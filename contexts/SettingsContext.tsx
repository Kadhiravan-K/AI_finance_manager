

import React, { createContext, useState, ReactNode, useEffect, useMemo, useContext, useCallback } from 'react';
import { Settings, Payee, Category, Sender, Contact, ContactGroup, Theme, DashboardWidget, NotificationSettings, TrustBinDeletionPeriodUnit, ToggleableTool, FinancialProfile, ActiveScreen, Transaction, Account, Budget, RecurringTransaction, Goal, InvestmentHolding, Trip, TripExpense, Shop, ShopProduct, ShopSale, ShopEmployee, ShopShift, TrustBinItem, UnlockedAchievement, UserStreak, Challenge, ChallengeType, TransactionType, AccountType, ItemType, ParsedTransactionData, Refund, Settlement, ShoppingList, GlossaryEntry } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { calculateNextDueDate } from '../utils/date';
import { USER_SELF_ID } from '../constants';
// Fix: Import default glossary entries to initialize the state.
import { DEFAULT_GLOSSARY_ENTRIES } from '../utils/glossary';

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
    { id: 'budgets', name: 'Budgets Summary', visible: false },
    { id: 'goals', name: 'Goals Summary', visible: false },
    { id: 'charts', name: 'Spending Charts', visible: false },
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
        aiHub: true,
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
        calendar: true,
        budgets: true,
        goals: true,
        learn: true,
        challenges: true,
        shoppingLists: true,
        subscriptions: true,
    },
    footerActions: ['dashboard', 'reports', 'budgets', 'more'],
    googleCalendar: {
        connected: false,
    },
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
  { id: 'group-family', name: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'group-friends', name: 'Friends', icon: '🧑‍🤝‍🧑' },
  { id: 'group-work', name: 'Work & Professional', icon: '🧑‍💼' },
  { id: 'group-education', name: 'Education', icon: '🏫' },
  { id: 'group-services', name: 'Services & Utilities', icon: '🛠️' },
  { id: 'group-medical', name: 'Medical & Emergency', icon: '🏥' },
  { id: 'group-finance', name: 'Business & Finance', icon: '💼' },
  { id: 'group-tech', name: 'Tech & Support', icon: '📱' },
  { id: 'group-personal', name: 'Personal & Lifestyle', icon: '🧘' },
  { id: 'group-shopping', name: 'Shopping & Vendors', icon: '🛍️' },
  { id: 'group-misc', name: 'Miscellaneous', icon: '📦' },
];

const DEFAULT_CONTACTS: Contact[] = [
    // Family
    { id: self.crypto.randomUUID(), name: 'Mom', groupId: 'group-family' },
    { id: self.crypto.randomUUID(), name: 'Dad', groupId: 'group-family' },
    // Friends
    { id: self.crypto.randomUUID(), name: 'Alex Smith', groupId: 'group-friends' },
    { id: self.crypto.randomUUID(), name: 'Ben Carter', groupId: 'group-friends' },
    // Work
    { id: self.crypto.randomUUID(), name: 'Chloe Davis (Manager)', groupId: 'group-work' },
    // Services
    { id: self.crypto.randomUUID(), name: 'Local Electrician', groupId: 'group-services' },
    // Medical
    { id: self.crypto.randomUUID(), name: 'Dr. Evelyn Reed', groupId: 'group-medical' },
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
    if (!settings) return DEFAULT_SETTINGS;

    const newSettings: any = { ...DEFAULT_SETTINGS, ...settings };
    
    newSettings.enabledTools = { ...DEFAULT_SETTINGS.enabledTools, ...(settings.enabledTools || {}) };
    
    // Migration: rename aiCommandCenter to aiHub
    if (newSettings.enabledTools.aiCommandCenter) {
      newSettings.enabledTools.aiHub = true;
      delete newSettings.enabledTools.aiCommandCenter;
    }
    
    newSettings.googleCalendar = { ...DEFAULT_SETTINGS.googleCalendar, ...(settings.googleCalendar || {}) };
    newSettings.footerActions = settings.footerActions || DEFAULT_SETTINGS.footerActions;
    
    // Clean up deprecated settings
    delete newSettings.fabActions;
    delete newSettings.headerActions;
    delete newSettings.enabledTools.glossary;

    if (newSettings.enabledTools.shop === undefined) {
      newSettings.enabledTools.shop = true;
    }
    if (newSettings.enabledTools.shoppingLists === undefined) {
      newSettings.enabledTools.shoppingLists = true;
    }
    delete newSettings.enabledTools.notes;


    return newSettings as Settings;
  }, [settings]);

  useEffect(() => {
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
  settlements: Settlement[];
  setSettlements: (value: Settlement[] | ((val: Settlement[]) => Settlement[])) => Promise<void>;
  shoppingLists: ShoppingList[];
  setShoppingLists: (value: ShoppingList[] | ((val: ShoppingList[]) => ShoppingList[])) => Promise<void>;
  // Fix: Add glossary entries to the context type.
  glossaryEntries: GlossaryEntry[];
  setGlossaryEntries: (value: GlossaryEntry[] | ((val: GlossaryEntry[]) => GlossaryEntry[])) => Promise<void>;
  selectedAccountIds: string[];
  setSelectedAccountIds: (value: string[] | ((val: string[]) => string[])) => Promise<void>;
  accountToEdit: Account | null;
  setAccountToEdit: React.Dispatch<React.SetStateAction<Account | null>>;


  // Functions
  findOrCreateCategory: (fullName: string, type: TransactionType) => string;
  updateStreak: () => void;
  checkAndCompleteChallenge: (type: ChallengeType) => void;
  deleteItem: (itemId: string, itemType: ItemType) => void;
  onAddAccount: (name: string, accountType: AccountType, currency: string, creditLimit?: number, openingBalance?: number) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  handleRecordSettlement: (fromContactId: string, toContactId: string, amount: number, currency: string) => void;
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
    const [settlements, setSettlements] = useLocalStorage<Settlement[]>('finance-tracker-settlements', []);
    const [shoppingLists, setShoppingLists] = useLocalStorage<ShoppingList[]>('finance-tracker-shopping-lists', []);
    // Fix: Properly initialize and manage glossary state.
    const [glossaryEntries, setGlossaryEntries] = useLocalStorage<GlossaryEntry[]>('finance-tracker-glossary', DEFAULT_GLOSSARY_ENTRIES);
    const [selectedAccountIds, setSelectedAccountIds] = useLocalStorage<string[]>('finance-tracker-selected-account-ids', ['all']);
    const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

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
          'refund': setRefunds, 'settlement': setSettlements, 'shoppingList': setShoppingLists as any,
          // Fix: Wire up the glossary entry setter for deletion.
          'glossaryEntry': setGlossaryEntries as any,
        };

        const itemMap: Record<string, any[]> = {
          'transaction': transactions, 'category': categories, 'payee': payees,
          'sender': senders, 'contact': contacts, 'contactGroup': contactGroups,
          'goal': goals, 'recurringTransaction': recurringTransactions, 'account': accounts,
          'trip': trips, 'tripExpense': tripExpenses, 'shop': shops,
          'shopProduct': shopProducts, 'shopEmployee': shopEmployees, 'shopShift': shopShifts,
          'refund': refunds, 'settlement': settlements, 'shoppingList': shoppingLists,
          // Fix: Provide the glossary entries array for deletion logic.
          'glossaryEntry': glossaryEntries,
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
        transactions, categories, payees, senders, contacts, contactGroups, goals, recurringTransactions, accounts, trips, tripExpenses, shops, shopProducts, shopEmployees, shopShifts, refunds, settlements, shoppingLists, glossaryEntries, setTrustBin,
        setTransactions, setCategories, setPayees, setSenders, setContacts, setContactGroups, setGoals, setRecurringTransactions, setAccounts, setTrips, setTripExpenses, setShops, setShopProducts, setShopEmployees, setShopShifts, setRefunds, setSettlements, setShoppingLists, setGlossaryEntries,
    ]);

    const onAddAccount = useCallback((name: string, accountType: AccountType, currency: string, creditLimit?: number, openingBalance?: number) => {
        const newAccount: Account = { id: self.crypto.randomUUID(), name, accountType, currency, creditLimit };
        setAccounts(prev => {
            if (prev.length === 0) {
                setSelectedAccountIds([newAccount.id]);
            }
            return [...prev, newAccount]
        });
        if (openingBalance && openingBalance > 0) {
            const openingBalanceCategory = findOrCreateCategory('Opening Balance', TransactionType.INCOME);
            const openingTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: newAccount.id, description: 'Opening Balance', amount: openingBalance, type: TransactionType.INCOME, categoryId: openingBalanceCategory, date: new Date().toISOString() };
            setTransactions(prev => [openingTransaction, ...prev]);
        }
    }, [findOrCreateCategory, setAccounts, setTransactions, setSelectedAccountIds]);

    const onEditAccount = useCallback((account: Account) => {
        setAccountToEdit(account);
    }, []);
    
    const onDeleteAccount = useCallback((id: string) => {
        deleteItem(id, 'account');
    }, [deleteItem]);

    const handleRecordSettlement = useCallback((fromContactId: string, toContactId: string, amount: number, currency: string) => {
        // 1. Create the Settlement object
        const newSettlement: Settlement = {
            id: self.crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            fromContactId,
            toContactId,
            amount,
            currency
        };
        setSettlements(prev => [...(prev || []), newSettlement]);

        // 2. Create corresponding financial transactions
        const fromAccount = accounts.find(a => a.currency === currency);
        const toAccount = accounts.find(a => a.currency === currency);

        if (!fromAccount || !toAccount) {
            console.error("Cannot record settlement transaction: No suitable account found for the currency.", currency);
            return;
        }

        const allContactsAndUser = [...contacts, { id: USER_SELF_ID, name: 'You', groupId: '' }];
        const fromName = allContactsAndUser.find(c => c.id === fromContactId)?.name || 'Unknown';
        const toName = allContactsAndUser.find(c => c.id === toContactId)?.name || 'Unknown';
        
        const expenseCategoryId = findOrCreateCategory('Debt Settlement', TransactionType.EXPENSE);
        const incomeCategoryId = findOrCreateCategory('Debt Settlement', TransactionType.INCOME);
        const now = new Date().toISOString();

        const expenseTx: Transaction = {
            id: self.crypto.randomUUID(),
            accountId: fromAccount.id,
            description: `Settlement to ${toName}`,
            amount: amount,
            type: TransactionType.EXPENSE,
            categoryId: expenseCategoryId,
            date: now
        };

        const incomeTx: Transaction = {
            id: self.crypto.randomUUID(),
            accountId: toAccount.id,
            description: `Settlement from ${fromName}`,
            amount: amount,
            type: TransactionType.INCOME,
            categoryId: incomeCategoryId,
            date: now
        };

        setTransactions(prev => [incomeTx, expenseTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, [accounts, contacts, findOrCreateCategory, setSettlements, setTransactions]);

    const value = useMemo(() => ({
        transactions, setTransactions, accounts, setAccounts, budgets, setBudgets,
        recurringTransactions, setRecurringTransactions, goals, setGoals, investmentHoldings, setInvestmentHoldings,
        trips, setTrips, tripExpenses, setTripExpenses, shops, setShops, shopProducts, setShopProducts,
        shopSales, setShopSales, shopEmployees, setShopEmployees, shopShifts, setShopShifts,
        trustBin, setTrustBin, unlockedAchievements, setUnlockedAchievements, streaks, setStreaks,
        challenges, setChallenges, refunds, setRefunds, 
        settlements, setSettlements,
        shoppingLists, setShoppingLists,
        // Fix: Expose glossary entries and setter on the context.
        glossaryEntries, setGlossaryEntries,
        selectedAccountIds, setSelectedAccountIds, accountToEdit, setAccountToEdit,
        findOrCreateCategory, updateStreak, checkAndCompleteChallenge, deleteItem,
        onAddAccount, onEditAccount, onDeleteAccount, handleRecordSettlement,
    }), [
        transactions, setTransactions, accounts, setAccounts, budgets, setBudgets,
        recurringTransactions, setRecurringTransactions, goals, setGoals, investmentHoldings, setInvestmentHoldings,
        trips, setTrips, tripExpenses, setTripExpenses, shops, setShops, shopProducts, setShopProducts,
        shopSales, setShopSales, shopEmployees, setShopEmployees, shopShifts, setShopShifts,
        trustBin, setTrustBin, unlockedAchievements, setUnlockedAchievements, streaks, setStreaks,
        challenges, setChallenges, refunds, setRefunds,
        settlements, setSettlements,
        shoppingLists, setShoppingLists,
        // Fix: Include glossary state in the dependency array.
        glossaryEntries, setGlossaryEntries,
        selectedAccountIds, setSelectedAccountIds, accountToEdit, setAccountToEdit,
        findOrCreateCategory, updateStreak, checkAndCompleteChallenge, deleteItem,
        onAddAccount, onEditAccount, onDeleteAccount, handleRecordSettlement
    ]);

    return <AppDataContext.Provider value={value as any}>{children}</AppDataContext.Provider>;
}