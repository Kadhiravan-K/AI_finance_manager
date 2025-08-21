import React, { useState } from 'react';
import { Account } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onTransfer: (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => void;
}

const inputStyle = "w-full bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner shadow-slate-900/50 transition-all duration-200";
const labelStyle = "block text-sm font-medium text-slate-400 mb-1";
const primaryButtonStyle = "px-4 py-2 rounded-lg text-white font-semibold bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-200 transform active:scale-[0.98] disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed";
const secondaryButtonStyle = "px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600/80 transition-colors";

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, accounts, onTransfer }) => {
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

  if (!isOpen) return null;

  const accountOptions = accounts.map(account => ({ value: account.id, label: account.name }));

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-slate-700/50 opacity-0 animate-scaleIn"
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
                onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                step="0.01"
                placeholder="0.00"
                className={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="notes" className={labelStyle}>Notes (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className={`${inputStyle} resize-none`}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={secondaryButtonStyle}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={primaryButtonStyle}
              >
                Transfer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;