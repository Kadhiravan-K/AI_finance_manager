import React, { useMemo } from 'react';
import { ProcessingStatus, Transaction, TransactionType, Category, DateRange, CustomDateRange, Budget, RecurringTransaction, Goal, Account, InvestmentHolding } from '../types';
import CategoryPieChart from './CategoryPieChart';
import TransactionFilters from './TransactionFilters';
import BudgetsSummary from './BudgetsSummary';
import UpcomingBills from './UpcomingBills';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import GoalsSummary from './GoalsSummary';
import DebtsSummary from './DebtsSummary';
import NetWorthSummary from './NetWorthSummary';
import PortfolioSummary from './PortfolioSummary';

interface FinanceDisplayProps {
  status: ProcessingStatus;
  transactions: Transaction[];
  allTransactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  goals: Goal[];
  investmentHoldings: InvestmentHolding[];
  onPayRecurring: (item: RecurringTransaction) => void;
  error: string;
  income: number;
  expense: number;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onSettleDebt: (transactionId: string, splitDetailId: string, settlementAccountId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateFilter: DateRange;
  setDateFilter: (filter: DateRange) => void;
  customDateRange: CustomDateRange;
  setCustomDateRange: React.Dispatch<React.SetStateAction<CustomDateRange>>;
  isBalanceVisible: boolean;
  setIsBalanceVisible: (visible: boolean) => void;
}

const getCategory = (categoryId: string, categories: Category[]): Category | undefined => {
    return categories.find(c => c.id === categoryId);
};

const getCategoryPath = (categoryId: string, categories: Category[]): string => {
    const path: string[] = [];
    let current = getCategory(categoryId, categories);
    while (current) {
        path.unshift(current.name);
        current = categories.find(c => c.id === current.parentId);
    }
    return path.join(' / ') || 'Uncategorized';
};

const formatDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const DashboardCard = ({ title, amount, colorClass, isVisible, children }: {title: string, amount: number, colorClass: string, isVisible: boolean, children: React.ReactNode}) => {
    const formatCurrency = useCurrencyFormatter();
    return (
        <div className={`p-4 rounded-xl glass-card transition-all duration-300 hover:bg-slate-800/80 hover:shadow-xl hover:-translate-y-1 hover:border-slate-600`}>
            <div className="flex items-center justify-between text-sm text-slate-400 mb-1">
              <span>{title}</span>
              {children}
            </div>
            <p className={`text-2xl font-bold ${colorClass}`}>{isVisible ? formatCurrency(amount) : '••••'}</p>
        </div>
    );
};


const Dashboard = ({ income, expense, isVisible }: { income: number, expense: number, isVisible: boolean }) => {
    const balance = income - expense;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-6">
            <DashboardCard title="Income" amount={income} colorClass="text-emerald-400" isVisible={isVisible}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </DashboardCard>
            <DashboardCard title="Expenses" amount={expense} colorClass="text-rose-400" isVisible={isVisible}>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" /></svg>
            </DashboardCard>
            <DashboardCard title="Balance" amount={balance} colorClass={`${balance >= 0 ? 'text-slate-200' : 'text-rose-400'}`} isVisible={isVisible}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 6-3 6m18-12l-3 6 3 6" /></svg>
            </DashboardCard>
        </div>
    );
}

const TransactionItem = ({ transaction, category, categoryPath, onEdit, onDelete, style, isVisible }: { transaction: Transaction, category: Category | undefined, categoryPath: string, onEdit: (t: Transaction) => void, onDelete: (id: string) => void, style: React.CSSProperties, isVisible: boolean }) => {
    const isIncome = transaction.type === TransactionType.INCOME;
    const isTransfer = !!transaction.transferId;
    const isSplit = !!transaction.splitDetails && transaction.splitDetails.length > 0;
    const formatCurrency = useCurrencyFormatter();

    const totalOwed = isSplit ? transaction.splitDetails?.filter(s => s.personName.toLowerCase() !== 'you' && !s.isSettled).reduce((acc, s) => acc + s.amount, 0) : 0;

    return (
        <li style={style} className="flex flex-col glass-card p-3 rounded-xl group transition-all duration-300 hover:bg-slate-800/80 hover:shadow-xl hover:-translate-y-1 hover:shadow-slate-900/50 hover:border-slate-600">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-xl bg-slate-900/30`}>
                    {isSplit ? '➗' : (isTransfer ? '↔️' : (category?.icon || (isIncome ? '💰' : '💸')))}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-slate-200 truncate font-medium">{transaction.description}</p>
                        <p className="text-xs text-slate-500">{categoryPath}</p>
                        {transaction.notes && <p className="text-xs text-slate-400/70 truncate italic mt-1">Note: {transaction.notes}</p>}
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className={`font-semibold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isVisible ? `${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}` : '••••'}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                        {!isTransfer && (
                            <button onClick={() => onEdit(transaction)} className="p-1 text-slate-400 hover:text-white" aria-label="Edit transaction">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                            </button>
                        )}
                        <button onClick={() => onDelete(transaction.id)} className="p-1 text-slate-400 hover:text-rose-500" aria-label="Delete transaction">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            </div>
             {isSplit && totalOwed > 0 && (
                <div className="mt-2 pl-12 text-xs text-yellow-400">
                    Owed to you: {isVisible ? formatCurrency(totalOwed) : '••••'}
                </div>
            )}
        </li>
    );
};

const FinanceDisplay: React.FC<FinanceDisplayProps> = ({ status, transactions, allTransactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, onPayRecurring, error, income, expense, onEdit, onDelete, onSettleDebt, isBalanceVisible, setIsBalanceVisible, ...filterProps }) => {
    
    const groupedTransactions = useMemo(() => {
        return transactions.reduce((acc, t) => {
            const dateKey = t.date.split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(t);
            return acc;
        }, {} as Record<string, Transaction[]>);
    }, [transactions]);
    
    const renderContent = () => {
        if (status === ProcessingStatus.ERROR && error) {
            return (
                <div className="bg-rose-900/50 border border-rose-700 text-rose-200 p-4 rounded-xl my-4 text-center animate-scaleIn">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            );
        }
        return null;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold text-white">Dashboard</h2>
                <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="p-2 text-slate-400 hover:text-white" aria-label="Toggle balance visibility">
                    {isBalanceVisible ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.05 10.05 0 015.396-6.175M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 2l20 20" /></svg>
                    )}
                </button>
            </div>
            <Dashboard income={income} expense={expense} isVisible={isBalanceVisible} />
            <NetWorthSummary accounts={accounts} allTransactions={allTransactions} holdings={investmentHoldings} isVisible={isBalanceVisible} />
            <PortfolioSummary holdings={investmentHoldings} isVisible={isBalanceVisible} />
            <DebtsSummary transactions={allTransactions} accounts={accounts} onSettle={onSettleDebt} isVisible={isBalanceVisible}/>
            <UpcomingBills recurringTransactions={recurringTransactions} onPay={onPayRecurring} categories={categories} />
            <GoalsSummary goals={goals} isVisible={isBalanceVisible} />
            <BudgetsSummary budgets={budgets} transactions={allTransactions} categories={categories} isVisible={isBalanceVisible} />
            {renderContent()}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <CategoryPieChart
                    title="Income Sources"
                    transactions={transactions}
                    categories={categories}
                    type={TransactionType.INCOME}
                />
                <CategoryPieChart
                    title="Expense Categories"
                    transactions={transactions}
                    categories={categories}
                    type={TransactionType.EXPENSE}
                />
            </div>

            <div className="my-6">
                <TransactionFilters {...filterProps} />
            </div>

            {transactions.length === 0 && status !== ProcessingStatus.LOADING ? (
                 <div className="text-center text-slate-400 p-8 rounded-xl glass-card mt-4 border border-dashed border-slate-700">
                    <p className="font-semibold text-slate-300">No transactions match your filters.</p>
                    <p className="text-sm">Try adjusting your search or date range!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.keys(groupedTransactions).map(dateKey => (
                        <div key={dateKey}>
                            <h3 className="font-semibold text-slate-400 text-sm mb-2">{formatDateGroup(dateKey)}</h3>
                            <ul className="space-y-3 stagger-delay">
                                {groupedTransactions[dateKey].map((t, index) => {
                                    const category = getCategory(t.categoryId, categories);
                                    const categoryPath = getCategoryPath(t.categoryId, categories);
                                    return <TransactionItem key={t.id} transaction={t} category={category} categoryPath={categoryPath} onEdit={onEdit} onDelete={onDelete} style={{ '--stagger-index': index } as React.CSSProperties} isVisible={isBalanceVisible} />;
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {status === ProcessingStatus.LOADING && transactions.length === 0 && (
                <div className="text-center text-slate-400 p-4 animate-pulse">
                    <p>Analyzing transaction...</p>
                </div>
            )}
        </div>
    );
};

export default FinanceDisplay;