import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, Account, Refund, Contact, ActiveModal } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomDatePicker from './CustomDatePicker';

const modalRoot = document.getElementById('modal-root')!;

interface RefundModalProps {
  refund?: Refund;
  originalTransaction?: Transaction;
  allTransactions: Transaction[];
  accounts: Account[];
  contacts: Contact[];
  refunds: Refund[];
  onClose: () => void;
  onSave: (refundData: Omit<Refund, 'id' | 'isClaimed' | 'claimedDate'>, id?: string) => void;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

const RefundModal: React.FC<RefundModalProps> = ({ refund, originalTransaction, allTransactions, accounts, contacts, refunds, onClose, onSave, openModal }) => {
  const isEditing = !!refund;
  
  const [linkedTx, setLinkedTx] = useState<Transaction | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [accountId, setAccountId] = useState('');
  const [contactId, setContactId] = useState('');
  const [expectedDate, setExpectedDate] = useState<Date | null>(null);
  const [expectedTime, setExpectedTime] = useState('09:00');

  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const formatCurrency = useCurrencyFormatter();

  useEffect(() => {
    if (isEditing && refund) {
        const tx = refund.originalTransactionId ? allTransactions.find(t => t.id === refund.originalTransactionId) : null;
        setLinkedTx(tx || null);
        setDescription(refund.description);
        setAmount(String(refund.amount));
        setNotes(refund.notes || '');
        setAccountId(refund.accountId);
        setContactId(refund.contactId || '');
        if (refund.expectedDate) {
            const date = new Date(refund.expectedDate);
            setExpectedDate(date);
            setExpectedTime(date.toTimeString().slice(0, 5));
        }
    } else if (originalTransaction) {
        setLinkedTx(originalTransaction as Transaction);
        setDescription(originalTransaction.description || '');
        setAmount(String(originalTransaction.amount || ''));
        setAccountId(originalTransaction.accountId || (accounts[0]?.id || ''));
    } else {
        setAccountId(accounts[0]?.id || '');
    }
  }, [isEditing, refund, originalTransaction, allTransactions, accounts]);


  const alreadyRefunded = useMemo(() => {
    if (!linkedTx) return 0;
    // Sum of all refunds (pending or claimed) for the linked transaction, excluding the one being edited
    return refunds
      .filter(r => r.originalTransactionId === linkedTx.id && r.id !== refund?.id)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [linkedTx, refunds, refund]);
  
  const maxAmount = useMemo(() => {
    if (!linkedTx) return Infinity;
    return linkedTx.amount - alreadyRefunded;
  }, [linkedTx, alreadyRefunded]);
  
  const isInvalidForRefund = maxAmount <= 0;

  useEffect(() => {
    if (!isEditing && linkedTx) {
      setAmount(String(maxAmount));
    }
  }, [maxAmount, linkedTx, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refundAmount = parseFloat(amount);
    if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > maxAmount) {
      alert(`Refund amount must be positive and not exceed ${formatCurrency(maxAmount)}.`);
      return;
    }
    
    if (!accountId) {
        alert("Please select an account to receive the refund.");
        return;
    }
    
    let finalExpectedDate: string | undefined = undefined;
    if (expectedDate) {
        const date = new Date(expectedDate);
        const [hours, minutes] = expectedTime.split(':').map(Number);
        date.setHours(hours, minutes);
        finalExpectedDate = date.toISOString();
    }

    const refundData: Omit<Refund, 'id' | 'isClaimed' | 'claimedDate'> = {
        description: description || (linkedTx ? `Refund for "${linkedTx.description}"` : 'General Refund'),
        amount: refundAmount,
        date: refund?.date || new Date().toISOString(),
        accountId: accountId,
        originalTransactionId: linkedTx?.id,
        notes: notes.trim() || undefined,
        contactId: contactId || undefined,
        expectedDate: finalExpectedDate,
    };
    
    onSave(refundData, refund?.id);
  };
  
  const refundableTransactions = useMemo(() => {
    return allTransactions.filter(t => t.type === 'expense' && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allTransactions, searchQuery]);


  const renderTransactionPicker = () => (
    <div className="absolute inset-0 bg-subtle z-10 flex flex-col p-4 animate-fadeInUp">
        <div className="flex items-center gap-2 mb-2">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search expenses..." className="w-full input-base p-2 rounded-lg" autoFocus />
            <button type="button" onClick={() => setShowPicker(false)} className="button-secondary px-3 py-2 text-sm">Cancel</button>
        </div>
        <div className="flex-grow overflow-y-auto space-y-1">
            {refundableTransactions.map(t => (
                <button key={t.id} onClick={() => { setLinkedTx(t); setShowPicker(false); }} className="w-full text-left p-2 bg-subtle rounded-lg group transition-colors hover-bg-stronger">
                    <div className="flex justify-between items-center">
                        <div>
                        <p className="font-medium text-primary">{t.description}</p>
                        <p className="text-xs text-secondary">{new Date(t.date).toLocaleDateString()}</p>
                        </div>
                        <span className="font-semibold text-rose-400">{formatCurrency(t.amount)}</span>
                    </div>
                </button>
            ))}
        </div>
    </div>
  );
  
  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));
  const contactOptions = [{value: '', label: 'None'}, ...contacts.map(c => ({ value: c.id, label: c.name }))];

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[55] p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={isEditing ? "Edit Refund" : "Process Refund"} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4 relative overflow-y-auto max-h-[75vh]">
          {showPicker && renderTransactionPicker()}
          {linkedTx ? (
            <div className="p-3 bg-subtle rounded-lg">
                <p className="text-sm text-secondary">Refunding for:</p>
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-primary">"{linkedTx.description}"</p>
                    <button type="button" onClick={() => { setLinkedTx(null); setDescription(''); }} className="text-xs text-sky-400 hover:text-sky-300">Change</button>
                </div>
            </div>
          ) : (
            <button type="button" onClick={() => setShowPicker(true)} className="w-full button-secondary py-2">
                Link to an original expense (Optional)
            </button>
          )}

           <div>
              <label className="text-sm text-secondary mb-1 block">Description</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder={linkedTx ? `Refund for "${linkedTx.description}"` : 'e.g., Return from Amazon'} className="w-full input-base p-2 rounded-md" required />
           </div>
           <div>
              <label className="text-sm text-secondary mb-1 block">Contact (Optional)</label>
              <CustomSelect options={contactOptions} value={contactId} onChange={setContactId} />
           </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-secondary mb-1 block">Receiving Account</label>
                <CustomSelect options={accountOptions} value={accountId} onChange={setAccountId} placeholder="Select account..." />
              </div>
              <div>
                <label className="text-sm text-secondary mb-1 block">
                Refund Amount {maxAmount !== Infinity && `(Max: ${formatCurrency(maxAmount)})`}
                </label>
                <input type="number" step="0.01" min="0.01" max={maxAmount === Infinity ? undefined : maxAmount} value={amount} onChange={e => setAmount(e.target.value)} className="w-full input-base p-2 rounded-md no-spinner" required disabled={isInvalidForRefund} />
              </div>
            </div>
            {isInvalidForRefund && <p className="text-xs text-center text-rose-400">This transaction has been fully refunded.</p>}
            
            <div>
              <label className="text-sm text-secondary mb-1 block">Expected By (Optional)</label>
              <div className="flex gap-2">
                  <CustomDatePicker value={expectedDate} onChange={setExpectedDate}/>
                  <button type="button" onClick={() => openModal('timePicker', { initialTime: expectedTime, onSave: setExpectedTime })} disabled={!expectedDate} className="w-full input-base p-2 rounded-lg">
                    {expectedTime}
                  </button>
              </div>
            </div>

           <div>
            <label className="text-sm text-secondary mb-1 block">Notes (Optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full input-base p-2 rounded-md resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-divider">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" disabled={isInvalidForRefund} className="button-primary px-4 py-2">{isEditing ? 'Save Changes' : 'Create Refund'}</button>
          </div>
        </form>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default RefundModal;