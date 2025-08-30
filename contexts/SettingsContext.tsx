import React, { createContext, useState, ReactNode, useEffect, useMemo, useContext, useCallback } from 'react';
import { Settings, Payee, Category, Sender, Contact, ContactGroup, Theme, DashboardWidget, NotificationSettings, TrustBinDeletionPeriodUnit, ToggleableTool, FinancialProfile, ActiveScreen, Transaction, Account, Budget, RecurringTransaction, Goal, InvestmentHolding, Trip, TripExpense, Shop, ShopProduct, ShopSale, ShopEmployee, ShopShift, TrustBinItem, UnlockedAchievement, UserStreak, Challenge, ChallengeType, TransactionType, AccountType, ItemType, ParsedTransactionData, Refund } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { calculateNextDueDate } from '../utils/date';

interface SettingsContextType {
  settings: Settings;
  setSettings: (value: Settings | ((val: Settings) => Settings)) => Promise<void>;
  payees: Payee[];
  setPayees: (value: Payee[] | ((val: Payee[]) => Payee[])) => Promise<void>;
  categories: Category[];
  setCategories: (value: Category[] | ((val: Category[]) => Category[])) => Promise<void>;
  senders: Sender[];
  setSenders: (value: Sender[] | ((val: Sender[]) => Sender[])) => Promise<void>;
  contactGroups: ContactGroup[];
  setContactGroups: (value: ContactGroup[] | ((val: ContactGroup[]) => ContactGroup[])) => Promise<void>;
  contacts: Contact[];
  setContacts: (value: Contact[] | ((val: Contact[]) => Contact[])) => Promise<void>;
  financialProfile: FinancialProfile;
  setFinancialProfile: (value: FinancialProfile | ((val: FinancialProfile) => FinancialProfile)) => Promise<void>;
}

const DEFAULT_DASHBOARD_WIDGETS: DashboardWidget[] = [
    { id: 'financialHealth', name: "Financial Health", visible: true },
    { id: 'aiCoach', name: "AI Financial Coach", visible: true },
    { id: 'summary', name: 'Monthly Summary', visible: true },
    { id: 'upcoming', name: 'Upcoming/Due Bills', visible: true },
    { id: 'budgets', name: 'Budgets Summary', visible: true },
    { id: 'goals', name: 'Goals Summary', visible: true },
    { id: 'charts', name: 'Spending Charts', visible: true },
    { id: 'netWorth', name: 'Net Worth', visible: false },
    { id: 'portfolio', name: 'Investment Portfolio', visible: false },
    { id: 'debts', name: 'Debts (Owed to You)', visible: false },
];

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    enabled: true,
    bills: { enabled: true },
    budgets: { enabled: true, categories: {} },
    largeTransaction: { enabled: false, amount: 1000 },
    goals: { enabled: true },
    investments: { enabled: true },
};

export const DEFAULT_SETTINGS: Settings = {
    currency: 'INR',
    theme: 'dark',
    dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
    notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
    trustBinDeletionPeriod: {
        value: 30,
        unit: 'days'
    },
    enabledTools: {
        achievements: true,
        aiCommandCenter: true,
        dataHub: false,
        investments: true,
        payees: false,
        refunds: true,
        scheduledPayments: true,
        senders: false,
        shop: false,
        calculator: true,
        tripManagement: true,
        accountTransfer: true,
    },
    footerActions: ['dashboard', 'reports', 'budgets', 'more'],
};

const DEFAULT_FINANCIAL_PROFILE: FinancialProfile = {
    monthlySalary: 0,
    monthlyRent: 0,
    monthlyEmi: 0,
    emergencyFundGoal: 0,
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  setSettings: async () => {},
  payees: [],
  setPayees: async () => {},
  categories: [],
  setCategories: async () => {},
  senders: [],
  setSenders: async () => {},
  contactGroups: [],
  setContactGroups: async () => {},
  contacts: [],
  setContacts: async () => {},
  financialProfile: DEFAULT_FINANCIAL_PROFILE,
  setFinancialProfile: async () => {},
});

const DEFAULT_CONTACT_GROUPS: ContactGroup[] = [
    { id: 'group-school', name: 'School Friends', icon: '🎓' },
    { id: 'group-college', name: 'College Friends', icon: '🏛️' },
    { id: 'group-work', name: 'Work Colleagues', icon: '💼' },
    { id: 'group-business', name: 'Business', icon: '🤝' },
    { id: 'group-relatives', name: 'Relatives', icon: '👨‍👩‍👧‍👦' },
];

const DEFAULT_CONTACTS: Contact[] = [
    { id: self.crypto.randomUUID(), name: 'Alex Smith', groupId: 'group-work' },
    { id: self.crypto.randomUUID(), name: 'Ben Carter', groupId: 'group-work' },
    { id: self.crypto.randomUUID(), name: 'Chloe Davis', groupId: 'group-work' },
];


export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<Settings>('finance-tracker-settings', DEFAULT_SETTINGS);
  const [payees, setPayees] = useLocalStorage<Payee[]>('finance-tracker-payees', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('finance-tracker-categories', []);
  const [senders, setSenders] = useLocalStorage<Sender[]>('finance-tracker-senders', []);
  const [contactGroups, setContactGroups] = useLocalStorage<ContactGroup[]>('finance-tracker-contact-groups', DEFAULT_CONTACT_GROUPS);
  const [contacts, setContacts] = useLocalStorage<Contact[]>('finance-tracker-contacts', DEFAULT_CONTACTS);
  const [financialProfile, setFinancialProfile] = useLocalStorage<FinancialProfile>('finance-tracker-financial-profile', DEFAULT_FINANCIAL_PROFILE);

  const migratedSettings = useMemo(() => {
    // This memo ensures that the settings object passed to consumers is always complete,
    // preventing crashes from accessing properties on undefined. It merges loaded settings
    // with defaults to fill in any missing properties from older versions.
    if (!settings) return DEFAULT_SETTINGS;

    const newSettings = { ...DEFAULT_SETTINGS, ...settings };
    
    // Deep merge nested objects
    newSettings.enabledTools = {
      ...DEFAULT_SETTINGS.enabledTools,
      ...(settings.enabledTools || {}),
    };
    
    // Safeguard: ensure Shop Hub is enabled if it was missing from saved settings
    if (newSettings.enabledTools.shop === undefined) {
      newSettings.enabledTools.shop = true;
    }


    return newSettings;
  }, [settings]);

  useEffect(() => {
    // This effect runs after render to persist the migrated settings back to storage if they differ
    // from what was originally loaded. This avoids render-loop issues.
    if (JSON.stringify(settings) !== JSON.stringify(migratedSettings)) {
      setSettings(migratedSettings);
    }
  }, [settings, migratedSettings, setSettings]);


  return (
    <SettingsContext.Provider value={{ settings: migratedSettings, setSettings, payees, setPayees, categories, setCategories, senders, setSenders, contactGroups, setContactGroups, contacts, setContacts, financialProfile, setFinancialProfile }}>
      {children}
    </SettingsContext.Provider>
  );
};


// --- APP DATA CONTEXT ---

// Define the shape of the context
interface AppDataContextType {
  // State
  transactions: Transaction[];
  setTransactions: (value: Transaction[] | ((val: Transaction[]) => Transaction[])) => Promise<void>;
  accounts: Account[];
  setAccounts: (value: Account[] | ((val: Account[]) => Account[])) => Promise<void>;
  budgets: Budget[];
  setBudgets: (value: Budget[] | ((val: Budget[]) => Budget[])) => Promise<void>;
  recurringTransactions: RecurringTransaction[];
  setRecurringTransactions: (value: RecurringTransaction[] | ((val: RecurringTransaction[]) => RecurringTransaction[])) => Promise<void>;
  goals: Goal[];
  setGoals: (value: Goal[] | ((val: Goal[]) => Goal[])) => Promise<void>;
  investmentHoldings: InvestmentHolding[];
  setInvestmentHoldings: (value: InvestmentHolding[] | ((val: InvestmentHolding[]) => InvestmentHolding[])) => Promise<void>;
  trips: Trip[];
  setTrips: (value: Trip[] | ((val: Trip[]) => Trip[])) => Promise<void>;
  tripExpenses: TripExpense[];
  setTripExpenses: (value: TripExpense[] | ((val: TripExpense[]) => TripExpense[])) => Promise<void>;
  shops: Shop[];
  setShops: (value: Shop[] | ((val: Shop[]) => Shop[])) => Promise<void>;
  shopProducts: ShopProduct[];
  setShopProducts: (value: ShopProduct[] | ((val: ShopProduct[]) => ShopProduct[])) => Promise<void>;
  shopSales: ShopSale[];
  setShopSales: (value: ShopSale[] | ((val: ShopSale[]) => ShopSale[])) => Promise<void>;
  shopEmployees: ShopEmployee[];
  setShopEmployees: (value: ShopEmployee[] | ((val: ShopEmployee[]) => ShopEmployee[])) => Promise<void>;
  shopShifts: ShopShift[];
  setShopShifts: (value: ShopShift[] | ((val: ShopShift[]) => ShopShift[])) => Promise<void>;
  trustBin: TrustBinItem[];
  setTrustBin: (value: TrustBinItem[] | ((val: TrustBinItem[]) => TrustBinItem[])) => Promise<void>;
  unlockedAchievements: UnlockedAchievement[];
  setUnlockedAchievements: (value: UnlockedAchievement[] | ((val: UnlockedAchievement[]) => UnlockedAchievement[])) => Promise<void>;
  streaks: UserStreak;
  setStreaks: (value: UserStreak | ((val: UserStreak) => UserStreak)) => Promise<void>;
  challenges: Challenge[];
  setChallenges: (value: Challenge[] | ((val: Challenge[]) => Challenge[])) => Promise<void>;
  refunds: Refund[];
  setRefunds: (value: Refund[] | ((val: Refund[]) => Refund[])) => Promise<void>;

  // Functions
  findOrCreateCategory: (fullName: string, type: TransactionType) => string;
  updateStreak: () => void;
  checkAndCompleteChallenge: (type: ChallengeType) => void;
  deleteItem: (itemId: string, itemType: ItemType) => void;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { categories, setCategories, payees, setPayees, senders, setSenders, contactGroups, setContactGroups, contacts, setContacts } = useContext(SettingsContext);

    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('finance-tracker-transactions', []);
    const [accounts, setAccounts] = useLocalStorage<Account[]>('finance-tracker-accounts', []);
    const [budgets, setBudgets] = useLocalStorage<Budget[]>('finance-tracker-budgets', []);
    const [recurringTransactions, setRecurringTransactions] = useLocalStorage<RecurringTransaction[]>('finance-tracker-recurring', []);
    const [goals, setGoals] = useLocalStorage<Goal[]>('finance-tracker-goals', []);
    const [investmentHoldings, setInvestmentHoldings] = useLocalStorage<InvestmentHolding[]>('finance-tracker-investments', []);
    const [trips, setTrips] = useLocalStorage<Trip[]>('finance-tracker-trips', []);
    const [tripExpenses, setTripExpenses] = useLocalStorage<TripExpense[]>('finance-tracker-trip-expenses', []);
    const [trustBin, setTrustBin] = useLocalStorage<TrustBinItem[]>('finance-tracker-trust-bin', []);
    const [shops, setShops] = useLocalStorage<Shop[]>('finance-tracker-shops', []);
    const [shopProducts, setShopProducts] = useLocalStorage<ShopProduct[]>('finance-tracker-shop-products', []);
    const [shopSales, setShopSales] = useLocalStorage<ShopSale[]>('finance-tracker-shop-sales', []);
    const [shopEmployees, setShopEmployees] = useLocalStorage<ShopEmployee[]>('finance-tracker-shop-employees', []);
    const [shopShifts, setShopShifts] = useLocalStorage<ShopShift[]>('finance-tracker-shop-shifts', []);
    const [unlockedAchievements, setUnlockedAchievements] = useLocalStorage<UnlockedAchievement[]>('finance-tracker-achievements', []);
    const [streaks, setStreaks] = useLocalStorage<UserStreak>('finance-tracker-streaks', { currentStreak: 0, longestStreak: 0, lastLogDate: null, streakFreezes: 3 });
    const [challenges, setChallenges] = useLocalStorage<Challenge[]>('finance-tracker-challenges', []);
    const [refunds, setRefunds] = useLocalStorage<Refund[]>('finance-tracker-refunds', []);

    const findOrCreateCategory = useCallback((fullName: string, type: TransactionType): string => {
        const parts = fullName.split('/').map(p => p.trim());
        let parentId: string | null = null;
        let finalCategoryId = '';
        let currentCategories = [...categories];
        for (const part of parts) {
          let existingCategory = currentCategories.find(c => c.name.toLowerCase() === part.toLowerCase() && c.type === type && c.parentId === parentId);
          if (existingCategory) {
            parentId = existingCategory.id;
            finalCategoryId = existingCategory.id;
          } else {
            const newCategory: Category = { id: self.crypto.randomUUID(), name: part, type, parentId, icon: '🆕' };
            currentCategories.push(newCategory);
            parentId = newCategory.id;
            finalCategoryId = newCategory.id;
          }
        }
        setCategories(currentCategories);
        return finalCategoryId;
    }, [categories, setCategories]);

    const updateStreak = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        if (streaks.lastLogDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = streaks.currentStreak;
        if (streaks.lastLogDate === yesterdayStr) {
            newStreak += 1; // Continue streak
        } else {
            newStreak = 1; // Reset or start new streak
        }

        setStreaks({
            ...streaks,
            currentStreak: newStreak,
            longestStreak: Math.max(streaks.longestStreak, newStreak),
            lastLogDate: today,
        });
    }, [streaks, setStreaks]);

    const checkAndCompleteChallenge = useCallback((type: ChallengeType) => {
        const today = new Date().toISOString().split('T')[0];
        const dailyChallenge = challenges.find(c => c.date === today);
        if (dailyChallenge && !dailyChallenge.isCompleted && dailyChallenge.type === type) {
            setChallenges(prev => prev.map(c => c.id === dailyChallenge.id ? { ...c, isCompleted: true } : c));
        }
    }, [challenges, setChallenges]);

    const deleteItem = useCallback((itemId: string, itemType: ItemType) => {
        const setterMap: Record<string, (items: any[]) => Promise<void>> = {
          'transaction': setTransactions, 'category': setCategories, 'payee': setPayees,
          'sender': setSenders, 'contact': setContacts, 'contactGroup': setContactGroups,
          'goal': setGoals, 'recurringTransaction': setRecurringTransactions, 'account': setAccounts,
          'trip': setTrips, 'tripExpense': setTripExpenses, 'shop': setShops,
          'shopProduct': setShopProducts, 'shopEmployee': setShopEmployees, 'shopShift': setShopShifts,
          'refund': setRefunds,
        };

        const itemMap: Record<string, any[]> = {
          'transaction': transactions, 'category': categories, 'payee': payees,
          'sender': senders, 'contact': contacts, 'contactGroup': contactGroups,
          'goal': goals, 'recurringTransaction': recurringTransactions, 'account': accounts,
          'trip': trips, 'tripExpense': tripExpenses, 'shop': shops,
          'shopProduct': shopProducts, 'shopEmployee': shopEmployees, 'shopShift': shopShifts,
          'refund': refunds,
        };
      
      const items = itemMap[itemType];
      const setter = setterMap[itemType];

      if (!items || !setter) return;

      const itemToDelete = items.find(item => item.id === itemId);
      if(itemToDelete) {
          const newTrustBinItem: TrustBinItem = { id: self.crypto.randomUUID(), item: itemToDelete, itemType, deletedAt: new Date().toISOString() };
          setTrustBin(prev => [...prev, newTrustBinItem]);
          setter(items.filter(item => item.id !== itemId));
      }
    }, [
        transactions, categories, payees, senders, contacts, contactGroups, goals, recurringTransactions, accounts, trips, tripExpenses, shops, shopProducts, shopEmployees, shopShifts, refunds, setTrustBin,
        setTransactions, setCategories, setPayees, setSenders, setContacts, setContactGroups, setGoals, setRecurringTransactions, setAccounts, setTrips, setTripExpenses, setShops, setShopProducts, setShopEmployees, setShopShifts, setRefunds
    ]);


    const value = useMemo(() => ({
        transactions, setTransactions, accounts, setAccounts, budgets, setBudgets,
        recurringTransactions, setRecurringTransactions, goals, setGoals, investmentHoldings, setInvestmentHoldings,
        trips, setTrips, tripExpenses, setTripExpenses, shops, setShops, shopProducts, setShopProducts,
        shopSales, setShopSales, shopEmployees, setShopEmployees, shopShifts, setShopShifts,
        trustBin, setTrustBin, unlockedAchievements, setUnlockedAchievements, streaks, setStreaks,
        challenges, setChallenges, refunds, setRefunds, findOrCreateCategory, updateStreak, checkAndCompleteChallenge, deleteItem,
    }), [
        transactions, setTransactions, accounts, setAccounts, budgets, setBudgets,
        recurringTransactions, setRecurringTransactions, goals, setGoals, investmentHoldings, setInvestmentHoldings,
        trips, setTrips, tripExpenses, setTripExpenses, shops, setShops, shopProducts, setShopProducts,
        shopSales, setShopSales, shopEmployees, setShopEmployees, shopShifts, setShopShifts,
        trustBin, setTrustBin, unlockedAchievements, setUnlockedAchievements, streaks, setStreaks,
        challenges, setChallenges, refunds, setRefunds, findOrCreateCategory, updateStreak, checkAndCompleteChallenge, deleteItem,
    ]);

    return <AppDataContext.Provider value={value as any}>{children}</AppDataContext.Provider>;
}