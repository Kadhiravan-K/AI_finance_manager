

import React, { createContext, useState, ReactNode, useEffect, useMemo, useContext, useCallback } from 'react';
import { parseTransactionText } from '../services/geminiService';
import { Settings, Payee, Category, Sender, Contact, ContactGroup, Theme, DashboardWidget, NotificationSettings, TrustBinDeletionPeriodUnit, ToggleableTool, FinancialProfile, ActiveScreen, Transaction, Account, Budget, RecurringTransaction, Goal, InvestmentHolding, Trip, TripExpense, Shop, ShopProduct, ShopSale, ShopEmployee, ShopShift, TrustBinItem, UnlockedAchievement, UserStreak, Challenge, ChallengeType, TransactionType, AccountType, ItemType, ParsedTransactionData, Refund, Settlement, ShoppingList, GlossaryEntry, UndoToastState, TripDayPlan, TripItineraryItem, SplitDetail, Debt } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { calculateNextDueDate } from '../utils/date';
import { USER_SELF_ID } from '../constants';
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
        debtManager: true,
    },
    footerActions: ['dashboard', 'reports', 'calendar', 'more'],
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
  glossaryEntries: GlossaryEntry[];
  setGlossaryEntries: (value: GlossaryEntry[] | ((val: GlossaryEntry[]) => GlossaryEntry[])) => Promise<void>;
  debts: Debt[];
  setDebts: (value: Debt[] | ((val: Debt[]) => Debt[])) => Promise<void>;
  selectedAccountIds: string[];
  setSelectedAccountIds: (value: string[] | ((val: string[]) => string[])) => Promise<void>;
  accountToEdit: Account | null;
  setAccountToEdit: React.Dispatch<React.SetStateAction<Account | null>>;
  undoToast: UndoToastState | null;
  setUndoToast: React.Dispatch<React.SetStateAction<UndoToastState | null>>;


  // Functions
  findOrCreateCategory: (fullName: string, type: TransactionType) => string;
  updateStreak: () => void;
  checkAndCompleteChallenge: (type: ChallengeType) => void;
  deleteItem: (itemId: string, itemType: ItemType) => void;
  onAddAccount: (name: string, accountType: AccountType, currency: string, creditLimit?: number, openingBalance?: number) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  handleRecordSettlement: (fromContactId: string, toContactId: string, amount: number, currency: string) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onBuyInvestment: (investmentAccountId: string, name: string, quantity: number, price: number, fromAccountId: string) => void;
  onSellInvestment: (holdingId: string, quantity: number, price: number, toAccountId: string) => void;
  onUpdateInvestmentValue: (holdingId: string, newCurrentValue: number) => void;
  onTransfer: (fromAccountId: string, toAccountId: string, fromAmount: number, toAmount: number, notes?: string) => void;
  onExecuteAICommand: (command: any) => Promise<string>;
  onSaveAutoTransaction: (text: string, accountId?: string) => Promise<void>;
  onSaveManualTransaction: (transaction: Transaction) => void;
  onSplitTransaction: (transactionId: string, splits: { personName: string; amount: number }[]) => void;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const SAMPLE_TRIP: Trip[] = [
    {
        id: 'sample-trip-1',
        name: 'Sample Goa Trip',
        date: new Date().toISOString(),
        currency: 'INR',
        participants: [
            { contactId: USER_SELF_ID, name: 'You' },
            { contactId: 'sample-contact-1', name: 'Alex' }
        ],
        budget: 25000,
        plan: [
            {
                id: 'day-1', date: new Date().toISOString().split('T')[0], title: 'Day 1: Arrival & Beach Fun',
                items: [
                    { id: 'item-1-1', time: '14:00', activity: 'Arrive and check-in to hotel', type: 'lodging' },
                    { id: 'item-1-2', time: '16:00', activity: 'Relax at Baga Beach', type: 'activity' },
                    { id: 'item-1-3', time: '19:00', activity: 'Dinner at a beach shack', type: 'food' },
                ]
            }
        ]
    }
];

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { categories, setCategories, payees, setPayees, senders, setSenders, contactGroups, setContactGroups, contacts, setContacts } = useContext(SettingsContext);

    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('finance-tracker-transactions', []);
    const [accounts, setAccounts] = useLocalStorage<Account[]>('finance-tracker-accounts', []);
    const [budgets, setBudgets] = useLocalStorage<Budget[]>('finance-tracker-budgets', []);
    const [recurringTransactions, setRecurringTransactions] = useLocalStorage<RecurringTransaction[]>('finance-tracker-recurring', []);
    const [goals, setGoals] = useLocalStorage<Goal[]>('finance-tracker-goals', []);
    const [investmentHoldings, setInvestmentHoldings] = useLocalStorage<InvestmentHolding[]>('finance-tracker-investments', []);
    const [trips, setTrips] = useLocalStorage<Trip[]>('finance-tracker-trips', SAMPLE_TRIP);
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
    const [glossaryEntries, setGlossaryEntries] = useLocalStorage<GlossaryEntry[]>('finance-tracker-glossary', DEFAULT_GLOSSARY_ENTRIES);
    const [debts, setDebts] = useLocalStorage<Debt[]>('finance-tracker-debts', []);
    const [selectedAccountIds, setSelectedAccountIds] = useLocalStorage<string[]>('finance-tracker-selected-account-ids', ['all']);
    const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
    const [undoToast, setUndoToast] = useState<UndoToastState | null>(null);

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
          'transaction': setTransactions as any, 'category': setCategories, 'payee': setPayees,
          'sender': setSenders, 'contact': setContacts, 'contactGroup': setContactGroups,
          'goal': setGoals as any, 'recurringTransaction': setRecurringTransactions as any, 'account': setAccounts as any,
          'trip': setTrips as any, 'tripExpense': setTripExpenses as any, 'shop': setShops as any,
          'shopProduct': setShopProducts as any, 'shopEmployee': setShopEmployees as any, 'shopShift': setShopShifts as any,
          'refund': setRefunds as any, 'settlement': setSettlements as any, 'shoppingList': setShoppingLists as any,
          'glossaryEntry': setGlossaryEntries as any, 'debt': setDebts as any,
        };

        const itemMap: Record<string, any[]> = {
          'transaction': transactions, 'category': categories, 'payee': payees,
          'sender': senders, 'contact': contacts, 'contactGroup': contactGroups,
          'goal': goals, 'recurringTransaction': recurringTransactions, 'account': accounts,
          'trip': trips, 'tripExpense': tripExpenses, 'shop': shops,
          'shopProduct': shopProducts, 'shopEmployee': shopEmployees, 'shopShift': shopShifts,
          'refund': refunds, 'settlement': settlements, 'shoppingList': shoppingLists,
          'glossaryEntry': glossaryEntries, 'debt': debts,
        };
      
      const items = itemMap[itemType];
      const setter = setterMap[itemType];

      if (!items || !setter) return;

      const itemToDelete = items.find(item => item.id === itemId);
      if(itemToDelete) {
          // Optimistically remove from UI
          setter(items.filter(item => item.id !== itemId));
          
          const onConfirm = () => {
              // On confirmation (timeout), move to trust bin
              const newTrustBinItem: TrustBinItem = { id: self.crypto.randomUUID(), item: itemToDelete, itemType, deletedAt: new Date().toISOString() };
              setTrustBin(prev => [...prev, newTrustBinItem]);
          };

          const onUndo = () => {
              // On undo, add the item back. The full list is captured in the closure.
              setter(items);
          };
          
          setUndoToast({
              message: `Deleted ${itemType}`,
              onConfirm,
              onUndo,
          });
      }
    }, [
        transactions, categories, payees, senders, contacts, contactGroups, goals, recurringTransactions, accounts, trips, tripExpenses, shops, shopProducts, shopEmployees, shopShifts, refunds, settlements, shoppingLists, glossaryEntries, debts, setTrustBin,
        setTransactions, setCategories, setPayees, setSenders, setContacts, setContactGroups, setGoals, setRecurringTransactions, setAccounts, setTrips, setTripExpenses, setShops, setShopProducts, setShopEmployees, setShopShifts, setRefunds, setSettlements, setShoppingLists, setGlossaryEntries, setDebts,
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

    const onUpdateTransaction = useCallback((transaction: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
    }, [setTransactions]);

    const onBuyInvestment = useCallback((investmentAccountId: string, name: string, quantity: number, price: number, fromAccountId: string) => {
        const cost = quantity * price;

        setInvestmentHoldings(prev => {
            const existing = prev.find(h => h.accountId === investmentAccountId && h.name.toLowerCase() === name.toLowerCase());
            if (existing) {
                const totalQuantity = existing.quantity + quantity;
                const totalCost = (existing.quantity * existing.averageCost) + cost;
                const newAverageCost = totalCost / totalQuantity;
                return prev.map(h => h.id === existing.id ? { ...h, quantity: totalQuantity, averageCost: newAverageCost, currentValue: h.currentValue + cost } : h);
            } else {
                return [...prev, {
                    id: self.crypto.randomUUID(),
                    accountId: investmentAccountId,
                    name,
                    quantity,
                    averageCost: price,
                    currentValue: cost
                }];
            }
        });

        const categoryId = findOrCreateCategory('Savings & Investment / Stock Purchases', TransactionType.EXPENSE);
        const newTransaction: Transaction = {
            id: self.crypto.randomUUID(),
            accountId: fromAccountId,
            description: `Buy Investment: ${quantity} of ${name}`,
            amount: cost,
            type: TransactionType.EXPENSE,
            categoryId,
            date: new Date().toISOString(),
        };
        setTransactions(prev => [newTransaction, ...prev]);
        updateStreak();
    }, [setInvestmentHoldings, setTransactions, findOrCreateCategory, updateStreak]);

    const onSellInvestment = useCallback((holdingId: string, quantity: number, price: number, toAccountId: string) => {
        const income = quantity * price;
        const holding = investmentHoldings.find(h => h.id === holdingId);
        if (!holding) return;

        if (quantity >= holding.quantity) {
            setInvestmentHoldings(prev => prev.filter(h => h.id !== holdingId));
        } else {
            const remainingQuantity = holding.quantity - quantity;
            const remainingValue = (remainingQuantity / holding.quantity) * holding.currentValue;
            setInvestmentHoldings(prev => prev.map(h => h.id === holdingId ? { ...h, quantity: remainingQuantity, currentValue: remainingValue } : h));
        }

        const categoryId = findOrCreateCategory('Investments / Capital Gains', TransactionType.INCOME);
        const newTransaction: Transaction = {
            id: self.crypto.randomUUID(),
            accountId: toAccountId,
            description: `Sell Investment: ${quantity} of ${holding.name}`,
            amount: income,
            type: TransactionType.INCOME,
            categoryId,
            date: new Date().toISOString(),
        };
        setTransactions(prev => [newTransaction, ...prev]);
        updateStreak();
    }, [investmentHoldings, setInvestmentHoldings, setTransactions, findOrCreateCategory, updateStreak]);

    const onUpdateInvestmentValue = useCallback((holdingId: string, newCurrentValue: number) => {
        setInvestmentHoldings(prev => prev.map(h => h.id === holdingId ? { ...h, currentValue: newCurrentValue } : h));
    }, [setInvestmentHoldings]);
    
    const onTransfer = useCallback((fromAccountId: string, toAccountId: string, fromAmount: number, toAmount: number, notes?: string) => {
        const transferId = self.crypto.randomUUID();
        const fromAccount = accounts.find(a => a.id === fromAccountId);
        const toAccount = accounts.find(a => a.id === toAccountId);
        
        if (!fromAccount || !toAccount) return;

        const transferCategory = findOrCreateCategory('Transfers', TransactionType.EXPENSE);
        
        const expenseTx: Transaction = {
            id: self.crypto.randomUUID(),
            accountId: fromAccountId,
            description: `Transfer to ${toAccount.name}`,
            amount: fromAmount,
            type: TransactionType.EXPENSE,
            categoryId: transferCategory,
            date: new Date().toISOString(),
            notes,
            transferId,
        };

        const incomeTx: Transaction = {
            id: self.crypto.randomUUID(),
            accountId: toAccountId,
            description: `Transfer from ${fromAccount.name}`,
            amount: toAmount,
            type: TransactionType.INCOME,
            categoryId: transferCategory,
            date: new Date().toISOString(),
            notes,
            transferId,
        };

        setTransactions(prev => [expenseTx, incomeTx, ...prev]);
        updateStreak();
    }, [accounts, setTransactions, findOrCreateCategory, updateStreak]);

    const onExecuteAICommand = useCallback(async (command: any): Promise<string> => {
        const { description, amount, type, category, accountName } = command;
        const targetAccount = accounts.find(a => a.name.toLowerCase() === accountName?.toLowerCase());
        if (!targetAccount) {
            return `I couldn't find an account named "${accountName}". Please be more specific.`;
        }
        const categoryId = findOrCreateCategory(category, type);
        const newTransaction: Transaction = {
            id: self.crypto.randomUUID(),
            accountId: targetAccount.id,
            description,
            amount,
            type,
            categoryId,
            date: new Date().toISOString(),
        };
        setTransactions(prev => [newTransaction, ...prev]);
        updateStreak();
        checkAndCompleteChallenge('log_transaction');
        return `Done! I've added a new ${type} of ${amount} for "${description}" to your ${targetAccount.name} account.`;
    }, [accounts, findOrCreateCategory, setTransactions, updateStreak, checkAndCompleteChallenge]);

    const onSaveAutoTransaction = useCallback(async (text: string, accountId?: string) => {
        if (!accountId) {
            alert("An account must be selected to save the transaction.");
            return;
        }
        try {
            const parsedData = await parseTransactionText(text);
            if (parsedData) {
                if (parsedData.isSpam) {
                    alert(`Spam detected (Confidence: ${parsedData.spamConfidence?.toFixed(2)}). Transaction not added.`);
                    return;
                }
                const categoryId = findOrCreateCategory(parsedData.categoryName, parsedData.type);
                const newTransaction: Transaction = {
                    id: parsedData.id,
                    accountId: accountId,
                    description: parsedData.description,
                    amount: parsedData.amount,
                    type: parsedData.type,
                    categoryId: categoryId,
                    date: parsedData.date,
                    notes: parsedData.notes,
                };
                setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                updateStreak();
                checkAndCompleteChallenge('log_transaction');
            } else {
                alert("Could not understand the transaction from the text provided.");
            }
        } catch (error) {
            console.error("Error during auto transaction parsing:", error);
            alert(error instanceof Error ? error.message : "An error occurred during parsing.");
        }
    }, [findOrCreateCategory, setTransactions, updateStreak, checkAndCompleteChallenge]);

    const onSaveManualTransaction = useCallback((data: Transaction) => {
        const existing = transactions.find(t => t.id === data.id);
        if (existing) {
            setTransactions(prev => prev.map(t => (t.id === data.id ? data : t)));
        } else {
            setTransactions(prev => [data, ...prev]);
            updateStreak();
            checkAndCompleteChallenge('log_transaction');
        }
    }, [transactions, setTransactions, updateStreak, checkAndCompleteChallenge]);

    const onSplitTransaction = useCallback((transactionId: string, splits: { personName: string; amount: number }[]) => {
        setTransactions(prev => prev.map(t => {
            if (t.id === transactionId) {
                const newSplitDetails: SplitDetail[] = splits.map(s => ({
                    id: contacts.find(c => c.name === s.personName)?.id || self.crypto.randomUUID(),
                    personName: s.personName,
                    amount: s.amount,
                    isSettled: s.personName.toLowerCase() === 'you',
                }));
                return { ...t, splitDetails: newSplitDetails };
            }
            return t;
        }));
    }, [setTransactions, contacts]);

    const value = useMemo(() => ({
        transactions, setTransactions, accounts, setAccounts, budgets, setBudgets,
        recurringTransactions, setRecurringTransactions, goals, setGoals, investmentHoldings, setInvestmentHoldings,
        trips, setTrips, tripExpenses, setTripExpenses, shops, setShops, shopProducts, setShopProducts,
        shopSales, setShopSales, shopEmployees, setShopEmployees, shopShifts, setShopShifts,
        trustBin, setTrustBin, unlockedAchievements, setUnlockedAchievements, streaks, setStreaks,
        challenges, setChallenges, refunds, setRefunds, 
        settlements, setSettlements,
        shoppingLists, setShoppingLists,
        glossaryEntries, setGlossaryEntries,
        debts, setDebts,
        selectedAccountIds, setSelectedAccountIds, accountToEdit, setAccountToEdit,
        undoToast, setUndoToast,
        findOrCreateCategory, updateStreak, checkAndCompleteChallenge, deleteItem,
        onAddAccount, onEditAccount, onDeleteAccount, handleRecordSettlement,
        onUpdateTransaction, onBuyInvestment, onSellInvestment, onUpdateInvestmentValue,
        onTransfer, onExecuteAICommand, onSaveAutoTransaction, onSaveManualTransaction, onSplitTransaction,
    }), [
        transactions, setTransactions, accounts, setAccounts, budgets, setBudgets,
        recurringTransactions, setRecurringTransactions, goals, setGoals, investmentHoldings, setInvestmentHoldings,
        trips, setTrips, tripExpenses, setTripExpenses, shops, setShops, shopProducts, setShopProducts,
        shopSales, setShopSales, shopEmployees, setShopEmployees, shopShifts, setShopShifts,
        trustBin, setTrustBin, unlockedAchievements, setUnlockedAchievements, streaks, setStreaks,
        challenges, setChallenges, refunds, setRefunds,
        settlements, setSettlements,
        shoppingLists, setShoppingLists,
        glossaryEntries, setGlossaryEntries,
        debts, setDebts,
        selectedAccountIds, setSelectedAccountIds, accountToEdit, setAccountToEdit,
        undoToast, setUndoToast,
        findOrCreateCategory, updateStreak, checkAndCompleteChallenge, deleteItem,
        onAddAccount, onEditAccount, onDeleteAccount, handleRecordSettlement,
        onUpdateTransaction, onBuyInvestment, onSellInvestment, onUpdateInvestmentValue,
        onTransfer, onExecuteAICommand, onSaveAutoTransaction, onSaveManualTransaction, onSplitTransaction
    ]);

    return <AppDataContext.Provider value={value as any}>{children}</AppDataContext.Provider>;
}