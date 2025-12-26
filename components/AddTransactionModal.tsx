
import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { Account, Contact, Transaction, TransactionType, ActiveModal, SpamWarning, ItemizedDetail, SplitDetail, ParsedTransactionData, Category, Sender, SenderType, USER_SELF_ID } from '../types';
import { AppDataContext, SettingsContext } from '../contexts/SettingsContext';
import { parseTransactionText, parseReceiptImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import { SpamWarningCard } from './SpamWarningCard';
import ModalHeader from './ModalHeader';
import ToggleSwitch from './ToggleSwitch';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { SplitManager } from './SplitManager';
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
  if (!settingsContext) throw new Error("SettingsContext not found");
  const { categories, settings, senders, setSenders, findOrCreateCategory } = settingsContext;
  const formatCurrency = useCurrencyFormatter();

  // Auto Tab State
  const [autoText, setAutoText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [spamWarning, setSpamWarning] = useState<SpamWarning | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [attachedFile, setAttachedFile] = useState<{base64: string, mimeType: string, preview: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSuggestCategory = async () => {
    if (!manualDescription.trim()) return;
    setIsParsing(true);
    try {
        const parsed = await parseTransactionText(manualDescription);
        if (parsed) {
            const cat = categories.find(c => c.name.toLowerCase() === parsed.categoryName.toLowerCase());
            if (cat) {
                if (cat.parentId) {
                    setManualCategoryId(cat.parentId);
                    setManualSubCategoryId(cat.id);
                } else {
                    setManualCategoryId(cat.id);
                    setManualSubCategoryId('');
                }
            }
        }
    } catch (e) {
        console.error("Auto categorization failed", e);
    } finally {
        setIsParsing(false);
    }
  };

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
        setManualDescription(transactionToDuplicate.description);
        setManualAmount(String(transactionToDuplicate.amount));
        setManualType(transactionToDuplicate.type);
        setManualAccountId(transactionToDuplicate.accountId);
        setNotes(transactionToDuplicate.notes || '');
        setManualDate(new Date());
        const category = categories.find(c => c.id === transactionToDuplicate.categoryId);
        if (category) {
            setManualCategoryId(category.parentId || category.id);
            setManualSubCategoryId(category.parentId ? category.id : '');
        }
    }
  }, [transactionToDuplicate, categories]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDate = new Date(manualDate);
    const [hours, minutes] = manualTime.split(':').map(Number);
    finalDate.setHours(hours, minutes);

    if (isItemized) {
        const finalItemizedDetails: ItemizedDetail[] = items
            .filter(i => i.description.trim() && parseFloat(i.amount) > 0)
            .map(i => ({ description: i.description, amount: parseFloat(i.amount), categoryId: i.categoryId || i.parentId || '', splitDetails: i.splitDetails }));
        
        onSaveManual({
            id: self.crypto.randomUUID(), accountId: manualAccountId, description: manualDescription, amount: itemizedTotal, type: manualType, categoryId: manualSubCategoryId || manualCategoryId, date: finalDate.toISOString(), notes, itemizedDetails: finalItemizedDetails
        });
    } else {
        onSaveManual({
            id: self.crypto.randomUUID(), accountId: manualAccountId, description: manualDescription, amount: parseFloat(manualAmount), type: manualType, categoryId: manualSubCategoryId || manualCategoryId, date: finalDate.toISOString(), notes
        });
    }
    onClose();
  };

  const accountOptions = accounts.map(a => ({ value: a.id, label: `${a.name} (${a.currency})` }));
  const topLevelCategories = useMemo(() => categories.filter(c => !c.parentId && c.type === manualType), [categories, manualType]);
  const subCategories = useMemo(() => categories.filter(c => c.parentId === manualCategoryId), [categories, manualCategoryId]);

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg border border-divider opacity-0 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
          <ModalHeader title="Add Transaction" onClose={onClose} />
          <div className="flex border-b border-divider flex-shrink-0">
            <button onClick={() => setActiveTab('auto')} className={`add-tx-tab w-full py-3 px-4 ${activeTab === 'auto' ? 'active' : ''}`}>AI Parse</button>
            <button onClick={() => setActiveTab('manual')} className={`add-tx-tab w-full py-3 px-4 ${activeTab === 'manual' ? 'active' : ''}`}>Manual</button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
            {activeTab === 'auto' ? (
                <div className="space-y-4">
                    <textarea value={autoText} onChange={e => setAutoText(e.target.value)} placeholder="e.g., spent 500 for lunch" rows={4} className="w-full themed-textarea" disabled={isParsing} />
                    <CustomSelect options={accountOptions} value={selectedAccountId} onChange={setSelectedAccountId} />
                    <button onClick={() => {}} className="button-primary w-full py-2">{isParsing ? <LoadingSpinner /> : 'Parse with AI'}</button>
                </div>
            ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <label className="text-sm font-medium text-secondary mb-1">Description</label>
                            <input type="text" value={manualDescription} onChange={e => setManualDescription(e.target.value)} onBlur={handleSuggestCategory} className="input-base w-full p-2 rounded-lg" required />
                        </div>
                        <button type="button" onClick={handleSuggestCategory} disabled={isParsing} className="p-2 mb-0.5 rounded-lg bg-subtle hover:bg-card-hover text-sky-400 border border-divider">
                            {isParsing ? <LoadingSpinner /> : '✨'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Amount</label>
                            <input type="number" step="0.01" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="input-base w-full p-2 rounded-lg no-spinner" required={!isItemized} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Type</label>
                            <CustomSelect options={[{value: 'expense', label: 'Expense'}, {value: 'income', label: 'Income'}]} value={manualType} onChange={val => setManualType(val as TransactionType)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Category</label>
                            <CustomSelect options={topLevelCategories.map(c => ({value: c.id, label: `${c.icon} ${c.name}`}))} value={manualCategoryId} onChange={setManualCategoryId} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Subcategory</label>
                            <CustomSelect options={subCategories.map(c => ({value: c.id, label: `${c.icon} ${c.name}`}))} value={manualSubCategoryId} onChange={setManualSubCategoryId} disabled={subCategories.length === 0} />
                        </div>
                    </div>
                    <button type="submit" className="button-primary w-full py-2">Save Transaction</button>
                </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddTransactionModal;
