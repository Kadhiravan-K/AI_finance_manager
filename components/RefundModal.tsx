import React, { useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, TransactionType, ModalState } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';

const modalRoot = document.getElementById('modal-root')!;

interface RefundModalProps {
  originalTransaction: Transaction;
  onClose: () => void;
  openModal: (name: ModalState['name'], props?: Record<string, any>) => void;
  onSave: (refundTransaction: Transaction) => void;
  findOrCreateCategory: (name: string, type: TransactionType) => string;
}

const RefundModal: React.FC<RefundModalProps> = ({ originalTransaction, onClose, openModal, onSave, findOrCreateCategory }) => {
  const { contacts } = useContext(SettingsContext);
  const [amount, setAmount] = useState(String(originalTransaction.amount));
  const [contactId, setContactId] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refundAmount = parseFloat(amount);
    if (refundAmount > 0 && refundAmount <= originalTransaction.amount) {
      const refundCategoryId = findOrCreateCategory('Refunds', TransactionType.INCOME);
      const contactName = contacts.find(c => c.id === contactId)?.name || 'Unknown';
      
      const refundTransaction: Transaction = {
        id: self.crypto.randomUUID(),
        accountId: originalTransaction.accountId,
        description: `Refund from ${contactName} for "${originalTransaction.description}"`,
        amount: refundAmount,
        type: TransactionType.INCOME,
        categoryId: refundCategoryId,
        date: new Date().toISOString(),
        notes: notes.trim() || undefined,
        isRefundFor: originalTransaction.id,
      };
      
      onSave(refundTransaction);
      onClose();
    } else {
        alert("Refund amount must be positive and not exceed the original transaction amount.");
    }
  };

  const contactOptions = contacts.map(c => ({ value: c.id, label: c.name }));

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Process Refund" onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-secondary">
            Processing refund for: <span className="font-semibold text-primary">"{originalTransaction.description}"</span>
          </p>
          <div>
            <label className="text-sm text-secondary mb-1 block">Refund Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={originalTransaction.amount}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full input-base p-2 rounded-md no-spinner"
              required
            />
          </div>
          <div>
             <label className="text-sm text-secondary mb-1 block">Refund From</label>
             <div className="flex items-center gap-2">
                <div className="flex-grow">
                     <CustomSelect
                        options={contactOptions}
                        value={contactId}
                        onChange={setContactId}
                        placeholder="Select Contact..."
                    />
                </div>
                <button type="button" onClick={() => openModal('contacts')} className="button-secondary p-2 aspect-square h-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
             </div>
          </div>
           <div>
            <label className="text-sm text-secondary mb-1 block">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full input-base p-2 rounded-md resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2">Confirm Refund</button>
          </div>
        </form>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default RefundModal;