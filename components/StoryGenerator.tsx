
import React, { useState, useCallback, useEffect, useMemo, useContext, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ProcessingStatus, Transaction, Account, Category, TransactionType, DateRange, CustomDateRange, Budget, Payee, RecurringTransaction, ActiveModal, SpamWarning, Sender, Goal, FeedbackItem, InvestmentHolding, AccountType, AppState, Contact, ContactGroup, Settings, ActiveScreen, UnlockedAchievement, FinanceTrackerProps, ModalState, Trip, TripExpense, TrustBinItem, TrustBinDeletionPeriodUnit, TripPayer, FinancialProfile, ItemType, Shop, ShopProduct, ShopSale, ShopSaleItem, ParsedTransactionData, UserStreak, Challenge, ChallengeType, ShopEmployee, ShopShift, Refund, Settlement, ShoppingList } from '../types';
import { parseTransactionText, parseNaturalLanguageQuery, parseAICommand, runFinancialScenario } from '../services/geminiService';
import useLocalStorage from '../hooks/useLocalStorage';
import FinanceDisplay from './StoryDisplay';
import EditTransactionModal from './EditTransactionModal';
import TransferModal from './TransferModal';
import ReportsScreen from './ReportsScreen';
import BudgetsScreen from './BudgetsModal';
import MoreScreen from './More';
import { SettingsContext, AppDataContext } from '../contexts/SettingsContext';
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
import InvestmentsScreen from './InvestmentsScreen';
import CalculatorScreen from './CalculatorScreen';
import AchievementsScreen from './AchievementsScreen';
import AchievementToast from './AchievementToast';
import { ALL_ACHIEVEMENTS, checkAchievements } from '../utils/achievements';
import DashboardSettingsModal from './DashboardSettingsModal';
import NotificationSettingsModal from './NotificationSettingsModal';
import { requestNotificationPermission, checkAndSendNotifications } from '../utils/notifications';
import TripManagementScreen from './TripManagementScreen';
import TripDetailsScreen from './TripDetailsScreen';
import RefundsScreen from './RefundsScreen';
import AddTripExpenseModal from './AddTripExpenseModal';
import RefundModal from './RefundModal';
import TrustBinModal from './TrustBinModal';
import EditAccountModal from './EditAccountModal';
import DataHubScreen from './DataHubScreen';
import ConfirmationDialog from './ConfirmationDialog';
import MiniCalculatorModal from './MiniCalculatorModal';
import EditTripModal from './EditTripModal';
import EditContactModal from './EditContactModal';
import EditContactGroupModal from './EditContactGroupModal';
import GlobalTripSummaryModal from './GlobalTripSummaryModal';
import NotificationsModal from './NotificationsModal';
import EditGoalModal from './EditGoalModal';
import ManageToolsModal from './ManageToolsModal';
import AddTransactionModal from './AddTransactionModal';
import FinancialHealthModal from './FinancialHealthModal';
import { ShopScreen } from './ShopScreen';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ChallengesScreen from './ChallengesScreen';
import LearnScreen from './LearnScreen';
import AccountsManagerModal from './AccountsManagerModal';
import GlobalSearchModal from './GlobalSearchModal';
import CalendarScreen from './CalendarScreen';
import UndoToast from './UndoToast';
import { DEFAULT_CATEGORIES } from '../utils/categories';
import EditRecurringModal from './EditRecurringModal';
import BuyInvestmentModal from './BuyInvestmentModal';
import AIHubModal from './AIHubModal';
import ShareGuideModal from './ShareGuideModal';
import IntegrationsModal from './IntegrationsModal';
import { ShoppingListScreen } from './ShoppingListScreen';
import ManualScreen from './ManualScreen';
import FooterCustomizationModal from './FooterCustomizationModal';
import EditShopModal from './EditShopModal';
import SubscriptionsScreen from './SubscriptionsScreen';
import GlossaryScreen from './GlossaryScreen';
import EditGlossaryEntryModal from './EditGlossaryEntryModal';
import ScheduledPaymentsScreen from './ScheduledPaymentsScreen';


const modalRoot = document.getElementById('modal-root')!;

const MainContentMemoized: React.FC<FinanceTrackerProps> = ({ 
  activeScreen, setActiveScreen, modalStack, setModalStack, isOnline, mainContentRef, initialText, onSelectionChange, onNavigate, isLoading, onSharedTextConsumed, onGoalComplete, appState
}) => {
  const { settings, setSettings, categories, setCategories, payees, setPayees, senders, setSenders, contactGroups, setContactGroups, contacts, setContacts, financialProfile, setFinancialProfile } = useContext(SettingsContext);
  const dataContext = useContext(AppDataContext);

  if (!dataContext) {
    throw new Error("MainContent must be used within an AppDataProvider");
  }

  const {
    transactions, setTransactions, accounts, setAccounts, budgets, setBudgets, recurringTransactions, setRecurringTransactions,
    goals, setGoals, investmentHoldings, setInvestmentHoldings, trips, setTrips, tripExpenses, setTripExpenses,
    trustBin, setTrustBin, shops, setShops, shopProducts, setShopProducts, shopSales, setShopSales,
    shopEmployees, setShopEmployees, shopShifts, setShopShifts, unlockedAchievements, setUnlockedAchievements,
    streaks, challenges, setChallenges, refunds, setRefunds, 
    settlements,
    shoppingLists,
    glossaryEntries, setGlossaryEntries,
    findOrCreateCategory, updateStreak, checkAndCompleteChallenge, deleteItem,
    selectedAccountIds, setSelectedAccountIds, accountToEdit, setAccountToEdit, onAddAccount, onEditAccount, onDeleteAccount,
    handleRecordSettlement
  } = dataContext;
  
  const [text, setText] = useState<string>('');
  const [feedbackQueue, setFeedbackQueue] = useLocalStorage<FeedbackItem[]>('finance-tracker-feedback-queue', []);
  const isInitialLoad = useRef(true);
  
  const [toastQueue, setToastQueue] = useState<string[]>([]);
  const [tripDetailsId, setTripDetailsId] = useState<string | null>(null);


  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [error, setError] = useState<string>('');
  const [spamWarning, setSpamWarning] = useState<SpamWarning | null>(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [undoAction, setUndoAction] = useState<{ message: string; onUndo: () => void } | null>(null);
  const [resetConfirmation, setResetConfirmation] = useState<boolean>(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange>('all');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ start: null, end: null });

  const activeModal = modalStack[modalStack.length - 1] || null;
  const closeActiveModal = () => setModalStack(prev => prev.slice(0, -1));
  const openModal = useCallback((name: ActiveModal, props?: Record<string, any>) => setModalStack(prev => [...prev, { name, props }]), [setModalStack]);
  const formatCurrency = useCurrencyFormatter();
  
  useEffect(() => {
      if (accountToEdit) {
          openModal('editAccount', { account: accountToEdit });
          setAccountToEdit(null); // Reset after opening
      }
  }, [accountToEdit, openModal, setAccountToEdit]);

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
    'finance-tracker-streaks', 'finance-tracker-challenges', 'finance-tracker-refunds',
    'finance-tracker-shopping-lists', 'finance-tracker-settlements',
    'finance-tracker-glossary'
  ];

  const handleResetApp = () => {
    allLocalStorageKeys.forEach(key => window.localStorage.removeItem(key));
    window.location.reload();
  }

  const confirmResetApp = () => {
    setResetConfirmation(true);
  }

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
    if (isInitialLoad.current && accounts.length > 0 && selectedAccountIds.length === 1 && selectedAccountIds[0] === 'all') {
        // Migrate legacy 'all' selection to a full list of account IDs
        setSelectedAccountIds(accounts.map(a => a.id));
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

  const handleAccountTransfer = (fromAccountId: string, toAccountId: string, fromAmount: number, toAmount: number, notes?: string) => {
    const fromAccount = accounts.find(a => a.id === fromAccountId);
    const toAccount = accounts.find(a => a.id === toAccountId);
    if (!fromAccount || !toAccount) { setError("Invalid accounts for transfer."); return; }
    const transferId = self.crypto.randomUUID();
    let expenseTransferCategory = findOrCreateCategory('Transfers', TransactionType.EXPENSE);
    let incomeTransferCategory = findOrCreateCategory('Transfers', TransactionType.INCOME);
    const now = new Date().toISOString();
    const expenseTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: fromAccountId, description: `Transfer to ${toAccount.name}`, amount: fromAmount, type: TransactionType.EXPENSE, categoryId: expenseTransferCategory, date: now, notes, transferId };
    const incomeTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: toAccountId, description: `Transfer from ${fromAccount.name}`, amount: toAmount, type: TransactionType.INCOME, categoryId: incomeTransferCategory, date: now, notes, transferId };
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
  
  const handleSaveCategory = (categoryData: Omit<Category, 'id'>, id?: string) => {
    if (id) {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, ...categoryData, id } : c));
    } else {
        setCategories(prev => [...prev, { ...categoryData, id: self.crypto.randomUUID() }]);
    }
    closeActiveModal();
  };
  
  const handleSaveGoal = (goal: Omit<Goal, 'id' | 'currentAmount'>, id?: string) => {
    if (id) {
      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...goal } : g));
    } else {
      setGoals(prev => [...prev, { ...goal, id: self.crypto.randomUUID(), currentAmount: 0 }]);
    }
    closeActiveModal();
  };

  const handleContributeToGoal = useCallback((goalId: string, amount: number, accountId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const wasCompleted = goal.currentAmount >= goal.targetAmount;
    
    const goalCategoryId = findOrCreateCategory('Goal Contributions', TransactionType.EXPENSE);
    const contributionTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: accountId, description: `Contribution to "${goal.name}"`, amount: amount, type: TransactionType.EXPENSE, categoryId: goalCategoryId, date: new Date().toISOString() };
    setTransactions(prev => [contributionTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    setGoals(prev => {
        const updatedGoals = prev.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g);
        
        const updatedGoal = updatedGoals.find(g => g.id === goalId);
        if (updatedGoal) {
            const isNowCompleted = updatedGoal.currentAmount >= updatedGoal.targetAmount;
            if (!wasCompleted && isNowCompleted) {
                onGoalComplete();
            }
        }
        
        return updatedGoals;
    });

    checkAndCompleteChallenge('review_goals');
  }, [goals, findOrCreateCategory, setTransactions, setGoals, checkAndCompleteChallenge, onGoalComplete]);

  const handleSettleDebt = (transactionId: string, splitDetailId: string, settlementAccountId: string, amount: number) => {
    const originalTransaction = transactions.find(t => t.id === transactionId);
    const splitDetail = originalTransaction?.splitDetails?.find(s => s.id === splitDetailId);
    if (!originalTransaction || !splitDetail) return;
    const repaymentCategoryId = findOrCreateCategory('Debt Repayment', TransactionType.INCOME);
    const incomeTransaction: Transaction = { id: self.crypto.randomUUID(), accountId: settlementAccountId, description: `Repayment from ${splitDetail.personName} for "${originalTransaction.description}"`, amount: amount, type: TransactionType.INCOME, categoryId: repaymentCategoryId!, date: new Date().toISOString() };
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
    closeActiveModal();
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
    closeActiveModal();
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
      handleItemDeletion(expenseId, 'tripExpense', tripExpenses.find(t => t.id === expenseId)?.description || 'trip expense');
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
      closeActiveModal();
      return savedContact;
  }, [setContacts, closeActiveModal])
  
  const handleSaveContactGroup = (groupData: Omit<ContactGroup, 'id'>, id?: string) => {
      if (id) {
          setContactGroups(prev => prev.map(g => g.id === id ? { ...g, ...groupData, id } : g));
      } else {
          setContactGroups(prev => [...prev, { ...groupData, id: self.crypto.randomUUID() }]);
      }
      closeActiveModal();
  };

  const handleItemDeletion = (itemId: string, itemType: ItemType, name: string) => {
    deleteItem(itemId, itemType);
    setUndoAction({
        message: `${name} moved to Trust Bin.`,
        onUndo: () => {
          const lastDeleted = trustBin[trustBin.length - 1];
          if (lastDeleted && lastDeleted.item.id === itemId) {
             handleRestoreFromTrustBin([lastDeleted.id]);
          }
        }
    });
  };
  
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
    if (restoredItemsByType.tripExpense) setTripExpenses((prev: TripExpense[]) => [...prev, ...restoredItemsByType.tripExpense!]);
    if (restoredItemsByType.shop) setShops(prev => [...prev, ...restoredItemsByType.shop!]);
    if (restoredItemsByType.shopProduct) setShopProducts(prev => [...prev, ...restoredItemsByType.shopProduct!]);
    if (restoredItemsByType.shopEmployee) setShopEmployees(prev => [...prev, ...restoredItemsByType.shopEmployee!]);
    if (restoredItemsByType.shopShift) setShopShifts((prev: ShopShift[]) => [...prev, ...restoredItemsByType.shopShift!]);
    if (restoredItemsByType.settlement) dataContext.setSettlements(prev => [...(prev || []), ...restoredItemsByType.settlement!]);
    if (restoredItemsByType.shoppingList) dataContext.setShoppingLists(prev => [...(prev || []), ...restoredItemsByType.shoppingList!]);
    if (restoredItemsByType.glossaryEntry) dataContext.setGlossaryEntries(prev => [...(prev || []), ...restoredItemsByType.glossaryEntry!]);
    
    setTrustBin(prev => prev.filter(item => !itemIds.includes(item.id)));
  };

  const handlePermanentDeleteFromTrustBin = (itemIds: string[]) => {
    setTrustBin(prev => prev.filter(item => !itemIds.includes(item.id)));
  }

  // Shop Handlers
  const handleSaveShop = (shopData: Omit<Shop, 'id'>, id?: string) => {
    if (id) setShops(prev => prev.map(s => s.id === id ? { ...s, ...shopData } : s));
    else setShops(prev => [...prev, { ...shopData, id: self.crypto.randomUUID() }]);
    closeActiveModal();
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
    const shop = shops.find(s => s.id === shopId);
    const accountForSale = accounts.find(a => a.currency === shop?.currency);

    const incomeTx: Transaction = {
        id: self.crypto.randomUUID(),
        accountId: accountForSale?.id || accounts[0]?.id,
        description: `Sale at ${shop?.name || 'Shop'}`,
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


  const handleSendCommand = async (command: string, file?: {name: string, type: string, data: string}): Promise<string> => {
      try {
          if (accounts.length === 0 && command.toLowerCase().includes('add')) {
              return "I can't add a transaction because you haven't created any accounts yet. Please create an account first.";
          }

          const geminiFile = file ? { mimeType: file.type, data: file.data } : undefined;
          const parsed = await parseAICommand(command, categories, accounts, geminiFile);
          
          if (parsed.action === 'clarify' || parsed.itemType === 'clarification_needed') {
              return parsed.name || "I need more information. Could you please clarify?";
          }
          
          if (parsed.action === 'general_query' && parsed.itemType === 'file_content') {
              return parsed.name || "I have processed the file but couldn't extract a specific answer. You can ask me more questions about it.";
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
                  onAddAccount(parsed.name, AccountType.DEPOSITORY, settings.currency, undefined, parsed.amount);
                  return `Done. I've created the "${parsed.name}" account for you.`;
              }

              case 'delete-transaction': // Assuming `name` is description and `targetName` is also description for transactions
              case 'delete-expense':
              case 'delete-income': {
                  const targetName = parsed.targetName || parsed.name;
                  if (!targetName) return "Which transaction should I delete?";
                  const txToDelete = transactions.find(t => t.description.toLowerCase().includes(targetName.toLowerCase()));
                  if (!txToDelete) return `I couldn't find a transaction matching "${targetName}".`;
                  handleItemDeletion(txToDelete.id, 'transaction', txToDelete.description);
                  return `OK. I've deleted "${txToDelete.description}". You can undo this for a few seconds.`;
              }
              
              default:
                  return "I'm sorry, I can't perform that action yet.";
          }
      } catch (err) {
          return err instanceof Error ? err.message : "I had trouble understanding that command.";
      }
  };
  
  const handleSaveRefund = (refundData: Omit<Refund, 'id' | 'isClaimed' | 'claimedDate'>, id?: string) => {
    if (id) {
      setRefunds(prev => (prev || []).map(r => r.id === id ? { ...r, ...refundData } : r));
    } else {
      const newRefund: Refund = {
          ...refundData,
          id: self.crypto.randomUUID(),
          isClaimed: false,
      };
      setRefunds(prev => [...(prev || []), newRefund]);
    }
    closeActiveModal();
  };

  const handleClaimRefund = (refundId: string) => {
      const refund = refunds.find(r => r.id === refundId);
      if(!refund) return;

      const refundCategory = findOrCreateCategory('Refunds & Rebates', TransactionType.INCOME);
      const incomeTx: Transaction = {
          id: self.crypto.randomUUID(),
          accountId: refund.accountId,
          description: `Claimed: ${refund.description}`,
          amount: refund.amount,
          type: TransactionType.INCOME,
          categoryId: refundCategory,
          date: new Date().toISOString(),
          notes: `Original refund issued on ${new Date(refund.date).toLocaleDateString()}`
      };
      setTransactions(prev => [incomeTx, ...prev]);
      setRefunds(prev => prev.map(r => r.id === refundId ? { ...r, isClaimed: true, claimedDate: new Date().toISOString() } : r));
  };
  
   const handleEditRecurring = (recurringTransaction: RecurringTransaction) => {
    openModal('editRecurring', { recurringTransaction });
  };


  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (selectedAccountIds.length > 0 && !selectedAccountIds.includes('all')) {
      result = result.filter(t => selectedAccountIds.includes(t.accountId));
    }
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(t => t.description.toLowerCase().includes(lowerQuery));
    }
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        result = result.filter(t => new Date(t.date).toDateString() === now.toDateString());
        break;
      case 'week':
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        result = result.filter(t => new Date(t.date) >= startOfWeek);
        break;
      case 'month':
        result = result.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear());
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
            const start = customDateRange.start;
            start.setHours(0,0,0,0);
            const end = customDateRange.end;
            end.setHours(23,59,59,999);
            result = result.filter(t => new Date(t.date) >= start && new Date(t.date) <= end);
        }
        break;
    }
    return result.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedAccountIds, searchQuery, dateFilter, customDateRange]);
  
  const handleSearchNavigation = (screen: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>) => {
    closeActiveModal(); // Must close search modal first
    setTimeout(() => { // Use timeout to ensure smooth transition
        if (screen === 'tripDetails' && modalProps?.tripId) {
            setTripDetailsId(modalProps.tripId);
            setActiveScreen('tripDetails');
        } else if (screen === 'shoppingLists' && modalProps?.shoppingListId) {
            // Placeholder for future navigation to a specific list
            setActiveScreen('shoppingLists');
        } else {
            // Fallback for other navigation types from search
            if (screen) setActiveScreen(screen);
            if (modal) openModal(modal, modalProps);
        }
    }, 150);
  };

  const handleCreateExpenseFromShoppingList = (list: ShoppingList) => {
    const totalAmount = list.items.reduce((sum, item) => sum + item.rate, 0);
    const itemizedNotes = list.items.map(item => `${item.isPurchased ? '[x]' : '[ ]'} ${item.name} (${item.quantity}) - (${formatCurrency(item.rate)})`).join('\n');
    
    const itemizedItemsForSplit = list.items.map(item => ({
        description: `${item.name} (${item.quantity})`,
        amount: String(item.rate),
    }));

    openModal('editTransaction', {
      initialData: {
        description: list.title,
        amount: totalAmount,
        type: TransactionType.EXPENSE,
        notes: itemizedNotes,
        itemizedItems: itemizedItemsForSplit,
      }
    });
  };

  const CurrentScreen = () => {
    switch(activeScreen) {
      case 'dashboard': return <FinanceDisplay
          status={status}
          transactions={filteredTransactions}
          allTransactions={transactions}
          accounts={accounts}
          categories={categories}
          budgets={budgets}
          recurringTransactions={recurringTransactions}
          goals={goals}
          investmentHoldings={investmentHoldings}
          onPayRecurring={handlePayRecurring}
          error={error}
          onEdit={(transaction) => openModal('editTransaction', { transaction })}
          onDelete={(id) => handleItemDeletion(id, 'transaction', transactions.find(t => t.id === id)?.description || 'transaction')}
          onSettleDebt={handleSettleDebt}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          onNaturalLanguageSearch={handleNaturalLanguageSearch}
          dateFilter={dateFilter} setDateFilter={setDateFilter}
          customDateRange={customDateRange}
          setCustomDateRange={setCustomDateRange}
          isBalanceVisible={isBalanceVisible} setIsBalanceVisible={setIsBalanceVisible}
          dashboardWidgets={settings.dashboardWidgets}
          mainContentRef={mainContentRef}
          financialProfile={financialProfile}
          onOpenFinancialHealth={() => openModal('financialHealth')}
          selectedAccountIds={selectedAccountIds}
          onAccountChange={setSelectedAccountIds}
          onAddAccount={onAddAccount}
          onEditAccount={onEditAccount}
          onDeleteAccount={(id) => handleItemDeletion(id, 'account', accounts.find(a => a.id === id)?.name || 'account')}
          baseCurrency={settings.currency}
          isLoading={isLoading}
          onAddTransaction={() => openModal('addTransaction', { initialTab: 'auto' })}
          appState={appState}
        />;
      case 'reports': return <ReportsScreen transactions={transactions} categories={categories} accounts={accounts} selectedAccountIds={selectedAccountIds} baseCurrency={settings.currency}/>;
      case 'budgets': return <BudgetsScreen categories={categories} transactions={transactions} budgets={budgets} onSaveBudget={handleSaveBudget} onAddBudget={() => {}} />;
      case 'investments': return <InvestmentsScreen accounts={accounts} holdings={investmentHoldings} onBuy={() => openModal('buyInvestment')} onSell={handleSellInvestment} onUpdateValue={handleUpdateInvestmentValue} onRefresh={() => {}} />;
      case 'goals': return <GoalsScreen goals={goals} onSaveGoal={handleSaveGoal} accounts={accounts} onContribute={handleContributeToGoal} onDelete={(id) => handleItemDeletion(id, 'goal', goals.find(g => g.id === id)?.name || 'goal')} onEditGoal={(goal) => openModal('editGoal', { goal })} onGoalComplete={onGoalComplete} />;
      case 'scheduled': return <ScheduledPaymentsScreen recurringTransactions={recurringTransactions} categories={categories} accounts={accounts} onAdd={() => openModal('editRecurring')} onEdit={handleEditRecurring} onDelete={(id) => handleItemDeletion(id, 'recurringTransaction', recurringTransactions.find(rt => rt.id === id)?.description || 'payment')} />;
      case 'calculator': return <CalculatorScreen appState={appState} />;
      case 'achievements': return <AchievementsScreen unlockedAchievements={unlockedAchievements} />;
      case 'tripManagement': return <TripManagementScreen trips={trips} tripExpenses={tripExpenses} onTripSelect={(id) => { setTripDetailsId(id); setActiveScreen('tripDetails'); }} onAddTrip={() => openModal('editTrip')} onEditTrip={(trip) => openModal('editTrip', { trip })} onDeleteTrip={(id) => handleItemDeletion(id, 'trip', trips.find(t=>t.id===id)?.name || 'trip')} onShowSummary={() => openModal('globalTripSummary')} />;
      case 'tripDetails':
        const selectedTrip = trips.find(t => t.id === tripDetailsId);
        if (selectedTrip) return <TripDetailsScreen trip={selectedTrip} expenses={tripExpenses.filter(e => e.tripId === tripDetailsId)} categories={categories} onAddExpense={() => openModal('addTripExpense', { trip: selectedTrip })} onEditExpense={(expense) => openModal('addTripExpense', { trip: selectedTrip, expenseToEdit: expense })} onDeleteExpense={handleDeleteTripExpense} onBack={() => { setTripDetailsId(null); setActiveScreen('tripManagement'); }} />;
        return null;
      case 'refunds': return <RefundsScreen refunds={refunds} contacts={contacts} onAddRefund={() => openModal('refund')} onEditRefund={(refund) => openModal('refund', { refund })} onClaimRefund={handleClaimRefund} onDeleteRefund={(id) => handleItemDeletion(id, 'refund', refunds.find(r=>r.id===id)?.description || 'refund')} />;
      case 'dataHub': return <DataHubScreen
          transactions={transactions} accounts={accounts} categories={categories} goals={goals} shops={shops} trips={trips} contacts={contacts}
          onAddTransaction={() => openModal('addTransaction')} onEditTransaction={(t) => openModal('editTransaction', { transaction: t })} onDeleteTransaction={(id) => handleItemDeletion(id, 'transaction', transactions.find(i=>i.id===id)?.description || 'item')}
          onAddAccount={() => openModal('editAccount')} onEditAccount={(a) => openModal('editAccount', { account: a })} onDeleteAccount={(id) => handleItemDeletion(id, 'account', accounts.find(i=>i.id===id)?.name || 'item')}
          onAddCategory={() => openModal('editCategory')} onEditCategory={(c) => openModal('editCategory', { category: c })} onDeleteCategory={(id) => handleItemDeletion(id, 'category', categories.find(c=>c.id===id)?.name || 'item')}
          onAddGoal={() => openModal('editGoal')} onEditGoal={(g) => openModal('editGoal', { goal: g })} onDeleteGoal={(id) => handleItemDeletion(id, 'goal', goals.find(i=>i.id===id)?.name || 'item')}
          onAddShop={() => openModal('editShop')} onEditShop={(s) => openModal('editShop', { shop: s })} onDeleteShop={(id) => handleItemDeletion(id, 'shop', shops.find(i=>i.id===id)?.name || 'item')}
          onAddTrip={() => openModal('editTrip')} onEditTrip={(t) => openModal('editTrip', { trip: t })} onDeleteTrip={(id) => handleItemDeletion(id, 'trip', trips.find(i=>i.id===id)?.name || 'item')}
          onAddContact={() => openModal('editContact')} onEditContact={(c) => openModal('editContact', { contact: c })} onDeleteContact={(id) => handleItemDeletion(id, 'contact', contacts.find(i=>i.id===id)?.name || 'item')}
      />;
      case 'shop': return <ShopScreen 
          shops={shops} products={shopProducts} sales={shopSales} employees={shopEmployees} shifts={shopShifts}
          onSaveShop={handleSaveShop} onDeleteShop={(id) => handleItemDeletion(id, 'shop', shops.find(s=>s.id===id)?.name || 'shop')}
          onSaveProduct={handleSaveProduct} onDeleteProduct={(id) => handleItemDeletion(id, 'shopProduct', shopProducts.find(p=>p.id===id)?.name || 'product')}
          onRecordSale={handleRecordSale} 
          onSaveEmployee={handleSaveEmployee} onDeleteEmployee={(id) => handleItemDeletion(id, 'shopEmployee', shopEmployees.find(e=>e.id===id)?.name || 'employee')}
          onSaveShift={handleSaveShift} onDeleteShift={(id) => handleItemDeletion(id, 'shopShift', shopShifts.find(s=>s.id===id)?.name || 'shift')}
      />;
      case 'challenges': return <ChallengesScreen appState={appState} setChallenges={setChallenges} />;
      case 'learn': return <LearnScreen onOpenChat={() => openModal('aiHub')} onOpenGlossary={() => setActiveScreen('glossary')} />;
      case 'calendar': return <CalendarScreen onNavigate={onNavigate} setActiveScreen={setActiveScreen} setTripDetailsId={setTripDetailsId} />;
      case 'shoppingLists': return <ShoppingListScreen onCreateExpense={handleCreateExpenseFromShoppingList} />;
      case 'manual': return <ManualScreen setActiveScreen={setActiveScreen} />;
      case 'subscriptions': return <SubscriptionsScreen />;
      case 'glossary': return <GlossaryScreen onAdd={() => openModal('editGlossaryEntry')} onEdit={(entry) => openModal('editGlossaryEntry', { entry })} />;
      case 'more': return <MoreScreen setActiveScreen={setActiveScreen} setActiveModal={openModal} onResetApp={confirmResetApp} />;
      default: return <div>Screen not found</div>;
    }
  }

  const ModalPortal = ({ children }: { children: React.ReactNode }) => ReactDOM.createPortal(children, modalRoot);

  return (
    <>
      <CurrentScreen />
      
      {undoAction && (
          <UndoToast 
            message={undoAction.message}
            onUndo={undoAction.onUndo}
            onDismiss={() => setUndoAction(null)}
          />
      )}
      
      <ConfirmationDialog 
        isOpen={resetConfirmation}
        title="Reset Application"
        message="Are you sure you want to delete ALL of your data? This action cannot be undone."
        onConfirm={handleResetApp}
        onCancel={() => setResetConfirmation(false)}
        confirmLabel="Delete All Data"
      />

      {toastQueue.map((achievementId, index) => {
        const achievement = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return null;
        return (
          <AchievementToast
            key={`${achievementId}-${index}`}
            achievement={achievement}
            onDismiss={() => setToastQueue(q => q.filter(id => id !== achievementId))}
          />
        )
      })}

      {activeModal && (
        <ModalPortal>
          {(() => {
            switch(activeModal.name) {
              case 'transfer': return <TransferModal onClose={closeActiveModal} accounts={accounts} onTransfer={handleAccountTransfer} />;
              case 'addTransaction': return <AddTransactionModal onCancel={closeActiveModal} onSaveAuto={handleAddTransaction} onSaveManual={handleSaveTransaction} isDisabled={selectedAccountIds.length === 0} initialText={initialText} onInitialTextConsumed={onSharedTextConsumed} {...activeModal.props} accounts={accounts} contacts={contacts} openModal={openModal} onOpenCalculator={handleOpenCalculator} selectedAccountId={selectedAccountIds.length === 1 ? selectedAccountIds[0] : undefined} />;
              case 'editTransaction': return <EditTransactionModal transaction={activeModal.props?.transaction} initialData={activeModal.props?.initialData} onSave={handleSaveTransaction} onCancel={closeActiveModal} accounts={accounts} contacts={contacts} openModal={openModal} onOpenCalculator={handleOpenCalculator} />;
              case 'appSettings': return <AppSettingsModal onClose={closeActiveModal} appState={appState} onRestore={(state) => { console.log("Restoring", state); }} />;
              case 'categories': return <CategoryManagerModal onClose={closeActiveModal} categories={categories} onAddTopLevelCategory={() => openModal('editCategory')} onAddSubcategory={(parent) => openModal('editCategory', { initialParentId: parent.id, initialType: parent.type })} onEditCategory={(category) => openModal('editCategory', { category })} onDeleteCategory={(id) => handleItemDeletion(id, 'category', categories.find(c=>c.id===id)?.name || 'category')} />;
              case 'editCategory': return <EditCategoryModal onCancel={closeActiveModal} onSave={handleSaveCategory} {...activeModal.props} categories={categories} />;
              case 'payees': return <PayeesModal onClose={closeActiveModal} payees={payees} setPayees={setPayees} categories={categories} onDelete={(id) => handleItemDeletion(id, 'payee', payees.find(p=>p.id===id)?.name || 'payee')} />;
              case 'importExport': return <ImportExportModal onClose={closeActiveModal} appState={appState} />;
              case 'senderManager': return <SenderManagerModal onClose={closeActiveModal} onDelete={(id) => handleItemDeletion(id, 'sender', senders.find(s=>s.id===id)?.name || 'sender')} />;
              case 'contacts': return <ContactsManagerModal onClose={closeActiveModal} onAddGroup={() => openModal('editContactGroup')} onEditGroup={(group) => openModal('editContactGroup', { group })} onDeleteGroup={(id) => handleItemDeletion(id, 'contactGroup', contactGroups.find(g=>g.id===id)?.name || 'group')} onAddContact={(group) => openModal('editContact', { initialGroupId: group.id })} onEditContact={(contact) => openModal('editContact', { contact })} onDeleteContact={(id) => handleItemDeletion(id, 'contact', contacts.find(c=>c.id===id)?.name || 'contact')} />;
              case 'feedback': return <FeedbackModal onClose={closeActiveModal} onSend={handleSendFeedback} isSending={isSendingFeedback} />;
              case 'dashboardSettings': return <DashboardSettingsModal onClose={closeActiveModal} />;
              case 'notificationSettings': return <NotificationSettingsModal onClose={closeActiveModal} budgets={budgets} categories={categories} />;
              case 'addTripExpense': return <AddTripExpenseModal trip={activeModal.props?.trip} expenseToEdit={activeModal.props?.expenseToEdit} onClose={closeActiveModal} onSave={items => handleAddTripExpense(activeModal.props?.trip.id, items)} onUpdate={(expense) => handleUpdateTripExpense(activeModal.props?.trip.id, expense)} categories={categories} onOpenCalculator={handleOpenCalculator} findOrCreateCategory={findOrCreateCategory} onSaveContact={handleSaveContact} />;
              case 'refund': return <RefundModal onClose={closeActiveModal} onSave={handleSaveRefund} {...activeModal.props} refunds={refunds} allTransactions={transactions} accounts={accounts} contacts={contacts} />;
              case 'trustBin': return <TrustBinModal onClose={closeActiveModal} trustBinItems={trustBin} onRestore={handleRestoreFromTrustBin} onPermanentDelete={handlePermanentDeleteFromTrustBin} />;
              case 'editAccount': return <EditAccountModal account={activeModal.props?.account} onClose={closeActiveModal} onSave={(account) => { onEditAccount(account); }} />;
              case 'miniCalculator': return <MiniCalculatorModal onClose={closeActiveModal} onResult={activeModal.props?.onResult} />;
              case 'editTrip': return <EditTripModal trip={activeModal.props?.trip} onClose={closeActiveModal} onSave={handleSaveTrip} onSaveContact={handleSaveContact} onOpenContactsManager={() => openModal('contacts')} />;
              case 'editContact': return <EditContactModal contact={activeModal.props?.contact} initialGroupId={activeModal.props?.initialGroupId} onClose={closeActiveModal} onSave={handleSaveContact} />;
              case 'editContactGroup': return <EditContactGroupModal group={activeModal.props?.group} onClose={closeActiveModal} onSave={handleSaveContactGroup} />;
              case 'globalTripSummary': return <GlobalTripSummaryModal allExpenses={tripExpenses} trips={trips} settlements={settlements} onClose={closeActiveModal} onSettle={handleRecordSettlement} />;
              case 'notifications': return <NotificationsModal onClose={closeActiveModal} notifications={[]} />;
              case 'editGoal': return <EditGoalModal goal={activeModal.props?.goal} onClose={closeActiveModal} onSave={handleSaveGoal} />;
              case 'manageTools': return <ManageToolsModal onClose={closeActiveModal} />;
              case 'financialHealth': return <FinancialHealthModal onClose={closeActiveModal} appState={appState} onSaveProfile={setFinancialProfile} onSaveBudget={handleSaveBudget} />;
              case 'accountsManager': return <AccountsManagerModal onClose={closeActiveModal} accounts={accounts} onAddAccount={onAddAccount} onEditAccount={onEditAccount} onDeleteAccount={(id) => handleItemDeletion(id, 'account', accounts.find(a=>a.id===id)?.name || 'account')} />;
              case 'globalSearch': return <GlobalSearchModal onClose={closeActiveModal} onNavigate={handleSearchNavigation} />;
              case 'editRecurring': return <EditRecurringModal recurringTransaction={activeModal.props?.recurringTransaction} onClose={closeActiveModal} onSave={handleSaveRecurring} categories={categories} accounts={accounts} />;
              case 'buyInvestment': return <BuyInvestmentModal onClose={closeActiveModal} accounts={accounts} onSave={handleBuyInvestment} />;
              case 'aiHub': return <AIHubModal onClose={closeActiveModal} onSendCommand={handleSendCommand} onNavigate={onNavigate} appState={appState} />;
              case 'shareGuide': return <ShareGuideModal onClose={closeActiveModal} />;
              case 'integrations': return <IntegrationsModal onClose={closeActiveModal} />;
              case 'footerCustomization': return <FooterCustomizationModal onClose={closeActiveModal} />;
              case 'editShop': return <EditShopModal shop={activeModal.props?.shop} onSave={handleSaveShop} onCancel={closeActiveModal} />;
              case 'editGlossaryEntry': return <EditGlossaryEntryModal entry={activeModal.props?.entry} onClose={closeActiveModal} onSave={(entry, id) => { if (id) { setGlossaryEntries(p => p.map(e => e.id === id ? { ...entry, id } : e)); } else { setGlossaryEntries(p => [...p, { ...entry, id: self.crypto.randomUUID() }]); } closeActiveModal(); }} />;
              default: return null;
            }
          })()}
        </ModalPortal>
      )}

      {spamWarning && <SpamWarningCard warning={spamWarning} onApprove={handleSpamApproval} onDiscard={() => setSpamWarning(null)} />}
    </>
  )
};

export const MainContent = React.memo(MainContentMemoized);
