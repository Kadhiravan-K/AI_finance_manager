import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Account, AccountType } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { currencies } from '../utils/currency';

const modalRoot = document.getElementById('modal-root')!;

interface EditAccountModalProps {
  account: Account;
  onSave: (account: Account) => void;
  onClose: () => void;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({ account, onSave, onClose }) => {
  const [formData, setFormData] = useState<Account>(account);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };
  
  const accountTypeOptions = [
      { value: AccountType.DEPOSITORY, label: 'Depository (Bank, Cash)' },
      { value: AccountType.CREDIT, label: 'Credit Card' },
      { value: AccountType.INVESTMENT, label: 'Investment' },
  ];
  
  const currencyOptions = useMemo(() => currencies.map(c => ({
    value: c.code,
    label: `${c.code} - ${c.name}`
  })), []);

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Edit Account" onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm text-secondary mb-1 block">Account Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              className="w-full input-base p-2 rounded-lg"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-secondary mb-1 block">Account Type</label>
            <CustomSelect
              options={accountTypeOptions}
              value={formData.accountType}
              onChange={v => setFormData(p => ({ ...p, accountType: v as AccountType }))}
            />
          </div>
          <div>
            <label className="text-sm text-secondary mb-1 block">Currency</label>
            <CustomSelect
                options={currencyOptions}
                value={formData.currency}
                onChange={v => setFormData(p => ({ ...p, currency: v }))}
            />
          </div>
          {formData.accountType === AccountType.CREDIT && (
            <div className="animate-fadeInUp">
              <label className="text-sm text-secondary mb-1 block">Credit Limit (Optional)</label>
              <input
                type="number"
                onWheel={e => e.currentTarget.blur()}
                value={formData.creditLimit || ''}
                onChange={e => setFormData(p => ({ ...p, creditLimit: parseFloat(e.target.value) || undefined }))}
                className="w-full input-base p-2 rounded-lg no-spinner"
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default EditAccountModal;