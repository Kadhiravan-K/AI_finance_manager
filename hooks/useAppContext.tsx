
import React, { useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';
import { 
  AppState, Profile, Settings, Account, Transaction, TransactionType, Category, Goal, Budget, RecurringTransaction, InvestmentHolding, Contact, ContactGroup, Trip, TripExpense, Shop, ShopProduct, ShopSale, ShopEmployee, ShopShift, Refund, Debt, Note, ItemType, TrustBinItem, GlossaryEntry, Challenge, UserStreak, ParsedTransactionData, Sender, SenderType, Invoice, InvoiceStatus,
  AccountType,
  FinancialProfile,
  CalendarEvent,
  Settlement,
  Priority,
  ChecklistItem
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
  const [contacts, setContacts] = useLocalStorage<Contact[]>('contacts', [
    // Family
    { id: 'contact-fam-1', name: '👩 Amma (Mom)', groupId: 'group-family' },
    { id: 'contact-fam-2', name: '👨 Appa (Dad)', groupId: 'group-family' },
    { id: 'contact-fam-3', name: '👦 Thambi (Younger Brother)', groupId: 'group-family' },
    { id: 'contact-fam-4', name: '👧 Akka (Elder Sister)', groupId: 'group-family' },
    { id: 'contact-fam-5', name: '👨‍💼 Uncle Ramesh (Chennai)', groupId: 'group-family' },
    { id: 'contact-fam-6', name: '👩‍💼 Aunt Meena (Coimbatore)', groupId: 'group-family' },
    { id: 'contact-fam-7', name: '👨‍🎓 Cousin Arjun (Student, ECE)', groupId: 'group-family' },
    { id: 'contact-fam-8', name: '👩‍💼 Cousin Divya (Banker, Tiruppur)', groupId: 'group-family' },
    { id: 'contact-fam-9', name: '👴 Grandfather Krishnan (Retired Teacher)', groupId: 'group-family' },
    { id: 'contact-fam-10', name: '👵 Grandmother Lakshmi (Home Chef)', groupId: 'group-family' },

    // Friends
    { id: 'contact-frd-1', name: '🧑 Ram (EEE, Hostel Mate)', groupId: 'group-friends' },
    { id: 'contact-frd-2', name: '🧑‍💻 John (Project Partner)', groupId: 'group-friends' },
    { id: 'contact-frd-3', name: '🎨 Priya (UI/UX Designer)', groupId: 'group-friends' },
    { id: 'contact-frd-4', name: '💻 Karthik (Freelancer, React Dev)', groupId: 'group-friends' },
    { id: 'contact-frd-5', name: '💰 Sneha (Finance Enthusiast)', groupId: 'group-friends' },
    { id: 'contact-frd-6', name: '🤖 Harish (IoT Hacker)', groupId: 'group-friends' },
    { id: 'contact-frd-7', name: '✍️ Anjali (Prompt Engineer)', groupId: 'group-friends' },
    { id: 'contact-frd-8', name: '🧪 Naveen (Gemini Tester)', groupId: 'group-friends' },
    { id: 'contact-frd-9', name: '🚀 Deepak (Startup Founder)', groupId: 'group-friends' },
    { id: 'contact-frd-10', name: '💃 Swathi (College Cultural Lead)', groupId: 'group-friends' },

    // Work / College / Mentors
    { id: 'contact-wrk-1', name: '👨‍🏫 Prof. Senthil (EEE Dept)', groupId: 'group-work' },
    { id: 'contact-wrk-2', name: '👩‍💼 Divya (Internship Lead, Zoho)', groupId: 'group-work' },
    { id: 'contact-wrk-3', name: '🧑‍💻 Rahul (Hackathon Teammate)', groupId: 'group-work' },
    { id: 'contact-wrk-4', name: '🔬 Swathi (Lab Partner)', groupId: 'group-work' },
    { id: 'contact-wrk-5', name: '👨‍🏫 Anand (Career Mentor)', groupId: 'group-work' },
    { id: 'contact-wrk-6', name: '🔌 Vignesh (Plugin Architect)', groupId: 'group-work' },
    { id: 'contact-wrk-7', name: '📄 Lavanya (Resume Reviewer)', groupId: 'group-work' },
    { id: 'contact-wrk-8', name: '👨‍💼 Suresh (Placement Officer)', groupId: 'group-work' },

    // Neighbors / Local Circle
    { id: 'contact-nei-1', name: '👨 Mr. Krishnan (Next Door)', groupId: 'group-neighbors' },
    { id: 'contact-nei-2', name: '👩 Mrs. Lakshmi (Groceries)', groupId: 'group-neighbors' },
    { id: 'contact-nei-3', name: '🛺 Auto Anna (Local Transport)', groupId: 'group-neighbors' },
    { id: 'contact-nei-4', name: '🛡️ Watchman Ravi (Security)', groupId: 'group-neighbors' },
    { id: 'contact-nei-5', name: '🧵 Tailor Kumar (Uniform Stitching)', groupId: 'group-neighbors' },
    { id: 'contact-nei-6', name: '💡 Electrician Mani (ESP32 Setup)', groupId: 'group-neighbors' },
    { id: 'contact-nei-7', name: '💊 Pharmacist Rekha (Medical Help)', groupId: 'group-neighbors' },
    
    // Finance / Shared Accounts
    { id: 'contact-fin-1', name: '💸 Hostel Split Group (Ram, Harish, Sneha)', groupId: 'group-finance' },
    { id: 'contact-fin-2', name: '🏦 Loan Contact: Uncle Suresh', groupId: 'group-finance' },
    { id: 'contact-fin-3', name: '🤝 Rent Partner: Gokul', groupId: 'group-finance' },
    { id: 'contact-fin-4', name: '💰 Budget Buddy: Deepa', groupId: 'group-finance' },
    { id: 'contact-fin-5', name: '📲 UPI Helper: Naveen', groupId: 'group-finance' },
    { id: 'contact-fin-6', name: '⏰ EMI Reminder: Priya', groupId: 'group-finance' },
    { id: 'contact-fin-7', name: '💳 Shared Wallet: Karthik', groupId: 'group-finance' },
    
    // Others / Semantic Tags
    { id: 'contact-oth-1', name: '🆘 Emergency Contact: Dad', groupId: 'group-others' },
    { id: 'contact-oth-2', name: '✨ Gemini Prompt Tester: Ramya', groupId: 'group-others' },
    { id: 'contact-oth-3', name: '🧩 Plugin Tester: Vignesh', groupId: 'group-others' },
    { id: 'contact-oth-4', name: '🧑‍⚖️ Career Referee: Prof. Senthil', groupId: 'group-others' },
    { id: 'contact-oth-5', name: '🤖 Agentic Trigger Contact: Anjali', groupId: 'group-others' },
    { id: 'contact-oth-6', name: '🌳 Family Tree Node: Grandfather Krishnan', groupId: 'group-others' },
    { id: 'contact-oth-7', name: '🐞 Finance Debug Partner: Sneha', groupId: 'group-others' },
  ]);
  const [contactGroups, setContactGroups] = useLocalStorage<ContactGroup[]>('contactGroups', [
      { id: 'group-family', name: 'Family', icon: '👨‍👩‍👧‍👦' },
      { id: 'group-friends', name: 'Friends', icon: '🧑‍🤝‍🧑' },
      { id: 'group-work', name: 'Work / College / Mentors', icon: '💼' },
      { id: 'group-neighbors', name: 'Neighbors / Local Circle', icon: '🏠' },
      { id: 'group-finance', name: 'Finance / Shared Accounts', icon: '💳' },
      { id: 'group-others', name: 'Others / Semantic Tags', icon: '🧘' },
  ]);
  const [trips, setTrips] = useLocalStorage<Trip[]>('trips', []);
  const [tripExpenses, setTripExpenses] = useLocalStorage<TripExpense[]>('tripExpenses', []);
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
  const [senders, setSenders] = useLocalStorage<Sender[]>('senders', []);
  const [customCalendarEvents, setCustomCalendarEvents] = useLocalStorage<CalendarEvent[]>('customCalendarEvents', []);


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

  const onAddNote = useCallback((type: 'note' | 'checklist', tripId?: string) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: self.crypto.randomUUID(),
      title: `Untitled ${type === 'note' ? 'Note' : 'Checklist'}`,
      content: type === 'note' ? '' : [{ id: self.crypto.randomUUID(), name: '', rate: 0, isPurchased: false, priority: Priority.NONE, quantity: '1' }],
      type: type,
      createdAt: now,
      updatedAt: now,
      tripId: tripId,
      icon: type === 'note' ? '📝' : '✅',
    };
    setNotes(prev => [...(prev || []), newNote]);
  }, [setNotes]);


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
        const now = new Date().toISOString();
        setTrips(prev => [...prev, { id: newTripId, date: new Date().toISOString(), ...tripData }]);
        
        // Add a default packing list
        const packingList: Note = {
          id: self.crypto.randomUUID(),
          title: "Packing List",
          icon: '🧳',
          content: [
            { id: self.crypto.randomUUID(), name: 'Clothes', isPurchased: false, rate: 0, quantity: '1', priority: Priority.HIGH },
            { id: self.crypto.randomUUID(), name: 'Toiletries', isPurchased: false, rate: 0, quantity: '1', priority: Priority.HIGH },
            { id: self.crypto.randomUUID(), name: 'Documents (Passport, ID)', isPurchased: false, rate: 0, quantity: '1', priority: Priority.HIGH },
            { id: self.crypto.randomUUID(), name: 'Chargers & Electronics', isPurchased: false, rate: 0, quantity: '1', priority: Priority.MEDIUM },
          ],
          type: 'checklist',
          createdAt: now,
          updatedAt: now,
          tripId: newTripId,
          isPinned: true
        };
        setNotes(prev => [...(prev || []), packingList]);
        
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

    const onSettle = useCallback(async (fromId: string, toId: string, amount: number, currency: string) => {
    const newSettlement: Settlement = { id: self.crypto.randomUUID(), fromContactId: fromId, toContactId: toId, amount, currency, date: new Date().toISOString() };
    await setSettlements(prev => [...prev, newSettlement]);
  }, [setSettlements]);

  const onSaveTripExpense = useCallback(async (expense: Omit<TripExpense, 'id'>) => {
    const newExpense = { ...expense, id: self.crypto.randomUUID(), date: new Date().toISOString() };
    await setTripExpenses(prev => [...prev, newExpense]);
  }, [setTripExpenses]);

  const onUpdateTripExpense = useCallback(async (expense: TripExpense) => {
    await setTripExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
  }, [setTripExpenses]);

  const onSaveShop = useCallback(async (shopData: Omit<Shop, 'id'>, id?: string) => {
    if (id) {
        await setShops(prev => prev.map(s => s.id === id ? { ...s, ...shopData } : s));
    } else {
        await setShops(prev => [...prev, { id: self.crypto.randomUUID(), ...shopData }]);
    }
  }, [setShops]);
  
   const onSaveProduct = useCallback(async (shopId: string, productData: Omit<ShopProduct, 'id' | 'shopId'>, id?: string) => {
    if (id) {
        await setShopProducts(prev => prev.map(p => p.id === id ? { ...p, ...productData } : p));
    } else {
        await setShopProducts(prev => [...prev, { id: self.crypto.randomUUID(), shopId, ...productData }]);
    }
  }, [setShopProducts]);

  const onSaveEmployee = useCallback(async (shopId: string, employeeData: Omit<ShopEmployee, 'id'|'shopId'>, id?: string) => {
    if (id) {
        await setShopEmployees(prev => prev.map(e => e.id === id ? { ...e, ...employeeData } : e));
    } else {
        await setShopEmployees(prev => [...prev, { id: self.crypto.randomUUID(), shopId, ...employeeData }]);
    }
  }, [setShopEmployees]);

  const onSaveShift = useCallback(async (shopId: string, shiftData: Omit<ShopShift, 'id'|'shopId'>, id?: string) => {
    if (id) {
        await setShopShifts(prev => prev.map(s => s.id === id ? { ...s, ...shiftData } : s));
    } else {
        await setShopShifts(prev => [...prev, { id: self.crypto.randomUUID(), shopId, ...shiftData }]);
    }
  }, [setShopShifts]);

  const onSaveRefund = useCallback(async (refundData: Omit<Refund, 'id' | 'isClaimed' | 'claimedDate'>, id?: string) => {
    if (id) {
        await setRefunds(prev => prev.map(r => r.id === id ? { ...r, ...refundData } : r));
    } else {
        await setRefunds(prev => [...prev, { id: self.crypto.randomUUID(), isClaimed: false, ...refundData }]);
    }
  }, [setRefunds]);

  const onSaveGlossaryEntry = useCallback(async (entryData: Omit<GlossaryEntry, 'id'>, id?: string) => {
    if (id) {
        await setGlossaryEntries(prev => prev.map(e => e.id === id ? { ...e, ...entryData } : e));
    } else {
        await setGlossaryEntries(prev => [...prev, { id: self.crypto.randomUUID(), ...entryData }]);
    }
  }, [setGlossaryEntries]);

  const onBuyInvestment = useCallback(async (investmentAccountId: string, name: string, quantity: number, price: number, fromAccountId: string) => {
    const totalCost = quantity * price;
    const existingHolding = investmentHoldings.find(h => h.accountId === investmentAccountId && h.name === name);
    
    if(existingHolding) {
      const totalQuantity = existingHolding.quantity + quantity;
      const totalInvestment = (existingHolding.quantity * existingHolding.averageCost) + totalCost;
      const newAverageCost = totalInvestment / totalQuantity;
      await setInvestmentHoldings(prev => prev.map(h => h.id === existingHolding.id ? {...h, quantity: totalQuantity, averageCost: newAverageCost, currentValue: h.currentValue + totalCost} : h));
    } else {
      const newHolding: InvestmentHolding = {
          id: self.crypto.randomUUID(),
          accountId: investmentAccountId,
          name,
          quantity,
          averageCost: price,
          currentValue: totalCost,
      };
      await setInvestmentHoldings(prev => [...prev, newHolding]);
    }

    const buyTx: Transaction = {
        id: self.crypto.randomUUID(),
        accountId: fromAccountId,
        description: `Buy ${quantity} ${name}`,
        amount: totalCost,
        type: TransactionType.EXPENSE,
        categoryId: findOrCreateCategory('Savings & Investment / Stock Purchases', TransactionType.EXPENSE),
        date: new Date().toISOString(),
    };
    await setTransactions(prev => [buyTx, ...prev]);
  }, [investmentHoldings, setInvestmentHoldings, setTransactions, findOrCreateCategory]);

  const onSellInvestment = useCallback(async (holdingId: string, quantity: number, price: number, toAccountId: string) => {
    const totalProceeds = quantity * price;
    await setInvestmentHoldings(prev => prev.map(h => h.id === holdingId ? {...h, quantity: h.quantity - quantity, currentValue: (h.quantity - quantity) * (h.currentValue / h.quantity) } : h).filter(h => h.quantity > 0.0001));

    const sellTx: Transaction = {
        id: self.crypto.randomUUID(),
        accountId: toAccountId,
        description: `Sell ${quantity} of ${investmentHoldings.find(h=>h.id===holdingId)?.name}`,
        amount: totalProceeds,
        type: TransactionType.INCOME,
        categoryId: findOrCreateCategory('Investments / Capital Gains', TransactionType.INCOME),
        date: new Date().toISOString(),
    };
    await setTransactions(prev => [sellTx, ...prev]);
  }, [setInvestmentHoldings, setTransactions, findOrCreateCategory, investmentHoldings]);

  const onUpdateInvestmentValue = useCallback(async (holdingId: string, newCurrentValue: number) => {
    await setInvestmentHoldings(prev => prev.map(h => h.id === holdingId ? {...h, currentValue: newCurrentValue } : h));
  }, [setInvestmentHoldings]);
  
  const onSaveInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id'>, id?: string) => {
    if (id) {
        await setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...invoiceData } : i));
    } else {
        await setInvoices(prev => [...prev, { id: self.crypto.randomUUID(), ...invoiceData }]);
    }
  }, [setInvoices]);

  const onRecordInvoicePayment = useCallback(async (invoice: Invoice, payment: { accountId: string; amount: number; date: string }) => {
    await setInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, status: InvoiceStatus.PAID } : i));
    
    const incomeTx: Transaction = {
        id: self.crypto.randomUUID(),
        accountId: payment.accountId,
        description: `Payment for Invoice #${invoice.invoiceNumber}`,
        amount: payment.amount,
        type: TransactionType.INCOME,
        categoryId: findOrCreateCategory('Business / Product Sales', TransactionType.INCOME),
        date: payment.date,
    };
    await setTransactions(prev => [incomeTx, ...prev]);
  }, [setInvoices, setTransactions, findOrCreateCategory]);

    const onRefreshPrices = useCallback(async () => {
    // This is a placeholder for a real API call to get latest market prices.
    // For now, we can simulate a small random change.
    await setInvestmentHoldings(prev => prev.map(h => ({
        ...h,
        currentValue: h.currentValue * (1 + (Math.random() - 0.5) * 0.1) // +/- 5% change
    })));
  }, [setInvestmentHoldings]);

  const dataSetters: Record<ItemType, Function> = {
    transaction: setTransactions, recurringTransaction: setRecurringTransactions, tripExpense: setTripExpenses, refund: setRefunds, settlement: setSettlements, account: setAccounts, category: setCategories, payee: setPayees, sender: setSenders, contact: setContacts, contactGroup: setContactGroups, trip: setTrips, shop: setShops, shopProduct: setShopProducts, shopEmployee: setShopEmployees, shopShift: setShopShifts, goal: setGoals, note: setNotes, glossaryEntry: setGlossaryEntries, debt: setDebts
  };

  const dataSources: Record<ItemType, any[]> = {
    transaction: transactions, recurringTransaction: recurringTransactions, tripExpense: tripExpenses, refund: refunds, settlement: settlements, account: accounts, category: categories, payee: payees, sender: senders, contact: contacts, contactGroup: contactGroups, trip: trips, shop: shops, shopProduct: shopProducts, shopEmployee: shopEmployees, shopShift: shopShifts, goal: goals, note: notes, glossaryEntry: glossaryEntries, debt: debts
  };
  
  const deleteItem = useCallback(async (id: string, itemType: ItemType) => {
    const setter = dataSetters[itemType];
    const source = dataSources[itemType];
    
    if (setter && source) {
        const itemToDelete = source.find(item => item.id === id);
        if (itemToDelete) {
            const binItem: TrustBinItem = {
                id: self.crypto.randomUUID(),
                itemType,
                item: itemToDelete,
                deletedAt: new Date().toISOString(),
            };
            await setTrustBin(prev => [...prev, binItem]);
            await setter((prev: any[]) => prev.filter(item => item.id !== id));
        }
    }
  }, [dataSources, dataSetters, setTrustBin]);

  const onRestoreItems = useCallback(async (itemIds: string[]) => {
    const itemsToRestore = trustBin.filter(item => itemIds.includes(item.id));
    if (itemsToRestore.length === 0) return;

    const grouped = itemsToRestore.reduce((acc, item) => {
        if (!acc[item.itemType]) acc[item.itemType] = [];
        acc[item.itemType].push(item.item);
        return acc;
    }, {} as Record<ItemType, any[]>);

    for (const type in grouped) {
        const setter = dataSetters[type as ItemType];
        if (setter) {
            await setter((prev: any[]) => [...prev, ...grouped[type as ItemType]]);
        }
    }
    
    await setTrustBin(prev => prev.filter(item => !itemIds.includes(item.id)));
  }, [trustBin, setTrustBin, dataSetters]);

  const onPermanentDeleteItems = useCallback(async (itemIds: string[]) => {
      await setTrustBin(prev => prev.filter(item => !itemIds.includes(item.id)));
  }, [setTrustBin]);
  
  const value = {
    isLoading,
    profile,
    // Full AppState
    settings, transactions, accounts, categories, budgets, goals, recurringTransactions, investmentHoldings, contacts, contactGroups, trips, tripExpenses, shops, shopProducts, shopSales, shopEmployees, shopShifts, refunds, settlements, debts, notes, glossaryEntries, unlockedAchievements, challenges, streaks, invoices, payees, senders,
    customCalendarEvents,
    financialProfile,
    trustBin,
    // Setters
    setSettings, setFinancialProfile, setTransactions, setAccounts, setCategories, setBudgets, setGoals, setRecurringTransactions, setInvestmentHoldings, setContacts, setContactGroups, setTrips, setTripExpenses, setShops, setShopProducts, setShopSales, setShopEmployees, setShopShifts, setRefunds, setSettlements, setDebts, setNotes, setGlossaryEntries, setUnlockedAchievements, setChallenges, setStreaks, setInvoices, setPayees, setSenders, setCustomCalendarEvents,
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
    onSettle,
    onSaveTrip,
    onSaveTripExpense,
    onUpdateTripExpense,
    onSaveShop,
    onSaveProduct,
    onSaveEmployee,
    onSaveShift,
    onSaveRefund,
    onSaveGlossaryEntry,
    onBuyInvestment,
    onSellInvestment,
    onUpdateInvestmentValue,
    onSaveInvoice,
    onRecordInvoicePayment,
    onRefreshPrices,
    onSaveContact,
    onSaveContactGroup,
    findOrCreateCategory,
    updateStreak,
    onAddNote,
    deleteItem,
    onRestoreItems,
    onPermanentDeleteItems,
    // UI State
    selectedAccountIds,
    setSelectedAccountIds,
    newlyUnlockedAchievementId,
    setNewlyUnlockedAchievementId,
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