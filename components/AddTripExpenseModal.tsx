import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Trip, TripExpense } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
// This component will be complex and will reuse logic from EditTransactionModal for splitting
// For this implementation, we'll keep it simpler.

const modalRoot = document.getElementById('modal-root')!;

interface AddTripExpenseModalProps {
  trip: Trip;
  onClose: () => void;
  onSave: (expense: TripExpense) => void;
}

const AddTripExpenseModal: React.FC<AddTripExpenseModalProps> = ({ trip, onClose, onSave }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(trip.participants[0]?.contactId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expenseAmount = parseFloat(amount);
    if (description.trim() && expenseAmount > 0 && paidBy) {
      const splitAmount = expenseAmount / trip.participants.length;
      
      const newExpense: TripExpense = {
        id: self.crypto.randomUUID(),
        tripId: trip.id,
        description: description.trim(),
        amount: expenseAmount,
        date: new Date().toISOString(),
        paidByContactId: paidBy,
        splitDetails: trip.participants.map(p => ({
          id: p.contactId,
          personName: p.name,
          amount: splitAmount,
          isSettled: false,
        })),
      };
      onSave(newExpense);
      onClose();
    }
  };
  
  const participantOptions = trip.participants.map(p => ({ value: p.contactId, label: p.name }));

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={`Add Expense to ${trip.name}`} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm text-secondary mb-1 block">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full input-base p-2 rounded-md" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-secondary mb-1 block">Amount</label>
              <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full input-base p-2 rounded-md no-spinner" required />
            </div>
            <div>
              <label className="text-sm text-secondary mb-1 block">Paid By</label>
              <CustomSelect options={participantOptions} value={paidBy} onChange={setPaidBy} />
            </div>
          </div>
          <div className="text-xs text-secondary text-center pt-2">
            By default, the expense will be split equally among all trip participants. More advanced splitting options can be configured later.
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2">Add Expense</button>
          </div>
        </form>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AddTripExpenseModal;