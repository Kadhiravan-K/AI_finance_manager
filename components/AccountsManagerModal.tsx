import React, { useState, useMemo, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Account, AccountType } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { currencies } from '../utils/currency';
import { SettingsContext } from '../contexts/SettingsContext';

const modalRoot = document.getElementById('modal-root')!;

interface AccountsManagerModalProps {
  onClose: () => void;
  accounts: Account[];
  onAddAccount: (name: string, accountType: AccountType, currency: string, creditLimit?: number, openingBalance?: number) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
}

const AccountsManagerModal: React.FC<AccountsManagerModalProps> = ({ onClose, accounts, onAddAccount, onEditAccount, onDeleteAccount }) => {
  const [isFormOpen, setIsFormOpen] = useState(accounts.length === 0);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setEditingAccount(null);
    setIsFormOpen(false);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Manage Accounts" onClose={onClose} icon="🏦" />
        <div className="flex-grow overflow-y-auto p-6 space-y-2">
          {accounts.map(account => (
            <div key={account.id} className="p-3 bg-subtle rounded-lg flex items-center justify-between group">
              <div>
                <p className="font-semibold text-primary">{account.name}</p>
                <p className="text-xs text-secondary">{account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} - {account.currency}</p>
              </div>
              <div className="space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(account)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                <button onClick={() => onDeleteAccount(account.id)} className="text-xs px-2 py-1 text-rose-400 hover:bg-rose-500/20 rounded-full transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {accounts.length === 0 && !isFormOpen && <p className="text-center text-secondary py-8">No accounts yet. Add one to get started.</p>}
        </div>
        {!isFormOpen && (
          <div className="p-4 border-t border-divider">
            <button onClick={() => setIsFormOpen(true)} className="button-primary w-full py-2">
              + Add New Account
            </button>
          </div>
        )}
        {isFormOpen && (
          <AccountForm
            account={editingAccount}
            onAddAccount={onAddAccount}
            onEditAccount={onEditAccount}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>,
    modalRoot
  );
};

interface AccountFormProps {
  account: Account | null;
  onAddAccount: AccountsManagerModalProps['onAddAccount'];
  onEditAccount: AccountsManagerModalProps['onEditAccount'];
  onCancel: () => void;
}

const AccountForm: React.FC<AccountFormProps> = ({ account, onAddAccount, onEditAccount, onCancel }) => {
  const { settings } = useContext(SettingsContext);
  const [formData, setFormData] = useState<Omit<Account, 'id'>>({
    name: account?.name || '',
    accountType: account?.accountType || AccountType.DEPOSITORY,
    currency: account?.currency || settings.currency,
    creditLimit: account?.creditLimit,
  });
  const [openingBalance, setOpeningBalance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(account) {
        onEditAccount({ ...account, ...formData });
    } else {
        onAddAccount(formData.name, formData.accountType, formData.currency, formData.creditLimit, parseFloat(openingBalance) || undefined);
    }
    onCancel();
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
  
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-divider bg-subtle space-y-3 animate-fadeInUp">
        <h4 className="font-semibold text-primary">{account ? 'Edit Account' : 'Add New Account'}</h4>
        <input
            type="text"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            className="w-full input-base p-2 rounded-lg"
            placeholder="Account Name"
            required
            autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
            <CustomSelect
                options={accountTypeOptions}
                value={formData.accountType}
                onChange={v => setFormData(p => ({ ...p, accountType: v as AccountType }))}
            />
             <CustomSelect
                options={currencyOptions}
                value={formData.currency}
                onChange={v => setFormData(p => ({ ...p, currency: v }))}
            />
        </div>
        {!account && (
            <div className="animate-fadeInUp">
              <label className="text-sm text-secondary mb-1 block">Opening Balance (Optional)</label>
              <input
                type="number"
                value={openingBalance}
                onChange={e => setOpeningBalance(e.target.value)}
                className="w-full input-base p-2 rounded-lg no-spinner"
                placeholder="0.00"
              />
            </div>
        )}
         {formData.accountType === AccountType.CREDIT && (
            <div className="animate-fadeInUp">
              <label className="text-sm text-secondary mb-1 block">Credit Limit (Optional)</label>
              <input
                type="number"
                value={formData.creditLimit || ''}
                onChange={e => setFormData(p => ({ ...p, creditLimit: parseFloat(e.target.value) || undefined }))}
                className="w-full input-base p-2 rounded-lg no-spinner"
              />
            </div>
          )}
        <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2">Save</button>
        </div>
    </form>
  )
}

export default AccountsManagerModal;