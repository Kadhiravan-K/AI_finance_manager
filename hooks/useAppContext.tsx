

import React, { useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';
import { 
  AppState, Profile, Settings, Account, Transaction, TransactionType, Category, Goal, Budget, RecurringTransaction, InvestmentHolding, Contact, ContactGroup, Trip, TripExpense, Shop, ShopProduct, ShopSale, ShopEmployee, ShopShift, Refund, Debt, Note, ItemType, TrustBinItem, GlossaryEntry, Challenge, UserStreak, ParsedTransactionData, Sender, SenderType, Invoice, InvoiceStatus,
  AccountType,
  FinancialProfile
} from '../types';
import { AppDataContext, DEFAULT_SETTINGS } from '../contexts/SettingsContext';
import { DEFAULT_CATEGORIES } from '../utils/categories';
import { checkAchievements } from '../utils/achievements';
import { createSurvivalNotesForTrip } from '../utils/survivalNotes';
import { DEFAULT_GLOSSARY_ENTRIES } from '../utils/glossary';
import { calculateNextDueDate } from '../utils/date';

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useLocalStorage<Profile | null>('profile', null);
  
  // Core Data using useLocalStorage for persistence
  const [settings, setSettings] = useLocalStorage<Settings>('settings', DEFAULT_SETTINGS);
  const [financialProfile, setFinancialProfile] = useLocalStorage<FinancialProfile>('financialProfile', { monthlySalary: 0, monthlyRent: 0, monthlyEmi: 0, emergencyFundGoal: 0 });
  const [accounts, setAccounts] = useLocalStorage<Account[]>('accounts', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', []);
  const [goals, setGoals] = useLocalStorage<Goal[]>('goals', []);
  const [recurringTransactions, setRecurringTransactions] = useLocalStorage<RecurringTransaction[]>('recurringTransactions', []);
  const [investmentHoldings, setInvestmentHoldings] = useLocalStorage<InvestmentHolding[]>('investmentHoldings', []);
  const [contacts, setContacts] = useLocalStorage<Contact[]>('contacts', []);
  const [contactGroups, setContactGroups] = useLocalStorage<ContactGroup[]>('contactGroups', [{ id: 'default', name: 'General', icon: '👥' }]);
  const [trips, setTrips] = useLocalStorage<Trip[]>('trips', []);
  const [tripExpenses, setTripExpenses] = useLocalStorage<TripExpense[]>('tripExpenses', []);
  const [shops, setShops] = useLocalStorage<Shop[]>('shops', []);
  const [shopProducts, setShopProducts] = useLocalStorage<ShopProduct[]>('shopProducts', []);
  const [shopSales, setShopSales] = useLocalStorage<ShopSale[]>('shopSales', []);
  const [shopEmployees, setShopEmployees] = useLocalStorage<ShopEmployee[]>('shopEmployees', []);
  const [shopShifts, setShopShifts] = useLocalStorage<ShopShift[]>('shopShifts', []);
  const [refunds, setRefunds] = useLocalStorage<Refund[]>('refunds', []);
  const [settlements, setSettlements] = useLocalStorage<any[]>('settlements', []);
  const [debts, setDebts] = useLocalStorage<Debt[]>('debts', []);
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [glossaryEntries, setGlossaryEntries] = useLocalStorage<GlossaryEntry[]>('glossaryEntries', DEFAULT_GLOSSARY_ENTRIES);
  const [unlockedAchievements, setUnlockedAchievements] = useLocalStorage<any[]>('unlockedAchievements', []);
  const [challenges, setChallenges] = useLocalStorage<Challenge[]>('challenges', []);
  const [streaks, setStreaks] = useLocalStorage<UserStreak>('streaks', { currentStreak: 0, longestStreak: 0, lastActivityDate: '', streakFreezes: 3 });
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [payees, setPayees] = useLocalStorage<any[]>('payees', []);
  const [senders, setSenders] = useLocalStorage<Sender[]>('senders', []);

  // UI State managed here for simplicity
  const [selectedAccountIds, setSelectedAccountIds] = useState(['all']);
  const [trustBin, setTrustBin] = useLocalStorage<TrustBinItem[]>('trustBin', []);
  const [newlyUnlockedAchievementId, setNewlyUnlockedAchievementId] = useState<string | null>(null);

  const saveSettings = setSettings;

  const findOrCreateCategory = useCallback((name: string, type: TransactionType): string => {
    const path = name.split(' / ').map(n => n.trim());
    let parentId: string | null = null;
    let foundCategoryId = '';

    for (const part of path) {
      const existing = categories.find(c => c.name.toLowerCase() === part.toLowerCase() && c.parentId === parentId && c.type === type);
      if (existing) {
        parentId = existing.id;
        foundCategoryId = existing.id;
      } else {
        const newCategory: Category = { id: self.crypto.randomUUID(), name: part, type, parentId };
        setCategories(prev => [...prev, newCategory]);
        parentId = newCategory.id;
        foundCategoryId = newCategory.id;
      }
    }
    return foundCategoryId;
  }, [categories, setCategories]);
  
  const updateStreak = useCallback(() => {
      const today = new Date().toISOString().split('T')[0];
      setStreaks(prev => {
          if (prev.lastActivityDate === today) return prev; // Already updated today
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          let newStreak = prev.currentStreak;
          if (prev.lastActivityDate === yesterdayStr) {
              newStreak += 1; // Continue streak
          } else {
              newStreak = 1; // Reset streak
          }

          return {
              ...prev,
              currentStreak: newStreak,
              longestStreak: Math.max(prev.longestStreak, newStreak),
              lastActivityDate: today,
          };
      });
  }, [setStreaks]);


  const onSaveAuto = useCallback(async (data: ParsedTransactionData, accountId: string): Promise<void> => {
    const categoryId = findOrCreateCategory(data.categoryName, data.type);
    const newTransaction: Transaction = {
      id: data.id,
      accountId,
      description: data.description,
      amount: data.amount,
      type: data.type,
      categoryId,
      date: data.date,
      notes: data.notes,
    };
    await setTransactions(prev => [newTransaction, ...prev]);
    updateStreak();
  }, [findOrCreateCategory, setTransactions, updateStreak]);

  const onSaveManual = useCallback(async (transaction: Transaction) => {
    await setTransactions(prev => [transaction, ...prev]);
    updateStreak();
  }, [setTransactions, updateStreak]);

  const onUpdateTransaction = useCallback(async (transaction: Transaction) => {
    await setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
  }, [setTransactions]);

  const onAddAccount = useCallback(async (name: string, accountType: AccountType, currency: string, creditLimit?: number, openingBalance?: number) => {
    const newAccount: Account = { id: self.crypto.randomUUID(), name, accountType, currency, creditLimit };
    await setAccounts(prev => [...prev, newAccount]);
    if (openingBalance && openingBalance !== 0) {
      const categoryId = findOrCreateCategory('Opening Balance', TransactionType.INCOME);
      const openingTx: Transaction = {
        id: self.crypto.randomUUID(),
        accountId: newAccount.id,
        description: 'Opening Balance',
        amount: Math.abs(openingBalance),
        type: openingBalance > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
        categoryId,
        date: new Date().toISOString(),
      };
      await setTransactions(prev => [openingTx, ...prev]);
    }
  }, [setAccounts, setTransactions, findOrCreateCategory]);

  const saveAccount = useCallback(async (accountData: Omit<Account, 'id'>, openingBalance?: number) => {
    const newAccount: Account = { id: self.crypto.randomUUID(), ...accountData };
    await setAccounts(prev => [...prev, newAccount]);
    if (openingBalance && openingBalance !== 0) {
      const categoryId = findOrCreateCategory('Opening Balance', TransactionType.INCOME);
      const openingTx: Transaction = {
        id: self.crypto.randomUUID(),
        accountId: newAccount.id,
        description: 'Opening Balance',
        amount: Math.abs(openingBalance),
        type: openingBalance > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
        categoryId,
        date: new Date().toISOString(),
      };
      await setTransactions(prev => [openingTx, ...prev]);
    }
  }, [setAccounts, setTransactions, findOrCreateCategory]);

  const onSaveCategory = useCallback((category: Omit<Category, 'id'>, id?: string) => {
    if (id) {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...category } : c));
    } else {
      setCategories(prev => [...prev, { id: self.crypto.randomUUID(), ...category }]);
    }
  }, [setCategories]);

  const onTransfer = useCallback((fromAccountId: string, toAccountId: string, fromAmount: number, toAmount: number, notes?: string) => {
    const date = new Date().toISOString();
    const fromCategoryId = findOrCreateCategory('Transfers', TransactionType.EXPENSE);
    const toCategoryId = findOrCreateCategory('Transfers', TransactionType.INCOME);

    const fromTx: Transaction = {
      id: self.crypto.randomUUID(), accountId: fromAccountId, description: `Transfer to ${accounts.find(a=>a.id===toAccountId)?.name}`, amount: fromAmount, type: TransactionType.EXPENSE, categoryId: fromCategoryId, date, notes
    };
    const toTx: Transaction = {
      id: self.crypto.randomUUID(), accountId: toAccountId, description: `Transfer from ${accounts.find(a=>a.id===fromAccountId)?.name}`, amount: toAmount, type: TransactionType.INCOME, categoryId: toCategoryId, date, notes
    };
    setTransactions(prev => [toTx, fromTx, ...prev]);
    updateStreak();
  }, [accounts, findOrCreateCategory, setTransactions, updateStreak]);

  const onSaveRecurring = useCallback((data: Omit<RecurringTransaction, 'id'>, id?: string) => {
    if (id) {
        setRecurringTransactions(prev => prev.map(rt => rt.id === id ? { ...rt, ...data, id } : rt));
    } else {
        setRecurringTransactions(prev => [...prev, { id: self.crypto.randomUUID(), ...data }]);
    }
  }, [setRecurringTransactions]);

  const onSaveGoal = useCallback((goalData: Omit<Goal, 'id' | 'currentAmount'>, id?: string) => {
    if (id) {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, ...goalData } : g));
    } else {
        setGoals(prev => [...prev, { id: self.crypto.randomUUID(), currentAmount: 0, ...goalData }]);
    }
  }, [setGoals]);

  const onSaveTrip = useCallback((tripData: Omit<Trip, 'id' | 'date'>, id?: string) => {
    if (id) {
        setTrips(prev => prev.map(t => t.id === id ? { ...t, ...tripData } : t));
    } else {
        const newTripId = self.crypto.randomUUID();
        setTrips(prev => [...prev, { id: newTripId, date: new Date().toISOString(), ...tripData }]);
        if (tripData.name.toLowerCase().includes('survival')) {
          const survivalNotes = createSurvivalNotesForTrip(newTripId);
          setNotes(prev => [...prev, ...survivalNotes]);
        }
    }
  }, [setTrips, setNotes]);

  const onSaveContactGroup = (groupData: Omit<ContactGroup, 'id'>, id?: string) => {
    if (id) {
        setContactGroups(prev => prev.map(g => g.id === id ? { ...g, ...groupData } : g));
    } else {
        setContactGroups(prev => [...prev, { id: self.crypto.randomUUID(), ...groupData }]);
    }
  };

  const onSaveContact = (contactData: Omit<Contact, 'id'>, id?: string): Contact => {
      let savedContact: Contact;
      if (id) {
          savedContact = { id, ...contactData };
          setContacts(prev => prev.map(c => c.id === id ? savedContact : c));
      } else {
          savedContact = { id: self.crypto.randomUUID(), ...contactData };
          setContacts(prev => [...prev, savedContact]);
      }
      return savedContact;
  };
  
  const value = {
    isLoading,
    profile,
    // Full AppState
    settings, transactions, accounts, categories, budgets, goals, recurringTransactions, investmentHoldings, contacts, contactGroups, trips, tripExpenses, shops, shopProducts, shopSales, shopEmployees, shopShifts, refunds, settlements, debts, notes, glossaryEntries, unlockedAchievements, challenges, streaks, invoices, payees, senders,
    financialProfile,
    trustBin,
    // Setters
    setSettings, setFinancialProfile, setTransactions, setAccounts, setCategories, setBudgets, setGoals, setRecurringTransactions, setInvestmentHoldings, setContacts, setContactGroups, setTrips, setTripExpenses, setShops, setShopProducts, setShopSales, setShopEmployees, setShopShifts, setRefunds, setSettlements, setDebts, setNotes, setGlossaryEntries, setUnlockedAchievements, setChallenges, setStreaks, setInvoices, setPayees, setSenders,
    // Business Logic
    saveSettings,
    saveAccount,
    onSaveAuto,
    onSaveManual,
    onUpdateTransaction,
    onAddAccount,
    onSaveCategory,
    onTransfer,
    onSaveRecurring,
    onSaveGoal,
    onSaveTrip,
    onSaveContact,
    onSaveContactGroup,
    findOrCreateCategory,
    updateStreak,
    // UI State
    selectedAccountIds,
    setSelectedAccountIds,
  };
  
  // Fake loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppDataProvider');
  }
  return context;
};