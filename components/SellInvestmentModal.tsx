import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Account, InvestmentHolding } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';

const modalRoot = document.getElementById('modal-root')!;

interface SellInvestmentModalProps {
  onClose: () => void;
  onSave: (holdingId: string, quantity: number, price: number, toAccountId: string) => void;
  accounts: Account[];
  holding: InvestmentHolding;
}

const SellInvestmentModal: React.FC<SellInvestmentModalProps> = ({ onClose, onSave, accounts, holding }) => {
  const depositoryAccounts = accounts.filter(a => a.accountType === 'depository');
  
  const [formData, setFormData] = useState({ 
      quantity: holding.quantity, 
      price: '', 
      toAccountId: depositoryAccounts[0]?.id || '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(holding.id, formData.quantity, parseFloat(formData.price), formData.toAccountId);
    onClose();
  }
  
  const accountOptions = depositoryAccounts.map(a => ({ value: a.id, label: a.name }));
  const labelStyle = "block text-sm font-medium text-secondary mb-1";

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={`Sell ${holding.name}`} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Quantity to Sell</label>
                <input type="number" step="any" value={formData.quantity} onWheel={e => e.currentTarget.blur()} onChange={e => setFormData(f => ({...f, quantity: parseFloat(e.target.value) || 0}))} className="input-base w-full rounded-lg py-2 px-3 no-spinner" max={holding.quantity} required autoFocus />
              </div>
              <div>
                <label className={labelStyle}>Price per unit</label>
                <input type="number" step="0.01" value={formData.price} onWheel={e => e.currentTarget.blur()} onChange={e => setFormData(f => ({...f, price: e.target.value}))} placeholder="0.00" className="input-base w-full rounded-lg py-2 px-3 no-spinner" required />
              </div>
            </div>
             <div>
                <label className={labelStyle}>Deposit to Account</label>
                <CustomSelect value={formData.toAccountId} onChange={v => setFormData(f => ({...f, toAccountId: v}))} options={accountOptions} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                <button type="submit" className="button-primary px-4 py-2 bg-rose-600 hover:bg-rose-500">Confirm Sale</button>
            </div>
        </form>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default SellInvestmentModal;