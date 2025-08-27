import React, { useState, useCallback, useEffect, useMemo, useContext, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ProcessingStatus, Transaction, Account, Category, TransactionType, DateRange, CustomDateRange, Budget, Payee, RecurringTransaction, ActiveModal, SpamWarning, Sender, Goal, FeedbackItem, InvestmentHolding, AccountType, AppState, Contact, ContactGroup, Settings, ActiveScreen, UnlockedAchievement, FinanceTrackerProps, ModalState, Trip, TripExpense, TrustBinItem, ConfirmationState, TrustBinDeletionPeriodUnit, TripPayer, AllDataScreenProps, FinancialProfile, ItemType, Shop, ShopProduct, ShopSale, ShopSaleItem, ParsedTransactionData, UserStreak, Challenge, ChallengeType, ShopEmployee, ShopShift } from '../types';
import { parseTransactionText, parseNaturalLanguageQuery, parseAICommand } from '../services/geminiService';
import useLocalStorage from '../hooks/useLocalStorage';
import FinanceDisplay from './StoryDisplay';
import AccountSelector from './AccountSelector';
import EditTransactionModal from './EditTransactionModal';
import TransferModal from './TransferModal';
import ReportsScreen from './ReportsScreen';
import BudgetsScreen from './BudgetsModal';
import MoreScreen from './More';
import ScheduledPaymentsScreen from './ScheduledPaymentsModal';
import { SettingsContext } from '../contexts/SettingsContext';
import { calculateNextDueDate } from '../utils/date';
import AppSettingsModal from './AppSettingsModal';
import CategoryManagerModal from './CategoryManagerModal';
import EditCategoryModal from './EditCategoryModal';
import PayeesModal from './PayeesModal';
import ImportExportModal from './ExportModal';
import SenderManagerModal from './SenderManagerModal';
import SpamWarningCard from './SpamWarningCard';
import GoalsScreen from './GoalsModal';
import ContactsManagerModal from './ContactsManagerModal';
import FeedbackModal from './FeedbackModal';
import InvestmentsScreen from './InvestmentsModal';
import CalculatorScreen from './CalculatorModal';
import AchievementsScreen from './AchievementsScreen';
import AchievementToast from './AchievementToast';
import { ALL_ACHIEVEMENTS, checkAchievements } from '../utils/achievements';
import DashboardSettingsModal from './DashboardSettingsModal';
import NotificationSettingsModal from './NotificationSettingsModal';
import { requestNotificationPermission, checkAndSendNotifications } from '../utils/notifications';
import TripManagementScreen from './TripManagementScreen';
import TripDetailsScreen from './TripDetailsScreen';
import RefundsScreen, { RefundTransactionSelector } from './RefundsScreen';
import AddTripExpenseModal from './AddTripExpenseModal';
import RefundModal from './RefundModal';
import TrustBinModal from './TrustBinModal';
import EditAccountModal from './EditAccountModal';
import DataHubScreen from './DataHubScreen';
import ConfirmationDialog from './ConfirmationDialog';
import MiniCalculatorModal from './MiniCalculatorModal';
import EditTripModal from './EditTripModal';
import EditContactModal from './EditContactModal';
import GlobalTripSummaryModal from './GlobalTripSummaryModal';
import NotificationsModal from './NotificationsModal';
import EditGoalModal from './EditGoalModal';
import ManageToolsModal from './ManageToolsModal';
import AddTransactionModal from './AddTransactionModal';
import FinancialHealthModal from './FinancialHealthModal';
import FooterSettingsModal from './FooterSettingsModal';
import { ShopScreen } from './ShopScreen';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import OnboardingGuide from './OnboardingGuide';
import { getDailyChallenge } from '../utils/challenges';
import ChallengesScreen from './ChallengesScreen';
import LearnScreen from './LearnScreen';

const modalRoot = document.getElementById('modal-root')!;

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
    // FIX: Added explicit type to systemCats to match the structure of the 'categories' array,
    // which includes an optional 'children' property. This resolves the TypeScript error when
    // iterating over the combined array.
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
    const addCategory = (name: string, type: TransactionType, parentId: string | null, icon: string) => {
        allCategories.push({ id: self.crypto.randomUUID(), name, type, parentId, icon });
    };

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
const DEFAULT_ACCOUNTS = (): Account[] => [];

export const FinanceTracker: React.FC<FinanceTrackerProps & { initialText?: string | null }> = ({ 
  activeScreen, setActiveScreen, modalStack, setModalStack, isOnline, mainContentRef, initialText, onSelectionChange, showOnboardingGuide, setShowOnboardingGuide
}) => {
  const [text, setText] = useState<string>('');
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('finance-tracker-transactions', []);
  const [accounts, setAccounts] = useLocalStorage<Account[]>('finance-tracker-accounts', DEFAULT_ACCOUNTS);
  const { settings, setSettings, categories, setCategories, payees, setPayees, senders, setSenders, contactGroups, setContactGroups, contacts, setContacts, financialProfile, setFinancialProfile } = useContext(SettingsContext);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('finance-tracker-budgets', []);
  const [recurringTransactions, setRecurringTransactions] = useLocalStorage<RecurringTransaction[]>('finance-tracker-recurring', []);
  const [goals, setGoals] = useLocalStorage<Goal[]>('finance-tracker-goals', []);
  const [investmentHoldings, setInvestmentHoldings] = useLocalStorage<InvestmentHolding[]>('finance-tracker-investments', []);
  const [trips, setTrips] = useLocalStorage<Trip[]>('finance-tracker-trips', []);
  const [tripExpenses, setTripExpenses] = useLocalStorage<TripExpense[]>('finance-tracker-trip-expenses', []);
  const [selectedAccountIds, setSelectedAccountIds] = useLocalStorage<string[]>('finance-tracker-selected-account-ids', ['all']);
  const [feedbackQueue, setFeedbackQueue] = useLocalStorage<FeedbackItem[]>('finance-tracker-feedback-queue', []);
  const [unlockedAchievements, setUnlockedAchievements] = useLocalStorage<UnlockedAchievement[]>('finance-tracker-achievements', []);
  const [trustBin, setTrustBin] = useLocalStorage<TrustBinItem[]>('finance-tracker-trust-bin', []);
  const isInitialLoad = useRef(true);
  
  // Shop State
  const [shops, setShops] = useLocalStorage<Shop[]>('finance-tracker-shops', []);
  const [shopProducts, setShopProducts] = useLocalStorage<ShopProduct[]>('finance-tracker-shop-products', []);
  const [shopSales, setShopSales] = useLocalStorage<ShopSale[]>('finance-tracker-shop-sales', []);
  const [shopEmployees, setShopEmployees] = useLocalStorage<ShopEmployee[]>('finance-tracker-shop-employees', []);
  const [shopShifts, setShopShifts] = useLocalStorage<ShopShift[]>('finance-tracker-shop-shifts', []);

  const [toastQueue, setToastQueue] = useState<string[]>([]);
  const [tripDetailsId, setTripDetailsId] = useState<string | null>(null);

  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [error, setError] = useState<string>('');
  const [spamWarning, setSpamWarning] = useState<SpamWarning | null>(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);
  
  // Gamification State
  const [streaks, setStreaks] = useLocalStorage<UserStreak>('finance-tracker-streaks', {
    currentStreak: 0,
    longestStreak: 0,
    lastLogDate: null,
    streakFreezes: 3
  });
  const [challenges, setChallenges] = useLocalStorage<Challenge[]>('finance-tracker-challenges', []);

  const dailyChallenge = useMemo(() => {
    const challenge = getDailyChallenge(challenges);
    if (!challenges.some(c => c.id === challenge.id)) {
        setChallenges(prev => [...prev.slice(-10), challenge]); // Keep last 10 challenges
    }
    return challenge;
  }, [challenges, setChallenges]);


  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange>('all');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ start: null, end: null });

  const activeModal = modalStack[modalStack.length - 1] || null;
  const closeActiveModal = () => setModalStack(prev => prev.slice(0, -1));
  const openModal = (name: ActiveModal, props?: Record<string, any>) => setModalStack(prev => [...prev, { name, props }]);
  const formatCurrency = useCurrencyFormatter();

  const handleOpenCalculator = (onResult: (result: number) => void) => {
    openModal('miniCalculator', { onResult });
  };

  const allLocalStorageKeys = [
    'finance-tracker-transactions', 'finance-tracker-accounts', 'finance-tracker-settings', 
    'finance-tracker-categories', 'finance-tracker-payees', 'finance-tracker-senders',
    'finance-tracker-contact-groups', 'finance-tracker-contacts', 'finance-tracker-financial-profile',
    'finance-tracker-budgets', 'finance-tracker-recurring', 'finance-tracker-goals',
    'finance-tracker-investments', 'finance-tracker-trips', 'finance-tracker-trip-expenses',
    'finance-tracker-selected-account-ids', 'finance-tracker-feedback-queue',
    'finance-tracker-achievements', 'finance-tracker-trust-bin', 'finance-tracker-shops',
    'finance-tracker-shop-products', 'finance-tracker-shop-sales', 'finance-tracker-shop-employees', 'finance-tracker-shop-shifts', 'finance-tracker-consent',
    'finance-tracker-onboarding-complete', 'finance-tracker-crypto-key', 'finance-tracker-show-guide',
    'finance-tracker-streaks', 'finance-tracker-challenges'
  ];

  const handleResetApp = () => {
    allLocalStorageKeys.forEach(key => window.localStorage.removeItem(key));
    window.location.reload();
  }

  const confirmResetApp = () => {
    setConfirmationState({
        title: 'Reset Application?',
        message: 'This will permanently delete all your data, including accounts, transactions, and settings. This action cannot be undone.',
        onConfirm: handleResetApp,
        confirmLabel: 'Reset',
        lockDuration: 5
    });
  }


  const appState: AppState = useMemo(() => ({
    transactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, payees, senders, contactGroups, contacts, settings, achievements: unlockedAchievements, trips: trips || [], tripExpenses: tripExpenses || [], financialProfile, shops, shopProducts, shopSales, shopEmployees, shopShifts
  }), [transactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, payees, senders, contactGroups, contacts, settings, unlockedAchievements, trips, tripExpenses, financialProfile, shops, shopProducts, shopSales, shopEmployees, shopShifts]);

  useEffect(() => {
    onSelectionChange?.(selectedAccountIds);
  }, [selectedAccountIds, onSelectionChange]);
  
  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (categories.length === 0) setCategories(DEFAULT_CATEGORIES);
  }, [categories, setCategories]);

  useEffect(() => {
    // This effect improves the onboarding experience. If the user has just finished
    // onboarding and has accounts, but the selection is still 'all', we select 
    // the first account for them. This enables the "Add Transaction" FAB by default.
    if (isInitialLoad.current && accounts.length > 0 && selectedAccountIds.length === 1 && selectedAccountIds[0] === 'all') {
        setSelectedAccountIds([accounts[0].id]);
    }
    isInitialLoad.current = false;
  }, [accounts, selectedAccountIds, setSelectedAccountIds]);
  
  // Auto-purge Trust Bin on load
  useEffect(() => {
    const { value, unit } = settings.trustBinDeletionPeriod;
    let multiplier = 1000; // ms
    switch(unit) {
        case 'minutes': multiplier *= 60; break;
        case 'hours': multiplier *= 60 * 60; break;
        case 'days': multiplier *= 60 * 60 * 24; break;
        case 'weeks': multiplier *= 60 * 60 * 24 * 7; break;
        case 'months': multiplier *= 60 * 60 * 24 * 30; break; // Approximation
        case 'years': multiplier *= 60 * 60 * 24 * 365; break; // Approximation
    }
    
    const cutoffDate = new Date(Date.now() - value * multiplier).toISOString();
    const itemsToKeep = trustBin.filter(item => item.deletedAt > cutoffDate);
    if (itemsToKeep.length < trustBin.length) {
      console.log(`Purged ${trustBin.length - itemsToKeep.length} old items from Trust Bin.`);
      setTrustBin(itemsToKeep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on app load
  
  const handlePayRecurring = useCallback((itemOrId: RecurringTransaction | string) => {
      const itemToPay = typeof itemOrId === 'string' 
        ? recurringTransactions.find(r => r.id === itemOrId) 
        : recurringTransactions.find(r => r.id === itemOrId.id);

      if (!itemToPay) return;

      const newTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: itemToPay.accountId, description: itemToPay.description, amount: itemToPay.amount, type: itemToPay.type, categoryId: itemToPay.categoryId, date: new Date().toISOString(), notes: itemToPay.notes };
      setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      
      const nextDueDate = calculateNextDueDate(itemToPay.nextDueDate, itemToPay);
      setRecurringTransactions(prev => prev.map(r => r.id === itemToPay.id ? { ...r, nextDueDate: nextDueDate.toISOString() } : r));
  }, [recurringTransactions, setRecurringTransactions, setTransactions]);

  useEffect(() => {
    // Listen for messages from the service worker (e.g., for actionable notifications)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'mark_as_paid' && event.data.id) {
        handlePayRecurring(event.data.id);
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [handlePayRecurring]);

  useEffect(() => {
    if (isOnline && feedbackQueue.length > 0) {
        const sendPromises = feedbackQueue.map(item => new Promise(resolve => setTimeout(resolve, 500)));
        Promise.all(sendPromises).then(() => setFeedbackQueue([])).catch(err => console.error("Failed to send queued feedback:", err));
    }
  }, [isOnline, feedbackQueue, setFeedbackQueue]);

  useEffect(() => {
    const unlockedIds = new Set(unlockedAchievements.map(a => a.achievementId));
    const newlyUnlockedIds = checkAchievements(appState, unlockedIds);
    if (newlyUnlockedIds.length > 0) {
      const newAchievements: UnlockedAchievement[] = newlyUnlockedIds.map(id => ({ achievementId: id, date: new Date().toISOString() }));
      setUnlockedAchievements(prev => [...prev, ...newAchievements]);
      setToastQueue(prev => [...prev, ...newlyUnlockedIds]);
    }
  }, [appState, unlockedAchievements, setUnlockedAchievements]);

  useEffect(() => {
    if (settings.notificationSettings.enabled) requestNotificationPermission();
    const intervalId = setInterval(() => checkAndSendNotifications(appState), 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [appState, settings.notificationSettings.enabled]);

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
    if (streaks.lastLogDate === today) return; // Already logged today

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
    if (dailyChallenge && !dailyChallenge.isCompleted && dailyChallenge.type === type) {
        setChallenges(prev => prev.map(c => c.id === dailyChallenge.id ? { ...c, isCompleted: true } : c));
    }
  }, [dailyChallenge, setChallenges]);


  const saveTransaction = useCallback((data: ParsedTransactionData, accountId: string, senderId?: string) => {
    let categoryId = '';
    let description = data.description;
    const matchingPayee = data.payeeIdentifier ? payees.find(p => p.identifier.toLowerCase() === data.payeeIdentifier?.toLowerCase()) : null;
    if(matchingPayee) {
        categoryId = matchingPayee.defaultCategoryId;
        description = matchingPayee.name;
    } else {
        categoryId = findOrCreateCategory(data.categoryName, data.type);
    }
    const newTransaction: Transaction = { id: data.id, accountId: accountId, description: description, amount: data.amount, type: data.type, categoryId: categoryId, date: data.date, notes: data.notes, payeeIdentifier: data.payeeIdentifier, senderId: senderId, };
    setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setStatus(ProcessingStatus.SUCCESS);
    setText('');
    setSpamWarning(null);
    updateStreak();
    checkAndCompleteChallenge('log_transaction');
    closeActiveModal();
  }, [findOrCreateCategory, setTransactions, payees, closeActiveModal, updateStreak, checkAndCompleteChallenge]);

  const handleAddTransaction = useCallback(async (transactionText: string, accountId?: string) => {
    if (!accountId) {
        setError('Please select an account to add this transaction.');
        return setStatus(ProcessingStatus.ERROR);
    }
    if (!transactionText.trim()) {
      setError('Paste message or Quick Add: "Lunch 500"');
      return setStatus(ProcessingStatus.ERROR);
    }
    setStatus(ProcessingStatus.LOADING);
    setError('');
    setSpamWarning(null);
    try {
      const parsed = await parseTransactionText(transactionText);
      if (parsed) {
        const senderIdentifier = parsed.senderName?.toLowerCase();
        const existingSender = senderIdentifier ? senders.find(s => s.identifier.toLowerCase() === senderIdentifier) : undefined;
        if (existingSender?.type === 'blocked') {
          setError(`Message from blocked sender "${existingSender.name}" ignored.`);
          setStatus(ProcessingStatus.ERROR);
          return;
        }
        if (existingSender?.type === 'trusted') {
          saveTransaction(parsed, accountId, existingSender.id);
          return;
        }
        if ((parsed.isSpam && parsed.spamConfidence > 0.7) || parsed.isForwarded) {
            setSpamWarning({ parsedData: parsed, rawText: transactionText });
            setStatus(ProcessingStatus.IDLE);
            setText('');
            return;
        }
        saveTransaction(parsed, accountId);
      } else {
        setError('This does not seem to be a valid financial transaction.');
        setStatus(ProcessingStatus.ERROR);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      if (errorMessage.includes("Security risk detected")) {
          setError("This message appears to contain a password or OTP and was blocked for your security. Please do not enter sensitive login information.");
      } else {
          setError(errorMessage);
      }
      setStatus(ProcessingStatus.ERROR);
    }
  }, [saveTransaction, senders]);
  
  const handleNaturalLanguageSearch = async () => {
      if (!searchQuery.trim()) return;
      setStatus(ProcessingStatus.LOADING);
      try {
        const result = await parseNaturalLanguageQuery(searchQuery);
        setSearchQuery(result.searchQuery || '');
        if(result.dateFilter) setDateFilter(result.dateFilter as DateRange);
      } catch (e) { setError("AI search failed. Please try a standard search."); } finally { setStatus(ProcessingStatus.IDLE); }
  }
  
  const handleSpamApproval = (trustSender: boolean) => {
    if (!spamWarning) return;
    let senderId: string | undefined = undefined;
    if (trustSender && spamWarning.parsedData.senderName) {
      const newSender: Sender = { id: self.crypto.randomUUID(), identifier: spamWarning.parsedData.senderName, name: spamWarning.parsedData.senderName, type: 'trusted' };
      setSenders(prev => [...prev, newSender]);
      senderId = newSender.id;
    }
    saveTransaction(spamWarning.parsedData, selectedAccountIds[0], senderId);
  };

  const handleAddAccount = useCallback((name: string, accountType: AccountType, currency: string, creditLimit?: number, openingBalance?: number) => {
    const newAccount: Account = { id: self.crypto.randomUUID(), name, accountType, currency, creditLimit };
    setAccounts(prev => [...prev, newAccount]);
    if (openingBalance && openingBalance > 0) {
        const openingBalanceCategory = findOrCreateCategory('Opening Balance', TransactionType.INCOME);
        const openingTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: newAccount.id, description: 'Opening Balance', amount: openingBalance, type: TransactionType.INCOME, categoryId: openingBalanceCategory, date: new Date().toISOString() };
        setTransactions(prev => [openingTransaction, ...prev]);
    }
    if(accounts.length === 0) setSelectedAccountIds([newAccount.id]);
  }, [accounts.length, findOrCreateCategory, setAccounts, setSelectedAccountIds, setTransactions]);
  
  const handleAccountTransfer = (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => {
    const fromAccount = accounts.find(a => a.id === fromAccountId);
    const toAccount = accounts.find(a => a.id === toAccountId);
    if (!fromAccount || !toAccount) { setError("Invalid accounts for transfer."); return; }
    const transferId = self.crypto.randomUUID();
    let expenseTransferCategory = findOrCreateCategory('Transfers', TransactionType.EXPENSE);
    let incomeTransferCategory = findOrCreateCategory('Transfers', TransactionType.INCOME);
    const now = new Date().toISOString();
    const expenseTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: fromAccountId, description: `Transfer to ${toAccount.name}`, amount, type: TransactionType.EXPENSE, categoryId: expenseTransferCategory, date: now, notes, transferId };
    const incomeTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: toAccountId, description: `Transfer from ${fromAccount.name}`, amount, type: TransactionType.INCOME, categoryId: incomeTransferCategory, date: now, notes, transferId };
    setTransactions(prev => [incomeTransaction, expenseTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    closeActiveModal();
  };

  const handleSaveTransaction = (updateData: Transaction | { action: 'split-and-replace', originalTransactionId: string, newTransactions: Omit<Transaction, 'id'>[] }) => {
    if ('action' in updateData && updateData.action === 'split-and-replace') {
      const { originalTransactionId, newTransactions: newTransactionsData } = updateData;
      const newTransactionsWithIds: Transaction[] = newTransactionsData.map(t => ({ ...t, id: self.crypto.randomUUID() }));
      setTransactions(prev => [...prev.filter(t => t.id !== originalTransactionId), ...newTransactionsWithIds].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      checkAndCompleteChallenge('log_transaction');
    } else {
      const tx = updateData as Transaction;
      if (tx.id) { // UPDATE
        setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else { // CREATE
        const newTransaction = { ...tx, id: self.crypto.randomUUID() };
         if (!newTransaction.accountId) {
            setError("Cannot create a transaction without an account.");
            return;
        }
        setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        checkAndCompleteChallenge('log_transaction');
      }
    }
    updateStreak();
    setModalStack([]); // Close all modals on save
  };
  
  const handleSaveBudget = (categoryId: string, amount: number) => {
    const month = new Date().toISOString().slice(0, 7);
    setBudgets(prev => {
        const existing = prev.find(b => b.categoryId === categoryId && b.month === month);
        if (existing) return prev.map(b => b.categoryId === categoryId && b.month === month ? { ...b, amount } : b);
        return [...prev, { categoryId, amount, month }];
    });
    checkAndCompleteChallenge('set_budget');
  };
  
  const handleAddNewCategory = useCallback((category: Omit<Category, 'id'>) => setCategories(prev => [...prev, { ...category, id: self.crypto.randomUUID() }]), [setCategories]);
  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };
  
  const handleSaveGoal = (goal: Omit<Goal, 'id' | 'currentAmount'>, id?: string) => {
    if (id) {
      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...goal } : g));
    } else {
      setGoals(prev => [...prev, { ...goal, id: self.crypto.randomUUID(), currentAmount: 0 }]);
    }
    closeActiveModal();
  };

  const handleContributeToGoal = (goalId: string, amount: number, accountId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const goalCategoryId = findOrCreateCategory('Goal Contributions', TransactionType.EXPENSE);
    const contributionTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: accountId, description: `Contribution to "${goal.name}"`, amount: amount, type: TransactionType.EXPENSE, categoryId: goalCategoryId, date: new Date().toISOString() };
    setTransactions(prev => [contributionTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g ));
    checkAndCompleteChallenge('review_goals');
  };

  const handleSettleDebt = (transactionId: string, splitDetailId: string, settlementAccountId: string) => {
    const originalTransaction = transactions.find(t => t.id === transactionId);
    const splitDetail = originalTransaction?.splitDetails?.find(s => s.id === splitDetailId);
    if (!originalTransaction || !splitDetail) return;
    const repaymentCategoryId = findOrCreateCategory('Debt Repayment', TransactionType.INCOME);
    const incomeTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: settlementAccountId, description: `Repayment from ${splitDetail.personName} for "${originalTransaction.description}"`, amount: splitDetail.amount, type: TransactionType.INCOME, categoryId: repaymentCategoryId!, date: new Date().toISOString() };
    setTransactions(prev => {
      const updatedOriginal = { ...originalTransaction, splitDetails: originalTransaction.splitDetails?.map(s => s.id === splitDetailId ? { ...s, isSettled: true, settledDate: new Date().toISOString() } : s), };
      return [incomeTransaction, ...prev.map(t => t.id === transactionId ? updatedOriginal : t)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

   const handleSendFeedback = async (message: string): Promise<{ queued: boolean }> => {
    setIsSendingFeedback(true);
    const feedbackItem: FeedbackItem = { id: self.crypto.randomUUID(), message, timestamp: new Date().toISOString() };
    let wasQueued = false;
    if (isOnline) await new Promise(resolve => setTimeout(resolve, 500));
    else { setFeedbackQueue(prev => [...prev, feedbackItem]); wasQueued = true; }
    setIsSendingFeedback(false);
    return { queued: wasQueued };
  };

  const handleBuyInvestment = (investmentAccountId: string, name: string, quantity: number, price: number, fromAccountId: string) => {
    const cost = quantity * price;
    const buyCategoryId = findOrCreateCategory('Savings & Investment/Buy', TransactionType.EXPENSE);
    const expenseTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: fromAccountId, description: `Buy ${quantity} ${name}`, amount: cost, type: TransactionType.EXPENSE, categoryId: buyCategoryId, date: new Date().toISOString() };
    setTransactions(prev => [expenseTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    const existingHolding = investmentHoldings.find(h => h.accountId === investmentAccountId && h.name.toLowerCase() === name.toLowerCase());
    if (existingHolding) {
      const totalQuantity = existingHolding.quantity + quantity;
      const totalCost = (existingHolding.quantity * existingHolding.averageCost) + cost;
      const newAverageCost = totalCost / totalQuantity;
      setInvestmentHoldings(prev => prev.map(h => h.id === existingHolding.id ? { ...h, quantity: totalQuantity, averageCost: newAverageCost, currentValue: h.currentValue + cost } : h));
    } else {
      setInvestmentHoldings(prev => [...prev, { id: self.crypto.randomUUID(), accountId: investmentAccountId, name, quantity, averageCost: price, currentValue: cost }]);
    }
  };

  const handleSellInvestment = (holdingId: string, quantity: number, price: number, toAccountId: string) => {
    const holding = investmentHoldings.find(h => h.id === holdingId);
    if (!holding) return;
    const proceeds = quantity * price;
    const sellCategoryId = findOrCreateCategory('Investments/Sell', TransactionType.INCOME);
    const incomeTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: toAccountId, description: `Sell ${quantity} ${holding.name}`, amount: proceeds, type: TransactionType.INCOME, categoryId: sellCategoryId, date: new Date().toISOString() };
    setTransactions(prev => [incomeTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    const remainingQuantity = holding.quantity - quantity;
    if (remainingQuantity > 0) {
      setInvestmentHoldings(prev => prev.map(h => h.id === holdingId ? { ...h, quantity: remainingQuantity, currentValue: remainingQuantity * (h.currentValue/h.quantity) } : h));
    } else {
      setInvestmentHoldings(prev => prev.filter(h => h.id !== holdingId));
    }
  };

  const handleUpdateInvestmentValue = (holdingId: string, newCurrentValue: number) => {
    setInvestmentHoldings(prev => prev.map(h => h.id === holdingId ? { ...h, currentValue: newCurrentValue } : h));
  };
  
  const handleSaveRecurring = (item: Omit<RecurringTransaction, 'id' | 'nextDueDate'> & { id?: string }) => {
    const nextDueDate = calculateNextDueDate(item.startDate, item);
    if (item.id) {
        setRecurringTransactions(prev => prev.map(r => r.id === item.id ? { ...item, id: item.id, nextDueDate: nextDueDate.toISOString() } as RecurringTransaction : r));
    } else {
        setRecurringTransactions(prev => [...prev, { ...item, id: self.crypto.randomUUID(), nextDueDate: nextDueDate.toISOString() } as RecurringTransaction]);
    }
  };

  const handleSaveTrip = (tripData: Omit<Trip, 'id' | 'date'>, id?: string) => {
      if(id) {
          setTrips(prev => prev.map(t => t.id === id ? { ...t, ...tripData } : t));
      } else {
          setTrips(prev => [...prev, { ...tripData, id: self.crypto.randomUUID(), date: new Date().toISOString() }]);
      }
      closeActiveModal();
  };
  
  const handleAddTripExpense = (tripId: string, items: Omit<TripExpense, 'id'|'tripId'|'date'>[]) => {
      const newExpenses: TripExpense[] = items.map(item => ({
          ...item,
          id: self.crypto.randomUUID(),
          tripId: tripId,
          date: new Date().toISOString(),
      }));
      setTripExpenses(prev => [...prev, ...newExpenses]);
      closeActiveModal();
  };

  const handleUpdateTripExpense = (tripId: string, expenseData: Omit<TripExpense, 'tripId' | 'date'>) => {
    setTripExpenses(prev => prev.map(exp => exp.id === expenseData.id ? { ...exp, ...expenseData, tripId } : exp));
    closeActiveModal();
  };

  const handleDeleteTripExpense = (expenseId: string) => {
      confirmDelete(expenseId, 'tripExpense', tripExpenses.find(t => t.id === expenseId)?.description || 'trip expense');
  }
  
  const handleSaveContact = useCallback((contactData: Omit<Contact, 'id'>, id?: string): Contact => {
      let savedContact: Contact;
      if (id) {
        let tempContact: Contact | undefined;
        setContacts(prev => prev.map(c => {
            if (c.id === id) {
              tempContact = { ...c, ...contactData };
              return tempContact;
            }
            return c;
        }));
        savedContact = tempContact!;
      } else {
        savedContact = { ...contactData, id: self.crypto.randomUUID() };
        setContacts(prev => [...prev, savedContact]);
      }
      return savedContact;
  }, [setContacts])
  
  const handleSaveContactGroup = useCallback((groupData: Omit<ContactGroup, 'id'>, id?: string): ContactGroup => {
    let savedGroup: ContactGroup;
    if (id) {
        let tempGroup: ContactGroup | undefined;
        setContactGroups(prev => prev.map(g => {
            if(g.id === id) {
                tempGroup = { ...g, ...groupData };
                return tempGroup;
            }
            return g;
        }));
        savedGroup = tempGroup!;
    } else {
        savedGroup = { ...groupData, id: self.crypto.randomUUID() };
        setContactGroups(prev => [...prev, savedGroup]);
    }
    return savedGroup;
  }, [setContactGroups])

  const handleDeleteItem = (itemId: string, itemType: ItemType) => {
    const itemGetter: Record<ItemType, () => any[]> = {
      'transaction': () => transactions, 'category': () => categories, 'payee': () => payees, 'sender': () => senders,
      'contact': () => contacts, 'contactGroup': () => contactGroups, 'goal': () => goals,
      'recurringTransaction': () => recurringTransactions, 'account': () => accounts, 'trip': () => trips,
      'tripExpense': () => tripExpenses, 'shop': () => shops, 'shopProduct': () => shopProducts,
      'shopEmployee': () => shopEmployees, 'shopShift': () => shopShifts,
    };

    const itemSetter: Record<ItemType, (items: any[]) => void> = {
      'transaction': setTransactions, 'category': setCategories, 'payee': setPayees, 'sender': setSenders,
      'contact': setContacts, 'contactGroup': setContactGroups, 'goal': setGoals,
      'recurringTransaction': setRecurringTransactions, 'account': setAccounts, 'trip': setTrips,
      'tripExpense': setTripExpenses, 'shop': setShops, 'shopProduct': setShopProducts,
      'shopEmployee': setShopEmployees, 'shopShift': setShopShifts,
    };
    
    const items = itemGetter[itemType]();
    const itemToDelete = items.find(item => item.id === itemId);
    if(itemToDelete) {
        const newTrustBinItem: TrustBinItem = {
            id: self.crypto.randomUUID(),
            item: itemToDelete,
            itemType,
            deletedAt: new Date().toISOString()
        };
        setTrustBin(prev => [...prev, newTrustBinItem]);
        itemSetter[itemType](items.filter(item => item.id !== itemId));
    }
    setConfirmationState(null);
  };
  
  const confirmDelete = (itemId: string, itemType: ItemType, name: string) => {
    setConfirmationState({
        title: `Delete ${itemType}?`,
        message: `Are you sure you want to delete "${name}"? This will move the item to the Trust Bin.`,
        onConfirm: () => handleDeleteItem(itemId, itemType),
        confirmLabel: 'Delete'
    })
  }
  
  const handleRestoreFromTrustBin = (itemIds: string[]) => {
    const itemsToRestore = trustBin.filter(item => itemIds.includes(item.id));
    if (itemsToRestore.length === 0) return;

    const restoredItemsByType: Partial<Record<ItemType, any[]>> = {};
    itemsToRestore.forEach(binItem => {
        if (!restoredItemsByType[binItem.itemType]) restoredItemsByType[binItem.itemType] = [];
        restoredItemsByType[binItem.itemType]!.push(binItem.item);
    });

    if (restoredItemsByType.transaction) setTransactions(prev => [...prev, ...restoredItemsByType.transaction!]);
    if (restoredItemsByType.category) setCategories(prev => [...prev, ...restoredItemsByType.category!]);
    if (restoredItemsByType.payee) setPayees(prev => [...prev, ...restoredItemsByType.payee!]);
    if (restoredItemsByType.sender) setSenders(prev => [...prev, ...restoredItemsByType.sender!]);
    if (restoredItemsByType.contact) setContacts(prev => [...prev, ...restoredItemsByType.contact!]);
    if (restoredItemsByType.contactGroup) setContactGroups(prev => [...prev, ...restoredItemsByType.contactGroup!]);
    if (restoredItemsByType.goal) setGoals(prev => [...prev, ...restoredItemsByType.goal!]);
    if (restoredItemsByType.recurringTransaction) setRecurringTransactions(prev => [...prev, ...restoredItemsByType.recurringTransaction!]);
    if (restoredItemsByType.account) setAccounts(prev => [...prev, ...restoredItemsByType.account!]);
    if (restoredItemsByType.trip) setTrips(prev => [...prev, ...restoredItemsByType.trip!]);
    if (restoredItemsByType.tripExpense) setTripExpenses(prev => [...prev, ...restoredItemsByType.tripExpense!]);
    if (restoredItemsByType.shop) setShops(prev => [...prev, ...restoredItemsByType.shop!]);
    if (restoredItemsByType.shopProduct) setShopProducts(prev => [...prev, ...restoredItemsByType.shopProduct!]);
    if (restoredItemsByType.shopEmployee) setShopEmployees(prev => [...prev, ...restoredItemsByType.shopEmployee!]);
    if (restoredItemsByType.shopShift) setShopShifts(prev => [...prev, ...restoredItemsByType.shopShift!]);

    setTrustBin(prev => prev.filter(item => !itemIds.includes(item.id)));
  };

  const handlePermanentDeleteFromTrustBin = (itemIds: string[]) => {
    setTrustBin(prev => prev.filter(item => !itemIds.includes(item.id)));
  }

  // Shop Handlers
  const handleSaveShop = (shopData: Omit<Shop, 'id'>, id?: string) => {
    if (id) setShops(prev => prev.map(s => s.id === id ? { ...s, ...shopData } : s));
    else setShops(prev => [...prev, { ...shopData, id: self.crypto.randomUUID() }]);
  };
  
  const handleSaveProduct = (shopId: string, productData: Omit<ShopProduct, 'id' | 'shopId'>, id?: string) => {
    if (id) setShopProducts(prev => prev.map(p => p.id === id ? { ...p, ...productData, shopId } : p));
    else setShopProducts(prev => [...prev, { ...productData, id: self.crypto.randomUUID(), shopId }]);
  };

  const handleRecordSale = (shopId: string, saleData: Omit<ShopSale, 'id' | 'shopId'>) => {
    const newSale = { ...saleData, id: self.crypto.randomUUID(), shopId };
    setShopSales(prev => [...prev, newSale]);
    // Update stock
    setShopProducts(prev => {
        const newProducts = [...prev];
        newSale.items.forEach(item => {
            const productIndex = newProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) newProducts[productIndex].stockQuantity -= item.quantity;
        });
        return newProducts;
    });
    // Record income transaction
    const incomeCategory = findOrCreateCategory('Shop Sales', TransactionType.INCOME);
    const incomeTx: Transaction = {
        id: self.crypto.randomUUID(),
        accountId: selectedAccountIds[0] || accounts[0]?.id, // Needs a better account selection strategy
        description: `Sale at ${shops.find(s => s.id === shopId)?.name || 'Shop'}`,
        amount: newSale.totalAmount,
        type: TransactionType.INCOME,
        categoryId: incomeCategory,
        date: newSale.timestamp,
        notes: `Sale ID: ${newSale.id}`
    };
    setTransactions(prev => [incomeTx, ...prev]);
  };

  const handleSaveEmployee = (shopId: string, employeeData: Omit<ShopEmployee, 'id' | 'shopId'>, id?: string) => {
      if (id) setShopEmployees(prev => prev.map(e => e.id === id ? { ...e, ...employeeData, shopId } : e));
      else setShopEmployees(prev => [...prev, { ...employeeData, id: self.crypto.randomUUID(), shopId }]);
  }

  const handleSaveShift = (shopId: string, shiftData: Omit<ShopShift, 'id' | 'shopId'>, id?: string) => {
      if (id) setShopShifts(prev => prev.map(s => s.id === id ? { ...s, ...shiftData, shopId } : s));
      else setShopShifts(prev => [...prev, { ...shiftData, id: self.crypto.randomUUID(), shopId }]);
  }


  const handleSendCommand = async (command: string): Promise<string> => {
      setIsInsightLoading(true);
      try {
          const parsed = await parseAICommand(command, categories, accounts);
          
          if (parsed.action === 'clarify' || parsed.itemType === 'clarification_needed') {
              return parsed.name || "I need more information. Could you please clarify?";
          }

          switch (`${parsed.action}-${parsed.itemType}`) {
              case 'create-expense':
              case 'create-income': {
                  if (!parsed.amount || !parsed.name) {
                      return "I need a description and amount to create a transaction.";
                  }
                  if (accounts.length > 1 && !parsed.accountName) {
                      return `Which account should I use? You have: ${accounts.map(a => a.name).join(', ')}.`;
                  }
                  const account = accounts.length === 1 ? accounts[0] : accounts.find(a => a.name.toLowerCase() === parsed.accountName?.toLowerCase());
                  if (!account) {
                      return `I couldn't find an account named "${parsed.accountName}".`;
                  }
                  const categoryName = parsed.category || (parsed.itemType === 'income' ? 'Other Income' : 'Miscellaneous');
                  const categoryId = findOrCreateCategory(categoryName, parsed.itemType === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE);
                  
                  const newTransaction: Transaction = {
                      id: self.crypto.randomUUID(),
                      accountId: account.id,
                      description: parsed.name,
                      amount: parsed.amount,
                      type: parsed.itemType === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
                      categoryId: categoryId,
                      date: new Date().toISOString(),
                  };
                  setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                  return `OK. I've added a new ${parsed.itemType} of ${formatCurrency(newTransaction.amount)} for "${newTransaction.description}".`;
              }
              
              case 'create-account': {
                  if (!parsed.name) return "I need a name to create an account.";
                  handleAddAccount(parsed.name, AccountType.DEPOSITORY, settings.currency, undefined, parsed.amount);
                  return `Done. I've created the "${parsed.name}" account for you.`;
              }

              case 'delete-transaction': // Assuming `name` is description and `targetName` is also description for transactions
              case 'delete-expense':
              case 'delete-income': {
                  const targetName = parsed.targetName || parsed.name;
                  if (!targetName) return "Which transaction should I delete?";
                  const txToDelete = transactions.find(t => t.description.toLowerCase().includes(targetName.toLowerCase()));
                  if (!txToDelete) return `I couldn't find a transaction matching "${targetName}".`;
                  confirmDelete(txToDelete.id, 'transaction', txToDelete.description);
                  return `OK. I've opened a confirmation to delete "${txToDelete.description}".`;
              }
              
              default:
                  return "I'm sorry, I can't perform that action yet.";
          }
      } catch (err) {
          return err instanceof Error ? err.message : "I had trouble understanding that command.";
      } finally {
          setIsInsightLoading(false);
      }
  };
  
  const filteredTransactions = useMemo(() => {
        let filtered = transactions;
        if (selectedAccountIds.length > 0 && !selectedAccountIds.includes('all')) {
            filtered = filtered.filter(t => selectedAccountIds.includes(t.accountId));
        }
        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(t => t.description.toLowerCase().includes(lowerCaseQuery));
        }
        const now = new Date();
        switch (dateFilter) {
            case 'today':
                filtered = filtered.filter(t => new Date(t.date).toDateString() === now.toDateString());
                break;
            case 'week':
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                filtered = filtered.filter(t => new Date(t.date) >= startOfWeek);
                break;
            case 'month':
                filtered = filtered.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear());
                break;
            case 'custom':
                 if (customDateRange.start && customDateRange.end) {
                    filtered = filtered.filter(t => new Date(t.date) >= customDateRange.start! && new Date(t.date) <= customDateRange.end!);
                }
                break;
        }
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedAccountIds, searchQuery, dateFilter, customDateRange]);

    const renderActiveScreen = () => {
        switch (activeScreen) {
            case 'dashboard': return <FinanceDisplay status={status} transactions={filteredTransactions} allTransactions={transactions} accounts={accounts} categories={categories} budgets={budgets} recurringTransactions={recurringTransactions} goals={goals} investmentHoldings={investmentHoldings} onPayRecurring={handlePayRecurring} error={error} onEdit={(t) => openModal('editTransaction', { transaction: t })} onDelete={(id) => confirmDelete(id, 'transaction', transactions.find(t=>t.id===id)?.description || 'transaction')} onSettleDebt={handleSettleDebt} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onNaturalLanguageSearch={handleNaturalLanguageSearch} dateFilter={dateFilter} setDateFilter={setDateFilter} customDateRange={customDateRange} setCustomDateRange={setCustomDateRange} isBalanceVisible={isBalanceVisible} setIsBalanceVisible={setIsBalanceVisible} dashboardWidgets={settings.dashboardWidgets} isInsightLoading={isInsightLoading} mainContentRef={mainContentRef} financialProfile={financialProfile} onOpenFinancialHealth={() => openModal('financialHealth')} selectedAccountIds={selectedAccountIds} />;
            case 'reports': return <ReportsScreen transactions={transactions} categories={categories} accounts={accounts} selectedAccountIds={selectedAccountIds} baseCurrency={settings.currency} />;
            case 'budgets': return <BudgetsScreen categories={categories} transactions={transactions} budgets={budgets} onSaveBudget={handleSaveBudget} />;
            case 'goals': return <GoalsScreen goals={goals} onSaveGoal={handleSaveGoal} accounts={accounts} onContribute={handleContributeToGoal} onDelete={(id) => confirmDelete(id, 'goal', goals.find(g=>g.id===id)?.name || 'goal')} onEditGoal={(g) => openModal('editGoal', { goal: g })} />;
            case 'investments': return <InvestmentsScreen accounts={accounts} holdings={investmentHoldings} onBuy={handleBuyInvestment} onSell={handleSellInvestment} onUpdateValue={handleUpdateInvestmentValue} onRefresh={() => {}}/>;
            case 'scheduled': return <ScheduledPaymentsScreen recurringTransactions={recurringTransactions} setRecurringTransactions={setRecurringTransactions} categories={categories} accounts={accounts} onDelete={(id) => confirmDelete(id, 'recurringTransaction', recurringTransactions.find(r=>r.id===id)?.description || 'item')} />;
            case 'calculator': return <CalculatorScreen />;
            case 'more': return <MoreScreen setActiveScreen={setActiveScreen} setActiveModal={(m) => openModal(m)} onResetApp={confirmResetApp} />;
            case 'achievements': return <AchievementsScreen unlockedAchievements={unlockedAchievements} />;
            case 'challenges': return <ChallengesScreen streak={streaks} challenge={dailyChallenge} />;
            case 'learn': return <LearnScreen />;
            case 'tripManagement': return <TripManagementScreen trips={trips} tripExpenses={tripExpenses} onTripSelect={(id) => { setActiveScreen('tripDetails'); setTripDetailsId(id); }} onAddTrip={() => openModal('editTrip')} onEditTrip={(t) => openModal('editTrip', {trip: t})} onDeleteTrip={(id) => confirmDelete(id, 'trip', trips.find(t=>t.id===id)?.name || 'trip')} onShowSummary={() => openModal('globalTripSummary')} />;
            case 'tripDetails':
                const trip = trips.find(t => t.id === tripDetailsId);
                if (!trip) return <p>Trip not found</p>;
                {/* FIX: Removed invalid 'setTrips' prop */}
                return <TripDetailsScreen trip={trip} expenses={tripExpenses.filter(e => e.tripId === trip.id)} onBack={() => setActiveScreen('tripManagement')} onAddExpense={() => openModal('addTripExpense', { trip: trip })} onEditExpense={(exp) => openModal('editTripExpense', { trip, expenseToEdit: exp })} onDeleteExpense={handleDeleteTripExpense} categories={categories} />;
            case 'refunds': return <RefundsScreen transactions={transactions} categories={categories} onEditTransaction={(t) => openModal('editTransaction', { transaction: t })} />;
            case 'dataHub': return <DataHubScreen transactions={transactions} accounts={accounts} categories={categories} goals={goals} onEditTransaction={(t) => openModal('editTransaction', { transaction: t })} onDeleteTransaction={(id) => confirmDelete(id, 'transaction', transactions.find(t=>t.id===id)?.description || 'item')} onEditAccount={(a) => openModal('editAccount', { account: a })} onDeleteAccount={(id) => confirmDelete(id, 'account', accounts.find(a=>a.id===id)?.name || 'item')} onEditCategory={(c) => openModal('editCategory', { category: c })} onDeleteCategory={(id) => confirmDelete(id, 'category', categories.find(c=>c.id===id)?.name || 'item')} onEditGoal={(g) => openModal('editGoal', { goal: g })} onDeleteGoal={(id) => confirmDelete(id, 'goal', goals.find(g=>g.id===id)?.name || 'item')} />;
            {/* FIX: Changed `shift` to `'shift'` to fix a typo causing a type error. */}
            case 'shop': return <ShopScreen shops={shops} products={shopProducts} sales={shopSales} employees={shopEmployees} shifts={shopShifts} onSaveShop={handleSaveShop} onDeleteShop={(id) => confirmDelete(id, 'shop', shops.find(s=>s.id===id)?.name || 'shop')} onSaveProduct={handleSaveProduct} onDeleteProduct={(id) => confirmDelete(id, 'shopProduct', shopProducts.find(p=>p.id===id)?.name || 'product')} onRecordSale={handleRecordSale} onSaveEmployee={handleSaveEmployee} onDeleteEmployee={(id) => confirmDelete(id, 'shopEmployee', shopEmployees.find(e=>e.id===id)?.name || 'employee')} onSaveShift={handleSaveShift} onDeleteShift={(id) => confirmDelete(id, 'shopShift', shopShifts.find(s=>s.id===id)?.name || 'shift')} />;
        }
    }
    {/* FIX: Added the missing return statement for the component, which renders the active screen and any active modals. */}
    return (
        <>
            {renderActiveScreen()}

            {confirmationState && ReactDOM.createPortal(
                <ConfirmationDialog 
                    isOpen={!!confirmationState}
                    {...confirmationState}
                    onCancel={() => setConfirmationState(null)}
                />,
                modalRoot
            )}

            {toastQueue.length > 0 && ReactDOM.createPortal(
                <AchievementToast 
                    achievement={ALL_ACHIEVEMENTS.find(a => a.id === toastQueue[0])!}
                    onDismiss={() => setToastQueue(q => q.slice(1))}
                />,
                document.body
            )}

            {showOnboardingGuide && ReactDOM.createPortal(
                <OnboardingGuide onFinish={() => setShowOnboardingGuide(false)} />,
                modalRoot
            )}
            
            {spamWarning && (
                <SpamWarningCard warning={spamWarning} onApprove={handleSpamApproval} onDiscard={() => setSpamWarning(null)} />
            )}

            {(() => {
                if (!activeModal) return null;

                const modalProps = activeModal.props || {};

                switch (activeModal.name) {
                    case 'addTransaction':
                        return ReactDOM.createPortal(
                            <AddTransactionModal
                                onCancel={closeActiveModal}
                                onSaveAuto={handleAddTransaction}
                                onSaveManual={handleSaveTransaction}
                                isDisabled={selectedAccountIds.length !== 1 && accounts.length > 0}
                                initialText={text}
                                accounts={accounts}
                                contacts={contacts}
                                openModal={openModal}
                                onOpenCalculator={handleOpenCalculator}
                                selectedAccountId={selectedAccountIds[0]}
                                {...modalProps}
                            />,
                            modalRoot
                        );
                    case 'editTransaction':
                        return ReactDOM.createPortal(
                            <EditTransactionModal
                                onSave={handleSaveTransaction}
                                onCancel={closeActiveModal}
                                accounts={accounts}
                                contacts={contacts}
                                openModal={openModal}
                                onOpenCalculator={handleOpenCalculator}
                                {...modalProps}
                            />,
                            modalRoot
                        );
                    case 'transfer':
                        return ReactDOM.createPortal(<TransferModal accounts={accounts} onTransfer={handleAccountTransfer} onClose={closeActiveModal} />, modalRoot);
                    case 'appSettings':
                        return ReactDOM.createPortal(<AppSettingsModal onClose={closeActiveModal} appState={appState} onRestore={(state) => { console.log("Restore not fully implemented in UI", state); }} />, modalRoot);
                    case 'categories':
                        return ReactDOM.createPortal(<CategoryManagerModal onClose={closeActiveModal} categories={categories} onAddNewCategory={handleAddNewCategory} onEditCategory={(c) => openModal('editCategory', { category: c })} onDeleteCategory={(id) => confirmDelete(id, 'category', categories.find(c => c.id === id)?.name || 'category')} />, modalRoot);
                    case 'editCategory': {
                        // FIX: Explicitly pass the 'category' prop to satisfy EditCategoryModalProps typing. Spreading a weakly typed `modalProps` does not guarantee the prop's presence to the compiler.
                        const { category } = modalProps;
                        return ReactDOM.createPortal(<EditCategoryModal onSave={handleUpdateCategory} onCancel={closeActiveModal} categories={categories} category={category} />, modalRoot);
                    }
                    case 'payees':
                        return ReactDOM.createPortal(<PayeesModal onClose={closeActiveModal} payees={payees} setPayees={setPayees} categories={categories} onDelete={(id) => confirmDelete(id, 'payee', payees.find(p=>p.id===id)?.name || 'payee')} />, modalRoot);
                    case 'importExport':
                        return ReactDOM.createPortal(<ImportExportModal onClose={closeActiveModal} appState={appState} />, modalRoot);
                    case 'senderManager':
                        return ReactDOM.createPortal(<SenderManagerModal onClose={closeActiveModal} onDelete={(id) => confirmDelete(id, 'sender', senders.find(s=>s.id===id)?.name || 'sender')} />, modalRoot);
                    case 'contacts':
                        return ReactDOM.createPortal(<ContactsManagerModal onClose={closeActiveModal} onSaveContact={handleSaveContact} onSaveGroup={handleSaveContactGroup} onDeleteContact={(id) => confirmDelete(id, 'contact', contacts.find(c=>c.id===id)?.name || 'contact')} onDeleteGroup={(id) => confirmDelete(id, 'contactGroup', contactGroups.find(g=>g.id===id)?.name || 'group')} />, modalRoot);
                    case 'feedback':
                        return ReactDOM.createPortal(<FeedbackModal onClose={closeActiveModal} onSend={handleSendFeedback} isSending={isSendingFeedback} />, modalRoot);
                    case 'dashboardSettings':
                        return ReactDOM.createPortal(<DashboardSettingsModal onClose={closeActiveModal} />, modalRoot);
                    case 'notificationSettings':
                        return ReactDOM.createPortal(<NotificationSettingsModal onClose={closeActiveModal} budgets={budgets} categories={categories} />, modalRoot);
                    case 'addTripExpense': {
                        // FIX: Explicitly pass the 'trip' prop to satisfy AddTripExpenseModalProps typing, which is required by the component.
                        const { trip } = modalProps;
                        return ReactDOM.createPortal(<AddTripExpenseModal onClose={closeActiveModal} onSave={items => handleAddTripExpense(trip.id, items)} onUpdate={expense => handleUpdateTripExpense(trip.id, expense)} categories={categories} onOpenCalculator={handleOpenCalculator} onSaveContact={handleSaveContact} findOrCreateCategory={findOrCreateCategory} trip={trip} />, modalRoot);
                    }
                    case 'editTripExpense': {
                         // FIX: Explicitly pass the 'trip' and 'expenseToEdit' props to satisfy AddTripExpenseModalProps typing.
                         const { trip, expenseToEdit } = modalProps;
                         return ReactDOM.createPortal(<AddTripExpenseModal onClose={closeActiveModal} onSave={() => {}} onUpdate={expense => handleUpdateTripExpense(trip.id, expense)} categories={categories} onOpenCalculator={handleOpenCalculator} onSaveContact={handleSaveContact} findOrCreateCategory={findOrCreateCategory} trip={trip} expenseToEdit={expenseToEdit} />, modalRoot);
                    }
                    case 'refund':
                        return ReactDOM.createPortal(<RefundModal originalTransaction={modalProps.transaction} contacts={contacts} onClose={closeActiveModal} onSave={handleSaveTransaction} findOrCreateCategory={findOrCreateCategory} />, modalRoot);
                    case 'selectRefund':
                        return ReactDOM.createPortal(<RefundTransactionSelector transactions={transactions} categories={categories} onCancel={closeActiveModal} onSelect={(t) => {
                           openModal('editTransaction', { transaction: { ...t, type: TransactionType.INCOME, isRefundFor: t.id }, onLaunchRefundPicker: () => {} });
                        }} />, modalRoot);
                    case 'trustBin':
                        return ReactDOM.createPortal(<TrustBinModal onClose={closeActiveModal} trustBinItems={trustBin} onRestore={handleRestoreFromTrustBin} onPermanentDelete={handlePermanentDeleteFromTrustBin} />, modalRoot);
                    case 'editAccount':
                         return ReactDOM.createPortal(<EditAccountModal account={modalProps.account} onClose={closeActiveModal} onSave={(acc) => setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a))} />, modalRoot);
                    case 'editTrip':
                        return ReactDOM.createPortal(<EditTripModal onClose={closeActiveModal} onSave={handleSaveTrip} onSaveContact={handleSaveContact} onOpenContactsManager={() => openModal('contacts')} {...modalProps} />, modalRoot);
                    case 'editContact':
                        return ReactDOM.createPortal(<EditContactModal onClose={closeActiveModal} onSave={handleSaveContact} {...modalProps} />, modalRoot);
                    case 'globalTripSummary':
                        return ReactDOM.createPortal(<GlobalTripSummaryModal trips={trips} allExpenses={tripExpenses} onClose={closeActiveModal} />, modalRoot);
                    case 'miniCalculator':
                        return ReactDOM.createPortal(<MiniCalculatorModal onClose={closeActiveModal} onResult={modalProps.onResult} />, modalRoot);
                    case 'notifications':
                        return ReactDOM.createPortal(<NotificationsModal onClose={closeActiveModal} notifications={[]} />, modalRoot); // Dummy data for now
                    case 'editGoal':
                        return ReactDOM.createPortal(<EditGoalModal onClose={closeActiveModal} onSave={handleSaveGoal} {...modalProps} />, modalRoot);
                    case 'manageTools':
                        return ReactDOM.createPortal(<ManageToolsModal onClose={closeActiveModal} />, modalRoot);
                    case 'financialHealth':
                        return ReactDOM.createPortal(<FinancialHealthModal onClose={closeActiveModal} appState={appState} onSaveProfile={setFinancialProfile} onSaveBudget={handleSaveBudget} onSendCommand={handleSendCommand} />, modalRoot);
                    case 'footerSettings':
                        return ReactDOM.createPortal(<FooterSettingsModal onClose={closeActiveModal} />, modalRoot);
                    default:
                        return null;
                }
            })()}
        </>
    );
}