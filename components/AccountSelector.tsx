import React, { useState } from 'react';
import { Account } from '../types';
import CustomSelect from './CustomSelect';

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  onAddAccount: (name: string) => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ accounts, selectedAccountId, onAccountChange, onAddAccount }) => {
  const [newAccountName, setNewAccountName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccountName.trim()) {
      onAddAccount(newAccountName.trim());
      setNewAccountName('');
      setShowAddForm(false);
    }
  };
  
  const accountOptions = [
    { value: 'all', label: 'All Accounts' },
    ...accounts.map(account => ({ value: account.id, label: account.name }))
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
           <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white transition-transform duration-300 ${showAddForm ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {showAddForm && (
        <form onSubmit={handleAddAccountSubmit} className="mt-4 flex space-x-2 opacity-0 animate-fadeInUp">
          <input
            type="text"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="New account name"
            className="flex-grow bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner shadow-slate-900/50"
            aria-label="New account name"
          />
          <button type="submit" className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold py-2 px-4 rounded-lg hover:from-emerald-600 hover:to-green-700 disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 transition-all duration-200 transform active:scale-[0.98]" disabled={!newAccountName.trim()}>
            Add
          </button>
        </form>
      )}
    </div>
  );
};

export default AccountSelector;