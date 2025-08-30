import React, { useState, useContext } from 'react';
import { SettingsContext, AppDataContext } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';
import CustomSelect from './CustomSelect';
import { AccountType, Account, Transaction, TransactionType, Category } from '../types';

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

// Copied from StoryGenerator.tsx to ensure categories are available during onboarding
const generateCategories = (): Category[] => {
    const categories: { name: string, type: TransactionType, parent: string | null, icon: string, children?: any[] }[] = [
        // Income
        { name: 'Salary', type: TransactionType.INCOME, parent: null, icon: '💼', children: [
            { name: 'Job', icon: '👨‍💻' }, { name: 'Part-time', icon: '🕒' }, { name: 'Freelance', icon: '🧑‍🔧' }, { name: 'Overtime Pay', icon: '🧾' }, { name: 'Performance Bonus', icon: '🎯' }
        ]},
        { name: 'Business', type: TransactionType.INCOME, parent: null, icon: '🏢', children: [
            { name: 'Product Sales', icon: '📦' }, { name: 'Service Income', icon: '🛠️' }, { name: 'Royalties', icon: '🎧' }, { name: 'Consulting Fees', icon: '🧮' }, { name: 'Affiliate Earnings', icon: '🧾' }
        ]},
        { name: 'Investments', type: TransactionType.INCOME, parent: null, icon: '📈', children: [
            { name: 'Dividends', icon: '💸' }, { name: 'Interest', icon: '🏦' }, { name: 'Capital Gains', icon: '📊' }, { name: 'Crypto Profits', icon: '🪙' }, { name: 'REIT Income', icon: '🏠' }
        ]},
        { name: 'Rental Income', type: TransactionType.INCOME, parent: null, icon: '🏠', children: [
            { name: 'Residential Rent', icon: '🏡' }, { name: 'Commercial Rent', icon: '🏬' }, { name: 'Airbnb/Short-Term', icon: '🛏️' }, { name: 'Storage Rental', icon: '🧺' }
        ]},
        { name: 'Gifts & Donations', type: TransactionType.INCOME, parent: null, icon: '🎁', children: [
            { name: 'Cash Gifts', icon: '💰' }, { name: 'Crowdfunding', icon: '🤝' }, { name: 'Inheritance', icon: '🧾' }, { name: 'Wedding Gifts', icon: '🎉' }, { name: 'Graduation Gifts', icon: '🎓' }
        ]},
        { name: 'Refunds & Rebates', type: TransactionType.INCOME, parent: null, icon: '🔁', children: [
            { name: 'Tax Refund', icon: '🧾' }, { name: 'Purchase Rebate', icon: '💳' }, { name: 'Cashback', icon: '💵' }, { name: 'Return Refund', icon: '🛍️' }, { name: 'Service Refund', icon: '🧼' }
        ]},
        { name: 'Other Income', type: TransactionType.INCOME, parent: null, icon: '🎲', children: [
            { name: 'Lottery', icon: '🎟️' }, { name: 'Prize Money', icon: '🏆' }, { name: 'Miscellaneous', icon: '❓' }, { name: 'Survey Rewards', icon: '🧠' }, { name: 'App Referral Bonus', icon: '📱' }
        ]},
        // Expenses
        { name: 'Housing', type: TransactionType.EXPENSE, parent: null, icon: '🏠', children: [
            { name: 'Rent', icon: '🏘️' }, { name: 'Mortgage', icon: '🏦' }, { name: 'Property Tax', icon: '🧾' }, { name: 'Repairs', icon: '🔧' }, { name: 'Home Improvement', icon: '🪜' }
        ]},
        { name: 'Utilities', type: TransactionType.EXPENSE, parent: null, icon: '🔌', children: [
            { name: 'Electricity', icon: '💡' }, { name: 'Water', icon: '🚰' }, { name: 'Gas', icon: '🔥' }, { name: 'Internet', icon: '🌐' }, { name: 'Phone', icon: '📞' }, { name: 'Cable TV', icon: '📡' }
        ]},
        { name: 'Food & Groceries', type: TransactionType.EXPENSE, parent: null, icon: '🍽️', children: [
            { name: 'Supermarket', icon: '🛒' }, { name: 'Dining Out', icon: '🍴' }, { name: 'Snacks', icon: '🍫' }, { name: 'Beverages', icon: '🧃' }, { name: 'Meal Delivery', icon: '🧑‍🍳' }
        ]},
        { name: 'Transportation', type: TransactionType.EXPENSE, parent: null, icon: '🚗', children: [
            { name: 'Fuel', icon: '⛽' }, { name: 'Public Transport', icon: '🚌' }, { name: 'Vehicle Maintenance', icon: '🔧' }, { name: 'Car Insurance', icon: '🚘' }, { name: 'Parking Fees', icon: '🅿️' }, { name: 'Ride-Hailing (Uber/Ola)', icon: '🚕' }
        ]},
        { name: 'Health & Insurance', type: TransactionType.EXPENSE, parent: null, icon: '🩺', children: [
            { name: 'Medical Bills', icon: '🧾' }, { name: 'Health Insurance', icon: '🛡️' }, { name: 'Gym', icon: '🏋️' }, { name: 'Medicines', icon: '💊' }, { name: 'Lab Tests', icon: '🧪' }, { name: 'Dental Care', icon: '🦷' }
        ]},
        { name: 'Education', type: TransactionType.EXPENSE, parent: null, icon: '📚', children: [
            { name: 'Tuition', icon: '🎓' }, { name: 'Books', icon: '📖' }, { name: 'Online Courses', icon: '💻' }, { name: 'Coaching Classes', icon: '🧠' }, { name: 'Exam Fees', icon: '📝' }
        ]},
        { name: 'Entertainment', type: TransactionType.EXPENSE, parent: null, icon: '🎉', children: [
            { name: 'Movies', icon: '🎬' }, { name: 'Subscriptions', icon: '📺' }, { name: 'Events', icon: '🎟️' }, { name: 'Gaming', icon: '🎮' }, { name: 'Music & Podcasts', icon: '🎧' }
        ]},
        { name: 'Shopping', type: TransactionType.EXPENSE, parent: null, icon: '🛍️', children: [
            { name: 'Clothing', icon: '👕' }, { name: 'Electronics', icon: '📱' }, { name: 'Home Goods', icon: '🪑' }, { name: 'Travel Gear', icon: '🧳' }, { name: 'Accessories', icon: '🕶️' }
        ]},
        { name: 'Finance', type: TransactionType.EXPENSE, parent: null, icon: '💳', children: [
            { name: 'Loan Payments', icon: '🏦' }, { name: 'Credit Card Bills', icon: '💳' }, { name: 'Bank Fees', icon: '🧾' }, { name: 'Interest Charges', icon: '📉' }, { name: 'Late Payment Penalties', icon: '🧾' }
        ]},
        { name: 'Savings & Investment', type: TransactionType.EXPENSE, parent: null, icon: '💼', children: [
            { name: 'Emergency Fund', icon: '🆘' }, { name: 'SIPs', icon: '📈' }, { name: 'Stock Purchases', icon: '📊' }, { name: 'Crypto Investments', icon: '🪙' }, { name: 'Real Estate Investment', icon: '🏠' }
        ]},
        { name: 'Personal Care', type: TransactionType.EXPENSE, parent: null, icon: '🧖', children: [
            { name: 'Salon', icon: '💇' }, { name: 'Skincare', icon: '🧴' }, { name: 'Hygiene Products', icon: '🧼' }, { name: 'Spa & Nails', icon: '💅' }, { name: 'Wellness Therapy', icon: '🧘' }
        ]},
        { name: 'Family & Kids', type: TransactionType.EXPENSE, parent: null, icon: '👨‍👩‍👧', children: [
            { name: 'School Fees', icon: '🏫' }, { name: 'Toys', icon: '🧸' }, { name: 'Childcare', icon: '🧑‍🍼' }, { name: 'Kids Clothing', icon: '🧥' }, { name: 'Lunch & Snacks', icon: '🍱' }
        ]},
        { name: 'Donations', type: TransactionType.EXPENSE, parent: null, icon: '🙏', children: [
            { name: 'Charity', icon: '❤️' }, { name: 'Religious Offerings', icon: '🕉️' }, { name: 'Clothing Donation', icon: '🧥' }, { name: 'Book Donation', icon: '📚' }
        ]},
        { name: 'Miscellaneous', type: TransactionType.EXPENSE, parent: null, icon: '🌀', children: [
            { name: 'Pet Care', icon: '🐶' }, { name: 'Gifts', icon: '🎁' }, { name: 'Unexpected Expenses', icon: '⚠️' }, { name: 'Travel Insurance', icon: '🧳' }, { name: 'Subscription Renewals', icon: '🧾' }
        ]},
    ];
    // System categories
    const systemCats: { name: string, type: TransactionType, parent: string | null, icon: string, children?: any[] }[] = [
        { name: 'Opening Balance', type: TransactionType.INCOME, parent: null, icon: '🏦' },
        { name: 'Transfers', type: TransactionType.INCOME, parent: null, icon: '↔️' },
        { name: 'Debt Repayment', type: TransactionType.INCOME, parent: null, icon: '🤝' },
        { name: 'Transfers', type: TransactionType.EXPENSE, parent: null, icon: '↔️' },
        { name: 'Goal Contributions', type: TransactionType.EXPENSE, parent: null, icon: '🎯' },
        { name: 'Money Lent', type: TransactionType.EXPENSE, parent: null, icon: '💸' },
        { name: 'Shop Sales', type: TransactionType.INCOME, parent: null, icon: '🏪' },
    ];
    
    const allCategories: Category[] = [];

    [...categories, ...systemCats].forEach(cat => {
        const parentId = self.crypto.randomUUID();
        allCategories.push({ id: parentId, name: cat.name, type: cat.type, parentId: null, icon: cat.icon });
        if (cat.children) {
            cat.children.forEach(child => {
                allCategories.push({ id: self.crypto.randomUUID(), name: child.name, type: cat.type, parentId: parentId, icon: child.icon });
            });
        }
    });

    return allCategories;
};
const DEFAULT_CATEGORIES = generateCategories();


const OnboardingModal: React.FC<OnboardingModalProps> = ({ onFinish }) => {
  const settingsContext = useContext(SettingsContext);
  const dataContext = useContext(AppDataContext);
  
  if (!settingsContext || !dataContext) {
    console.error("OnboardingModal must be used within SettingsProvider and AppDataProvider.");
    return null;
  }

  const { settings, setSettings, categories, setCategories } = settingsContext;
  const { setAccounts, setTransactions } = dataContext;

  const [defaultCurrency, setDefaultCurrency] = useState(settings.currency || 'INR');
  const [accountFields, setAccountFields] = useState<AccountData[]>([
    { id: self.crypto.randomUUID(), name: 'Cash', amount: '', accountType: AccountType.DEPOSITORY, currency: defaultCurrency },
    { id: self.crypto.randomUUID(), name: 'Main Bank', amount: '', accountType: AccountType.DEPOSITORY, currency: defaultCurrency },
  ]);

  const handleFinish = async () => {
    let currentCategories = categories;
    if (currentCategories.length === 0) {
        await setCategories(DEFAULT_CATEGORIES);
        currentCategories = DEFAULT_CATEGORIES;
    }

    const findOrCreateCategoryLocal = (name: string, type: TransactionType): string => {
        const existing = currentCategories.find(c => c.name === name && c.type === type && !c.parentId);
        if (existing) {
            return existing.id;
        }
        console.error(`Onboarding: Could not find required category "${name}"`);
        const fallbackCategory = currentCategories.find(c => c.type === type);
        return fallbackCategory ? fallbackCategory.id : (currentCategories[0]?.id || '');
    };
    
    const validAccounts = accountFields.filter(field => field.name.trim());
    const newBaseCurrency = validAccounts.length > 0 ? validAccounts[0].currency : defaultCurrency;
    
    await setSettings((prev) => ({ ...prev, currency: newBaseCurrency }));

    const newAccounts: Account[] = [];
    const newTransactions: Transaction[] = [];

    const openingBalanceCategory = findOrCreateCategoryLocal('Opening Balance', TransactionType.INCOME);
    if (!openingBalanceCategory) {
        console.error("CRITICAL: 'Opening Balance' category not found during onboarding.");
        alert("An error occurred during setup. Could not find a category for opening balances.");
        return;
    }

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
    
    await setAccounts(newAccounts);
    await setTransactions(newTransactions);

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
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
