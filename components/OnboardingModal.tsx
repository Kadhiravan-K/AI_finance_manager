import React, { useState, useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';
import CustomSelect from './CustomSelect';
import { AccountType } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

interface OnboardingModalProps {
  onFinish: () => void;
}

interface AccountData {
    name: string;
    balance: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onFinish }) => {
  const [step, setStep] = useState(1);
  const { settings, setSettings } = useContext(SettingsContext);
  const [, setAccounts] = useLocalStorage<any[]>('finance-tracker-accounts', []);
  const [, setTransactions] = useLocalStorage<any[]>('finance-tracker-transactions', []);
  const { categories } = useContext(SettingsContext);
  
  const [initialAccounts, setInitialAccounts] = useState<AccountData[]>([{ name: 'Cash', balance: '' }]);

  const handleCurrencyChange = (currencyCode: string) => {
    setSettings(prev => ({ ...prev, currency: currencyCode }));
  };
  
  const handleAccountChange = (index: number, field: keyof AccountData, value: string) => {
    const newAccounts = [...initialAccounts];
    newAccounts[index][field] = value;
    setInitialAccounts(newAccounts);
  };
  
  const addAccountField = () => {
    setInitialAccounts([...initialAccounts, { name: '', balance: '' }]);
  };

  const handleFinish = () => {
      const finalAccounts = [];
      const openingTransactions = [];
      const openingBalanceCategory = categories.find(c => c.name === 'Opening Balance');
      
      for (const acc of initialAccounts) {
          if (acc.name.trim()) {
              const newAccount = {
                  id: self.crypto.randomUUID(),
                  name: acc.name.trim(),
                  accountType: AccountType.DEPOSITORY
              };
              finalAccounts.push(newAccount);
              
              const balance = parseFloat(acc.balance);
              if (balance > 0 && openingBalanceCategory) {
                  openingTransactions.push({
                      id: self.crypto.randomUUID(),
                      accountId: newAccount.id,
                      description: 'Opening Balance',
                      amount: balance,
                      type: 'income',
                      categoryId: openingBalanceCategory.id,
                      date: new Date().toISOString()
                  });
              }
          }
      }
      setAccounts(finalAccounts);
      setTransactions(openingTransactions);
      onFinish();
  };

  const currencyOptions = currencies.map(c => ({
    value: c.code,
    label: `${c.name} (${c.symbol})`
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
            <h2 className="text-2xl font-bold text-primary mb-4">Select Your Currency</h2>
            <p className="text-secondary mb-6">This will be used for all your financial entries.</p>
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
                <p className="text-secondary mb-6">Add your primary accounts and their current balances to get an accurate start.</p>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {initialAccounts.map((acc, index) => (
                        <div key={index} className="grid grid-cols-2 gap-3">
                            <input 
                                type="text" 
                                placeholder="Account Name (e.g., Bank)" 
                                value={acc.name}
                                onChange={e => handleAccountChange(index, 'name', e.target.value)}
                                className="input-base w-full rounded-lg py-2 px-3"
                            />
                            <input 
                                type="number"
                                step="0.01"
                                placeholder="Current Balance"
                                value={acc.balance}
                                onChange={e => handleAccountChange(index, 'balance', e.target.value)}
                                className="input-base w-full rounded-lg py-2 px-3 no-spinner"
                            />
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
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-8 border border-divider">
        {renderStep()}
      </div>
    </div>
  );
};

export default OnboardingModal;