import React, { useState, useContext, useRef, useEffect } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';
import CustomSelect from './CustomSelect';
import { AccountType, Account, Transaction, TransactionType } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

interface OnboardingModalProps {
  onFinish: () => void;
}

interface AccountData {
    name: string;
    balance: string;
    accountType: AccountType;
    currency: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onFinish }) => {
  const [step, setStep] = useState(1);
  const { settings, setSettings } = useContext(SettingsContext);
  const [, setAccounts] = useLocalStorage<Account[]>('finance-tracker-accounts', []);
  const [, setTransactions] = useLocalStorage<Transaction[]>('finance-tracker-transactions', []);
  const { categories } = useContext(SettingsContext);
  
  const [initialAccounts, setInitialAccounts] = useState<AccountData[]>([{ name: 'Cash', balance: '', accountType: AccountType.DEPOSITORY, currency: settings.currency }]);
  const lastInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 3 && initialAccounts.length > 1) {
        lastInputRef.current?.focus();
    }
  }, [initialAccounts.length, step]);

  const handleCurrencyChange = (currencyCode: string) => {
    setSettings(prev => ({ ...prev, currency: currencyCode }));
  };
  
  const handleAccountChange = (index: number, field: keyof AccountData, value: string) => {
    const newAccounts = [...initialAccounts];
    (newAccounts[index] as any)[field] = value;
    setInitialAccounts(newAccounts);
  };
  
  const addAccountField = () => {
    setInitialAccounts([...initialAccounts, { name: '', balance: '', accountType: AccountType.DEPOSITORY, currency: settings.currency }]);
  };
  
  const removeAccountField = (indexToRemove: number) => {
    setInitialAccounts(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleFinish = async () => {
      const finalAccounts: Account[] = [];
      const openingTransactions: Transaction[] = [];
      const openingBalanceCategory = categories.find(c => c.name === 'Opening Balance' && c.type === TransactionType.INCOME);
      
      for (const acc of initialAccounts) {
          if (acc.name.trim()) {
              const newAccount: Account = {
                  id: self.crypto.randomUUID(),
                  name: acc.name.trim(),
                  accountType: acc.accountType,
                  currency: acc.currency,
              };
              finalAccounts.push(newAccount);
              
              const balance = parseFloat(acc.balance);
              if (!isNaN(balance) && balance > 0 && openingBalanceCategory) {
                  openingTransactions.push({
                      id: self.crypto.randomUUID(),
                      accountId: newAccount.id,
                      description: 'Opening Balance',
                      amount: balance,
                      type: TransactionType.INCOME,
                      categoryId: openingBalanceCategory.id,
                      date: new Date().toISOString()
                  });
              }
          }
      }
      await setAccounts(finalAccounts);
      await setTransactions(openingTransactions);
      onFinish();
  };

  const currencyOptions = currencies.map(c => ({
    value: c.code,
    label: `${c.code} - ${c.name}`
  }));
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center animate-fadeInUp">
            <h2 className="text-3xl font-bold text-primary mb-4">Welcome to Your Personal Finance Hub!</h2>
            <p className="text-secondary mb-8">Let's get your finances organized in just a few simple steps.</p>
            <button onClick={() => setStep(2)} className="button-primary px-6 py-3 w-full flex items-center justify-center">Get Started</button>
          </div>
        );
      case 2:
        return (
          <div className="animate-fadeInUp">
            <h2 className="text-2xl font-bold text-primary mb-4">Select Your Base Currency</h2>
            <p className="text-secondary mb-6">This will be your default currency for reports and summaries.</p>
            <CustomSelect
              value={settings.currency}
              onChange={handleCurrencyChange}
              options={currencyOptions}
            />
            <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(1)} className="button-secondary px-6 py-3">Back</button>
                <button onClick={() => setStep(3)} className="button-primary px-6 py-3">Next</button>
            </div>
          </div>
        );
      case 3:
        return (
            <div className="animate-fadeInUp">
                <h2 className="text-2xl font-bold text-primary mb-2">Set Up Your First Accounts</h2>
                <p className="text-secondary mb-6">Add your primary accounts and their current balances. You can add more later.</p>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {initialAccounts.map((acc, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                            <input 
                                type="text" 
                                placeholder="Account Name" 
                                value={acc.name}
                                onChange={e => handleAccountChange(index, 'name', e.target.value)}
                                className="input-base w-full rounded-lg py-2 px-3 md:col-span-2"
                                ref={index === initialAccounts.length - 1 ? lastInputRef : null}
                                autoFocus={index === 0}
                            />
                            <div className="md:col-span-1">
                                <CustomSelect 
                                    value={acc.currency} 
                                    onChange={value => handleAccountChange(index, 'currency', value)}
                                    options={currencyOptions} 
                                />
                            </div>
                            <input 
                                type="number"
                                step="0.01"
                                placeholder={`Balance`}
                                value={acc.balance}
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                onChange={e => handleAccountChange(index, 'balance', e.target.value)}
                                className="input-base w-full rounded-lg py-2 px-3 no-spinner md:col-span-1"
                            />
                            {initialAccounts.length > 1 ? (
                                <button type="button" onClick={() => removeAccountField(index)} className="text-rose-400 hover:text-rose-300 transition-colors h-8 w-8 flex items-center justify-center rounded-full hover:bg-rose-500/20 md:col-span-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            ) : <div className="md:col-span-1"></div>}
                        </div>
                    ))}
                </div>
                <button onClick={addAccountField} className="w-full text-center p-2 mt-4 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400 transition-all duration-200 onboarding-add-button">
                    + Add Another Account
                </button>
                <div className="mt-8 flex justify-between">
                    <button onClick={() => setStep(2)} className="button-secondary px-6 py-3">Back</button>
                    <button onClick={handleFinish} className="button-primary px-6 py-3">Finish Setup</button>
                </div>
            </div>
        )
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-8 border border-divider">
        {renderStep()}
      </div>
    </div>
  );
};

export default OnboardingModal;