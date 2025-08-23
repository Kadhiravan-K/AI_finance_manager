import React, { useState, useCallback, useEffect, useMemo, useContext } from 'react';
import ReactDOM from 'react-dom';
import { ProcessingStatus, Transaction, Account, Category, TransactionType, DateRange, CustomDateRange, Budget, Payee, RecurringTransaction, ActiveModal, SpamWarning, Sender, Goal, FeedbackItem, InvestmentHolding, AccountType, AppState, Contact, ContactGroup, Settings, ActiveScreen, UnlockedAchievement, FinanceTrackerProps, ModalState, Trip, TripExpense } from '../types';
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
import ExportModal from './ExportModal';
import SenderManagerModal from './SenderManagerModal';
import SpamWarningCard from './SpamWarningCard';
import GoalsScreen from './GoalsModal';
import ContactsManagerModal from './ContactsManagerModal';
import FeedbackModal from './FeedbackModal';
import InvestmentsScreen from './InvestmentsModal';
import CalculatorScreen from './CalculatorModal';
import QuickAddModal from './QuickAddModal';
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

const modalRoot = document.getElementById('modal-root')!;

const generateCategories = (): Category[] => {
  const categories: Category[] = [];
  const add = (type: TransactionType, name: string, parentName: string | null = null, icon: string = '📁') => {
    const parent = parentName ? categories.find(c => c.name === parentName && c.type === type) : null;
    categories.push({ id: self.crypto.randomUUID(), name, type, parentId: parent ? parent.id : null, icon });
  };
  add(TransactionType.INCOME, 'Opening Balance', null, '🏦');
  add(TransactionType.INCOME, 'Personal Earnings', null, '💼');
  add(TransactionType.INCOME, 'Company Salary', 'Personal Earnings', '🏢');
  add(TransactionType.INCOME, 'Other Income', null, '💸');
  add(TransactionType.INCOME, 'Investments', null, '📈');
  add(TransactionType.INCOME, 'Debt Repayment', null, '🤝');
  add(TransactionType.INCOME, 'Transfers', null, '↔️');
  add(TransactionType.INCOME, 'Refunds', null, '↩️');
  add(TransactionType.EXPENSE, 'Food & Beverages', null, '🍽️');
  add(TransactionType.EXPENSE, 'Lunch', 'Food & Beverages', '🍛');
  add(TransactionType.EXPENSE, 'Groceries', 'Food & Beverages', '🛒');
  add(TransactionType.EXPENSE, 'Travel & Transport', null, '🚗');
  add(TransactionType.EXPENSE, 'Shopping', null, '🛍️');
  add(TransactionType.EXPENSE, 'Bills & Utilities', null, '🧾');
  add(TransactionType.EXPENSE, 'Rent', 'Bills & Utilities', '🏠');
  add(TransactionType.EXPENSE, 'Entertainment', null, '🎉');
  add(TransactionType.EXPENSE, 'Health & Wellness', null, '🏥');
  add(TransactionType.EXPENSE, 'Miscellaneous', null, '🧰');
  add(TransactionType.EXPENSE, 'Goal Contributions', null, '🎯');
  add(TransactionType.EXPENSE, 'Money Lent', null, '💸');
  add(TransactionType.EXPENSE, 'Investments', null, '📈');
  add(TransactionType.EXPENSE, 'Transfers', null, '↔️');
  return categories;
};

const DEFAULT_CATEGORIES = generateCategories();
const DEFAULT_ACCOUNTS = (): Account[] => [];

const FinanceTracker: React.FC<FinanceTrackerProps & { initialText?: string | null }> = ({ 
  activeScreen, setActiveScreen, modalStack, setModalStack, isOnline, mainContentRef, initialText 
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
  const [selectedAccountId, setSelectedAccountId] = useLocalStorage<string>('finance-tracker-selected-account-id', 'all');
  const [feedbackQueue, setFeedbackQueue] = useLocalStorage<FeedbackItem[]>('finance-tracker-feedback-queue', []);
  const [unlockedAchievements, setUnlockedAchievements] = useLocalStorage<UnlockedAchievement[]>('finance-tracker-achievements', []);
  const [toastQueue, setToastQueue] = useState<string[]>([]);
  const [tripDetailsId, setTripDetailsId] = useState<string | null>(null);

  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [error, setError] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [spamWarning, setSpamWarning] = useState<SpamWarning | null>(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [isInsightLoading, setIsInsightLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange>('all');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ start: null, end: null });

  const activeModal = modalStack[modalStack.length - 1] || null;

  const appState: AppState = useMemo(() => ({
    transactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, payees, senders, contactGroups, contacts, settings, achievements: unlockedAchievements, trips, tripExpenses
  }), [transactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, payees, senders, contactGroups, contacts, settings, unlockedAchievements, trips, tripExpenses]);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (categories.length === 0) setCategories(DEFAULT_CATEGORIES);
  }, [categories, setCategories]);
  
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
    const newTransaction: Transaction = { id: data.id, accountId: selectedAccountId, description: description, amount: data.amount, type: data.type, categoryId: categoryId, date: data.date, notes: data.notes, payeeIdentifier: data.payeeIdentifier, senderId: senderId, };
    setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setStatus(ProcessingStatus.SUCCESS);
    setText('');
    setSpamWarning(null);
    closeActiveModal();
  }, [selectedAccountId, findOrCreateCategory, setTransactions, payees, setModalStack]);

  const handleAddTransaction = useCallback(async (transactionText: string) => {
    if (selectedAccountId === 'all') {
      setError('Please select a specific account to add a transaction.');
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
  }, [selectedAccountId, saveTransaction, senders]);
  
  const handleQuickAddSubmit = useCallback(() => {
    handleAddTransaction(text).finally(() => closeActiveModal());
  }, [handleAddTransaction, text, setModalStack]);
  
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
    if(accounts.length === 0) setSelectedAccountId(newAccount.id);
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

  const handleDeleteTransaction = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) return;
    if (transactionToDelete.transferId) {
        if (window.confirm("This is part of a transfer. Deleting it will also delete the corresponding transaction in the other account. Are you sure?")) {
            setTransactions(prev => prev.filter(t => t.transferId !== transactionToDelete.transferId));
        }
    } else {
        setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleUpdateTransaction = (updateData: Transaction | { action: 'split-and-replace', originalTransactionId: string, newTransactions: Omit<Transaction, 'id'>[] }) => {
    if ('action' in updateData && updateData.action === 'split-and-replace') {
      const { originalTransactionId, newTransactions: newTransactionsData } = updateData;
      const newTransactionsWithIds: Transaction[] = newTransactionsData.map(t => ({ ...t, id: self.crypto.randomUUID() }));
      setTransactions(prev => [...prev.filter(t => t.id !== originalTransactionId), ...newTransactionsWithIds].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } else {
      setTransactions(prev => prev.map(t => t.id === (updateData as Transaction).id ? (updateData as Transaction) : t).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
    setEditingCategory(null);
  };
  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm("Are you sure? This will also delete all its subcategories.")) {
      const childIds = categories.filter(c => c.parentId === categoryId).map(c => c.id);
      setCategories(prev => prev.filter(c => !c.id.startsWith(categoryId)));
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
    if (isOnline) await new Promise(resolve => setTimeout(resolve, 1000));
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
      setTransactions(state.transactions); setAccounts(state.accounts); setCategories(state.categories); setBudgets(state.budgets); setRecurringTransactions(state.recurringTransactions); setGoals(state.goals); setInvestmentHoldings(state.investmentHoldings); setPayees(state.payees); setSenders(state.senders); setContactGroups(state.contactGroups); setContacts(state.contacts); setSettings(state.settings); setUnlockedAchievements(state.achievements || []); setTrips(state.trips || []); setTripExpenses(state.tripExpenses || []); setSelectedAccountId(state.accounts[0]?.id || 'all');
      alert("Data restored successfully!");
  };

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => !t.isRefundFor);
    if (selectedAccountId !== 'all') result = result.filter(t => t.accountId === selectedAccountId);
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
  }, [transactions, selectedAccountId, searchQuery, dateFilter, customDateRange, categories]);

  const dashboardData = useMemo(() => filteredTransactions.reduce((acc, t) => {
    if (t.type === 'income') acc.income += t.amount; else acc.expense += t.amount;
    return acc;
  }, { income: 0, expense: 0 }), [filteredTransactions]);
  
  const closeActiveModal = () => setModalStack(prev => prev.slice(0, -1));
  const openModal = (name: ActiveModal, props?: Record<string, any>) => setModalStack(prev => [...prev, { name, props }]);

  const isFormDisabled = (selectedAccountId === 'all' && accounts.length > 0) || status === ProcessingStatus.LOADING;
  const currentToastAchievementId = toastQueue[0];
  const currentToastAchievement = currentToastAchievementId ? ALL_ACHIEVEMENTS.find(a => a.id === currentToastAchievementId) : null;

  const renderScreen = () => {
    const currentTrip = tripDetailsId ? trips.find(t => t.id === tripDetailsId) : null;
    switch (activeScreen) {
      case 'dashboard': return (
        <div>
          <div className="p-4">
            <AccountSelector accounts={accounts} selectedAccountId={selectedAccountId} onAccountChange={setSelectedAccountId} onAddAccount={handleAddAccount} />
            {spamWarning && ( <SpamWarningCard warning={spamWarning} onApprove={handleSpamApproval} onDiscard={() => setSpamWarning(null)} /> )}
          </div>
          <FinanceDisplay
              mainContentRef={mainContentRef}
              status={status} transactions={filteredTransactions} allTransactions={transactions} accounts={accounts} categories={categories} budgets={budgets} recurringTransactions={recurringTransactions} onPayRecurring={handlePayRecurring} goals={goals} investmentHoldings={investmentHoldings} error={error} income={dashboardData.income} expense={dashboardData.expense} onEdit={(t) => openModal('editTransaction', { transaction: t })} onDelete={handleDeleteTransaction} onSettleDebt={handleSettleDebt} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onNaturalLanguageSearch={handleNaturalLanguageSearch} dateFilter={dateFilter} setDateFilter={setDateFilter} customDateRange={customDateRange} setCustomDateRange={setCustomDateRange} isBalanceVisible={isBalanceVisible} setIsBalanceVisible={setIsBalanceVisible} dashboardWidgets={settings.dashboardWidgets} aiInsight={aiInsight} isInsightLoading={isInsightLoading}
          />
        </div>);
      case 'reports': return <ReportsScreen transactions={transactions} categories={categories} />;
      case 'investments': return <InvestmentsScreen accounts={accounts} holdings={investmentHoldings} onBuy={handleBuyInvestment} onSell={handleSellInvestment} onUpdateValue={handleUpdateHoldingValue} onRefresh={handleRefreshPortfolio} />;
      case 'budgets': return <BudgetsScreen categories={categories.filter(c => c.type === TransactionType.EXPENSE)} transactions={transactions} budgets={budgets} onSaveBudget={handleSaveBudget} />;
      case 'goals': return <GoalsScreen goals={goals} setGoals={setGoals} accounts={accounts} onContribute={handleContributeToGoal} />;
      case 'scheduled': return <ScheduledPaymentsScreen recurringTransactions={recurringTransactions} setRecurringTransactions={setRecurringTransactions} categories={categories} accounts={accounts} />;
      case 'calculator': return <CalculatorScreen />;
      case 'more': return <SettingsScreen setActiveScreen={setActiveScreen} setActiveModal={openModal} />;
      case 'achievements': return <AchievementsScreen unlockedAchievements={unlockedAchievements} />;
      case 'tripManagement': return <TripManagementScreen trips={trips} setTrips={setTrips} contacts={contacts} onTripSelect={(id) => { setTripDetailsId(id); setActiveScreen('tripDetails'); }} />;
      case 'tripDetails': return currentTrip ? <TripDetailsScreen trip={currentTrip} expenses={tripExpenses.filter(e => e.tripId === currentTrip.id)} onAddExpense={() => openModal('addTripExpense', { trip: currentTrip })} onBack={() => setActiveScreen('tripManagement')} /> : null;
      case 'refunds': return <RefundsScreen transactions={transactions} categories={categories} onEditTransaction={(t) => openModal('editTransaction', { transaction: t })} />;
      default: return null;
    }
  };

  const renderModal = (modal: ModalState) => {
    switch (modal.name) {
      case 'editTransaction': return <EditTransactionModal transaction={modal.props?.transaction} onSave={handleUpdateTransaction} onCancel={closeActiveModal} accounts={accounts} openModal={openModal} />;
      case 'quickAdd': return <QuickAddModal onClose={closeActiveModal} text={text} setText={setText} onSubmit={handleQuickAddSubmit} isLoading={status === ProcessingStatus.LOADING} isDisabled={isFormDisabled} disabledReason={selectedAccountId === 'all' && accounts.length > 0 ? 'Select an account' : undefined} />;
      case 'transfer': return <TransferModal onClose={closeActiveModal} accounts={accounts} onTransfer={handleAccountTransfer} />;
      case 'appSettings': return <AppSettingsModal onClose={closeActiveModal} appState={appState} onRestore={handleRestoreBackup} />;
      case 'categories': return <CategoryManagerModal onClose={closeActiveModal} categories={categories} onAddNewCategory={handleAddNewCategory} onEditCategory={setEditingCategory} onDeleteCategory={handleDeleteCategory} />;
      case 'payees': return <PayeesModal onClose={closeActiveModal} payees={payees} setPayees={setPayees} categories={categories} />;
      case 'contacts': return <ContactsManagerModal onClose={closeActiveModal} />;
      case 'senderManager': return <SenderManagerModal onClose={closeActiveModal} />;
      case 'export': return <ExportModal onClose={closeActiveModal} transactions={transactions} accounts={accounts} categories={categories} senders={senders} />;
      case 'feedback': return <FeedbackModal onClose={closeActiveModal} onSend={handleSendFeedback} isSending={isSendingFeedback} />;
      case 'dashboardSettings': return <DashboardSettingsModal onClose={closeActiveModal} />;
      case 'notificationSettings': return <NotificationSettingsModal onClose={closeActiveModal} budgets={budgets} categories={categories} />;
      case 'addTripExpense': return <AddTripExpenseModal trip={modal.props?.trip} onClose={closeActiveModal} onSave={(expense) => setTripExpenses(prev => [...prev, expense])} />;
      case 'refund': return <RefundModal originalTransaction={modal.props?.transaction} onClose={closeActiveModal} openModal={openModal} onSave={(refund) => setTransactions(prev => [refund, ...prev])} findOrCreateCategory={findOrCreateCategory}/>;
      default: return null;
    }
  };

  return ( <>
      {currentToastAchievement && ( <AchievementToast achievement={currentToastAchievement} onDismiss={() => setToastQueue(prev => prev.slice(1))} /> )}
      {renderScreen()}
      {editingCategory && ReactDOM.createPortal(<EditCategoryModal category={editingCategory} categories={categories} onSave={handleUpdateCategory} onCancel={() => setEditingCategory(null)} />, modalRoot)}
      {modalStack.map((modal, index) => (
          <React.Fragment key={index}>
            {ReactDOM.createPortal(renderModal(modal), modalRoot)}
          </React.Fragment>
      ))}
    </>
  );
};
export default FinanceTracker;