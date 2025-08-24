import React, { useState, useCallback, useEffect, useMemo, useContext } from 'react';
import ReactDOM from 'react-dom';
import { ProcessingStatus, Transaction, Account, Category, TransactionType, DateRange, CustomDateRange, Budget, Payee, RecurringTransaction, ActiveModal, SpamWarning, Sender, Goal, FeedbackItem, InvestmentHolding, AccountType, AppState, Contact, ContactGroup, Settings, ActiveScreen, UnlockedAchievement, FinanceTrackerProps, ModalState, Trip, TripExpense, TrustBinItem, ConfirmationState, TrustBinDeletionPeriodUnit, TripPayer, AllDataScreenProps } from '../types';
import { parseTransactionText, getFinancialInsight, parseNaturalLanguageQuery } from '../services/geminiService';
import useLocalStorage from '../hooks/useLocalStorage';
import FinanceDisplay from './StoryDisplay';
import AccountSelector from './AccountSelector';
import EditTransactionModal from './EditTransactionModal';
import TransferModal from './TransferModal';
import ReportsScreen from './ReportsModal';
import BudgetsScreen from './BudgetsModal';
import SettingsScreen from './SettingsScreen';
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
import AllDataScreen from './AllDataScreen';
import ConfirmationDialog from './ConfirmationDialog';
import MiniCalculatorModal from './MiniCalculatorModal';
import EditTripModal from './EditTripModal';
import EditContactModal from './EditContactModal';
import GlobalTripSummaryModal from './GlobalTripSummaryModal';
import NotificationsModal from './NotificationsModal';
import EditGoalModal from './EditGoalModal';
import ManageToolsModal from './ManageToolsModal';
import AddTransactionModal from './AddTransactionModal';

const modalRoot = document.getElementById('modal-root')!;

const generateCategories = (): Category[] => {
    const categories: Category[] = [];
    const addCategory = (type: TransactionType, name: string, parentName: string | null, icon: string) => {
        const parent = parentName ? categories.find(c => c.name === parentName && c.type === type) : null;
        const parentId = parent ? parent.id : null;
        categories.push({ id: self.crypto.randomUUID(), name, type, parentId, icon });
    };

    // Income Categories
    addCategory(TransactionType.INCOME, 'Salary', null, '💼');
    addCategory(TransactionType.INCOME, 'Job', 'Salary', '👨‍💻');
    addCategory(TransactionType.INCOME, 'Part-time', 'Salary', '🕒');
    addCategory(TransactionType.INCOME, 'Freelance', 'Salary', '🧑‍🔧');

    addCategory(TransactionType.INCOME, 'Business', null, '🏢');
    addCategory(TransactionType.INCOME, 'Product Sales', 'Business', '📦');
    addCategory(TransactionType.INCOME, 'Service Income', 'Business', '🛠️');
    addCategory(TransactionType.INCOME, 'Royalties', 'Business', '🎧');

    addCategory(TransactionType.INCOME, 'Investments', null, '📈');
    addCategory(TransactionType.INCOME, 'Dividends', 'Investments', '💸');
    addCategory(TransactionType.INCOME, 'Interest', 'Investments', '🏦');
    addCategory(TransactionType.INCOME, 'Capital Gains', 'Investments', '📊');
    addCategory(TransactionType.INCOME, 'Sell', 'Investments', '💰');

    addCategory(TransactionType.INCOME, 'Rental Income', null, '🏠');
    addCategory(TransactionType.INCOME, 'Residential Rent', 'Rental Income', '🏡');
    addCategory(TransactionType.INCOME, 'Commercial Rent', 'Rental Income', '🏬');

    addCategory(TransactionType.INCOME, 'Gifts & Donations', null, '🎁');
    addCategory(TransactionType.INCOME, 'Cash Gifts', 'Gifts & Donations', '💰');
    addCategory(TransactionType.INCOME, 'Crowdfunding', 'Gifts & Donations', '🤝');
    addCategory(TransactionType.INCOME, 'Inheritance', 'Gifts & Donations', '🧾');

    addCategory(TransactionType.INCOME, 'Refunds & Rebates', null, '🔁');
    addCategory(TransactionType.INCOME, 'Tax Refund', 'Refunds & Rebates', '🧾');
    addCategory(TransactionType.INCOME, 'Purchase Rebate', 'Refunds & Rebates', '💳');
    addCategory(TransactionType.INCOME, 'Cashback', 'Refunds & Rebates', '💵');
    addCategory(TransactionType.INCOME, 'Refunds', 'Refunds & Rebates', '↩️');

    addCategory(TransactionType.INCOME, 'Other Income', null, '🎲');
    addCategory(TransactionType.INCOME, 'Lottery', 'Other Income', '🎟️');
    addCategory(TransactionType.INCOME, 'Prize Money', 'Other Income', '🏆');
    addCategory(TransactionType.INCOME, 'Miscellaneous', 'Other Income', '❓');

    // Expense Categories
    addCategory(TransactionType.EXPENSE, 'Housing', null, '🏠');
    addCategory(TransactionType.EXPENSE, 'Rent', 'Housing', '🏘️');
    addCategory(TransactionType.EXPENSE, 'Mortgage', 'Housing', '🏦');
    addCategory(TransactionType.EXPENSE, 'Property Tax', 'Housing', '🧾');
    addCategory(TransactionType.EXPENSE, 'Repairs', 'Housing', '🔧');

    addCategory(TransactionType.EXPENSE, 'Utilities', null, '🔌');
    addCategory(TransactionType.EXPENSE, 'Electricity', 'Utilities', '💡');
    addCategory(TransactionType.EXPENSE, 'Water', 'Utilities', '🚰');
    addCategory(TransactionType.EXPENSE, 'Gas', 'Utilities', '🔥');
    addCategory(TransactionType.EXPENSE, 'Internet', 'Utilities', '🌐');
    addCategory(TransactionType.EXPENSE, 'Phone', 'Utilities', '📞');

    addCategory(TransactionType.EXPENSE, 'Food & Groceries', null, '🍽️');
    addCategory(TransactionType.EXPENSE, 'Supermarket', 'Food & Groceries', '🛒');
    addCategory(TransactionType.EXPENSE, 'Dining Out', 'Food & Groceries', '🍴');
    addCategory(TransactionType.EXPENSE, 'Snacks', 'Food & Groceries', '🍫');

    addCategory(TransactionType.EXPENSE, 'Travel & Transport', null, '🚗');
    addCategory(TransactionType.EXPENSE, 'Fuel', 'Travel & Transport', '⛽');
    addCategory(TransactionType.EXPENSE, 'Public Transport', 'Travel & Transport', '🚌');
    addCategory(TransactionType.EXPENSE, 'Vehicle Maintenance', 'Travel & Transport', '🔧');

    addCategory(TransactionType.EXPENSE, 'Health & Insurance', null, '🩺');
    addCategory(TransactionType.EXPENSE, 'Medical Bills', 'Health & Insurance', '🧾');
    addCategory(TransactionType.EXPENSE, 'Health Insurance', 'Health & Insurance', '🛡️');
    addCategory(TransactionType.EXPENSE, 'Gym', 'Health & Insurance', '🏋️');

    addCategory(TransactionType.EXPENSE, 'Education', null, '📚');
    addCategory(TransactionType.EXPENSE, 'Tuition', 'Education', '🎓');
    addCategory(TransactionType.EXPENSE, 'Books', 'Education', '📖');
    addCategory(TransactionType.EXPENSE, 'Online Courses', 'Education', '💻');

    addCategory(TransactionType.EXPENSE, 'Entertainment', null, '🎉');
    addCategory(TransactionType.EXPENSE, 'Movies', 'Entertainment', '🎬');
    addCategory(TransactionType.EXPENSE, 'Subscriptions', 'Entertainment', '📺');
    addCategory(TransactionType.EXPENSE, 'Events', 'Entertainment', '🎟️');

    addCategory(TransactionType.EXPENSE, 'Shopping', null, '🛍️');
    addCategory(TransactionType.EXPENSE, 'Clothing', 'Shopping', '👕');
    addCategory(TransactionType.EXPENSE, 'Electronics', 'Shopping', '📱');
    addCategory(TransactionType.EXPENSE, 'Home Goods', 'Shopping', '🪑');

    addCategory(TransactionType.EXPENSE, 'Finance', null, '💳');
    addCategory(TransactionType.EXPENSE, 'Loan Payments', 'Finance', '🏦');
    addCategory(TransactionType.EXPENSE, 'Credit Card Bills', 'Finance', '💳');
    addCategory(TransactionType.EXPENSE, 'Bank Fees', 'Finance', '🧾');

    addCategory(TransactionType.EXPENSE, 'Savings & Investment', null, '💼');
    addCategory(TransactionType.EXPENSE, 'Emergency Fund', 'Savings & Investment', '🆘');
    addCategory(TransactionType.EXPENSE, 'SIPs', 'Savings & Investment', '📈');
    addCategory(TransactionType.EXPENSE, 'Stock Purchases', 'Savings & Investment', '📊');
    addCategory(TransactionType.EXPENSE, 'Buy', 'Savings & Investment', '💰');

    addCategory(TransactionType.EXPENSE, 'Personal Care', null, '🧖');
    addCategory(TransactionType.EXPENSE, 'Salon', 'Personal Care', '💇');
    addCategory(TransactionType.EXPENSE, 'Skincare', 'Personal Care', '🧴');
    addCategory(TransactionType.EXPENSE, 'Hygiene Products', 'Personal Care', '🧼');

    addCategory(TransactionType.EXPENSE, 'Family & Kids', null, '👨‍👩‍👧');
    addCategory(TransactionType.EXPENSE, 'School Fees', 'Family & Kids', '🏫');
    addCategory(TransactionType.EXPENSE, 'Toys', 'Family & Kids', '🧸');
    addCategory(TransactionType.EXPENSE, 'Childcare', 'Family & Kids', '🧑‍🍼');

    addCategory(TransactionType.EXPENSE, 'Donations', null, '🙏');
    addCategory(TransactionType.EXPENSE, 'Charity', 'Donations', '❤️');
    addCategory(TransactionType.EXPENSE, 'Religious Offerings', 'Donations', '🕉️');

    addCategory(TransactionType.EXPENSE, 'Miscellaneous', null, '🌀');
    addCategory(TransactionType.EXPENSE, 'Pet Care', 'Miscellaneous', '🐶');
    addCategory(TransactionType.EXPENSE, 'Gifts', 'Miscellaneous', '🎁');
    addCategory(TransactionType.EXPENSE, 'Unexpected Expenses', 'Miscellaneous', '⚠️');

    // System categories
    addCategory(TransactionType.INCOME, 'Opening Balance', null, '🏦');
    addCategory(TransactionType.INCOME, 'Transfers', null, '↔️');
    addCategory(TransactionType.INCOME, 'Debt Repayment', null, '🤝');
    
    addCategory(TransactionType.EXPENSE, 'Transfers', null, '↔️');
    addCategory(TransactionType.EXPENSE, 'Goal Contributions', null, '🎯');
    addCategory(TransactionType.EXPENSE, 'Money Lent', null, '💸');

    return categories;
};

const DEFAULT_CATEGORIES = generateCategories();
const DEFAULT_ACCOUNTS = (): Account[] => [];

const FinanceTracker: React.FC<FinanceTrackerProps & { initialText?: string | null }> = ({ 
  activeScreen, setActiveScreen, modalStack, setModalStack, isOnline, mainContentRef, initialText, onSelectionChange 
}) => {
  const [text, setText] = useState<string>('');
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('finance-tracker-transactions', []);
  const [accounts, setAccounts] = useLocalStorage<Account[]>('finance-tracker-accounts', DEFAULT_ACCOUNTS);
  const { settings, setSettings, categories, setCategories, payees, setPayees, senders, setSenders, contactGroups, setContactGroups, contacts, setContacts } = useContext(SettingsContext);
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
  const [toastQueue, setToastQueue] = useState<string[]>([]);
  const [tripDetailsId, setTripDetailsId] = useState<string | null>(null);

  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [error, setError] = useState<string>('');
  const [spamWarning, setSpamWarning] = useState<SpamWarning | null>(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [isInsightLoading, setIsInsightLoading] = useState(true);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);
  const [miniCalcState, setMiniCalcState] = useState<{ onResult: (result: number) => void } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange>('all');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ start: null, end: null });

  const activeModal = modalStack[modalStack.length - 1] || null;

  const appState: AppState = useMemo(() => ({
    transactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, payees, senders, contactGroups, contacts, settings, achievements: unlockedAchievements, trips, tripExpenses
  }), [transactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, payees, senders, contactGroups, contacts, settings, unlockedAchievements, trips, tripExpenses]);

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
        : itemOrId;

      if (!itemToPay) return;

      const newTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: itemToPay.accountId, description: itemToPay.description, amount: itemToPay.amount, type: itemToPay.type, categoryId: itemToPay.categoryId, date: new Date().toISOString(), notes: itemToPay.notes };
      setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      
      const nextDueDate = calculateNextDueDate(itemToPay.nextDueDate, itemToPay.frequency);
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
    setIsInsightLoading(true);
    getFinancialInsight(transactions.slice(0, 50)).then(setAiInsight).finally(() => setIsInsightLoading(false));
  }, [transactions]);
  
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

  const saveTransaction = useCallback((data: any, senderId?: string) => {
    let categoryId = '';
    let description = data.description;
    const matchingPayee = data.payeeIdentifier ? payees.find(p => p.identifier.toLowerCase() === data.payeeIdentifier?.toLowerCase()) : null;
    if(matchingPayee) {
        categoryId = matchingPayee.defaultCategoryId;
        description = matchingPayee.name;
    } else {
        categoryId = findOrCreateCategory(data.categoryName, data.type);
    }
    const newTransaction: Transaction = { id: data.id, accountId: selectedAccountIds[0], description: description, amount: data.amount, type: data.type, categoryId: categoryId, date: data.date, notes: data.notes, payeeIdentifier: data.payeeIdentifier, senderId: senderId, };
    setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setStatus(ProcessingStatus.SUCCESS);
    setText('');
    setSpamWarning(null);
    closeActiveModal();
  }, [selectedAccountIds, findOrCreateCategory, setTransactions, payees, setModalStack]);

  const handleAddTransaction = useCallback(async (transactionText: string) => {
    if (selectedAccountIds.length !== 1 || selectedAccountIds[0] === 'all') {
      setError('Please select a single account to add a transaction.');
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
          saveTransaction(parsed, existingSender.id);
          return;
        }
        if (parsed.isSpam && parsed.spamConfidence > 0.7) {
            setSpamWarning({ parsedData: parsed, rawText: transactionText });
            setStatus(ProcessingStatus.IDLE);
            setText('');
            return;
        }
        saveTransaction(parsed);
      } else {
        setError('This does not seem to be a valid financial transaction.');
        setStatus(ProcessingStatus.ERROR);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setStatus(ProcessingStatus.ERROR);
    }
  }, [selectedAccountIds, saveTransaction, senders]);
  
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
    saveTransaction(spamWarning.parsedData, senderId);
  };

  const handleAddAccount = (name: string, accountType: AccountType, creditLimit?: number, openingBalance?: number) => {
    const newAccount = { id: self.crypto.randomUUID(), name, accountType, creditLimit };
    setAccounts(prev => [...prev, newAccount]);
    if (openingBalance && openingBalance > 0) {
        const openingBalanceCategory = findOrCreateCategory('Opening Balance', TransactionType.INCOME);
        const openingTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: newAccount.id, description: 'Opening Balance', amount: openingBalance, type: TransactionType.INCOME, categoryId: openingBalanceCategory, date: new Date().toISOString() };
        setTransactions(prev => [openingTransaction, ...prev]);
    }
    if(accounts.length === 0) setSelectedAccountIds([newAccount.id]);
  };
  
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
    } else {
      const tx = updateData as Transaction;
      if (tx.id) { // UPDATE
        setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else { // CREATE
        const newTransaction = { ...tx, id: self.crypto.randomUUID() };
         if (!newTransaction.accountId && selectedAccountIds.length === 1 && selectedAccountIds[0] !== 'all') {
          newTransaction.accountId = selectedAccountIds[0];
        }
        setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    }
    closeActiveModal();
  };
  
  const handleSaveBudget = (categoryId: string, amount: number) => {
    const month = new Date().toISOString().slice(0, 7);
    setBudgets(prev => {
        const existing = prev.find(b => b.categoryId === categoryId && b.month === month);
        if (existing) return prev.map(b => b.categoryId === categoryId && b.month === month ? { ...b, amount } : b);
        return [...prev, { categoryId, amount, month }];
    });
  };
  
  const handleAddNewCategory = (category: Omit<Category, 'id'>) => setCategories(prev => [...prev, { ...category, id: self.crypto.randomUUID() }]);
  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };
  
  const handleSaveGoal = (goal: Omit<Goal, 'id' | 'currentAmount'>, id?: string) => {
    if (id) {
      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...goal } : g));
    } else {
      setGoals(prev => [...prev, { ...goal, id: self.crypto.randomUUID(), currentAmount: 0 }]);
    }
  };

  const handleContributeToGoal = (goalId: string, amount: number, accountId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const goalCategoryId = findOrCreateCategory('Goal Contributions', TransactionType.EXPENSE);
    const contributionTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: accountId, description: `Contribution to "${goal.name}"`, amount: amount, type: TransactionType.EXPENSE, categoryId: goalCategoryId, date: new Date().toISOString() };
    setTransactions(prev => [contributionTransaction, ...prev].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g ));
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
    const buyCategoryId = findOrCreateCategory('Investments/Buy', TransactionType.EXPENSE);
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
    const newQuantity = holding.quantity - quantity;
    if (newQuantity <= 0) {
      setInvestmentHoldings(prev => prev.filter(h => h.id !== holdingId));
    } else {
      const remainingValue = newQuantity * (holding.currentValue / holding.quantity);
      setInvestmentHoldings(prev => prev.map(h => h.id === holdingId ? { ...h, quantity: newQuantity, currentValue: remainingValue } : h));
    }
  };
  
  const handleUpdateHoldingValue = (holdingId: string, newCurrentValue: number) => setInvestmentHoldings(prev => prev.map(h => h.id === holdingId ? { ...h, currentValue: newCurrentValue } : h));
  const handleRefreshPortfolio = () => setInvestmentHoldings(prev => prev.map(h => ({ ...h, currentValue: h.currentValue * (1 + (Math.random() - 0.5) * 0.1) })));
  
  const handleRestoreBackup = (state: AppState) => {
      setTransactions(state.transactions); setAccounts(state.accounts); setCategories(state.categories); setBudgets(state.budgets); setRecurringTransactions(state.recurringTransactions); setGoals(state.goals); setInvestmentHoldings(state.investmentHoldings); setPayees(state.payees); setSenders(state.senders); setContactGroups(state.contactGroups); setContacts(state.contacts); setSettings(state.settings); setUnlockedAchievements(state.achievements || []); setTrips(state.trips || []); setTripExpenses(state.tripExpenses || []); 
      setSelectedAccountIds(state.accounts[0] ? [state.accounts[0].id] : ['all']);
      alert("Data restored successfully!");
  };

  const handleSaveTrip = (trip: Omit<Trip, 'id' | 'date'>, id?: string) => {
    if (id) {
      setTrips(prev => prev.map(t => t.id === id ? { ...t, ...trip } : t));
    } else {
      setTrips(prev => [...prev, { ...trip, id: self.crypto.randomUUID(), date: new Date().toISOString() }]);
    }
    closeActiveModal();
  };
  
  const handleSaveContact = (contact: Omit<Contact, 'id'>, id?: string) => {
    if (id) {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, ...contact } : c));
      return contacts.find(c => c.id === id);
    } else {
      const newContact = { ...contact, id: self.crypto.randomUUID() };
      setContacts(prev => [...prev, newContact]);
      return newContact;
    }
  }

  const handleSaveTripItems = (
    tripId: string,
    items: {
      description: string;
      amount: number;
      categoryId: string;
      payers: TripPayer[];
      splitDetails: any[]; // Using 'any' for SplitDetail because it's complex
    }[]
  ) => {
    const newExpenses: TripExpense[] = items.map(item => ({
      id: self.crypto.randomUUID(),
      tripId: tripId,
      date: new Date().toISOString(),
      amount: item.amount,
      description: item.description,
      categoryId: item.categoryId,
      payers: item.payers,
      splitDetails: item.splitDetails,
    }));

    setTripExpenses(prev => [...prev, ...newExpenses]);
    closeActiveModal();
  };

  // --- Trust Bin and Delete Handlers ---
  const createTrustBinItem = (item: any, itemType: TrustBinItem['itemType']): TrustBinItem => ({
    id: self.crypto.randomUUID(), item, itemType, deletedAt: new Date().toISOString()
  });

  const handleDeleteRequest = (title: string, message: string, onConfirm: () => void) => {
    setConfirmationState({ title, message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmationState) {
        confirmationState.onConfirm();
        setConfirmationState(null); // Close dialog after action
    }
  };
  
  const handleDeleteTransaction = (id: string) => handleDeleteRequest('Delete Transaction', 'Are you sure you want to delete this transaction? If it is part of a transfer, the linked transaction will also be deleted.', () => {
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) return;
    if (transactionToDelete.transferId) {
        const linkedTransactions = transactions.filter(t => t.transferId === transactionToDelete.transferId);
        const binItems: TrustBinItem[] = linkedTransactions.map(t => createTrustBinItem(t, 'transaction'));
        setTrustBin(prev => [...prev, ...binItems]);
        setTransactions(prev => prev.filter(t => t.transferId !== transactionToDelete.transferId));
    } else {
        setTrustBin(prev => [...prev, createTrustBinItem(transactionToDelete, 'transaction')]);
        setTransactions(prev => prev.filter(t => t.id !== id));
    }
  });

  const handleDeleteAccount = (accountId: string) => handleDeleteRequest('Delete Account', 'This will delete the account and all its associated transactions. This action cannot be undone.', () => {
    const accountToDelete = accounts.find(a => a.id === accountId);
    if (!accountToDelete) return;
    const transactionsToDelete = transactions.filter(t => t.accountId === accountId);
    const binItems: TrustBinItem[] = [ createTrustBinItem(accountToDelete, 'account'), ...transactionsToDelete.map(t => createTrustBinItem(t, 'transaction')) ];
    setTrustBin(prev => [...prev, ...binItems]);
    setAccounts(prev => prev.filter(a => a.id !== accountId));
    setTransactions(prev => prev.filter(t => t.accountId !== accountId));
    if (selectedAccountIds.includes(accountId)) {
        const newSelection = selectedAccountIds.filter(id => id !== accountId);
        setSelectedAccountIds(newSelection.length === 0 ? ['all'] : newSelection);
    }
  });

  const handleDeleteCategory = (categoryId: string) => handleDeleteRequest('Delete Category', 'This will delete the category and all its subcategories. Transactions under these categories will need to be re-categorized.', () => {
    const toDelete = new Set<string>();
    const queue = [categoryId];
    toDelete.add(categoryId);
    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = categories.filter(c => c.parentId === currentId);
        children.forEach(c => { toDelete.add(c.id); queue.push(c.id); });
    }
    const categoriesToDelete = categories.filter(c => toDelete.has(c.id));
    const binItems: TrustBinItem[] = categoriesToDelete.map(c => createTrustBinItem(c, 'category'));
    setTrustBin(prev => [...prev, ...binItems]);
    setCategories(prev => prev.filter(c => !toDelete.has(c.id)));
  });

  const handleDeletePayee = (id: string) => handleDeleteRequest('Delete Payee', 'Are you sure you want to delete this payee?', () => {
      const item = payees.find(p => p.id === id);
      if(item) { setTrustBin(prev => [...prev, createTrustBinItem(item, 'payee')]); setPayees(p => p.filter(i => i.id !== id)); }
  });
  const handleDeleteSender = (id: string) => handleDeleteRequest('Delete Sender', 'Are you sure you want to delete this sender?', () => {
      const item = senders.find(s => s.id === id);
      if(item) { setTrustBin(prev => [...prev, createTrustBinItem(item, 'sender')]); setSenders(s => s.filter(i => i.id !== id)); }
  });
  const handleDeleteContact = (id: string) => handleDeleteRequest('Delete Contact', 'Are you sure you want to delete this contact?', () => {
      const item = contacts.find(c => c.id === id);
      if(item) { setTrustBin(prev => [...prev, createTrustBinItem(item, 'contact')]); setContacts(c => c.filter(i => i.id !== id)); }
  });
  const handleDeleteContactGroup = (id: string) => handleDeleteRequest('Delete Contact Group', 'This will delete the group and all contacts within it.', () => {
      const group = contactGroups.find(g => g.id === id);
      if(group) {
          const contactsInGroup = contacts.filter(c => c.groupId === id);
          const binItems: TrustBinItem[] = [ createTrustBinItem(group, 'contactGroup'), ...contactsInGroup.map(c => createTrustBinItem(c, 'contact')) ];
          setTrustBin(prev => [...prev, ...binItems]);
          setContactGroups(g => g.filter(i => i.id !== id));
          setContacts(c => c.filter(i => i.groupId !== id));
      }
  });
  const handleDeleteGoal = (id: string) => handleDeleteRequest('Delete Goal', 'Are you sure you want to delete this goal?', () => {
      const item = goals.find(g => g.id === id);
      if(item) { setTrustBin(prev => [...prev, createTrustBinItem(item, 'goal')]); setGoals(g => g.filter(i => i.id !== id)); }
  });
  const handleDeleteRecurring = (id: string) => handleDeleteRequest('Delete Scheduled Payment', 'Are you sure you want to delete this recurring payment?', () => {
      const item = recurringTransactions.find(r => r.id === id);
      if(item) { setTrustBin(prev => [...prev, createTrustBinItem(item, 'recurringTransaction')]); setRecurringTransactions(r => r.filter(i => i.id !== id)); }
  });
    const handleDeleteTrip = (id: string) => handleDeleteRequest('Delete Trip', 'This will delete the trip and all its expenses. This action cannot be undone.', () => {
    const item = trips.find(t => t.id === id);
    if(item) {
      const expensesToDelete = tripExpenses.filter(e => e.tripId === id);
      const binItems: TrustBinItem[] = [ createTrustBinItem(item, 'trip'), ...expensesToDelete.map(e => createTrustBinItem(e, 'transaction')) ]; // treat trip expenses as transactions in bin
      setTrustBin(prev => [...prev, ...binItems]);
      setTrips(t => t.filter(i => i.id !== id));
      setTripExpenses(e => e.filter(i => i.tripId !== id));
    }
  });

  const handleRestoreFromBin = (itemIds: string[]) => {
    const itemsToRestore = trustBin.filter(i => itemIds.includes(i.id));
    if (!itemsToRestore.length) return;

    const restoredItemsByType: { [key in TrustBinItem['itemType']]?: any[] } = {};
    let idsToRemoveFromBin = new Set<string>(itemIds);

    itemsToRestore.forEach(itemToRestore => {
      if (!restoredItemsByType[itemToRestore.itemType]) restoredItemsByType[itemToRestore.itemType] = [];
      restoredItemsByType[itemToRestore.itemType]!.push(itemToRestore.item);

      if (itemToRestore.itemType === 'account') {
        const account = itemToRestore.item as Account;
        const relatedTransactions = trustBin.filter(i => i.itemType === 'transaction' && i.item.accountId === account.id);
        if (relatedTransactions.length > 0) {
          if (!restoredItemsByType.transaction) restoredItemsByType.transaction = [];
          relatedTransactions.forEach(txItem => { if (!idsToRemoveFromBin.has(txItem.id)) { restoredItemsByType.transaction!.push(txItem.item); idsToRemoveFromBin.add(txItem.id); } });
        }
      }
    });

    if (restoredItemsByType.transaction) setTransactions(prev => [...prev, ...restoredItemsByType.transaction!].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    if (restoredItemsByType.category) setCategories(prev => [...prev, ...restoredItemsByType.category!]);
    if (restoredItemsByType.payee) setPayees(prev => [...prev, ...restoredItemsByType.payee!]);
    if (restoredItemsByType.sender) setSenders(prev => [...prev, ...restoredItemsByType.sender!]);
    if (restoredItemsByType.contact) setContacts(prev => [...prev, ...restoredItemsByType.contact!]);
    if (restoredItemsByType.contactGroup) setContactGroups(prev => [...prev, ...restoredItemsByType.contactGroup!]);
    if (restoredItemsByType.goal) setGoals(prev => [...prev, ...restoredItemsByType.goal!]);
    if (restoredItemsByType.recurringTransaction) setRecurringTransactions(prev => [...prev, ...restoredItemsByType.recurringTransaction!]);
    if (restoredItemsByType.account) setAccounts(prev => [...prev, ...restoredItemsByType.account!]);
    if (restoredItemsByType.trip) setTrips(prev => [...prev, ...restoredItemsByType.trip!]);
    
    setTrustBin(prev => prev.filter(i => !idsToRemoveFromBin.has(i.id)));
  };
  const handlePermanentDeleteFromBin = (itemIds: string[]) => handleDeleteRequest('Permanently Delete', `Are you sure you want to permanently delete ${itemIds.length} item(s)? This action cannot be undone.`, () => {
      setTrustBin(prev => prev.filter(i => !itemIds.includes(i.id)));
  });

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => !t.isRefundFor);
    if (!selectedAccountIds.includes('all')) {
      result = result.filter(t => selectedAccountIds.includes(t.accountId));
    }
    if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        result = result.filter(t => t.description.toLowerCase().includes(lowerCaseQuery) || t.notes?.toLowerCase().includes(lowerCaseQuery) || categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(lowerCaseQuery));
    }
    const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate: Date | null = null; let endDate: Date | null = null;
    switch (dateFilter) {
        case 'today': startDate = today; endDate = new Date(today); endDate.setDate(endDate.getDate() + 1); break;
        case 'week': startDate = new Date(today); startDate.setDate(startDate.getDate() - now.getDay()); endDate = new Date(startDate); endDate.setDate(endDate.getDate() + 7); break;
        case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); break;
        case 'custom': startDate = customDateRange.start; endDate = customDateRange.end ? new Date(customDateRange.end.getTime() + 86400000) : null; break;
    }
    if (startDate) result = result.filter(t => new Date(t.date) >= startDate!);
    if (endDate) result = result.filter(t => new Date(t.date) < endDate!);
    return result;
  }, [transactions, selectedAccountIds, searchQuery, dateFilter, customDateRange, categories]);

  const dashboardData = useMemo(() => filteredTransactions.reduce((acc, t) => {
    if (t.type === 'income') acc.income += t.amount; else acc.expense += t.amount;
    return acc;
  }, { income: 0, expense: 0 }), [filteredTransactions]);
  
  const closeActiveModal = () => setModalStack(prev => prev.slice(0, -1));
  const openModal = (name: ActiveModal, props?: Record<string, any>) => setModalStack(prev => [...prev, { name, props }]);

  const currentToastAchievementId = toastQueue[0];
  const currentToastAchievement = currentToastAchievementId ? ALL_ACHIEVEMENTS.find(a => a.id === currentToastAchievementId) : null;

  const allDataScreenProps: AllDataScreenProps = {
    transactions, accounts, categories, goals,
    onEditTransaction: (t) => openModal('editTransaction', {transaction: t}),
    onDeleteTransaction: handleDeleteTransaction,
    onEditAccount: (a) => openModal('editAccount', {account: a}),
    onDeleteAccount: handleDeleteAccount,
    onEditCategory: (c) => openModal('editCategory', {category: c}),
    onDeleteCategory: handleDeleteCategory,
    onEditGoal: (g) => openModal('editGoal', {goal: g}),
    onDeleteGoal: handleDeleteGoal
  };

  const renderScreen = () => {
    const currentTrip = tripDetailsId ? trips.find(t => t.id === tripDetailsId) : null;
    switch (activeScreen) {
      case 'dashboard': return (
        <div>
          <div className="p-4">
            <AccountSelector 
              accounts={accounts} 
              selectedAccountIds={selectedAccountIds} 
              onAccountChange={setSelectedAccountIds} 
              onAddAccount={handleAddAccount} 
              onDeleteAccount={handleDeleteAccount}
              onEditAccount={(account) => openModal('editAccount', { account })}
            />
            {spamWarning && ( <SpamWarningCard warning={spamWarning} onApprove={handleSpamApproval} onDiscard={() => setSpamWarning(null)} /> )}
          </div>
          <FinanceDisplay
              mainContentRef={mainContentRef}
              status={status} transactions={filteredTransactions} allTransactions={transactions} accounts={accounts} categories={categories} budgets={budgets} recurringTransactions={recurringTransactions} onPayRecurring={handlePayRecurring} goals={goals} investmentHoldings={investmentHoldings} error={error} income={dashboardData.income} expense={dashboardData.expense} onEdit={(t) => openModal('editTransaction', { transaction: t })} onDelete={handleDeleteTransaction} onSettleDebt={handleSettleDebt} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onNaturalLanguageSearch={handleNaturalLanguageSearch} dateFilter={dateFilter} setDateFilter={setDateFilter} customDateRange={customDateRange} setCustomDateRange={setCustomDateRange} isBalanceVisible={isBalanceVisible} setIsBalanceVisible={setIsBalanceVisible} dashboardWidgets={settings.dashboardWidgets} aiInsight={aiInsight} isInsightLoading={isInsightLoading}
          />
        </div>);
      case 'reports': return <ReportsScreen transactions={transactions} categories={categories} accounts={accounts} selectedAccountIds={selectedAccountIds} />;
      case 'investments': return <InvestmentsScreen accounts={accounts} holdings={investmentHoldings} onBuy={handleBuyInvestment} onSell={handleSellInvestment} onUpdateValue={handleUpdateHoldingValue} onRefresh={handleRefreshPortfolio} />;
      case 'budgets': return <BudgetsScreen categories={categories.filter(c => c.type === TransactionType.EXPENSE)} transactions={transactions} budgets={budgets} onSaveBudget={handleSaveBudget} />;
      case 'goals': return <GoalsScreen goals={goals} onSaveGoal={handleSaveGoal} accounts={accounts} onContribute={handleContributeToGoal} onDelete={handleDeleteGoal} onEditGoal={(g) => openModal('editGoal', {goal: g})} />;
      case 'scheduled': return <ScheduledPaymentsScreen recurringTransactions={recurringTransactions} setRecurringTransactions={setRecurringTransactions} categories={categories} accounts={accounts} onDelete={handleDeleteRecurring} />;
      case 'calculator': return <CalculatorScreen />;
      case 'more': return <SettingsScreen setActiveScreen={setActiveScreen} setActiveModal={openModal} />;
      case 'achievements': return <AchievementsScreen unlockedAchievements={unlockedAchievements} />;
      case 'tripManagement': return <TripManagementScreen trips={trips} onTripSelect={(id) => { setTripDetailsId(id); setActiveScreen('tripDetails'); }} onAddTrip={() => openModal('editTrip')} onEditTrip={(trip) => openModal('editTrip', {trip})} onDeleteTrip={handleDeleteTrip} onShowSummary={() => openModal('globalTripSummary')} />;
      case 'tripDetails': return currentTrip ? <TripDetailsScreen trip={currentTrip} expenses={tripExpenses.filter(e => e.tripId === currentTrip.id)} onAddExpense={() => openModal('addTripExpense', { trip: currentTrip })} onBack={() => setActiveScreen('tripManagement')} /> : null;
      case 'refunds': return <RefundsScreen transactions={transactions} categories={categories} onEditTransaction={(t) => openModal('editTransaction', { transaction: t })} />;
      case 'allData': return <AllDataScreen {...allDataScreenProps} />;
      default: return null;
    }
  };

  const renderModal = (modal: ModalState) => {
    switch (modal.name) {
      case 'addTransaction': return <AddTransactionModal onCancel={closeActiveModal} onSaveAuto={handleAddTransaction} onSaveManual={handleSaveTransaction} isDisabled={selectedAccountIds.length !== 1 || selectedAccountIds[0] === 'all'} initialText={initialText} accounts={accounts} openModal={openModal} onOpenCalculator={(onResult) => setMiniCalcState({onResult})} selectedAccountId={selectedAccountIds.length === 1 ? selectedAccountIds[0] : undefined} />;
      case 'editTransaction': return <EditTransactionModal transaction={modal.props?.transaction} onSave={handleSaveTransaction} onCancel={closeActiveModal} accounts={accounts} openModal={openModal} selectedAccountId={selectedAccountIds.length === 1 ? selectedAccountIds[0] : undefined} onLaunchRefundPicker={() => { closeActiveModal(); openModal('selectRefund'); }} onOpenCalculator={(onResult) => setMiniCalcState({onResult})} />;
      case 'transfer': return <TransferModal onClose={closeActiveModal} accounts={accounts} onTransfer={handleAccountTransfer} />;
      case 'appSettings': return <AppSettingsModal onClose={closeActiveModal} appState={appState} onRestore={handleRestoreBackup} />;
      case 'categories': return <CategoryManagerModal onClose={closeActiveModal} categories={categories} onAddNewCategory={handleAddNewCategory} onEditCategory={(cat) => openModal('editCategory', {category: cat})} onDeleteCategory={handleDeleteCategory} />;
      case 'editCategory': return <EditCategoryModal category={modal.props?.category} categories={categories} onSave={(cat) => { handleUpdateCategory(cat); closeActiveModal(); }} onCancel={closeActiveModal} />;
      case 'payees': return <PayeesModal onClose={closeActiveModal} payees={payees} setPayees={setPayees} categories={categories} onDelete={handleDeletePayee} />;
      case 'contacts': return <ContactsManagerModal onClose={closeActiveModal} onDeleteGroup={handleDeleteContactGroup} onDeleteContact={handleDeleteContact} />;
      case 'senderManager': return <SenderManagerModal onClose={closeActiveModal} onDelete={handleDeleteSender}/>;
      case 'importExport': return <ImportExportModal onClose={closeActiveModal} transactions={transactions} accounts={accounts} categories={categories} senders={senders} />;
      case 'feedback': return <FeedbackModal onClose={closeActiveModal} onSend={handleSendFeedback} isSending={isSendingFeedback} />;
      case 'dashboardSettings': return <DashboardSettingsModal onClose={closeActiveModal} />;
      case 'notificationSettings': return <NotificationSettingsModal onClose={closeActiveModal} budgets={budgets} categories={categories} />;
      case 'addTripExpense': return <AddTripExpenseModal trip={modal.props?.trip} onClose={closeActiveModal} onSave={(items) => handleSaveTripItems(modal.props?.trip.id, items)} categories={categories} />;
      case 'refund': return <RefundModal originalTransaction={modal.props?.transaction} onClose={closeActiveModal} openModal={openModal} onSave={(refund) => setTransactions(prev => [refund, ...prev])} findOrCreateCategory={findOrCreateCategory}/>;
      case 'trustBin': return <TrustBinModal onClose={closeActiveModal} trustBinItems={trustBin} onRestore={handleRestoreFromBin} onPermanentDelete={handlePermanentDeleteFromBin} />;
      case 'editAccount': return <EditAccountModal account={modal.props?.account} onClose={closeActiveModal} onSave={(updatedAccount) => setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a))} />;
      case 'selectRefund': return <RefundTransactionSelector transactions={transactions} categories={categories} onCancel={closeActiveModal} onSelect={(transaction) => { closeActiveModal(); openModal('refund', { transaction }); }} />;
      case 'editTrip': return <EditTripModal trip={modal.props?.trip} onClose={closeActiveModal} onSave={handleSaveTrip} onSaveContact={handleSaveContact} onDeleteContact={handleDeleteContact} onOpenEditContact={(contact) => openModal('editContact', {contact})} />;
      case 'editContact': return <EditContactModal contact={modal.props?.contact} onSave={(contact, id) => {handleSaveContact(contact, id); closeActiveModal();}} onClose={closeActiveModal} />;
      case 'globalTripSummary': return <GlobalTripSummaryModal allExpenses={tripExpenses} onClose={closeActiveModal} />;
      case 'notifications': return <NotificationsModal onClose={closeActiveModal} notifications={[]} />;
      case 'editGoal': return <EditGoalModal goal={modal.props?.goal} onSave={(goal, id) => {handleSaveGoal(goal, id); closeActiveModal()}} onClose={closeActiveModal} />;
      case 'manageTools': return <ManageToolsModal onClose={closeActiveModal} />;
      default: return null;
    }
  };

  return ( <>
      {currentToastAchievement && ( <AchievementToast achievement={currentToastAchievement} onDismiss={() => setToastQueue(prev => prev.slice(1))} /> )}
      {renderScreen()}
      {confirmationState && <ConfirmationDialog isOpen={!!confirmationState} {...confirmationState} onConfirm={handleConfirm} onCancel={() => setConfirmationState(null)} />}
      {modalStack.map((modal, index) => (
          <React.Fragment key={`${modal.name}-${index}`}>
            {ReactDOM.createPortal(renderModal(modal), modalRoot)}
          </React.Fragment>
      ))}
       {miniCalcState && ReactDOM.createPortal(
            <MiniCalculatorModal 
                onClose={() => setMiniCalcState(null)} 
                onResult={(res) => { miniCalcState.onResult(res); setMiniCalcState(null); }} 
            />, 
            modalRoot
        )}
    </>
  );
};
export default FinanceTracker;