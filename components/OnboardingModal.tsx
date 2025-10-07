import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { currencies } from '../utils/currency';
import { AccountType } from '../types';
import CustomSelect from './CustomSelect';

const OnboardingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { saveSettings, saveAccount, settings } = useAppContext();
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState(settings.currency || 'INR');
  const [accountName, setAccountName] = useState('Cash');
  const [openingBalance, setOpeningBalance] = useState('0');

  const handleFinish = async () => {
    // Save initial account
    await saveAccount({
      name: accountName,
      accountType: AccountType.DEPOSITORY,
      currency: currency,
    }, parseFloat(openingBalance) || 0);

    // Save settings and mark setup as complete
    await saveSettings({
      ...settings,
      currency: currency,
      isSetupComplete: true,
      hasSeenOnboarding: true,
    });
    
    onClose();
  };

  const currencyOptions = currencies.map(c => ({
    value: c.code,
    label: `${c.code} - ${c.name}`
  }));

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md border border-divider animate-scaleIn">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary mb-2">Welcome to Finance Hub!</h2>
          <p className="text-secondary mb-6">Let's get your finances set up in a minute.</p>

          {step === 1 && (
            <div className="space-y-4 animate-fadeInUp">
              <h3 className="font-semibold text-primary">Step 1: Your Primary Currency</h3>
              <CustomSelect options={currencyOptions} value={currency} onChange={setCurrency} />
              <button onClick={() => setStep(2)} className="button-primary w-full py-2 mt-4">Next</button>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4 animate-fadeInUp">
              <h3 className="font-semibold text-primary">Step 2: Add Your First Account</h3>
              <p className="text-sm text-secondary">This can be your physical cash, a savings account, or your main checking account.</p>
              <div>
                <label className="text-sm font-medium text-secondary mb-1">Account Name</label>
                <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} className="w-full input-base p-2 rounded-lg" />
              </div>
               <div>
                <label className="text-sm font-medium text-secondary mb-1">Current Balance ({currency})</label>
                <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} className="w-full input-base p-2 rounded-lg" />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep(1)} className="button-secondary w-full py-2">Back</button>
                <button onClick={handleFinish} className="button-primary w-full py-2">Finish Setup</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
