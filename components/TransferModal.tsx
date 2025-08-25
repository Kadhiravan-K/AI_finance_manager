import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Account } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';

const modalRoot = document.getElementById('modal-root')!;

interface TransferModalProps {
  onClose: () => void;
  accounts: Account[];
  onTransfer: (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => void;
}

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const TransferModal: React.FC<TransferModalProps> = ({ onClose, accounts, onTransfer }) => {
  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]?.id || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
      setError('Please fill all fields with valid values.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('Cannot transfer to the same account.');
      return;
    }
    onTransfer(fromAccountId, toAccountId, amount, notes.trim() || undefined);
  };

  const accountOptions = accounts.map(account => ({ value: account.id, label: account.name }));

  const modalContent = (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider opacity-0 animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <ModalHeader title="Transfer Funds" onClose={onClose} />
        <div className="p-6">
          {error && <p className="text-rose-400 text-sm mb-4 text-center animate-pulse">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>From</label>
                <CustomSelect
                  value={fromAccountId}
                  onChange={setFromAccountId}
                  options={accountOptions}
                />
              </div>
              <div>
                <label className={labelStyle}>To</label>
                <CustomSelect
                  value={toAccountId}
                  onChange={setToAccountId}
                  options={accountOptions}
                />
              </div>
            </div>
            <div>
              <label htmlFor="amount" className={labelStyle}>Amount</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="input-base w-full rounded-full py-2 px-3 no-spinner"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="notes" className={labelStyle}>Notes (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="input-base w-full rounded-lg py-2 px-3 resize-none"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="button-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button-primary px-4 py-2"
              >
                Transfer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default TransferModal;