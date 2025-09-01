import React, { createContext, useState, ReactNode, useEffect, useMemo, useContext, useCallback } from 'react';
import { Settings, Payee, Category, Sender, Contact, ContactGroup, Theme, DashboardWidget, NotificationSettings, TrustBinDeletionPeriodUnit, ToggleableTool, FinancialProfile, ActiveScreen, Transaction, Account, Budget, RecurringTransaction, Goal, InvestmentHolding, Trip, TripExpense, Shop, ShopProduct, ShopSale, ShopEmployee, ShopShift, TrustBinItem, UnlockedAchievement, UserStreak, Challenge, ChallengeType, TransactionType, AccountType, ItemType, ParsedTransactionData, Refund, Note } from '../types';
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

export const DEFAULT_SETTINGS: Omit<Settings, 'fabActions' | 'headerActions'> & {footerActions: ActiveScreen[]} = {
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
        calendar: true,
        notes: true,
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
  settings: DEFAULT_SETTINGS as Settings,
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
  const [settings, setSettings] = useLocalStorage<Settings>('finance-tracker-settings', DEFAULT_SETTINGS as Settings);
  const [payees, setPayees] = useLocalStorage<Payee[]>('finance-tracker-payees', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('finance-tracker-categories', []);
  const [senders, setSenders] = useLocalStorage<Sender[]>('finance-tracker-senders', []);
  const [contactGroups, setContactGroups] = useLocalStorage<ContactGroup[]>('finance-tracker-contact-groups', DEFAULT_CONTACT_GROUPS);
  const [contacts, setContacts] = useLocalStorage<Contact[]>('finance-tracker-contacts', DEFAULT_CONTACTS);
  const [financialProfile, setFinancialProfile] = useLocalStorage<FinancialProfile>('finance-tracker-financial-profile', DEFAULT_FINANCIAL_PROFILE);

  const migratedSettings = useMemo(() => {
    if (!settings) return DEFAULT_SETTINGS as Settings;

    const newSettings: any = { ...DEFAULT_SETTINGS, ...settings };
    
    newSettings.enabledTools = { ...DEFAULT_SETTINGS.enabledTools, ...(settings.enabledTools || {}) };
    
    // Clean up deprecated settings
    delete newSettings.fabActions;
    delete newSettings.headerActions;

    if (newSettings.enabledTools.shop === undefined) {
      newSettings.enabledTools.shop = true;
    }

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
  setTripExpenses: (value: TripExpense[] | ((val: Trip[]) => TripExpense[])) => Promise<void>;
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
  notes: Note[];
  setNotes: (value: Note[] | ((val: Note[]) => Note[])) => Promise<void>;
  // Fix: Add state for selected accounts to be globally available
  selectedAccountIds: string[];
  setSelectedAccountIds: (value: string[] | ((val: string[]) => string[])) => Promise<void>;
  // Fix: Add state for UI communication to open edit modal from context
  accountToEdit: Account | null;
  setAccountToEdit: React.Dispatch<React.SetStateAction<Account | null>>;


  // Functions
  findOrCreateCategory: (fullName: string, type: TransactionType) => string;
  updateStreak: () => void;
  checkAndCompleteChallenge: (type: ChallengeType) => void;
  deleteItem: (itemId: string, itemType: ItemType) => void;
  moveTempNoteToTrustBin: (tempNote: { content: string, timestamp: number }) => void;
  updateNoteContent: (noteId: string, newContent: string) => void;
  archiveNote: (noteId: string, isArchived: boolean) => void;
  pinNote: (noteId: string, isPinned: boolean) => void;
  changeNoteColor: (noteId: string, color: string) => void;
  // Fix: Add account management functions to the context
  onAddAccount: (name: string, accountType: AccountType, currency: string, creditLimit?: number, openingBalance?: number) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
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
    const [notes, setNotes] = useLocalStorage<Note[]>('finance-tracker-notes', []);
    // Fix: Moved selectedAccountIds from StoryGenerator to context
    const [selectedAccountIds, setSelectedAccountIds] = useLocalStorage<string[]>('finance-tracker-selected-account-ids', ['all']);
    // Fix: Add state for cross-component communication for editing accounts
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
          'refund': setRefunds, 'note': setNotes,
        };

        const itemMap: Record<string, any[]> = {
          'transaction': transactions, 'category': categories, 'payee': payees,
          'sender': senders, 'contact': contacts, 'contactGroup': contactGroups,
          'goal': goals, 'recurringTransaction': recurringTransactions, 'account': accounts,
          'trip': trips, 'tripExpense': tripExpenses, 'shop': shops,
          'shopProduct': shopProducts, 'shopEmployee': shopEmployees, 'shopShift': shopShifts,
          'refund': refunds, 'note': notes,
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
        transactions, categories, payees, senders, contacts, contactGroups, goals, recurringTransactions, accounts, trips, tripExpenses, shops, shopProducts, shopEmployees, shopShifts, refunds, notes, setTrustBin,
        setTransactions, setCategories, setPayees, setSenders, setContacts, setContactGroups, setGoals, setRecurringTransactions, setAccounts, setTrips, setTripExpenses, setShops, setShopProducts, setShopEmployees, setShopShifts, setRefunds, setNotes
    ]);

    const moveTempNoteToTrustBin = useCallback((tempNote: { content: string; timestamp: number }) => {
        if (!tempNote.content.trim()) return;

        const now = new Date().toISOString();
        const newNote: Note = {
            id: self.crypto.randomUUID(),
            content: `[Archived Scratchpad]\n${tempNote.content}`,
            tags: ['scratchpad'],
            category: 'general',
            isArchived: false,
            isPinned: false,
            color: 'grey',
            createdAt: now,
            updatedAt: now,
        };
        const newTrustBinItem: TrustBinItem = {
            id: self.crypto.randomUUID(),
            item: newNote,
            itemType: 'note',
            deletedAt: now
        };
        setTrustBin(prev => [...prev, newTrustBinItem]);
    }, [setTrustBin]);
    
    const updateNoteContent = useCallback((noteId: string, newContent: string) => {
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: newContent, updatedAt: new Date().toISOString() } : n));
    }, [setNotes]);

    const archiveNote = useCallback((noteId: string, isArchived: boolean) => {
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isArchived, updatedAt: new Date().toISOString() } : n));
    }, [setNotes]);
    
    const pinNote = useCallback((noteId: string, isPinned: boolean) => {
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isPinned, updatedAt: new Date().toISOString() } : n));
    }, [setNotes]);

    const changeNoteColor = useCallback((noteId: string, color: string) => {
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, color, updatedAt: new Date().toISOString() } : n));
    }, [setNotes]);

    // Fix: Implement onAddAccount in the context provider
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

    // Fix: Implement onEditAccount to trigger UI effect
    const onEditAccount = useCallback((account: Account) => {
        setAccountToEdit(account);
    }, []);
    
    // Fix: Implement onDeleteAccount using the existing deleteItem function.
    const onDeleteAccount = useCallback((id: string) => {
        deleteItem(id, 'account');
    }, [deleteItem]);


    const value = useMemo(() => ({
        transactions, setTransactions, accounts, setAccounts, budgets, setBudgets,
        recurringTransactions, setRecurringTransactions, goals, setGoals, investmentHoldings, setInvestmentHoldings,
        trips, setTrips, tripExpenses, setTripExpenses, shops, setShops, shopProducts, setShopProducts,
        shopSales, setShopSales, shopEmployees, setShopEmployees, shopShifts, setShopShifts,
        trustBin, setTrustBin, unlockedAchievements, setUnlockedAchievements, streaks, setStreaks,
        challenges, setChallenges, refunds, setRefunds, notes, setNotes, 
        selectedAccountIds, setSelectedAccountIds, accountToEdit, setAccountToEdit,
        findOrCreateCategory, updateStreak, checkAndCompleteChallenge, deleteItem,
        moveTempNoteToTrustBin, updateNoteContent, archiveNote, pinNote, changeNoteColor,
        onAddAccount, onEditAccount, onDeleteAccount,
    }), [
        transactions, setTransactions, accounts, setAccounts, budgets, setBudgets,
        recurringTransactions, setRecurringTransactions, goals, setGoals, investmentHoldings, setInvestmentHoldings,
        trips, setTrips, tripExpenses, setTripExpenses, shops, setShops, shopProducts, setShopProducts,
        shopSales, setShopSales, shopEmployees, setShopEmployees, shopShifts, setShopShifts,
        trustBin, setTrustBin, unlockedAchievements, setUnlockedAchievements, streaks, setStreaks,
        challenges, setChallenges, refunds, setRefunds, notes, setNotes,
        selectedAccountIds, setSelectedAccountIds, accountToEdit, setAccountToEdit,
        findOrCreateCategory, updateStreak, checkAndCompleteChallenge, deleteItem,
        moveTempNoteToTrustBin, updateNoteContent, archiveNote, pinNote, changeNoteColor,
        onAddAccount, onEditAccount, onDeleteAccount,
    ]);

    return <AppDataContext.Provider value={value as any}>{children}</AppDataContext.Provider>;
}