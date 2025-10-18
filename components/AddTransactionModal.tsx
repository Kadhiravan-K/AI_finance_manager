import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Account, Contact, Transaction, TransactionType, ActiveModal, SpamWarning, ItemizedDetail, SplitDetail, ParsedTransactionData, Category, Sender, SenderType, USER_SELF_ID } from '../types';
import { AppDataContext, SettingsContext } from '../contexts/SettingsContext';
import { parseTransactionText } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import { SpamWarningCard } from './SpamWarningCard';
import ModalHeader from './ModalHeader';
import ToggleSwitch from './ToggleSwitch';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
// FIX: Corrected import paths for SplitManager.
import { SplitManager } from './SplitManager';
// FIX: Corrected import paths for SplitItemModal.
import SplitItemModal from './SplitItemModal';

interface Item {
    id: string;
    description: string;
    amount: string;
    categoryId: string;
    parentId: string | null;
    splitDetails: SplitDetail[];
}

type SplitMode = 'equally' | 'percentage' | 'shares' | 'manual';

interface AddTransactionModalProps {
  onClose: () => void;
  onSaveAuto: (data: ParsedTransactionData, accountId: string) => Promise<void>;
  onSaveManual: (transaction: Transaction) => void;
  accounts: Account[];
  contacts: Contact[];
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
  onOpenCalculator: (onResult: (result: number) => void) => void;
  initialText: string | null;
  onInitialTextConsumed: () => void;
  initialTab?: 'auto' | 'manual';
  transactionToDuplicate?: Transaction;
  initialTransaction?: Partial<Transaction>;
  isItemized?: boolean;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  onClose, onSaveAuto, onSaveManual, accounts, contacts, openModal, onOpenCalculator, initialText, onInitialTextConsumed, initialTab, transactionToDuplicate, initialTransaction, isItemized: isItemizedProp
}) => {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>(initialTab || 'manual');
  const settingsContext = useContext(SettingsContext);
  if (!settingsContext) {
      throw new Error("SettingsContext not found in AddTransactionModal");
  }
  const { categories, settings, senders, setSenders } = settingsContext;

  const dataContext = useContext(AppDataContext);
  const formatCurrency = useCurrencyFormatter();

  // Auto Tab State
  const [autoText, setAutoText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [spamWarning, setSpamWarning] = useState<SpamWarning | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');

  // Manual Tab State
  const [isItemized, setIsItemized] = useState(isItemizedProp || false);
  const [manualDescription, setManualDescription] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualType, setManualType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [manualCategoryId, setManualCategoryId] = useState('');
  const [manualSubCategoryId, setManualSubCategoryId] = useState('');
  const [manualAccountId, setManualAccountId] = useState(accounts[0]?.id || '');
  const [manualDate, setManualDate] = useState(new Date());
  const [manualTime, setManualTime] = useState(new Date().toTimeString().slice(0, 5));
  const [notes, setNotes] = useState('');
  const [payers, setPayers] = useState<SplitDetail[]>([]);
  const [payerMode, setPayerMode] = useState<SplitMode>('manual');
  const [itemToSplit, setItemToSplit] = useState<Item | null>(null);

  const [items, setItems] = useState<Item[]>([{ id: self.crypto.randomUUID(), description: '', amount: '', categoryId: '', parentId: null, splitDetails: [] }]);
  const itemizedTotal = useMemo(() => items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0), [items]);

  const allParticipants = useMemo(() => [
    { contactId: USER_SELF_ID, name: 'You' },
    ...contacts.map(c => ({ contactId: c.id, name: c.name }))
  ], [contacts]);

  useEffect(() => {
    if (initialText) {
      setAutoText(initialText);
      setActiveTab('auto');
      onInitialTextConsumed();
    }
  }, [initialText, onInitialTextConsumed]);

  useEffect(() => {
    if (transactionToDuplicate) {
        setActiveTab('manual');
        const { description, amount, type, categoryId, accountId, notes: txNotes } = transactionToDuplicate;
        const category = categories.find(c => c.id === categoryId);
        
        setManualDescription(description);
        setManualAmount(String(amount));
        setManualType(type);
        setManualAccountId(accountId);
        setNotes(txNotes || '');
        setManualDate(new Date()); // Set to today
        
        if (category) {
            if (category.parentId) {
                setManualCategoryId(category.parentId);
                setManualSubCategoryId(category.id);
            } else {
                setManualCategoryId(category.id);
                setManualSubCategoryId('');
            }
        }
    }
  }, [transactionToDuplicate, categories]);
  
  useEffect(() => {
      if (!isItemized) {
          setPayers([]);
          return;
      }
  
      if (payers.length === 0) {
          setPayers([{ id: USER_SELF_ID, personName: 'You', amount: itemizedTotal, isSettled: true, shares: '1', percentage: '100' }]);
          return; 
      }
      
      if (payerMode === 'manual') return;

      const numPayers = payers.length;
      if (numPayers === 0 || itemizedTotal === 0) return;
  
      let updatedPayers: SplitDetail[];
      switch (payerMode) {
          case 'equally':
              const splitAmount = itemizedTotal / numPayers;
              updatedPayers = payers.map(p => ({ ...p, amount: splitAmount }));
              break;
          case 'percentage':
              let totalPercentage = payers.reduce((sum, p) => sum + (parseFloat(p.percentage || '0') || 0), 0) || 100;
              updatedPayers = payers.map(p => ({ ...p, amount: ((parseFloat(p.percentage || '0') || 0) / totalPercentage) * itemizedTotal }));
              break;
          case 'shares':
              let totalShares = payers.reduce((sum, p) => sum + (parseFloat(p.shares || '0') || 0), 0) || numPayers;
              updatedPayers = payers.map(p => ({ ...p, amount: ((parseFloat(p.shares || '0') || 0) / totalShares) * itemizedTotal }));
              break;
          default:
              updatedPayers = [...payers];
      }
      setPayers(updatedPayers);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isItemized, payerMode, itemizedTotal, payers.length]);
  
  useEffect(() => {
    if (initialTransaction) {
        setActiveTab('manual');
        if (initialTransaction.itemizedDetails || isItemizedProp) {
            setIsItemized(true);
        }
        setManualDescription(initialTransaction.description || '');
        setManualAmount(String(initialTransaction.amount || ''));
        setManualType(initialTransaction.type || TransactionType.EXPENSE);
        setManualAccountId(initialTransaction.accountId || accounts[0]?.id || '');
        if (initialTransaction.date) {
            setManualDate(new Date(initialTransaction.date));
        }
        if (initialTransaction.itemizedDetails) {
            setItems(initialTransaction.itemizedDetails.map(d => {
                const category = categories.find(c => c.id === d.categoryId);
                return {
                    id: self.crypto.randomUUID(),
                    description: d.description,
                    amount: String(d.amount),
                    categoryId: d.categoryId,
                    parentId: category?.parentId || (category ? category.id : ''),
                    splitDetails: d.splitDetails || [],
                };
            }));
        } else {
            const category = categories.find(c => c.id === initialTransaction.categoryId);
            if (category) {
                setManualCategoryId(category.parentId || category.id);
                setManualSubCategoryId(category.parentId ? category.id : '');
            }
        }
    }
}, [initialTransaction, isItemizedProp, categories, accounts]);


  const handleItemChange = (id: string, field: keyof Item, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const handleAddItem = () => setItems(prev => [...prev, { id: self.crypto.randomUUID(), description: '', amount: '', categoryId: '', parentId: null, splitDetails: [] }]);
  const handleRemoveItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

  const handleParseText = async () => {
    if (!autoText.trim() || !selectedAccountId) return;
    setIsParsing(true);
    setSpamWarning(null);
    try {
      const parsedData = await parseTransactionText(autoText);
      if (parsedData) {
        if (parsedData.isSpam) {
          setSpamWarning({ rawText: autoText, parsedData });
        } else {
          await onSaveAuto(parsedData, selectedAccountId);
          onClose();
        }
      } else {
        alert("Could not understand the transaction from the text provided.");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred during parsing.");
    } finally {
      setIsParsing(false);
    }
  };
  
  const handleSpamApproval = (trustSender: boolean) => {
    if (!spamWarning) return;
    
    if (trustSender && spamWarning.parsedData.senderName) {
        const newSender: Sender = {
            id: self.crypto.randomUUID(),
            name: spamWarning.parsedData.senderName,
            identifier: spamWarning.parsedData.senderName,
            type: SenderType.TRUSTED,
        };
        const exists = senders.find(s => s.identifier.toLowerCase() === newSender.identifier.toLowerCase());
        if (!exists) {
            setSenders(prev => [...prev, newSender]);
        }
    }
    
    onSaveAuto(spamWarning.parsedData, selectedAccountId);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalDate = new Date(manualDate);
    const [hours, minutes] = manualTime.split(':').map(Number);
    finalDate.setHours(hours, minutes);

    let transactionData: Transaction;

    if (isItemized) {
        const finalAmount = itemizedTotal;
        if (isNaN(finalAmount) || finalAmount <= 0) { alert("Please enter valid amounts for items."); return; }
        
        const finalItemizedDetails: ItemizedDetail[] = items
            .filter(i => i.description.trim() && parseFloat(i.amount) > 0 && (i.categoryId || i.parentId))
            .map(i => ({ description: i.description, amount: parseFloat(i.amount), categoryId: i.categoryId || i.parentId!, splitDetails: i.splitDetails }));

        if (finalItemizedDetails.length === 0) { alert("Please fill out at least one valid item."); return; }
        
        const primaryCategory = categories.find(c => c.id === finalItemizedDetails[0].categoryId);
        if (!primaryCategory) { alert("Please select a valid category for items."); return; }
        
        const finalPayers = payers.map(p => ({ contactId: p.id, amount: p.amount }));

        transactionData = {
            id: self.crypto.randomUUID(), accountId: manualAccountId, description: manualDescription || `${finalItemizedDetails[0].description} & more`, amount: finalAmount, type: primaryCategory.type, categoryId: primaryCategory.id, date: finalDate.toISOString(), notes, itemizedDetails: finalItemizedDetails, payers: finalPayers.length > 0 ? finalPayers : undefined
        };

    } else {
        const finalAmount = parseFloat(manualAmount);
        if (isNaN(finalAmount) || finalAmount <= 0) { alert("Please enter a valid amount."); return; }
        if (!manualCategoryId) { alert("Please select a category."); return; }
        
        transactionData = {
            id: self.crypto.randomUUID(), accountId: manualAccountId, description: manualDescription, amount: finalAmount, type: manualType, categoryId: manualSubCategoryId || manualCategoryId, date: finalDate.toISOString(), notes
        };
    }
    onSaveManual(transactionData);
    onClose();
  };

  const handleSaveItemSplit = (splits: SplitDetail[]) => {
    if (!itemToSplit) return;
    handleItemChange(itemToSplit.id, 'splitDetails', splits);
    setItemToSplit(null);
  };
  
  const selectedAccount = useMemo(() => accounts.find(a => a.id === manualAccountId), [accounts, manualAccountId]);

  const accountOptions = accounts.map(a => ({ value: a.id, label: `${a.name} (${a.currency})` }));
  const topLevelCategories = useMemo(() => categories.filter(c => !c.parentId && c.type === manualType), [categories, manualType]);
  const subCategories = useMemo(() => categories.filter(c => c.parentId === manualCategoryId), [categories, manualCategoryId]);
  const topLevelExpenseCategories = useMemo(() => categories.filter(c => !c.parentId && c.type === TransactionType.EXPENSE), [categories]);

  const getSplitSummary = (item: Item) => {
    if (!item.splitDetails || item.splitDetails.length === 0) return 'Not split';
    if (item.splitDetails.length === 1) return `Paid by ${item.splitDetails[0].personName}`;
    return `Split between ${item.splitDetails.length} people`;
  };

  return (
    <>
      {itemToSplit && (
        <SplitItemModal
          item={{ description: itemToSplit.description, amount: parseFloat(itemToSplit.amount) || 0 }}
          initialSplitDetails={itemToSplit.splitDetails || []}
          onSave={handleSaveItemSplit}
          onClose={() => setItemToSplit(null)}
          participants={allParticipants}
          currency={selectedAccount?.currency || settings.currency}
        />
      )}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg border border-divider opacity-0 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
          <ModalHeader title="Add Transaction" onClose={onClose} />
          <div className="flex border-b border-divider flex-shrink-0">
            <button onClick={() => setActiveTab('auto')} className={`add-tx-tab w-full py-3 px-4 ${activeTab === 'auto' ? 'active' : ''}`}>AI Parse</button>
            <button onClick={() => setActiveTab('manual')} className={`add-tx-tab w-full py-3 px-4 ${activeTab === 'manual' ? 'active' : ''}`}>Manual</button>
          </div>
          {activeTab === 'auto' ? (
             <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {spamWarning ? (
                    <SpamWarningCard
                        warning={spamWarning}
                        onApprove={handleSpamApproval}
                        onDiscard={() => setSpamWarning(null)}
                    />
                ) : (
                <>
                    <p className="text-sm text-secondary">
                    Paste a transaction SMS or type a simple phrase like "coffee for 500".
                    The AI will do the rest.
                    </p>
                    <textarea
                    value={autoText}
                    onChange={(e) => setAutoText(e.target.value)}
                    placeholder="e.g., INR 250 was spent on Amazon..."
                    rows={5}
                    className="w-full themed-textarea"
                    disabled={isParsing}
                    autoFocus
                    />
                    <div>
                    <label className="text-sm font-medium text-secondary mb-1">Account</label>
                    <CustomSelect
                        options={accountOptions}
                        value={selectedAccountId}
                        onChange={setSelectedAccountId}
                    />
                    </div>
                    <button
                    onClick={handleParseText}
                    disabled={isParsing || !autoText.trim()}
                    className="button-primary w-full py-2 flex items-center justify-center"
                    >
                    {isParsing ? <LoadingSpinner /> : 'Parse with AI'}
                    </button>
                </>
                )}
             </div>
          ) : (
            <form id="manual-transaction-form" onSubmit={handleManualSubmit} className="flex-grow flex flex-col overflow-hidden">
              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {!isItemized ? (
                  <div className="space-y-4 animate-fadeInUp">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Date</label>
                            <CustomDatePicker value={manualDate} onChange={setManualDate} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Time</label>
                            <button type="button" onClick={() => openModal('timePicker', { initialTime: manualTime, onSave: setManualTime })} className="input-base p-2 rounded-lg w-full text-left">{manualTime}</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Amount ({selectedAccount?.currency})</label>
                            <div className="relative">
                                <input type="text" inputMode="decimal" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="input-base w-full p-2 rounded-lg" required />
                                <button type="button" onClick={() => onOpenCalculator(res => setManualAmount(String(res)))} className="absolute right-2 top-1/2 -translate-y-1/2 text-xl" aria-label="Open calculator">🧮</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Type</label>
                            <CustomSelect options={[{value: 'expense', label: 'Expense'}, {value: 'income', label: 'Income'}]} value={manualType} onChange={val => { setManualType(val as TransactionType); setManualCategoryId(''); setManualSubCategoryId(''); }} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Category</label>
                            <CustomSelect options={topLevelCategories.map(c=>({value: c.id, label: c.name}))} value={manualCategoryId} onChange={setManualCategoryId} placeholder="Select Category" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Subcategory</label>
                            <CustomSelect options={subCategories.map(c=>({value: c.id, label: c.name}))} value={manualSubCategoryId} onChange={setManualSubCategoryId} placeholder="-" disabled={!manualCategoryId || subCategories.length === 0} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-secondary mb-1">Description</label>
                        <input type="text" value={manualDescription} onChange={e => setManualDescription(e.target.value)} className="input-base w-full p-2 rounded-lg" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-secondary mb-1">Account</label>
                        <CustomSelect options={accountOptions} value={manualAccountId} onChange={setManualAccountId} placeholder="Account" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 animate-fadeInUp">
                      <input type="text" value={manualDescription} onChange={e => setManualDescription(e.target.value)} placeholder="Overall Description (e.g., Dinner with friends)" className="input-base w-full p-2 rounded-lg" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Date</label>
                            <CustomDatePicker value={manualDate} onChange={setManualDate} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Time</label>
                            <button type="button" onClick={() => openModal('timePicker', { initialTime: manualTime, onSave: setManualTime })} className="input-base p-2 rounded-lg w-full text-left">{manualTime}</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-secondary mb-1">Account</label>
                        <CustomSelect options={accountOptions} value={manualAccountId} onChange={setManualAccountId} placeholder="Account" />
                      </div>
                      {items.map((item) => (
                          <div key={item.id} className="itemized-item-card">
                            <div className="flex items-start gap-2">
                                <div className="flex-grow space-y-2">
                                    <input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} placeholder="Item Description" className="input-base p-2 rounded-md w-full" required />
                                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2"><div className="relative"><input type="number" step="0.01" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} placeholder="0.00" className="input-base p-2 rounded-md w-full no-spinner" required /><button type="button" onClick={() => onOpenCalculator(res => handleItemChange(item.id, 'amount', String(res)))} className="absolute right-2 top-1/2 -translate-y-1/2 text-xl">🧮</button></div><span className="p-2 text-center text-secondary">in</span><CustomSelect value={item.parentId || ''} onChange={val => { handleItemChange(item.id, 'parentId', val); handleItemChange(item.id, 'categoryId', val); }} options={[{value: '', label: 'Category'}, ...topLevelExpenseCategories.map(c => ({value: c.id, label: c.name}))]} /></div>
                                </div>
                                {items.length > 1 && <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1 text-rose-400 hover:text-rose-300 rounded-full flex-shrink-0" aria-label="Remove item"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                            </div>
                            <div className="mt-2 pt-2 border-t border-divider flex justify-between items-center">
                                  <span className="text-xs text-secondary">{getSplitSummary(item)}</span>
                                  <button type="button" onClick={() => setItemToSplit(item)} className="button-secondary text-xs px-3 py-1">Split Item</button>
                            </div>
                          </div>
                      ))}
                      <button type="button" onClick={handleAddItem} className="w-full text-center p-2 text-sm text-sky-400 hover:text-sky-300">+ Add Item</button>
                  </div>
                )}
                
                <div className="pt-4 border-t border-divider space-y-3">
                  <ToggleSwitch label="Itemize This Transaction" checked={isItemized} onChange={setIsItemized} />
                  {isItemized && <SplitManager title="Paid By" mode={payerMode} onModeChange={setPayerMode} participants={payers} onParticipantsChange={setPayers} totalAmount={itemizedTotal} allParticipants={allParticipants} formatCurrency={formatCurrency} isPayerManager />}
                </div>

                <div>
                    <label className="text-sm font-medium text-secondary mb-1">Notes (Optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (Optional)" className="input-base w-full p-2 rounded-lg" rows={2} />
                </div>
              </div>

              <div className="flex-shrink-0 p-4 border-t border-divider flex items-center justify-end gap-3">
                 <button type="button" onClick={() => openModal('refund')} className="button-secondary text-sm mr-auto px-4 py-2">
                    Proceed to Refund
                </button>
                <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                <button type="submit" form="manual-transaction-form" className="button-primary px-4 py-2">Save Transaction</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default AddTransactionModal;