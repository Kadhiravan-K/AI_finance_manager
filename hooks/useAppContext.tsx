

import React, { useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';
import { 
  AppState, Profile, Settings, Account, Transaction, TransactionType, Category, Goal, Budget, RecurringTransaction, InvestmentHolding, Contact, ContactGroup, Trip, TripExpense, TripMessage, Shop, ShopProduct, ShopSale, ShopEmployee, ShopShift, Refund, Debt, Note, ItemType, TrustBinItem, GlossaryEntry, Challenge, UserStreak, ParsedTransactionData, Sender, Invoice, InvoiceStatus,
  AccountType,
  FinancialProfile,
  CalendarEvent,
  Settlement,
  Priority,
  supabase,
  User,
  Session
} from '../types';
import { AppDataContext, DEFAULT_SETTINGS } from '../contexts/SettingsContext';
import { DEFAULT_CATEGORIES } from '../utils/categories';
import { db } from '../services/supabaseService';
import { DEFAULT_GLOSSARY_ENTRIES } from '../utils/glossary';

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Local-first persistence
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
  const [contactGroups, setContactGroups] = useLocalStorage<ContactGroup[]>('contactGroups', []);
  const [trips, setTrips] = useLocalStorage<Trip[]>('trips', []);
  const [tripExpenses, setTripExpenses] = useLocalStorage<TripExpense[]>('tripExpenses', []);
  const [tripMessages, setTripMessages] = useLocalStorage<TripMessage[]>('tripMessages', []);
  const [shops, setShops] = useLocalStorage<Shop[]>('shops', []);
  const [shopProducts, setShopProducts] = useLocalStorage<ShopProduct[]>('shopProducts', []);
  const [shopSales, setShopSales] = useLocalStorage<ShopSale[]>('shopSales', []);
  const [shopEmployees, setShopEmployees] = useLocalStorage<ShopEmployee[]>('shopEmployees', []);
  const [shopShifts, setShopShifts] = useLocalStorage<ShopShift[]>('shopShifts', []);
  const [refunds, setRefunds] = useLocalStorage<Refund[]>('refunds', []);
  const [settlements, setSettlements] = useLocalStorage<Settlement[]>('settlements', []);
  const [debts, setDebts] = useLocalStorage<Debt[]>('debts', []);
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [glossaryEntries, setGlossaryEntries] = useLocalStorage<GlossaryEntry[]>('glossaryEntries', DEFAULT_GLOSSARY_ENTRIES);
  const [unlockedAchievements, setUnlockedAchievements] = useLocalStorage<any[]>('unlockedAchievements', []);
  const [challenges, setChallenges] = useLocalStorage<Challenge[]>('challenges', []);
  const [streaks, setStreaks] = useLocalStorage<UserStreak>('streaks', { currentStreak: 0, longestStreak: 0, lastActivityDate: '', streakFreezes: 3 });
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [payees, setPayees] = useLocalStorage<any[]>('payees', []);
  const [senders, setSenders] = useLocalStorage<any[]>('senders', []);
  const [customCalendarEvents, setCustomCalendarEvents] = useLocalStorage<CalendarEvent[]>('customCalendarEvents', []);
  const [trustBin, setTrustBin] = useLocalStorage<TrustBinItem[]>('trustBin', []);

  const [selectedAccountIds, setSelectedAccountIds] = useState(['all']);

  // AUTH STATE LISTENER
  useEffect(() => {
    // Fix: In Supabase v2, getSession is an async method on supabase.auth.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Fix: onAuthStateChange returns an object containing subscription in v2.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setIsCloudSynced(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // CLOUD SYNC ENGINE
  useEffect(() => {
    if (!user || isCloudSynced) return;

    const syncFromCloud = async () => {
        setIsLoading(true);
        try {
            // Parallel fetch for all modules
            const [
                cloudAccounts, cloudTransactions, cloudGoals, cloudBudgets, cloudSettings
            ] = await Promise.all([
                db.fetchAll<Account>('accounts', user.id),
                db.fetchAll<Transaction>('transactions', user.id),
                db.fetchAll<Goal>('goals', user.id),
                db.fetchAll<Budget>('budgets', user.id),
                db.fetchAll<Settings>('settings', user.id)
            ]);

            // Simple conflict resolution: Cloud wins if data exists
            if (cloudAccounts.length > 0) setAccounts(cloudAccounts);
            if (cloudTransactions.length > 0) setTransactions(cloudTransactions);
            if (cloudGoals.length > 0) setGoals(cloudGoals);
            if (cloudBudgets.length > 0) setBudgets(cloudBudgets);
            if (cloudSettings.length > 0) setSettings(cloudSettings[0]);

            setIsCloudSynced(true);
        } catch (e) {
            console.error("Cloud sync failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    syncFromCloud();
  }, [user, isCloudSynced]);

  // WRAPPERS FOR DATABASE PERSISTENCE
  const persist = useCallback(async (table: string, item: any) => {
    if (user) {
        try { await db.upsert(table, item, user.id); } catch (e) { console.error(`Failed to sync ${table}`, e); }
    }
  }, [user]);

  const removeCloud = useCallback(async (table: string, id: string) => {
    if (user) {
        try { await db.delete(table, id, user.id); } catch (e) { console.error(`Failed to delete from cloud ${table}`, e); }
    }
  }, [user]);

  // Re-define CRUD methods to use sync
  const onSaveManual = useCallback(async (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
    persist('transactions', transaction);
  }, [setTransactions, persist]);

  const onAddAccount = useCallback(async (name: string, accountType: AccountType, currency: string, creditLimit?: number) => {
    const newAccount: Account = { id: self.crypto.randomUUID(), name, accountType, currency, creditLimit };
    setAccounts(prev => [...prev, newAccount]);
    persist('accounts', newAccount);
  }, [setAccounts, persist]);

  const deleteItem = useCallback(async (id: string, itemType: ItemType) => {
    const setters: any = { transaction: setTransactions, account: setAccounts, goal: setGoals };
    const tables: any = { transaction: 'transactions', account: 'accounts', goal: 'goals' };
    
    if (setters[itemType]) {
        setters[itemType]((prev: any[]) => prev.filter((i: any) => i.id !== id));
        removeCloud(tables[itemType], id);
    }
  }, [user, removeCloud, setTransactions, setAccounts, setGoals]);

  const value = {
    isLoading, user, isCloudSynced,
    settings, transactions, accounts, categories, budgets, goals, recurringTransactions, investmentHoldings, contacts, contactGroups, trips, tripExpenses, tripMessages, shops, shopProducts, shopSales, shopEmployees, shopShifts, refunds, settlements, debts, notes, glossaryEntries, unlockedAchievements, challenges, streaks, invoices, payees, senders,
    customCalendarEvents, financialProfile, trustBin,
    setSettings, setTransactions, setAccounts, setGoals, setBudgets, setRecurringTransactions, setChallenges, setRefunds, setDebts, setNotes, setGlossaryEntries, setUnlockedAchievements, setInvoices, setPayees, setSenders, setCustomCalendarEvents, setFinancialProfile, setTrustBin,
    onSaveManual, onAddAccount, deleteItem,
    selectedAccountIds, setSelectedAccountIds,
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return <AppDataContext.Provider value={value as any}>{children}</AppDataContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppDataProvider');
  return context;
};
