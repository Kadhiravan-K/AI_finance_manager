import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Account, AccountType } from '../types';
import CustomCheckbox from './CustomCheckbox';
import CustomSelect from './CustomSelect';
import { currencies } from '../utils/currency';

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountIds: string[];
  onAccountChange: (ids: string[]) => void;
  onAddAccount: (name: string, accountType: AccountType, currency: string, creditLimit?: number, openingBalance?: number) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  baseCurrency: string;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ accounts, selectedAccountIds, onAccountChange, onAddAccount, onEditAccount, onDeleteAccount, baseCurrency }) => {
  const [newAccountName, setNewAccountName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [accountType, setAccountType] = useState<AccountType>(AccountType.DEPOSITORY);
  const [creditLimit, setCreditLimit] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState<string>(baseCurrency);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const accountsByCurrency = useMemo(() => {
    return accounts.reduce((acc, account) => {
      (acc[account.currency] = acc[account.currency] || []).push(account);
      return acc;
    }, {} as Record<string, Account[]>);
  }, [accounts]);
  
  const currencyOptions = useMemo(() => currencies.map(c => ({
    value: c.code,
    label: `${c.code} - ${c.name}`
  })), []);

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccountName.trim()) {
      onAddAccount(newAccountName.trim(), accountType, newAccountCurrency, parseFloat(creditLimit) || undefined, parseFloat(openingBalance) || undefined);
      setNewAccountName('');
      setAccountType(AccountType.DEPOSITORY);
      setCreditLimit('');
      setOpeningBalance('');
      setNewAccountCurrency(baseCurrency);
      setShowAddForm(false);
    }
  };

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
  
  const handleCurrencyGroupSelect = (currency: string, isSelected: boolean) => {
    const currencyAccountIds = accountsByCurrency[currency].map(a => a.id);
    const otherSelectedIds = selectedAccountIds.filter(id => id !== 'all' && !currencyAccountIds.includes(id));
    
    let newSelection = isSelected 
      ? [...otherSelectedIds, ...currencyAccountIds]
      : otherSelectedIds;

    if (newSelection.length === accounts.length || newSelection.length === 0) {
        newSelection = ['all'];
    }
    onAccountChange(newSelection);
  };


  const getButtonLabel = () => {
    if (selectedAccountIds.includes('all') || selectedAccountIds.length === 0) return 'All Accounts';
    if (selectedAccountIds.length === 1) {
      return accounts.find(a => a.id === selectedAccountIds[0])?.name || 'Select Account';
    }
    
    const firstCurrency = accounts.find(a => a.id === selectedAccountIds[0])?.currency;
    const allSameCurrency = selectedAccountIds.every(id => accounts.find(a => a.id === id)?.currency === firstCurrency);

    if (allSameCurrency) {
        const currencyAccounts = accountsByCurrency[firstCurrency!];
        if(selectedAccountIds.length === currencyAccounts.length) return `All ${firstCurrency} Accounts`;
    }

    return `${selectedAccountIds.length} Accounts Selected`;
  };
  
  const accountTypeOptions = [
      { value: AccountType.DEPOSITORY, label: 'Depository (Bank, Cash)' },
      { value: AccountType.CREDIT, label: 'Credit Card' },
      { value: AccountType.INVESTMENT, label: 'Investment' },
  ];

  return (
    <div className="mb-6 p-4 rounded-xl glass-card relative z-30">
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow" ref={wrapperRef}>
           <button 
             type="button" 
             onClick={() => setIsDropdownOpen(!isDropdownOpen)}
             className="w-full input-base rounded-lg py-2 px-3 text-left flex justify-between items-center"
           >
             <span className="text-primary truncate">{getButtonLabel()}</span>
             <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
           </button>
           {isDropdownOpen && (
             <div className="absolute z-50 mt-1 w-full glass-card rounded-lg shadow-lg border border-divider flex flex-col max-h-60 animate-fadeInUp">
                <div className="p-2 border-b border-divider">
                    <CustomCheckbox
                        id="acc-all"
                        label="All Accounts (All Currencies)"
                        checked={selectedAccountIds.includes('all')}
                        onChange={() => handleSelectionChange('all')}
                    />
                </div>
               <ul className="p-1 overflow-y-auto">
                 {Object.entries(accountsByCurrency).map(([currency, currencyAccounts]) => (
                     <li key={currency}>
                        <div className="p-2 sticky top-0 bg-subtle">
                             <CustomCheckbox
                                id={`curr-${currency}`}
                                label={`All ${currency} Accounts`}
                                checked={selectedAccountIds.includes('all') || currencyAccounts.every(a => selectedAccountIds.includes(a.id))}
                                onChange={(isChecked) => handleCurrencyGroupSelect(currency, isChecked)}
                            />
                        </div>
                        <ul className="pl-6">
                            {currencyAccounts.map(account => (
                            <li key={account.id} className="p-2 flex justify-between items-center group hover-bg-stronger rounded-md">
                                <CustomCheckbox
                                id={`acc-${account.id}`}
                                label={account.name}
                                checked={selectedAccountIds.includes('all') || selectedAccountIds.includes(account.id)}
                                onChange={() => handleSelectionChange(account.id)}
                                />
                                <div className="space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEditAccount(account)} className="p-1 text-secondary hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg></button>
                                    <button onClick={() => onDeleteAccount(account.id)} className="p-1 text-secondary hover:text-rose-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </li>
                            ))}
                        </ul>
                     </li>
                 ))}
               </ul>
             </div>
           )}
        </div>
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
      {showAddForm && (
        <form onSubmit={handleAddAccountSubmit} className="mt-4 space-y-3 opacity-0 animate-fadeInUp">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="Account name" className="flex-grow rounded-lg py-2 px-3 shadow-inner input-base" required />
              <CustomSelect value={newAccountCurrency} onChange={setNewAccountCurrency} options={currencyOptions} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={accountType} onChange={e => setAccountType(e.target.value as AccountType)} className="input-base rounded-lg py-2 px-3">
                  {accountTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <input type="number" value={openingBalance} onWheel={(e) => (e.target as HTMLElement).blur()} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="Opening Balance (Optional)" className="w-full rounded-lg py-2 px-3 shadow-inner input-base no-spinner"/>
          </div>
           
            {accountType === AccountType.CREDIT && ( <input type="number" onWheel={(e) => (e.target as HTMLElement).blur()} value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="Credit Limit (Optional)" className="w-full rounded-lg py-2 px-3 shadow-inner input-base no-spinner"/> )}
           
          <div className="flex justify-end">
            <button type="submit" className="button-primary font-bold py-2 px-4" disabled={!newAccountName.trim()}>Add Account</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AccountSelector;