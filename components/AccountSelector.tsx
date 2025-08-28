import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Account, AccountType, Transaction } from '../types';
import CustomCheckbox from './CustomCheckbox';
import CustomSelect from './CustomSelect';
import { currencies } from '../utils/currency';
// FIX: Imported getCurrencyFormatter from the correct utility file instead of the hook file.
import { getCurrencyFormatter } from '../utils/currency';

interface AccountSelectorProps {
  accounts: Account[];
  allTransactions: Transaction[];
  selectedAccountIds: string[];
  onAccountChange: (ids: string[]) => void;
  onAddAccount: (name: string, accountType: AccountType, currency: string, creditLimit?: number, openingBalance?: number) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  baseCurrency: string;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ accounts, allTransactions, selectedAccountIds, onAccountChange, onAddAccount, onEditAccount, onDeleteAccount, baseCurrency }) => {
  const [showAddForm, setShowAddForm] = useState(accounts.length === 0);
  
  const accountBalances = useMemo(() => {
    const balances = new Map<string, number>();
    accounts.forEach(acc => balances.set(acc.id, 0)); // Initialize all accounts
    allTransactions.forEach(t => {
      if (balances.has(t.accountId)) {
        const current = balances.get(t.accountId)!;
        balances.set(t.accountId, current + (t.type === 'income' ? t.amount : -t.amount));
      }
    });
    return balances;
  }, [accounts, allTransactions]);

  const handleSelectionChange = (accountId: string) => {
    let newSelection: string[];
    if (accountId === 'all') {
      newSelection = selectedAccountIds.includes('all') ? [] : ['all'];
    } else {
      const currentSelection = selectedAccountIds.filter(id => id !== 'all');
      if (currentSelection.includes(accountId)) {
        newSelection = currentSelection.filter(id => id !== accountId);
      } else {
        newSelection = [...currentSelection, accountId];
      }
      if (newSelection.length === accounts.length || newSelection.length === 0) {
        newSelection = ['all'];
      }
    }
    onAccountChange(newSelection);
  };
  
  // FIX: Refactored AccountForm to remove the unused `onSave` prop which caused a type error,
  // and removed dead code related to editing, as this form is only used for adding accounts.
  const AccountForm = ({ onCancel }: { onCancel: () => void; }) => {
    const [name, setName] = useState('');
    const [openingBalance, setOpeningBalance] = useState('');
    const [accountType, setAccountType] = useState<AccountType>(AccountType.DEPOSITORY);
    const [creditLimit, setCreditLimit] = useState('');
    const [currency, setCurrency] = useState(baseCurrency);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
        onAddAccount(name, accountType, currency, parseFloat(creditLimit) || undefined, parseFloat(openingBalance) || undefined);
        onCancel();
      }
    };
    
    const currencyOptions = useMemo(() => currencies.map(c => ({ value: c.code, label: `${c.code} - ${c.name}`})), []);
    const accountTypeOptions = [ { value: AccountType.DEPOSITORY, label: 'Bank/Cash' }, { value: AccountType.CREDIT, label: 'Credit Card' }, { value: AccountType.INVESTMENT, label: 'Investment' }];

    return (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 p-3 bg-subtle rounded-lg border border-divider">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Account name" className="w-full input-base p-2 rounded-md" required />
          <div className="grid grid-cols-2 gap-3">
              <CustomSelect value={accountType} onChange={val => setAccountType(val as AccountType)} options={accountTypeOptions} />
              <CustomSelect value={currency} onChange={setCurrency} options={currencyOptions} />
          </div>
          {accountType === AccountType.CREDIT && ( <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="Credit Limit" className="w-full input-base p-2 rounded-md no-spinner"/> )}
          <input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="Opening Balance" className="w-full input-base p-2 rounded-md no-spinner"/>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="button-secondary px-3 py-1 text-sm">Cancel</button>
            <button type="submit" className="button-primary px-3 py-1 text-sm">Save</button>
          </div>
        </form>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-xl glass-card relative z-30">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-primary">Accounts</h3>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-2 bg-subtle rounded-full hover-bg-stronger transition-colors flex-shrink-0"
              aria-label={showAddForm ? 'Cancel adding account' : 'Add new account'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 text-primary ${showAddForm ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
        </div>
      
      {showAddForm && <AccountForm onCancel={() => setShowAddForm(false)} />}

       <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
         <div className="p-2 border-b border-divider">
            <CustomCheckbox
                id="acc-all"
                label="All Accounts (Filter)"
                checked={selectedAccountIds.includes('all')}
                onChange={() => handleSelectionChange('all')}
            />
        </div>
        {accounts.map(account => {
            const balance = accountBalances.get(account.id) || 0;
            const formatCurrency = getCurrencyFormatter(account.currency).format;
            const isSelected = selectedAccountIds.includes('all') || selectedAccountIds.includes(account.id);
            return (
                <div key={account.id} className={`p-2 flex justify-between items-center group hover-bg-stronger rounded-md transition-colors ${isSelected ? '' : 'opacity-60'}`}>
                    <div onClick={() => handleSelectionChange(account.id)} className="flex-grow cursor-pointer">
                        <p className="font-semibold text-primary">{account.name}</p>
                        <p className="text-sm font-bold text-primary">{formatCurrency(balance)}</p>
                    </div>
                    <div className="space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEditAccount(account)} className="p-1 text-secondary hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg></button>
                        <button onClick={() => onDeleteAccount(account.id)} className="p-1 text-secondary hover:text-rose-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                </div>
            )
        })}
        </div>
    </div>
  );
};

export default AccountSelector;