

import React, { createContext, ReactNode, useState, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { 
    Settings, Category, Payee, Sender, Contact, ContactGroup, FinancialProfile, Transaction, 
    Account, Budget, RecurringTransaction, Goal, InvestmentHolding, UserStreak, UnlockedAchievement, 
    Challenge, Trip, TripExpense, Refund, Settlement, Shop, ShopProduct, ShopSale, 
    ShopEmployee, ShopShift, Note, GlossaryEntry, Debt, TransactionType, ItemType, ActiveScreen, 
    DashboardWidget, Invoice, InvoiceStatus, ShopType,
    // Fix: Import missing types
    TrustBinItem,
    AccountType
} from '../types';
import { DEFAULT_CATEGORIES } from '../utils/categories';
import { DEFAULT_GLOSSARY_ENTRIES } from '../utils/glossary';

// Define the shape of the context data
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
    // Fix: Corrected the type for the `setShopSales` setter function to match the implementation.
    setShopSales: (value: ShopSale[] | ((val: ShopSale[]) => ShopSale[])) => Promise<void>;
    shopEmployees: ShopEmployee[];
    setShopEmployees: (value: ShopEmployee[] | ((val: ShopEmployee[]) => ShopEmployee[])) => Promise<void>;
    shopShifts: ShopShift[];
    setShopShifts: (value: ShopShift[] | ((val: ShopShift[]) => ShopShift[])) => Promise<void>;
    // Fix: Renamed 'shoppingLists' to 'notes' to align with the 'Note' type and fix downstream errors.
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
}

// Create contexts with a default value of null
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
        // Fix: Renamed 'shoppingLists' to 'notes' to match the ToggleableTool type.
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
    const [contacts, setContacts] = useLocalStorage<Contact[]>('contacts', []);
    const [contactGroups, setContactGroups] = useLocalStorage<ContactGroup[]>('contactGroups', []);
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
    const [trips, setTrips] = useLocalStorage<Trip[]>('trips', []);
    const [tripExpenses, setTripExpenses] = useLocalStorage<TripExpense[]>('tripExpenses', []);
    const [refunds, setRefunds] = useLocalStorage<Refund[]>('refunds', []);
    const [settlements, setSettlements] = useLocalStorage<Settlement[]>('settlements', []);
    const [shops, setShops] = useLocalStorage<Shop[]>('shops', []);
    const [shopProducts, setShopProducts] = useLocalStorage<ShopProduct[]>('shopProducts', []);
    const [shopSales, setShopSales] = useLocalStorage<ShopSale[]>('shopSales', []);
    const [shopEmployees, setShopEmployees] = useLocalStorage<ShopEmployee[]>('shopEmployees', []);
    const [shopShifts, setShopShifts] = useLocalStorage<ShopShift[]>('shopShifts', []);
    // Fix: Renamed state from 'shoppingLists' to 'notes' to align with the 'Note' type.
    const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
    const [glossaryEntries, setGlossaryEntries] = useLocalStorage<GlossaryEntry[]>('glossaryEntries', DEFAULT_GLOSSARY_ENTRIES);
    const [debts, setDebts] = useLocalStorage<Debt[]>('debts', []);
    const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
    const [trustBinItems, setTrustBinItems] = useLocalStorage<TrustBinItem[]>('trustBin', []);
    
    // UI State (not persisted)
    const [selectedAccountIds, setSelectedAccountIds] = useState(['all']);

    // Computed/Helper functions
    const deleteItem = useCallback((id: string, itemType: ItemType) => {
        // Fix: Renamed 'shoppingList' to 'note' to match the ItemType definition.
        const stateSetters: Record<ItemType, React.Dispatch<any>> = {
            transaction: setTransactions, account: setAccounts, category: setCategories,
            recurringTransaction: setRecurringTransactions, goal: setGoals, investmentHolding: setInvestmentHoldings,
            payee: setPayees, sender: setSenders, contact: setContacts, contactGroup: setContactGroups,
            trip: setTrips, tripExpense: setTripExpenses, shop: setShops, shopProduct: setShopProducts,
            shopSale: setShopSales, shopEmployee: setShopEmployees, shopShift: setShopShifts,
            refund: setRefunds, settlement: setSettlements, note: setNotes,
            glossaryEntry: setGlossaryEntries, debt: setDebts, invoice: setInvoices
        };

        // Fix: Renamed 'shoppingList' to 'note' to match the ItemType definition.
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
        // 1. Update invoice status
        const newStatus = payment.amount >= invoice.totalAmount ? InvoiceStatus.PAID : invoice.status;
        const updatedInvoice: Invoice = { ...invoice, status: newStatus };
        saveInvoice(updatedInvoice, invoice.id);

        // 2. Create income transaction
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

        // 3. Create ShopSale record
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
            profit: 0, // Note: Profit calculation would require product cost data, which is not available yet.
            date: payment.date
        };
        setShopSales(prev => [sale, ...prev]);
    }, [saveInvoice, findOrCreateCategory, setTransactions, setShopSales, shopProducts]);

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
        saveInvoice, recordPaymentForInvoice
    };

    return (
        <SettingsContext.Provider value={settingsContextValue}>
            <AppDataContext.Provider value={appDataContextValue}>
                {children}
            </AppDataContext.Provider>
        </SettingsContext.Provider>
    );
};
