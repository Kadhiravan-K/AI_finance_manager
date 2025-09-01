import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Account, AccountType } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import NumberStepper from './NumberStepper';

const modalRoot = document.getElementById('modal-root')!;

interface BuyInvestmentModalProps {
  onClose: () => void;
  onSave: (investmentAccountId: string, name: string, quantity: number, price: number, fromAccountId: string) => void;
  accounts: Account[];
}

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const BuyInvestmentModal: React.FC<BuyInvestmentModalProps> = ({ onClose, onSave, accounts }) => {
  const investmentAccounts = accounts.filter(a => a.accountType === AccountType.INVESTMENT);
  const depositoryAccounts = accounts.filter(a => a.accountType === AccountType.DEPOSITORY);
  
  const [formData, setFormData] = useState({ 
      name: '', 
      quantity: 1, 
      price: '', 
      accountId: investmentAccounts[0]?.id || '', 
      linkedAccountId: depositoryAccounts[0]?.id || '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData.accountId, formData.name, formData.quantity, parseFloat(formData.price), formData.linkedAccountId);
  }

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Buy Investment" onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className={labelStyle}>Investment Account</label>
                <CustomSelect value={formData.accountId} onChange={v => setFormData(f => ({...f, accountId: v}))} options={investmentAccounts.map(a => ({value: a.id, label: a.name}))} />
            </div>
            <div>
                <label className={labelStyle}>Holding Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} className="input-base w-full rounded-lg py-2 px-3" required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Quantity</label>
                <NumberStepper 
                  value={formData.quantity}
                  onChange={v => setFormData(f => ({...f, quantity: v}))}
                  min={0.0001}
                  step={1}
                />
              </div>
              <div>
                <label className={labelStyle}>Price per unit</label>
                <input type="number" step="0.01" value={formData.price} onWheel={e => e.currentTarget.blur()} onChange={e => setFormData(f => ({...f, price: e.target.value}))} className="input-base w-full rounded-lg py-2 px-3 no-spinner" required />
              </div>
            </div>
             <div>
                <label className={labelStyle}>From Account</label>
                <CustomSelect value={formData.linkedAccountId} onChange={v => setFormData(f => ({...f, linkedAccountId: v}))} options={depositoryAccounts.map(a => ({value: a.id, label: a.name}))} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                <button type="submit" className="button-primary px-4 py-2">Confirm Purchase</button>
            </div>
        </form>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default BuyInvestmentModal;