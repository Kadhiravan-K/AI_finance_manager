import React, { useState, useEffect, useContext, useRef } from 'react';
import { Account, Contact, Transaction, TransactionType, ActiveModal, SpamWarning, ItemizedDetail, SplitDetail, ParsedTransactionData, Category } from '../types';
import { AppDataContext, SettingsContext } from '../contexts/SettingsContext';
import { parseTransactionText } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import SlidingToggle from './SlidingToggle';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import SpamWarningCard from './SpamWarningCard';
import ModalHeader from './ModalHeader';
import ToggleSwitch from './ToggleSwitch';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface AddTransactionModalProps {
  onCancel: () => void;
  onSaveAuto: (text: string, accountId?: string) => Promise<void>;
  onSaveManual: (transaction: Transaction) => void;
  accounts: Account[];
  contacts: Contact[];
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
  onOpenCalculator: (onResult: (result: number) => void) => void;
  initialText: string | null;
  onInitialTextConsumed: () => void;
  initialTab?: 'auto' | 'manual';
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  onCancel, onSaveAuto, onSaveManual, accounts, contacts, openModal, onOpenCalculator, initialText, onInitialTextConsumed, initialTab
}) => {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>(initialTab || 'auto');
  const { categories, settings } = useContext(SettingsContext);
  const dataContext = useContext(AppDataContext);
  const formatCurrency = useCurrencyFormatter();

  // Auto Tab State
  const [autoText, setAutoText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [spamWarning, setSpamWarning] = useState<SpamWarning | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');

  // Manual Tab State
  const [isItemized, setIsItemized] = useState(false);
  const [splitDetails, setSplitDetails] = useState<SplitDetail[]>([]);
  const [manualDescription, setManualDescription] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualType, setManualType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [manualCategoryId, setManualCategoryId] = useState('');
  const [manualSubCategoryId, setManualSubCategoryId] = useState('');
  const [manualAccountId, setManualAccountId] = useState(accounts[0]?.id || '');
  const [manualDate, setManualDate] = useState(new Date());

  const topLevelCategories = useMemo(() => categories.filter(c => !c.parentId && c.type === manualType), [categories, manualType]);
  const subCategories = useMemo(() => categories.filter(c => c.parentId === manualCategoryId), [categories, manualCategoryId]);

  useEffect(() => {
    if (initialText) {
      setAutoText(initialText);
      setActiveTab('auto');
      onInitialTextConsumed();
    }
  }, [initialText, onInitialTextConsumed]);

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
          await onSaveAuto(autoText, selectedAccountId);
          onCancel();
        }
      } else {
        alert("Could not parse a transaction from the text. Please try manual entry.");
        setActiveTab('manual');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred.");
    }
    setIsParsing(false);
  };

  const handleSpamApproval = (trustSender: boolean) => {
    // Here you would handle trusting the sender if that logic exists
    onSaveAuto(spamWarning!.rawText, selectedAccountId);
    onCancel();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(manualAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!manualCategoryId) {
        alert('Please select a category.');
        return;
    }
    const newTransaction: Transaction = {
      id: self.crypto.randomUUID(),
      accountId: manualAccountId,
      description: manualDescription,
      amount,
      type: manualType,
      categoryId: manualSubCategoryId || manualCategoryId,
      date: manualDate.toISOString(),
      splitDetails: splitDetails.length > 0 ? splitDetails : undefined,
    };
    onSaveManual(newTransaction);
    onCancel();
  };

  const accountOptions = accounts.map(a => ({ value: a.id, label: `${a.name} (${a.currency})` }));

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg border border-divider opacity-0 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Add Transaction" onClose={onCancel} />
        <div className="flex border-b border-divider flex-shrink-0">
          <button onClick={() => setActiveTab('auto')} className={`w-full py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${activeTab === 'auto' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary'}`}>
            🤖 AI Parse (Quick)
          </button>
          <button onClick={() => setActiveTab('manual')} className={`w-full py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${activeTab === 'manual' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary'}`}>
            ✍️ Manual (Detailed)
          </button>
        </div>

        {activeTab === 'auto' ? (
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
            <p className="text-sm text-secondary">Paste a transaction message (from SMS, WhatsApp, etc.) or just type what you spent.</p>
            <textarea
              value={autoText}
              onChange={e => setAutoText(e.target.value)}
              rows={4}
              className="w-full themed-textarea p-3"
              placeholder='e.g., "Paid 500 to Zomato" or paste a full bank SMS.'
            />
            <div>
              <label className="text-sm font-medium text-secondary mb-1">Add to Account</label>
              <CustomSelect options={accountOptions} value={selectedAccountId} onChange={setSelectedAccountId} />
            </div>
            {spamWarning && <SpamWarningCard warning={spamWarning} onApprove={handleSpamApproval} onDiscard={() => setSpamWarning(null)} />}
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
              <button onClick={handleParseText} disabled={isParsing || !autoText.trim() || !selectedAccountId} className="button-primary px-4 py-2 flex items-center justify-center min-w-[100px]">
                {isParsing ? <LoadingSpinner /> : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
            <SlidingToggle options={[{value: 'expense', label: 'Expense'}, {value: 'income', label: 'Income'}]} value={manualType} onChange={val => setManualType(val as TransactionType)} />
            <div className="relative">
                <label className="text-sm font-medium text-secondary mb-1">Amount ({settings.currency})</label>
                <input type="number" step="0.01" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="input-base w-full p-2 rounded-lg" required />
                <button type="button" onClick={() => onOpenCalculator(res => setManualAmount(String(res)))} className="absolute right-2 bottom-2 text-xl">🧮</button>
            </div>
            <input type="text" value={manualDescription} onChange={e => setManualDescription(e.target.value)} placeholder="Description" className="input-base w-full p-2 rounded-lg" required />
            <div className="grid grid-cols-2 gap-4">
                <CustomSelect options={topLevelCategories.map(c => ({ value: c.id, label: c.name }))} value={manualCategoryId} onChange={setManualCategoryId} placeholder="Category" />
                <CustomSelect options={subCategories.map(c => ({ value: c.id, label: c.name }))} value={manualSubCategoryId} onChange={setManualSubCategoryId} placeholder="Subcategory" disabled={subCategories.length === 0} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CustomSelect options={accountOptions} value={manualAccountId} onChange={setManualAccountId} placeholder="Account" />
              <CustomDatePicker value={manualDate} onChange={setManualDate} />
            </div>
            <div className="pt-4 border-t border-divider"><ToggleSwitch label="Itemize & Split Transaction" checked={isItemized} onChange={setIsItemized} /></div>
             <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
              <button type="submit" className="button-primary px-4 py-2">Save Transaction</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddTransactionModal;
