
import React, { createContext, ReactNode, useState, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { 
    Settings, Category, Payee, Sender, Contact, ContactGroup, FinancialProfile, Transaction, 
    Account, Budget, RecurringTransaction, Goal, InvestmentHolding, UserStreak, UnlockedAchievement, 
    Challenge, Trip, TripExpense, Refund, Settlement, Shop, ShopProduct, ShopSale, 
    ShopEmployee, ShopShift, Note, GlossaryEntry, Debt, TransactionType, ItemType, ActiveScreen, 
    DashboardWidget, Invoice, InvoiceStatus, ShopType,
    TrustBinItem,
    AccountType,
    TripDayPlan,
    TripParticipant
} from '../types';
import { DEFAULT_CATEGORIES } from '../utils/categories';
import { DEFAULT_GLOSSARY_ENTRIES } from '../utils/glossary';
import { USER_SELF_ID } from '../constants';

// --- START OF DEFAULT DATA ---

const DEFAULT_COLLEGE_GROUP_ID = "group-college-friends-default";

const DEFAULT_CONTACT_GROUP: ContactGroup[] = [
    { id: DEFAULT_COLLEGE_GROUP_ID, name: "College Friends", icon: "🎓" }
];

const studentNames = [
    "K P ABISHEK", "AKALYA K", "AKASH KUMAR C M", "ALBIN THOMAS JOBY", "ARAVINTH S", "ARJUN P", "ARUNKUMAR A", 
    "ASHIF AHAMMED M", "ASWIN SHAJU", "AWINI S", "BALAJI M", "BESVIN ELRAO L", "DHARUN R", "G FAHEEM KHASHIF KHAN", 
    "GIRIRAJALINGAM P", "HARISANTH M", "JASWANTH S", "JAYACHANDHAR J", "JAYAPRASANTH S", "KADHIRAVAN K", 
    "KALAI SELVAN V", "KALAISELVAN S", "KATHIRAVAN M J", "KAVILKANNAN S", "KAVIYA M", "KAZANDHRAN M E", "KISHOR M", 
    "MADHAN R", "MANISH M", "MANOJ V", "MOHAMED THOUFEEK T S", "T R MOHAMMED ASHARAF", "MOHANRAJ C", "MUBARAK A", 
    "MUKESH M", "MUTHUKUMAR S", "NAVEEN M", "NIKSHITHA SHERIN N", "PARTHASARATHI J", "POOVARASAN P", "PRANAV M", 
    "RAGU R", "RAJAN I", "SAMUEL K THOBIYAS", "SANJAI S", "SANJAYKUMAR L V", "SARAN R", "SHAJIN A", "SHAJU A", 
    "SHARAN G", "SIVAPRIYA V", "SREEJITH R", "SRIMURALIKRISHNA S", "SRINIVASAN K", "SUDHARSAN S K", "SUGUMARAN T", 
    "SUNILKUMAR E", "UDHASINI C", "VIGNESH S", "VIKRAM S", "VISHNU A", "YOKESH G", "ESKAI PANDI", "PREM KUMAR E", 
    "SRI DEVANAESHWARAN", "VETRIVEL", "MAHENDRA KUMAR"
];

const DEFAULT_CONTACTS: Contact[] = studentNames.map(name => ({
    id: self.crypto.randomUUID(),
    name: name,
    groupId: DEFAULT_COLLEGE_GROUP_ID
}));

const getStartDate = (dayOffset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().split('T')[0];
};

const DEFAULT_TRIP_ID = "trip-goa-college-default";

const DEFAULT_TRIP_PLAN: TripDayPlan[] = [
    {
        id: self.crypto.randomUUID(),
        date: getStartDate(0),
        title: "Day 0: Travel to Goa",
        items: [
            { id: self.crypto.randomUUID(), time: "15:10", activity: "Start Journey from Coimbatore", type: 'travel', icon: '🚂' },
            { id: self.crypto.randomUUID(), time: "15:15", activity: "Overnight Travel (Train: CBE JBP SF SPL)", type: 'travel', icon: '🌙' }
        ]
    },
    {
        id: self.crypto.randomUUID(),
        date: getStartDate(1),
        title: "Day 1: North Goa Beaches",
        items: [
            { id: self.crypto.randomUUID(), time: "06:00", activity: "Arrival at Madgaon", type: 'travel', icon: '🚉' },
            { id: self.crypto.randomUUID(), time: "07:00", activity: "Transfer to Hotel & Refreshment", type: 'travel', icon: '🏨' },
            { id: self.crypto.randomUUID(), time: "09:00", activity: "Breakfast", type: 'food', icon: '🍳' },
            { id: self.crypto.randomUUID(), time: "10:00", activity: "Visit Miramar Beach", type: 'activity', icon: '🏖️' },
            { id: self.crypto.randomUUID(), time: "12:00", activity: "Explore Fort Aguada", type: 'activity', icon: '🏰' },
            { id: self.crypto.randomUUID(), time: "14:00", activity: "Dolphin Point Trip (Optional)", type: 'activity', icon: '🐬' },
            { id: self.crypto.randomUUID(), time: "16:00", activity: "Relax at Calangute Beach", type: 'activity', icon: '🌊' },
            { id: self.crypto.randomUUID(), time: "18:00", activity: "Sunset at Baga Beach", type: 'activity', icon: '🌅' },
            { id: self.crypto.randomUUID(), time: "20:00", activity: "Dinner & Hotel Check-in", type: 'lodging', icon: '🛌' }
        ]
    },
    {
        id: self.crypto.randomUUID(),
        date: getStartDate(2),
        title: "Day 2: South Goa Heritage",
        items: [
            { id: self.crypto.randomUUID(), time: "09:00", activity: "Breakfast", type: 'food', icon: '🍳' },
            { id: self.crypto.randomUUID(), time: "10:00", activity: "Visit Old Goa Churches", type: 'activity', icon: '⛪' },
            { id: self.crypto.randomUUID(), time: "13:00", activity: "Lunch", type: 'food', icon: '🍛' },
            { id: self.crypto.randomUUID(), time: "15:00", activity: "Cantilon Beach", type: 'activity', icon: '🏖️' },
            { id: self.crypto.randomUUID(), time: "18:00", activity: "Mandovi River Dancing Cruise", type: 'activity', icon: '🚢' },
            { id: self.crypto.randomUUID(), time: "20:00", activity: "Dinner & Overnight Stay", type: 'lodging', icon: '🛌' }
        ]
    },
    {
        id: self.crypto.randomUUID(),
        date: getStartDate(3),
        title: "Day 3: Naval Aviation & Departure",
        items: [
            { id: self.crypto.randomUUID(), time: "09:00", activity: "Breakfast", type: 'food', icon: '🍳' },
            { id: self.crypto.randomUUID(), time: "10:00", activity: "INS Hansa visit (subject to permission)", type: 'activity', icon: '✈️' },
            { id: self.crypto.randomUUID(), time: "13:00", activity: "Lunch", type: 'food', icon: '🍛' },
            { id: self.crypto.randomUUID(), time: "15:00", activity: "Hansa Beach", type: 'activity', icon: '🏖️' },
            { id: self.crypto.randomUUID(), time: "20:00", activity: "Dinner", type: 'food', icon: '🍲' },
            { id: self.crypto.randomUUID(), time: "21:00", activity: "Return Journey to Mangaluru (Overnight)", type: 'travel', icon: '🚌' }
        ]
    },
    {
        id: self.crypto.randomUUID(),
        date: getStartDate(4),
        title: "Day 4: Return Journey",
        items: [
            { id: self.crypto.randomUUID(), time: "06:00", activity: "Arrival at Mangaluru", type: 'travel', icon: '🌇' },
            { id: self.crypto.randomUUID(), time: "06:45", activity: "Train to Coimbatore (INTERCITY SF EX)", type: 'travel', icon: '🚂' },
            { id: self.crypto.randomUUID(), time: "15:32", activity: "Arrival at Coimbatore", type: 'travel', icon: '🏠' }
        ]
    }
];

const DEFAULT_TRIP_PARTICIPANTS: TripParticipant[] = [
    { contactId: USER_SELF_ID, name: 'You' },
    ...DEFAULT_CONTACTS.map(contact => ({ contactId: contact.id, name: contact.name }))
];

const DEFAULT_TRIPS: Trip[] = [
    {
        id: DEFAULT_TRIP_ID,
        name: "Goa College Trip",
        date: getStartDate(0),
        participants: DEFAULT_TRIP_PARTICIPANTS,
        currency: "INR",
        budget: 258400, // 6800 * 38
        plan: DEFAULT_TRIP_PLAN
    }
];

const DEFAULT_NOTE_CONTENT = `
### Inclusions
- Accommodation as mentioned (Quad sharing)
- Train Tickets (Sleeper onwards and second sitting return)
- Local Transportation in private vehicle
- Entry Tickets as per the itinerary
- Tour Manager
- Meals (3 Breakfast, 3 Lunch & 3 Dinner)
- GST

### Exclusions
- Optional Trips (e.g., Dolphin Point)
- Shopping, Video/camera/Mobile fee
- Travel Insurance/Medical expense
- Peak Charges/Holiday charges
- Adventure Activities
- Train Food

### Terms & Conditions
- Booking will be processed only after 30% of Advance Payment.
- Balance payment requested prior to 25 Days from departure.
- No Changes/modifications will be applicable on the program once the final summary has been released.
`;

const DEFAULT_NOTES: Note[] = [
    {
        id: self.crypto.randomUUID(),
        title: "Goa Trip Details",
        content: DEFAULT_NOTE_CONTENT.trim(),
        type: 'note',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tripId: DEFAULT_TRIP_ID
    }
];

// --- END OF DEFAULT DATA ---

interface SettingsContextType {
    settings: Settings;
    setSettings: (value: Settings | ((val: Settings) => Settings)) => Promise<void>;
    categories: Category[];
    setCategories: (value: Category[] | ((val: Category[]) => Category[])) => Promise<void>;
    payees: Payee[];
    setPayees: (value: Payee[] | ((val: Payee[]) => Payee[])) => Promise<void>;
    senders: Sender[];
    setSenders: (value: Sender[] | ((val: Sender[]) => Sender[])) => Promise<void>;
    contacts: Contact[];
    setContacts: (value: Contact[] | ((val: Contact[]) => Contact[])) => Promise<void>;
    contactGroups: ContactGroup[];
    setContactGroups: (value: ContactGroup[] | ((val: ContactGroup[]) => ContactGroup[])) => Promise<void>;
    financialProfile: FinancialProfile;
    setFinancialProfile: (value: FinancialProfile | ((val: FinancialProfile) => FinancialProfile)) => Promise<void>;
}

interface AppDataContextType {
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
    streaks: UserStreak;
    setStreaks: (value: UserStreak | ((val: UserStreak) => UserStreak)) => Promise<void>;
    unlockedAchievements: UnlockedAchievement[];
    setUnlockedAchievements: (value: UnlockedAchievement[] | ((val: UnlockedAchievement[]) => UnlockedAchievement[])) => Promise<void>;
    challenges: Challenge[];
    setChallenges: (value: Challenge[] | ((val: Challenge[]) => Challenge[])) => Promise<void>;
    trips: Trip[];
    setTrips: (value: Trip[] | ((val: Trip[]) => Trip[])) => Promise<void>;
    tripExpenses: TripExpense[];
    setTripExpenses: (value: TripExpense[] | ((val: TripExpense[]) => TripExpense[])) => Promise<void>;
    refunds: Refund[];
    setRefunds: (value: Refund[] | ((val: Refund[]) => Refund[])) => Promise<void>;
    settlements: Settlement[];
    setSettlements: (value: Settlement[] | ((val: Settlement[]) => Settlement[])) => Promise<void>;
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
    notes: Note[];
    setNotes: (value: Note[] | ((val: Note[]) => Note[])) => Promise<void>;
    glossaryEntries: GlossaryEntry[];
    setGlossaryEntries: (value: GlossaryEntry[] | ((val: GlossaryEntry[]) => GlossaryEntry[])) => Promise<void>;
    debts: Debt[];
    setDebts: (value: Debt[] | ((val: Debt[]) => Debt[])) => Promise<void>;
    invoices: Invoice[];
    setInvoices: (value: Invoice[] | ((val: Invoice[]) => Invoice[])) => Promise<void>;
    trustBinItems: TrustBinItem[];
    setTrustBinItems: (value: TrustBinItem[] | ((val: TrustBinItem[]) => TrustBinItem[])) => Promise<void>;
    
    selectedAccountIds: string[];
    setSelectedAccountIds: React.Dispatch<React.SetStateAction<string[]>>;

    deleteItem: (id: string, itemType: ItemType) => void;
    findOrCreateCategory: (name: string, type: TransactionType) => string;
    updateStreak: () => void;
    onUpdateTransaction: (transaction: Transaction) => void;
    onAddAccount: (name: string, accountType: AccountType, currency: string, creditLimit?: number, openingBalance?: number) => void;
    onDeleteAccount: (id: string) => void;
    saveInvoice: (invoiceData: Omit<Invoice, 'id'>, id?: string) => void;
    recordPaymentForInvoice: (invoice: Invoice, payment: { accountId: string; amount: number; date: string }) => void;
    onSaveProduct: (shopId: string, productData: Omit<ShopProduct, 'id' | 'shopId'>, id?: string) => void;
}

export const SettingsContext = createContext<SettingsContextType | null>(null);
export const AppDataContext = createContext<AppDataContextType | null>(null);

const DEFAULT_DASHBOARD_WIDGETS: DashboardWidget[] = [
    { id: 'summary', name: 'Period Summary', visible: true },
    { id: 'netWorth', name: 'Net Worth', visible: true },
    { id: 'financialHealth', name: 'Financial Health', visible: true },
    { id: 'aiCoach', name: 'AI Coach', visible: true },
    { id: 'netWorthTrend', name: 'Net Worth Trend', visible: true },
    { id: 'portfolio', name: 'Portfolio', visible: true },
    { id: 'goals', name: 'Goals', visible: true },
    { id: 'budgets', name: 'Budgets', visible: true },
    { id: 'upcoming', name: 'Upcoming Bills', visible: true },
    { id: 'debts', name: 'Debts', visible: false },
    { id: 'charts', name: 'Charts', visible: false },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Settings state
    const [settings, setSettings] = useLocalStorage<Settings>('settings', {
        currency: 'USD',
        theme: 'dark',
        footerActions: ['dashboard', 'reports', 'budgets', 'more'] as ActiveScreen[],
        enabledTools: {
            investments: true, tripManagement: true, shop: true, refunds: true, achievements: true, challenges: true,
            learn: true, calendar: true, notes: true, calculator: true, scheduledPayments: true,
            accountTransfer: true, budgets: true, goals: true, payees: true, senders: true, aiHub: true,
            dataHub: true, feedback: true, faq: true, subscriptions: true, debtManager: true
        },
        dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
        notificationSettings: { enabled: true, bills: { enabled: true }, budgets: { enabled: true, categories: {} }, largeTransaction: { enabled: true, amount: 1000 }, goals: { enabled: true } },
        trustBinDeletionPeriod: { value: 30, unit: 'days' },
    });
    const [categories, setCategories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
    const [payees, setPayees] = useLocalStorage<Payee[]>('payees', []);
    const [senders, setSenders] = useLocalStorage<Sender[]>('senders', []);
    const [contacts, setContacts] = useLocalStorage<Contact[]>('contacts', DEFAULT_CONTACTS);
    const [contactGroups, setContactGroups] = useLocalStorage<ContactGroup[]>('contactGroups', DEFAULT_CONTACT_GROUP);
    const [financialProfile, setFinancialProfile] = useLocalStorage<FinancialProfile>('financialProfile', { monthlySalary: 0, monthlyRent: 0, monthlyEmi: 0, emergencyFundGoal: 0 });

    // App Data State
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
    const [accounts, setAccounts] = useLocalStorage<Account[]>('accounts', []);
    const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', []);
    const [recurringTransactions, setRecurringTransactions] = useLocalStorage<RecurringTransaction[]>('recurringTransactions', []);
    const [goals, setGoals] = useLocalStorage<Goal[]>('goals', []);
    const [investmentHoldings, setInvestmentHoldings] = useLocalStorage<InvestmentHolding[]>('investmentHoldings', []);
    const [streaks, setStreaks] = useLocalStorage<UserStreak>('streaks', { currentStreak: 0, longestStreak: 0, streakFreezes: 3, lastActivityDate: '' });
    const [unlockedAchievements, setUnlockedAchievements] = useLocalStorage<UnlockedAchievement[]>('unlockedAchievements', []);
    const [challenges, setChallenges] = useLocalStorage<Challenge[]>('challenges', []);
    const [trips, setTrips] = useLocalStorage<Trip[]>('trips', DEFAULT_TRIPS);
    const [tripExpenses, setTripExpenses] = useLocalStorage<TripExpense[]>('tripExpenses', []);
    const [refunds, setRefunds] = useLocalStorage<Refund[]>('refunds', []);
    const [settlements, setSettlements] = useLocalStorage<Settlement[]>('settlements', []);
    const [shops, setShops] = useLocalStorage<Shop[]>('shops', []);
    const [shopProducts, setShopProducts] = useLocalStorage<ShopProduct[]>('shopProducts', []);
    const [shopSales, setShopSales] = useLocalStorage<ShopSale[]>('shopSales', []);
    const [shopEmployees, setShopEmployees] = useLocalStorage<ShopEmployee[]>('shopEmployees', []);
    const [shopShifts, setShopShifts] = useLocalStorage<ShopShift[]>('shopShifts', []);
    const [notes, setNotes] = useLocalStorage<Note[]>('notes', DEFAULT_NOTES);
    const [glossaryEntries, setGlossaryEntries] = useLocalStorage<GlossaryEntry[]>('glossaryEntries', DEFAULT_GLOSSARY_ENTRIES);
    const [debts, setDebts] = useLocalStorage<Debt[]>('debts', []);
    const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
    const [trustBinItems, setTrustBinItems] = useLocalStorage<TrustBinItem[]>('trustBin', []);
    
    // UI State (not persisted)
    const [selectedAccountIds, setSelectedAccountIds] = useState(['all']);

    // Computed/Helper functions
    const deleteItem = useCallback((id: string, itemType: ItemType) => {
        const stateSetters: Record<ItemType, React.Dispatch<any>> = {
            transaction: setTransactions, account: setAccounts, category: setCategories,
            recurringTransaction: setRecurringTransactions, goal: setGoals, investmentHolding: setInvestmentHoldings,
            payee: setPayees, sender: setSenders, contact: setContacts, contactGroup: setContactGroups,
            trip: setTrips, tripExpense: setTripExpenses, shop: setShops, shopProduct: setShopProducts,
            shopSale: setShopSales, shopEmployee: setShopEmployees, shopShift: setShopShifts,
            refund: setRefunds, settlement: setSettlements, note: setNotes,
            glossaryEntry: setGlossaryEntries, debt: setDebts, invoice: setInvoices
        };

        const states: Record<ItemType, any[]> = {
            transaction: transactions, account: accounts, category: categories,
            recurringTransaction: recurringTransactions, goal: goals, investmentHolding: investmentHoldings,
            payee: payees, sender: senders, contact: contacts, contactGroup: contactGroups,
            trip: trips, tripExpense: tripExpenses, shop: shops, shopProduct: shopProducts,
            shopSale: shopSales, shopEmployee: shopEmployees, shopShift: shopShifts,
            refund: refunds, settlement: settlements, note: notes,
            glossaryEntry: glossaryEntries, debt: debts, invoice: invoices
        };
        
        const setter = stateSetters[itemType];
        const stateArray = states[itemType];
        const itemToDelete = stateArray.find(item => item.id === id);

        if (setter && itemToDelete) {
            setter((prev: any[]) => prev.filter(item => item.id !== id));
            setTrustBinItems(prev => [...prev, {
                id: self.crypto.randomUUID(),
                itemType,
                item: itemToDelete,
                deletedAt: new Date().toISOString()
            }]);
        }
    }, [transactions, accounts, categories, recurringTransactions, goals, investmentHoldings, payees, senders, contacts, contactGroups, trips, tripExpenses, shops, shopProducts, shopSales, shopEmployees, shopShifts, refunds, settlements, notes, glossaryEntries, debts, invoices, setTrustBinItems, setTransactions, setAccounts, setCategories, setRecurringTransactions, setGoals, setInvestmentHoldings, setPayees, setSenders, setContacts, setContactGroups, setTrips, setTripExpenses, setShops, setShopProducts, setShopSales, setShopEmployees, setShopShifts, setRefunds, setSettlements, setNotes, setGlossaryEntries, setDebts, setInvoices]);

    const findOrCreateCategory = useCallback((name: string, type: TransactionType): string => {
        const path = name.split('/').map(s => s.trim());
        let parentId: string | null = null;
        let foundCategoryId = '';

        path.forEach(part => {
            const existing = categories.find(c => c.name.toLowerCase() === part.toLowerCase() && c.parentId === parentId && c.type === type);
            if (existing) {
                parentId = existing.id;
                foundCategoryId = existing.id;
            } else {
                const newCategory: Category = {
                    id: self.crypto.randomUUID(),
                    name: part,
                    type,
                    parentId,
                    icon: '📁'
                };
                setCategories(prev => [...prev, newCategory]);
                parentId = newCategory.id;
                foundCategoryId = newCategory.id;
            }
        });
        return foundCategoryId;
    }, [categories, setCategories]);
    
    const updateStreak = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        if (streaks.lastActivityDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        let newStreak = streaks.currentStreak;
        if (streaks.lastActivityDate === yesterdayStr) {
            newStreak++; // Continue streak
        } else {
            newStreak = 1; // Reset streak
        }

        setStreaks(prev => ({
            ...prev,
            currentStreak: newStreak,
            longestStreak: Math.max(prev.longestStreak, newStreak),
            lastActivityDate: today
        }));
    }, [streaks, setStreaks]);

    const onUpdateTransaction = useCallback((transaction: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
    }, [setTransactions]);

    const onAddAccount = useCallback((name: string, accountType: AccountType, currency: string, creditLimit?: number, openingBalance?: number) => {
        const newAccount: Account = { id: self.crypto.randomUUID(), name, accountType, currency, creditLimit };
        setAccounts(prev => [...prev, newAccount]);
        if (openingBalance && openingBalance > 0) {
            const openingBalanceCategory = findOrCreateCategory('Opening Balance', TransactionType.INCOME);
            const transaction: Transaction = {
                id: self.crypto.randomUUID(),
                accountId: newAccount.id,
                description: 'Opening Balance',
                amount: openingBalance,
                type: TransactionType.INCOME,
                categoryId: openingBalanceCategory,
                date: new Date().toISOString(),
            };
            setTransactions(prev => [transaction, ...prev]);
        }
    }, [setAccounts, setTransactions, findOrCreateCategory]);
    
    const onDeleteAccount = useCallback((id: string) => {
        if(transactions.some(t => t.accountId === id)) {
            alert("Cannot delete account with transactions. Please re-assign or delete them first.");
            return;
        }
        deleteItem(id, 'account');
    }, [transactions, deleteItem]);

    const saveInvoice = useCallback((invoiceData: Omit<Invoice, 'id'>, id?: string) => {
        if (id) {
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...invoiceData } : inv));
        } else {
            const newInvoice: Invoice = { ...invoiceData, id: self.crypto.randomUUID() };
            setInvoices(prev => [newInvoice, ...prev]);
        }
    }, [setInvoices]);

    const recordPaymentForInvoice = useCallback((invoice: Invoice, payment: { accountId: string; amount: number; date: string }) => {
        const newStatus = payment.amount >= invoice.totalAmount ? InvoiceStatus.PAID : invoice.status;
        const updatedInvoice: Invoice = { ...invoice, status: newStatus };
        saveInvoice(updatedInvoice, invoice.id);

        const incomeCategory = findOrCreateCategory('Business / Sales', TransactionType.INCOME);
        const incomeTransaction: Transaction = {
            id: self.crypto.randomUUID(),
            accountId: payment.accountId,
            description: `Payment for Invoice #${invoice.invoiceNumber}`,
            amount: payment.amount,
            type: TransactionType.INCOME,
            categoryId: incomeCategory,
            date: payment.date,
            notes: `Invoice ID: ${invoice.id}`
        };
        setTransactions(prev => [incomeTransaction, ...prev]);

        const sale: ShopSale = {
            id: self.crypto.randomUUID(),
            shopId: invoice.shopId,
            items: invoice.lineItems.map(item => {
                const product = shopProducts.find(p => p.name.toLowerCase() === item.description.toLowerCase() && p.shopId === invoice.shopId);
                return {
                    productId: product?.id || 'custom',
                    quantity: item.quantity,
                    price: item.unitPrice,
                };
            }),
            totalAmount: invoice.totalAmount,
            profit: 0, 
            date: payment.date
        };
        setShopSales(prev => [sale, ...prev]);
    }, [saveInvoice, findOrCreateCategory, setTransactions, setShopSales, shopProducts]);

    const onSaveProduct = useCallback((shopId: string, productData: Omit<ShopProduct, 'id' | 'shopId'>, id?: string) => {
        if (id) {
            setShopProducts(prev => prev.map(p => (p.id === id ? { ...p, shopId, ...productData } : p)));
        } else {
            setShopProducts(prev => [...prev, { id: self.crypto.randomUUID(), shopId, ...productData }]);
        }
    }, [setShopProducts]);

    const settingsContextValue: SettingsContextType = {
        settings, setSettings, categories, setCategories, payees, setPayees, senders, setSenders,
        contacts, setContacts, contactGroups, setContactGroups, financialProfile, setFinancialProfile,
    };

    const appDataContextValue: AppDataContextType = {
        transactions, setTransactions, accounts, setAccounts, budgets, setBudgets,
        recurringTransactions, setRecurringTransactions, goals, setGoals,
        investmentHoldings, setInvestmentHoldings, streaks, setStreaks,
        unlockedAchievements, setUnlockedAchievements, challenges, setChallenges,
        trips, setTrips, tripExpenses, setTripExpenses, refunds, setRefunds, settlements, setSettlements,
        shops, setShops, shopProducts, setShopProducts, shopSales, setShopSales,
        shopEmployees, setShopEmployees, shopShifts, setShopShifts,
        notes, setNotes, glossaryEntries, setGlossaryEntries, debts, setDebts,
        invoices, setInvoices, trustBinItems, setTrustBinItems,
        selectedAccountIds, setSelectedAccountIds,
        deleteItem, findOrCreateCategory, updateStreak, onUpdateTransaction, onAddAccount, onDeleteAccount,
        saveInvoice, recordPaymentForInvoice, onSaveProduct
    };

    return (
        <SettingsContext.Provider value={settingsContextValue}>
            <AppDataContext.Provider value={appDataContextValue}>
                {children}
            </AppDataContext.Provider>
        </SettingsContext.Provider>
    );
};