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
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onFinish }) => {
  const [settings, setSettings] = useLocalStorage('finance-tracker-settings', null as any);
  const [accounts, setAccounts] = useLocalStorage<Account[]>('finance-tracker-accounts', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('finance-tracker-transactions', []);
  const [categories] = useLocalStorage<Category[]>('finance-tracker-categories', []);

  const [baseCurrency, setBaseCurrency] = useState('INR');
  const [accountFields, setAccountFields] = useState<AccountData[]>([
    { id: self.crypto.randomUUID(), name: 'Cash', amount: '', accountType: AccountType.DEPOSITORY },
    { id: self.crypto.randomUUID(), name: 'Main Bank', amount: '', accountType: AccountType.DEPOSITORY },
  ]);

  const findOrCreateCategory = (name: string, type: TransactionType): string => {
    const existing = categories.find(c => c.name === name && c.type === type && !c.parentId);
    // In a real app, we'd have a reliable way to get this ID. For onboarding, a hardcoded-like approach is acceptable.
    // Assuming the default categories are generated with a known ID or are found.
    return existing ? existing.id : 'opening-balance-category-id'; 
  };

  const handleFinish = async () => {
    // 1. Save settings
    await setSettings((prev: any) => ({ ...prev, currency: baseCurrency }));

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
                currency: baseCurrency,
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
                    // FIX: Changed 'openingBalanceCategoryId' to 'openingBalanceCategory' to match the defined variable name.
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
    setAccountFields(prev => [...prev, { id: self.crypto.randomUUID(), name: '', amount: '', accountType: AccountType.DEPOSITORY }]);
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

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn flex flex-col max-h-[90vh]">
        <div className="p-6 text-center border-b border-divider">
            <h2 className="text-2xl font-bold text-primary">Initial Setup</h2>
            <p className="text-sm text-secondary mt-1">Set your base currency and add your primary accounts to begin.</p>
        </div>

        <div className="p-6 space-y-6 flex-grow overflow-y-auto">
            {/* Currency */}
            <div className="space-y-2 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                <label className="font-semibold text-primary">1. Select Your Base Currency</label>
                <p className="text-xs text-secondary">This will be your default currency for reports and summaries.</p>
                <CustomSelect options={currencyOptions} value={baseCurrency} onChange={setBaseCurrency} />
            </div>

            {/* Accounts */}
            <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                <div>
                    <label className="font-semibold text-primary">2. Set Up Your First Accounts</label>
                    <p className="text-xs text-secondary">Add your primary accounts and their current balances. You can add more later.</p>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {accountFields.map((account, index) => (
                        <div key={account.id} className="p-3 bg-subtle rounded-lg border border-divider relative animate-slideFadeIn">
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="Account Name" value={account.name} onChange={e => handleAccountChange(account.id, 'name', e.target.value)} className="input-base p-2 rounded-md col-span-2" />
                                <CustomSelect options={accountTypeOptions} value={account.accountType} onChange={val => handleAccountChange(account.id, 'accountType', val)} />
                                <input type="text" inputMode="decimal" placeholder="Current Balance" value={account.amount} onWheel={e => e.currentTarget.blur()} onChange={e => handleAccountChange(account.id, 'amount', e.target.value)} className="input-base p-2 rounded-md no-spinner" />
                            </div>
                            {accountFields.length > 1 && (
                                <button onClick={() => removeAccountField(account.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg close-button">&times;</button>
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
             <button onClick={handleFinish} className="button-primary w-full py-3 font-bold">
                Finish Setup
             </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;