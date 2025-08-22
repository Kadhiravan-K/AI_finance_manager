import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import CustomSelect from './CustomSelect';

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  onAddAccount: (name: string, accountType: AccountType, creditLimit?: number) => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ accounts, selectedAccountId, onAccountChange, onAddAccount }) => {
  const [newAccountName, setNewAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>(AccountType.DEPOSITORY);
  const [creditLimit, setCreditLimit] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccountName.trim()) {
      onAddAccount(newAccountName.trim(), accountType, parseFloat(creditLimit) || undefined);
      setNewAccountName('');
      setAccountType(AccountType.DEPOSITORY);
      setCreditLimit('');
      setShowAddForm(false);
    }
  };
  
  const accountOptions = [
    { value: 'all', label: 'All Accounts' },
    ...accounts.map(account => ({ value: account.id, label: account.name }))
  ];
  
  const accountTypeOptions = [
      { value: AccountType.DEPOSITORY, label: 'Depository (Bank, Cash)' },
      { value: AccountType.CREDIT, label: 'Credit Card' },
      { value: AccountType.INVESTMENT, label: 'Investment' },
  ];

  return (
    <div className="mb-6 bg-slate-800/50 p-4 rounded-xl shadow-lg border border-slate-700/50 transition-all duration-300 hover:bg-slate-800 hover:shadow-xl hover:border-slate-600">
      <div className="flex items-center space-x-4">
        <div className="flex-grow">
          <CustomSelect
            value={selectedAccountId}
            onChange={onAccountChange}
            options={accountOptions}
          />
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 bg-slate-700/80 rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0"
          aria-label={showAddForm ? 'Cancel adding account' : 'Add new account'}
          >
           <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white transition-transform duration-300 ${showAddForm ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {showAddForm && (
        <form onSubmit={handleAddAccountSubmit} className="mt-4 space-y-3 opacity-0 animate-fadeInUp">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="New account name"
                className="flex-grow bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner shadow-slate-900/50"
                aria-label="New account name"
                required
              />
              <CustomSelect
                options={accountTypeOptions}
                value={accountType}
                onChange={(val) => setAccountType(val as AccountType)}
              />
          </div>
          {accountType === AccountType.CREDIT && (
              <div className="opacity-0 animate-fadeInUp">
                <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="Credit Limit (Optional)"
                    className="w-full bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner shadow-slate-900/50"
                />
              </div>
          )}
          <div className="flex justify-end">
            <button type="submit" className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold py-2 px-4 rounded-lg hover:from-emerald-600 hover:to-green-700 disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 transition-all duration-200 transform active:scale-[0.98]" disabled={!newAccountName.trim()}>
                Add Account
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AccountSelector;