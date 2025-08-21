

import React, { useState, useCallback, useEffect, useMemo, useContext } from 'react';
import { ProcessingStatus, Transaction, Account, Category, TransactionType, DateRange, CustomDateRange, Budget, Payee, RecurringTransaction, ActiveModal } from '../types';
import { parseTransactionText } from '../services/geminiService';
import useLocalStorage from '../hooks/useLocalStorage';
import QuickAddForm from './PromptForm';
import FinanceDisplay from './StoryDisplay';
import AccountSelector from './AccountSelector';
import EditTransactionModal from './EditTransactionModal';
import TransferModal from './TransferModal';
import ReportsModal from './ReportsModal';
import BudgetsModal from './BudgetsModal';
import SettingsModal from './SettingsModal';
import ScheduledPaymentsModal from './ScheduledPaymentsModal';
import { SettingsContext } from '../contexts/SettingsContext';
import { calculateNextDueDate } from '../utils/date';
import AppSettingsModal from './AppSettingsModal';
import CategoryManagerModal from './CategoryManagerModal';
import EditCategoryModal from './EditCategoryModal';
import PayeesModal from './PayeesModal';
import ExportModal from './ExportModal';

const generateCategories = (): Category[] => {
  const categories: Category[] = [];
  const add = (type: TransactionType, name: string, parentName: string | null = null, icon: string = '📁') => {
    const parent = parentName ? categories.find(c => c.name === parentName && c.type === type) : null;
    categories.push({
      id: self.crypto.randomUUID(),
      name,
      type,
      parentId: parent ? parent.id : null,
      icon,
    });
  };
 // INCOME
  add(TransactionType.INCOME, 'Family Contributions', null, '👨‍👩‍👧‍👦');
  add(TransactionType.INCOME, 'Father', 'Family Contributions', '👨');
  add(TransactionType.INCOME, 'Mother', 'Family Contributions', '👩');
  add(TransactionType.INCOME, 'Uncle', 'Family Contributions', '👨‍🦳');
  add(TransactionType.INCOME, 'Aunt', 'Family Contributions', '👵');
  add(TransactionType.INCOME, 'Brother', 'Family Contributions', '👦');
  add(TransactionType.INCOME, 'Sister', 'Family Contributions', '👧');
  
  add(TransactionType.INCOME, 'Personal Earnings', null, '💼');
  add(TransactionType.INCOME, 'Company Salary', 'Personal Earnings', '🏢');
  add(TransactionType.INCOME, 'Freelancing', 'Personal Earnings', '💻');
  add(TransactionType.INCOME, 'Part-Time Jobs', 'Personal Earnings', '🕒');
  add(TransactionType.INCOME, 'Startup Revenue', 'Personal Earnings', '🚀');
  add(TransactionType.INCOME, 'Business Income', 'Personal Earnings', '🏪');
  add(TransactionType.INCOME, 'Stock Market Gains', 'Personal Earnings', '📈');

  add(TransactionType.INCOME, 'Other Income Sources', null, '📊');
  add(TransactionType.INCOME, 'Rental Income', 'Other Income Sources', '🏠');
  add(TransactionType.INCOME, 'Bank Interest / FD', 'Other Income Sources', '🏦');
  add(TransactionType.INCOME, 'Dividends', 'Other Income Sources', '💸');
  add(TransactionType.INCOME, 'Crypto Earnings', 'Other Income Sources', '🪙');
  add(TransactionType.INCOME, 'Royalties (Books, Music, Code)', 'Other Income Sources', '📚');
  add(TransactionType.INCOME, 'Scholarships / Subsidies', 'Other Income Sources', '🎓');
  add(TransactionType.INCOME, 'Gifts / Donations', 'Other Income Sources', '🎁');
  add(TransactionType.INCOME, 'Refunds / Cashback', 'Other Income Sources', '🔁');
  add(TransactionType.INCOME, 'Resale (OLX, FB Marketplace)', 'Other Income Sources', '🔄');
  add(TransactionType.INCOME, 'YouTube / Content Creation', 'Other Income Sources', '📹');
  add(TransactionType.INCOME, 'Affiliate Marketing', 'Other Income Sources', '🔗');
  
  add(TransactionType.INCOME, 'Transfers', null, '↔️');
  add(TransactionType.EXPENSE, 'Transfers', null, '↔️');


  // EXPENSES
  add(TransactionType.EXPENSE, 'Food & Beverages', null, '🍽️');
  add(TransactionType.EXPENSE, 'Breakfast', 'Food & Beverages', '🍳');
  add(TransactionType.EXPENSE, 'Lunch', 'Food & Beverages', '🍛');
  add(TransactionType.EXPENSE, 'Dinner', 'Food & Beverages', '🍲');
  add(TransactionType.EXPENSE, 'Tea / Coffee', 'Food & Beverages', '☕');
  add(TransactionType.EXPENSE, 'Snacks', 'Food & Beverages', '🍪');
  add(TransactionType.EXPENSE, 'Juices', 'Food & Beverages', '🧃');
  add(TransactionType.EXPENSE, 'Soft Drinks / Alcohol', 'Food & Beverages', '🥤');

  add(TransactionType.EXPENSE, 'Stationery & Supplies', null, '✏️');
  add(TransactionType.EXPENSE, 'Personal Use', 'Stationery & Supplies', '🧍');
  add(TransactionType.EXPENSE, 'Others', 'Stationery & Supplies', '👥');
  add(TransactionType.EXPENSE, 'School / College', 'Stationery & Supplies', '🏫');

  add(TransactionType.EXPENSE, 'Fees & Fines', null, '🧾');
  add(TransactionType.EXPENSE, 'College Fees', 'Fees & Fines', '🎓');
  add(TransactionType.EXPENSE, 'College Fines', 'Fees & Fines', '🚫');
  add(TransactionType.EXPENSE, 'Exam Fees', 'Fees & Fines', '📝');
  add(TransactionType.EXPENSE, 'Book Fees', 'Fees & Fines', '📚');
  add(TransactionType.EXPENSE, 'Educational Tours', 'Fees & Fines', '🧳');
  add(TransactionType.EXPENSE, 'Industrial Visits (IV)', 'Fees & Fines', '🏭');
  add(TransactionType.EXPENSE, 'Symposiums / Conferences', 'Fees & Fines', '🗣️');
  add(TransactionType.EXPENSE, 'Party / Celebration', 'Fees & Fines', '🎉');

  add(TransactionType.EXPENSE, 'Room & Essentials', null, '🏠');
  add(TransactionType.EXPENSE, 'Daily Products (Soap, Shampoo, etc.)', 'Room & Essentials', '🧼');
  add(TransactionType.EXPENSE, 'Groceries', 'Room & Essentials', '🛒');
  add(TransactionType.EXPENSE, 'Vegetables', 'Room & Essentials', '🥦');
  add(TransactionType.EXPENSE, 'Fruits', 'Room & Essentials', '🍎');
  add(TransactionType.EXPENSE, 'Furniture', 'Room & Essentials', '🪑');
  add(TransactionType.EXPENSE, 'Cleaning Supplies', 'Room & Essentials', '🧹');

  add(TransactionType.EXPENSE, 'Travel & Transport', null, '🚗');
  add(TransactionType.EXPENSE, 'Bus', 'Travel & Transport', '🚌');
  add(TransactionType.EXPENSE, 'Train', 'Travel & Transport', '🚆');
  add(TransactionType.EXPENSE, 'Bike (Fuel / Maintenance)', 'Travel & Transport', '🛵');
  add(TransactionType.EXPENSE, 'Car (Fuel / Maintenance)', 'Travel & Transport', '🚗');
  add(TransactionType.EXPENSE, 'Flight', 'Travel & Transport', '✈️');
  add(TransactionType.EXPENSE, 'Boat', 'Travel & Transport', '🛶');
  add(TransactionType.EXPENSE, 'Ship / Ferry', 'Travel & Transport', '🚢');
  add(TransactionType.EXPENSE, 'Ride Sharing (Uber, Ola)', 'Travel & Transport', '🚖');
  add(TransactionType.EXPENSE, 'Parking Fees', 'Travel & Transport', '🅿️');

  add(TransactionType.EXPENSE, 'Monthly Maintenance / EMI', null, '🔁');
  add(TransactionType.EXPENSE, 'Room Rent', 'Monthly Maintenance / EMI', '🏠');
  add(TransactionType.EXPENSE, 'Mobile Recharge', 'Monthly Maintenance / EMI', '📱');
  add(TransactionType.EXPENSE, 'Haircut', 'Monthly Maintenance / EMI', '💇');
  add(TransactionType.EXPENSE, 'Beauty Parlour', 'Monthly Maintenance / EMI', '💅');
  add(TransactionType.EXPENSE, 'Electricity Bill', 'Monthly Maintenance / EMI', '⚡');
  add(TransactionType.EXPENSE, 'Water Bill', 'Monthly Maintenance / EMI', '🚰');
  add(TransactionType.EXPENSE, 'Cooking Gas', 'Monthly Maintenance / EMI', '🔥');
  add(TransactionType.EXPENSE, 'EMIs (Loans, Credit Cards)', 'Monthly Maintenance / EMI', '💳');
  add(TransactionType.EXPENSE, 'Health / Family Insurance', 'Monthly Maintenance / EMI', '🏥');
  add(TransactionType.EXPENSE, 'Subscriptions (Netflix, Spotify, etc.)', 'Monthly Maintenance / EMI', '📺');
  add(TransactionType.EXPENSE, 'TV Recharge / Cable', 'Monthly Maintenance / EMI', '📡');

  add(TransactionType.EXPENSE, 'Entertainment', null, '🎉');
  add(TransactionType.EXPENSE, 'Movies', 'Entertainment', '🎬');
  add(TransactionType.EXPENSE, 'Clubs / Pubs', 'Entertainment', '🕺');
  add(TransactionType.EXPENSE, 'Restaurants', 'Entertainment', '🍽️');
  add(TransactionType.EXPENSE, 'Local Tours / Trips', 'Entertainment', '🧭');
  add(TransactionType.EXPENSE, 'Gaming / Apps', 'Entertainment', '🎮');
  
  add(TransactionType.EXPENSE, 'Health & Wellness', null, '🏥');
  add(TransactionType.EXPENSE, 'Hospital Visits', 'Health & Wellness', '🏨');
  add(TransactionType.EXPENSE, 'Health Insurance', 'Health & Wellness', '🛡️');
  add(TransactionType.EXPENSE, 'Routine Checkups', 'Health & Wellness', '🩺');
  add(TransactionType.EXPENSE, 'Medicines', 'Health & Wellness', '💊');
  add(TransactionType.EXPENSE, 'Fitness / Gym', 'Health & Wellness', '🏋️');
  add(TransactionType.EXPENSE, 'Mental Health / Therapy', 'Health & Wellness', '🧠');
  
  add(TransactionType.EXPENSE, 'Shopping', null, '🛍️');
  add(TransactionType.EXPENSE, 'Clothes / Dresses', 'Shopping', '👗');
  add(TransactionType.EXPENSE, 'Bags / Backpacks', 'Shopping', '🎒');
  add(TransactionType.EXPENSE, 'Footwear', 'Shopping', '👟');
  add(TransactionType.EXPENSE, 'Belts / Accessories', 'Shopping', '🧢');
  add(TransactionType.EXPENSE, 'Electronics / Gadgets', 'Shopping', '📱');
  add(TransactionType.EXPENSE, 'Home Decor', 'Shopping', '🪞');

  add(TransactionType.EXPENSE, 'Events & Occasions', null, '🎊');
  add(TransactionType.EXPENSE, 'Cultural Events', 'Events & Occasions', '🎭');
  add(TransactionType.EXPENSE, 'Sports Events', 'Events & Occasions', '🏅');
  add(TransactionType.EXPENSE, 'Workshops / Seminars', 'Events & Occasions', '🧪');
  add(TransactionType.EXPENSE, 'Gifts', 'Events & Occasions', '🎁');
  add(TransactionType.EXPENSE, 'Marriage Functions', 'Events & Occasions', '💍');
  add(TransactionType.EXPENSE, 'Birthday Treats', 'Events & Occasions', '🎂');
  add(TransactionType.EXPENSE, 'Festival Celebrations', 'Events & Occasions', '🔔');

  add(TransactionType.EXPENSE, 'Miscellaneous', null, '🧰');
  add(TransactionType.EXPENSE, 'Donations / Charity', 'Miscellaneous', '🤲');
  add(TransactionType.EXPENSE, 'Pet Care', 'Miscellaneous', '🐶');
  add(TransactionType.EXPENSE, 'Repairs (Home, Electronics)', 'Miscellaneous', '🛠️');
  add(TransactionType.EXPENSE, 'Courier / Delivery Charges', 'Miscellaneous', '📦');
  add(TransactionType.EXPENSE, 'Legal / Documentation Fees', 'Miscellaneous', '📄');
  add(TransactionType.EXPENSE, 'Unexpected Expenses', 'Miscellaneous', '❗');
  return categories;
};
const DEFAULT_CATEGORIES = generateCategories();

const DEFAULT_ACCOUNTS = () => {
    const defaultBank = { id: self.crypto.randomUUID(), name: 'Bank Account' };
    const defaultSavings = { id: self.crypto.randomUUID(), name: 'Savings' };
    const defaultCash = { id: self.crypto.randomUUID(), name: 'Cash' };
    const defaultGPay = { id: self.crypto.randomUUID(), name: 'GPay' };
    const defaultDebitCard = { id: self.crypto.randomUUID(), name: 'Debit Card' };
    return [defaultBank, defaultSavings, defaultCash, defaultGPay, defaultDebitCard];
};


interface FinanceTrackerProps {
  activeModal: ActiveModal;
  setActiveModal: (modal: ActiveModal) => void;
}

const FinanceTracker: React.FC<FinanceTrackerProps> = ({ 
  activeModal,
  setActiveModal,
}) => {
  const [text, setText] = useState<string>('');
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('finance-tracker-transactions', []);
  const [accounts, setAccounts] = useLocalStorage<Account[]>('finance-tracker-accounts', DEFAULT_ACCOUNTS);
  const { categories, setCategories, payees, setPayees } = useContext(SettingsContext);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('finance-tracker-budgets', []);
  const [recurringTransactions, setRecurringTransactions] = useLocalStorage<RecurringTransaction[]>('finance-tracker-recurring', []);
  const [selectedAccountId, setSelectedAccountId] = useLocalStorage<string>('finance-tracker-selected-account-id', accounts[0]?.id || 'all');
  
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [error, setError] = useState<string>('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange>('all');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ start: null, end: null });

  useEffect(() => {
    const storedCategories = localStorage.getItem('finance-tracker-categories');
    if (!storedCategories) {
        setCategories(DEFAULT_CATEGORIES);
    }
    const currentSelected = accounts.find((acc: Account) => acc.id === selectedAccountId);
    if (!currentSelected && selectedAccountId !== 'all' && accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId, setSelectedAccountId, setCategories]);
  
  const findOrCreateCategory = useCallback((fullName: string, type: TransactionType): string => {
      const parts = fullName.split('/').map(p => p.trim());
      let parentId: string | null = null;
      let finalCategoryId = '';

      let currentCategories = [...categories];

      for (const part of parts) {
        let existingCategory = currentCategories.find(c =>
          c.name.toLowerCase() === part.toLowerCase() &&
          c.type === type &&
          c.parentId === parentId
        );

        if (existingCategory) {
          parentId = existingCategory.id;
          finalCategoryId = existingCategory.id;
        } else {
          const newCategory: Category = {
            id: self.crypto.randomUUID(),
            name: part,
            type,
            parentId,
            icon: '🆕',
          };
          currentCategories.push(newCategory);
          parentId = newCategory.id;
          finalCategoryId = newCategory.id;
        }
      }
      setCategories(currentCategories);
      return finalCategoryId;
  }, [categories, setCategories]);

  const handleAddTransaction = useCallback(async () => {
    if (selectedAccountId === 'all') {
      setError('Please select a specific account to add a transaction.');
      return setStatus(ProcessingStatus.ERROR);
    }
    if (!text.trim()) {
      setError('Please paste a transaction message or use quick add format (e.g., "Lunch 500").');
      return setStatus(ProcessingStatus.ERROR);
    }

    setStatus(ProcessingStatus.LOADING);
    setError('');

    try {
      const parsed = await parseTransactionText(text);
      if (parsed) {
        let categoryId = '';
        let description = parsed.description;

        const matchingPayee = parsed.payeeIdentifier ? payees.find(p => p.identifier.toLowerCase() === parsed.payeeIdentifier?.toLowerCase()) : null;
        
        if(matchingPayee) {
            categoryId = matchingPayee.defaultCategoryId;
            description = matchingPayee.name;
        } else {
            categoryId = findOrCreateCategory(parsed.categoryName, parsed.type);
        }

        const newTransaction: Transaction = {
          id: parsed.id,
          accountId: selectedAccountId,
          description: description,
          amount: parsed.amount,
          type: parsed.type,
          categoryId: categoryId,
          date: parsed.date,
          notes: parsed.notes,
          payeeIdentifier: parsed.payeeIdentifier
        };
        setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setStatus(ProcessingStatus.SUCCESS);
        setText('');
      } else {
        setError('This does not seem to be a valid financial transaction.');
        setStatus(ProcessingStatus.ERROR);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setStatus(ProcessingStatus.ERROR);
    }
  }, [text, selectedAccountId, findOrCreateCategory, setTransactions, payees]);

  const handleAddAccount = (name: string) => {
    const newAccount = { id: self.crypto.randomUUID(), name };
    setAccounts(prev => [...prev, newAccount]);
    setSelectedAccountId(newAccount.id);
  };
  
  const handleAccountTransfer = (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => {
    const fromAccount = accounts.find(a => a.id === fromAccountId);
    const toAccount = accounts.find(a => a.id === toAccountId);
    if (!fromAccount || !toAccount) {
        setError("Invalid accounts for transfer.");
        return;
    }

    const transferId = self.crypto.randomUUID();
    let expenseTransferCategory = findOrCreateCategory('Transfers', TransactionType.EXPENSE);
    let incomeTransferCategory = findOrCreateCategory('Transfers', TransactionType.INCOME);
    
    const now = new Date().toISOString();

    const expenseTransaction: Transaction = {
        id: self.crypto.randomUUID(),
        accountId: fromAccountId,
        description: `Transfer to ${toAccount.name}`,
        amount,
        type: TransactionType.EXPENSE,
        categoryId: expenseTransferCategory,
        date: now,
        notes,
        transferId,
    };

    const incomeTransaction: Transaction = {
        id: self.crypto.randomUUID(),
        accountId: toAccountId,
        description: `Transfer from ${fromAccount.name}`,
        amount,
        type: TransactionType.INCOME,
        categoryId: incomeTransferCategory,
        date: now,
        notes,
        transferId,
    };
    
    setTransactions(prev => [incomeTransaction, expenseTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setActiveModal(null);
  };

  const handleDeleteTransaction = (id: string) => {
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

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setEditingTransaction(null);
  };
  
  const handleSaveBudget = (categoryId: string, amount: number) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setBudgets(prev => {
        const existing = prev.find(b => b.categoryId === categoryId && b.month === month);
        if (existing) {
            return prev.map(b => b.categoryId === categoryId && b.month === month ? { ...b, amount } : b);
        }
        return [...prev, { categoryId, amount, month }];
    });
  };

  const handlePayRecurring = (item: RecurringTransaction) => {
      const newTransaction: Transaction = {
          id: self.crypto.randomUUID(),
          accountId: item.accountId,
          description: item.description,
          amount: item.amount,
          type: item.type,
          categoryId: item.categoryId,
          date: new Date().toISOString(),
          notes: item.notes,
      };
      setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      const nextDueDate = calculateNextDueDate(item.nextDueDate, item.frequency);
      setRecurringTransactions(prev => prev.map(r => r.id === item.id ? { ...r, nextDueDate: nextDueDate.toISOString() } : r));
  };
  
  const handleAddNewCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: self.crypto.randomUUID() };
    setCategories(prev => [...prev, newCategory]);
  };

  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    setEditingCategory(null);
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm("Are you sure you want to delete this category? This will also delete all its subcategories.")) {
      const childIds = categories.filter(c => c.parentId === categoryId).map(c => c.id);
      const idsToDelete = [categoryId, ...childIds];
      setCategories(prev => prev.filter(c => !idsToDelete.includes(c.id)));
    }
  };


  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (selectedAccountId !== 'all') {
      result = result.filter(t => t.accountId === selectedAccountId);
    }
    
    if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        result = result.filter(t => 
            t.description.toLowerCase().includes(lowerCaseQuery) ||
            t.notes?.toLowerCase().includes(lowerCaseQuery) ||
            categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(lowerCaseQuery)
        );
    }

    if (dateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        switch (dateFilter) {
            case 'today':
                startDate = today;
                endDate = new Date(today);
                endDate.setDate(endDate.getDate() + 1);
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - now.getDay());
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case 'custom':
                startDate = customDateRange.start;
                endDate = customDateRange.end ? new Date(customDateRange.end.getTime() + 86400000) : null;
                break;
        }

        if (startDate) {
            result = result.filter(t => new Date(t.date) >= startDate!);
        }
        if (endDate) {
            result = result.filter(t => new Date(t.date) < endDate!);
        }
    }

    return result;
  }, [transactions, selectedAccountId, searchQuery, dateFilter, customDateRange, categories]);

  const dashboardData = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
    }, { income: 0, expense: 0 });
  }, [filteredTransactions]);

  const isFormDisabled = selectedAccountId === 'all' || status === ProcessingStatus.LOADING;
  const handleCloseActiveModal = () => setActiveModal(null);

  return (
    <div className="flex flex-col flex-grow h-full">
       <AccountSelector
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        onAddAccount={handleAddAccount}
      />
      <div className="flex-grow overflow-y-auto mb-4 pr-1">
        <FinanceDisplay
            status={status}
            transactions={filteredTransactions}
            allTransactions={transactions}
            categories={categories}
            budgets={budgets}
            recurringTransactions={recurringTransactions}
            onPayRecurring={handlePayRecurring}
            error={error}
            income={dashboardData.income}
            expense={dashboardData.expense}
            onEdit={setEditingTransaction}
            onDelete={handleDeleteTransaction}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
        />
      </div>
      <div className="flex-shrink-0 pt-2">
        <QuickAddForm
          text={text}
          setText={setText}
          onSubmit={handleAddTransaction}
          isLoading={status === ProcessingStatus.LOADING}
          isDisabled={isFormDisabled}
          disabledReason={selectedAccountId === 'all' ? 'Select an account to add transactions' : undefined}
        />
      </div>
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onSave={handleUpdateTransaction}
          onCancel={() => setEditingTransaction(null)}
          accounts={accounts}
        />
      )}
      {activeModal === 'transfer' && (
        <TransferModal
            isOpen={true}
            onClose={handleCloseActiveModal}
            accounts={accounts}
            onTransfer={handleAccountTransfer}
        />
      )}
      {activeModal === 'settings' && (
          <SettingsModal
            onClose={handleCloseActiveModal}
            setActiveModal={setActiveModal}
          />
      )}
       {activeModal === 'appSettings' && (
          <AppSettingsModal
            isOpen={true}
            onClose={() => setActiveModal('settings')}
          />
      )}
       {activeModal === 'categories' && (
          <CategoryManagerModal
            isOpen={true}
            onClose={() => setActiveModal('settings')}
            categories={categories}
            onAddNewCategory={handleAddNewCategory}
            onEditCategory={setEditingCategory}
            onDeleteCategory={handleDeleteCategory}
          />
      )}
       {editingCategory && (
          <EditCategoryModal 
            category={editingCategory} 
            categories={categories} 
            onSave={handleUpdateCategory} 
            onCancel={() => setEditingCategory(null)} 
          />
      )}
       {activeModal === 'payees' && (
          <PayeesModal
            isOpen={true}
            onClose={() => setActiveModal('settings')}
            payees={payees}
            setPayees={setPayees}
            categories={categories}
          />
      )}
      {activeModal === 'export' && (
        <ExportModal 
          onClose={() => setActiveModal('settings')}
          transactions={transactions}
          accounts={accounts}
          categories={categories}
        />
      )}
      {activeModal === 'reports' && (
          <ReportsModal
            isOpen={true}
            onClose={handleCloseActiveModal}
            transactions={transactions}
            categories={categories}
          />
      )}
      {activeModal === 'budgets' && (
          <BudgetsModal
            isOpen={true}
            onClose={handleCloseActiveModal}
            categories={categories.filter(c => c.type === TransactionType.EXPENSE)}
            transactions={transactions}
            budgets={budgets}
            onSaveBudget={handleSaveBudget}
          />
      )}
      {activeModal === 'scheduled' && (
        <ScheduledPaymentsModal
          isOpen={true}
          onClose={handleCloseActiveModal}
          recurringTransactions={recurringTransactions}
          setRecurringTransactions={setRecurringTransactions}
          categories={categories}
          accounts={accounts}
        />
      )}
    </div>
  );
};

export default FinanceTracker;