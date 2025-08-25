import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, TransactionType, SplitDetail } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

const modalRoot = document.getElementById('modal-root')!;

interface RefundModalProps {
  originalTransaction: Transaction;
  onClose: () => void;
  onSave: (refundTransaction: Transaction) => void;
  findOrCreateCategory: (name: string, type: TransactionType) => string;
}

const RefundModal: React.FC<RefundModalProps> = ({ originalTransaction, onClose, onSave, findOrCreateCategory }) => {
  const formatCurrency = useCurrencyFormatter();
  const [amount, setAmount] = useState(String(originalTransaction.amount));
  const [notes, setNotes] = useState('');
  const [refundingPersonId, setRefundingPersonId] = useState<string>('');

  const potentialRefundees = useMemo(() => {
    return originalTransaction.splitDetails?.filter(s => s.personName.toLowerCase() !== 'you') || [];
  }, [originalTransaction.splitDetails]);

  const selectedRefundee = useMemo(() => {
    return potentialRefundees.find(p => p.id === refundingPersonId);
  }, [potentialRefundees, refundingPersonId]);
  
  const maxAmount = useMemo(() => {
      if (selectedRefundee) return selectedRefundee.amount;
      return originalTransaction.amount;
  }, [selectedRefundee, originalTransaction.amount]);
  
  useEffect(() => {
      if (potentialRefundees.length === 1) {
          setRefundingPersonId(potentialRefundees[0].id);
          setAmount(String(potentialRefundees[0].amount));
      } else {
          setAmount(String(originalTransaction.amount));
      }
  }, [potentialRefundees, originalTransaction.amount]);
  
  useEffect(() => {
    setAmount(String(maxAmount));
  }, [maxAmount]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refundAmount = parseFloat(amount);
    if (refundAmount > 0 && refundAmount <= maxAmount) {
      const refundCategoryId = findOrCreateCategory('Refunds & Rebates', TransactionType.INCOME);
      
      const description = selectedRefundee
        ? `Refund from ${selectedRefundee.personName} for "${originalTransaction.description}"`
        : `Refund for "${originalTransaction.description}"`;

      const refundTransaction: Transaction = {
        id: self.crypto.randomUUID(),
        accountId: originalTransaction.accountId,
        description,
        amount: refundAmount,
        type: TransactionType.INCOME,
        categoryId: refundCategoryId,
        date: new Date().toISOString(),
        notes: notes.trim() || undefined,
        isRefundFor: originalTransaction.id,
      };
      
      onSave(refundTransaction);
    } else {
        alert(`Refund amount must be positive and not exceed ${formatCurrency(maxAmount)}.`);
    }
  };

  const refundeeOptions = potentialRefundees.map(p => ({ value: p.id, label: p.personName }));

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[55] p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Process Refund" onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-secondary">
            Refunding for: <span className="font-semibold text-primary">"{originalTransaction.description}"</span>
          </p>
          {potentialRefundees.length > 0 && (
              <div>
                <label className="text-sm text-secondary mb-1 block">Refund From</label>
                <CustomSelect
                    options={refundeeOptions}
                    value={refundingPersonId}
                    onChange={setRefundingPersonId}
                    placeholder="Select person..."
                />
              </div>
          )}
          <div>
            <label className="text-sm text-secondary mb-1 block">Refund Amount (Max: {formatCurrency(maxAmount)})</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={maxAmount}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full input-base p-2 rounded-md no-spinner"
              required
            />
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