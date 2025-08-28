import React, { useState } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';
import CustomSelect from './CustomSelect';
import { AccountType, Account, Transaction, TransactionType, Category } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

interface OnboardingModalProps {
  onFinish: () => void;
}

interface AccountData {
    id: string;
    name: string;
    amount: string;
    accountType: AccountType;
    currency: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onFinish }) => {
  const [settings, setSettings] = useLocalStorage('finance-tracker-settings', null as any);
  const [accounts, setAccounts] = useLocalStorage<Account[]>('finance-tracker-accounts', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('finance-tracker-transactions', []);
  const [categories] = useLocalStorage<Category[]>('finance-tracker-categories', []);

  const [defaultCurrency, setDefaultCurrency] = useState(settings?.currency || 'INR');
  const [accountFields, setAccountFields] = useState<AccountData[]>([
    { id: self.crypto.randomUUID(), name: 'Cash', amount: '', accountType: AccountType.DEPOSITORY, currency: defaultCurrency },
    { id: self.crypto.randomUUID(), name: 'Main Bank', amount: '', accountType: AccountType.DEPOSITORY, currency: defaultCurrency },
  ]);

  const findOrCreateCategory = (name: string, type: TransactionType): string => {
    // This is a simplified version for onboarding. A robust implementation would be needed for a full app.
    const existing = categories.find(c => c.name === name && c.type === type && !c.parentId);
    return existing?.id || 'opening-balance-category-id-placeholder'; 
  };

  const handleFinish = async () => {
    // 1. Determine the new base currency from the first valid account, or the default.
    const validAccounts = accountFields.filter(field => field.name.trim());
    const newBaseCurrency = validAccounts.length > 0 ? validAccounts[0].currency : defaultCurrency;
    await setSettings((prev: any) => ({ ...prev, currency: newBaseCurrency }));


    // 2. Create accounts and opening balance transactions
    const newAccounts: Account[] = [];
    const newTransactions: Transaction[] = [];

    const openingBalanceCategory = findOrCreateCategory('Opening Balance', TransactionType.INCOME);

    for (const field of accountFields) {
        if (field.name.trim()) {
            const newAccount: Account = {
                id: self.crypto.randomUUID(),
                name: field.name.trim(),
                accountType: field.accountType,
                currency: field.currency,
            };
            newAccounts.push(newAccount);

            const openingBalance = parseFloat(field.amount);
            if (!isNaN(openingBalance) && openingBalance > 0) {
                newTransactions.push({
                    id: self.crypto.randomUUID(),
                    accountId: newAccount.id,
                    description: 'Opening Balance',
                    amount: openingBalance,
                    type: TransactionType.INCOME,
                    categoryId: openingBalanceCategory,
                    date: new Date().toISOString(),
                });
            }
        }
    }
    
    // 3. Save data to storage
    await setAccounts(newAccounts);
    await setTransactions(newTransactions);

    // 4. Finalize
    onFinish();
  };
  
  const handleAccountChange = (id: string, field: keyof AccountData, value: string) => {
    setAccountFields(prev => prev.map(acc => acc.id === id ? { ...acc, [field]: value } : acc));
  };
  
  const addAccountField = () => {
    setAccountFields(prev => [...prev, { id: self.crypto.randomUUID(), name: '', amount: '', accountType: AccountType.DEPOSITORY, currency: defaultCurrency }]);
  };

  const removeAccountField = (id: string) => {
    setAccountFields(prev => prev.filter(acc => acc.id !== id));
  };
  
  const currencyOptions = currencies.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }));
  const accountTypeOptions = [
    { value: AccountType.DEPOSITORY, label: 'Bank/Cash' },
    { value: AccountType.CREDIT, label: 'Credit Card' },
    { value: AccountType.INVESTMENT, label: 'Investment' },
  ];
  
  const isFinishDisabled = accountFields.every(acc => !acc.name.trim());

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn flex flex-col max-h-[90vh]">
        <div className="p-6 text-center border-b border-divider">
            <h2 className="text-2xl font-bold text-primary">Initial Setup</h2>
            <p className="text-sm text-secondary mt-1">Set your currency and add your accounts to begin.</p>
        </div>

        <div className="p-6 space-y-6 flex-grow overflow-y-auto">
            {/* Currency */}
            <div className="space-y-2 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                <label className="font-semibold text-primary">1. Default Currency</label>
                <p className="text-xs text-secondary">This will be the default for new accounts you add below.</p>
                <CustomSelect options={currencyOptions} value={defaultCurrency} onChange={setDefaultCurrency} />
            </div>

            {/* Accounts */}
            <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                <div>
                    <label className="font-semibold text-primary">2. Your Accounts</label>
                    <p className="text-xs text-secondary">Add your primary accounts and their current balances.</p>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {accountFields.map((account, index) => (
                        <div key={account.id} className="p-4 bg-subtle rounded-lg border border-divider relative animate-slideFadeIn">
                            <div className="space-y-3">
                                <input type="text" placeholder="Account Name (e.g., Savings)" value={account.name} onChange={e => handleAccountChange(account.id, 'name', e.target.value)} className="input-base p-2 rounded-md w-full" />
                                <div className="grid grid-cols-2 gap-3">
                                    <CustomSelect options={accountTypeOptions} value={account.accountType} onChange={val => handleAccountChange(account.id, 'accountType', val)} />
                                    <input type="text" inputMode="decimal" placeholder="Current Balance" value={account.amount} onWheel={e => e.currentTarget.blur()} onChange={e => handleAccountChange(account.id, 'amount', e.target.value)} className="input-base p-2 rounded-md no-spinner" />
                                </div>
                                <CustomSelect options={currencyOptions} value={account.currency} onChange={val => handleAccountChange(account.id, 'currency', val)} />
                            </div>
                            {accountFields.length > 1 && (
                                <button onClick={() => removeAccountField(account.id)} className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg close-button" aria-label="Remove account">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button onClick={addAccountField} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400 onboarding-add-button">
                    + Add Another Account
                </button>
            </div>
        </div>

        <div className="p-4 border-t border-divider flex-shrink-0">
             <button onClick={handleFinish} disabled={isFinishDisabled} className="button-primary w-full py-3 font-bold">
                Finish Setup
             </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;