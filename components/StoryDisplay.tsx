
import React, { useMemo, useState, useEffect, useContext } from 'react';
import { ProcessingStatus, Transaction, TransactionType, Category, DateRange, CustomDateRange, Budget, RecurringTransaction, Goal, Account, InvestmentHolding, DashboardWidget, FinancialProfile, AccountType, ActiveScreen, ActiveModal, AppState } from '../types';
import CategoryPieChart from './CategoryPieChart';
import TransactionFilters from './TransactionFilters';
import BudgetsSummary from './BudgetsSummary';
import UpcomingBills from './UpcomingBills';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import GoalsSummary from './GoalsSummary';
import DebtsSummary from './DebtsSummary';
import NetWorthSummary from './NetWorthSummary';
import PortfolioSummary from './PortfolioSummary';
import FinancialHealthScore from './FinancialHealthScore';
import DynamicAIInsights from './DynamicAIInsights';
import EmptyState from './EmptyState';
import { AppDataContext } from '../contexts/SettingsContext';

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
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onSettleDebt: (transactionId: string, splitDetailId: string, settlementAccountId: string, amount: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNaturalLanguageSearch: () => void;
  dateFilter: DateRange;
  setDateFilter: (filter: DateRange) => void;
  customDateRange: CustomDateRange;
  setCustomDateRange: React.Dispatch<React.SetStateAction<CustomDateRange>>;
  isBalanceVisible: boolean;
  setIsBalanceVisible: (visible: boolean) => void;
  dashboardWidgets: DashboardWidget[];
  mainContentRef?: React.RefObject<HTMLElement>;
  financialProfile: FinancialProfile;
  onOpenFinancialHealth: () => void;
  selectedAccountIds: string[];
  onAccountChange: (ids: string[]) => void;
  onAddAccount: (name: string, accountType: AccountType, currency: string, creditLimit?: number, openingBalance?: number) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  baseCurrency: string;
  isLoading: boolean;
  onAddTransaction: () => void;
  appState: AppState;
}

const getCategory = (categoryId: string, categories: Category[]): Category | undefined => categories.find(c => c.id === categoryId);
const getCategoryPath = (categoryId: string, categories: Category[]): string => {
    let path: string[] = [], current = getCategory(categoryId, categories);
    while (current) { path.unshift(current.name); current = categories.find(c => c.id === current.parentId); }
    return path.join(' / ') || 'Uncategorized';
};

const formatDateGroup = (dateString: string) => {
    const date = new Date(dateString), today = new Date(), yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const DashboardSkeleton: React.FC = () => (
    <div className="px-4">
        <div className="h-28 mb-6 skeleton-loader"></div>
        <div className="h-12 mb-6 skeleton-loader"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-6">
            <div className="h-24 skeleton-loader"></div>
            <div className="h-24 skeleton-loader"></div>
            <div className="h-24 skeleton-loader"></div>
        </div>
        <div className="space-y-3">
            <div className="h-16 skeleton-loader"></div>
            <div className="h-16 skeleton-loader"></div>
            <div className="h-16 skeleton-loader"></div>
            <div className="h-16 skeleton-loader"></div>
        </div>
    </div>
);

const TransactionItem = React.memo(({ transaction, category, categoryPath, onEdit, onDelete, isVisible, accounts }: { transaction: Transaction, category: Category | undefined, categoryPath: string, onEdit: (t: Transaction) => void, onDelete: (id: string) => void, isVisible: boolean, accounts: Account[] }) => {
    const isIncome = transaction.type === TransactionType.INCOME;
    const isTransfer = !!transaction.transferId;
    const isSplit = !!transaction.splitDetails && transaction.splitDetails.length > 0;
    const account = accounts.find(a => a.id === transaction.accountId);
    const formatCurrency = useCurrencyFormatter(undefined, account?.currency);

    return (
        <div className="glass-card p-3 rounded-xl hover-bg-stronger group transition-colors duration-200 flex items-center gap-3 h-full">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {isSplit ? '➗' : (isTransfer ? '↔️' : (category?.icon || (isIncome ? '💰' : '💸')))}
            </div>
            <div className="flex-grow overflow-hidden">
                <div className="flex justify-between items-center">
                    <p className="text-primary truncate font-semibold">{transaction.description}</p>
                    <span className={`font-semibold font-mono text-base flex-shrink-0 ml-2 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isVisible ? `${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}` : '••••'}
                    </span>
                </div>
                <div className="flex justify-between items-center text-xs mt-0.5">
                    <p className="text-secondary truncate">{categoryPath}</p>
                    <p className="text-tertiary truncate">{account?.name}</p>
                </div>
            </div>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                <button onClick={() => onEdit(transaction)} className="p-2 text-tertiary hover:text-sky-400 transition-colors" aria-label="Edit transaction"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                <button onClick={() => onDelete(transaction.id)} className="p-2 text-tertiary hover:text-rose-400 transition-colors" aria-label="Delete transaction"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
        </div>
    );
});


// VIRTUALIZED LIST COMPONENT
const VirtualizedTransactionList = ({ transactions, categories, onEdit, onDelete, isBalanceVisible, mainContentRef, accounts }: Pick<FinanceDisplayProps, 'transactions' | 'categories' | 'onEdit' | 'onDelete' | 'isBalanceVisible' | 'mainContentRef' | 'accounts'>) => {
    const ITEM_HEIGHT = 72; // Adjusted height for new design with p-3
    const HEADER_HEIGHT = 32;
    const OVERSCAN = 5;

    const [scrollTop, setScrollTop] = useState(0);
    const containerHeight = mainContentRef?.current?.clientHeight || window.innerHeight;

    useEffect(() => {
        const container = mainContentRef?.current;
        if (!container) return;
        const handleScroll = () => setScrollTop(container.scrollTop);
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [mainContentRef]);

    const flattenedList = useMemo(() => {
        const grouped = transactions.reduce((acc, t) => {
            const dateKey = t.date.split('T')[0];
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(t);
            return acc;
        }, {} as Record<string, Transaction[]>);

        const flat: { type: 'header' | 'transaction'; data: any; height: number; offsetTop: number; }[] = [];
        let offset = 0;
        Object.keys(grouped).forEach(dateKey => {
            flat.push({ type: 'header', data: dateKey, height: HEADER_HEIGHT, offsetTop: offset });
            offset += HEADER_HEIGHT;
            grouped[dateKey].forEach(t => {
                flat.push({ type: 'transaction', data: t, height: ITEM_HEIGHT, offsetTop: offset });
                offset += ITEM_HEIGHT;
            });
        });
        return flat;
    }, [transactions]);

    const totalHeight = flattenedList[flattenedList.length - 1]?.offsetTop + flattenedList[flattenedList.length - 1]?.height || 0;
    const startIndex = Math.max(0, flattenedList.findIndex(item => item.offsetTop + item.height > scrollTop) - OVERSCAN);
    const endIndex = Math.min(flattenedList.length - 1, flattenedList.findIndex(item => item.offsetTop + item.height > scrollTop + containerHeight) + OVERSCAN);
    
    const visibleItems = flattenedList.slice(startIndex, endIndex + 1);

    return (
        <ul style={{ height: `${totalHeight}px`, position: 'relative' }}>
            {visibleItems.map(item => {
                if (item.type === 'header') {
                    return (
                        <li key={item.data} className="virtual-scroll-item" style={{ transform: `translateY(${item.offsetTop}px)`, height: `${HEADER_HEIGHT}px` }}>
                            <div className="flex items-center h-full px-4" style={{backgroundColor: 'var(--color-bg-app)'}}>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-tertiary">{formatDateGroup(item.data)}</h3>
                            </div>
                        </li>
                    );
                }
                const t: Transaction = item.data;
                const category = getCategory(t.categoryId, categories);
                const categoryPath = getCategoryPath(t.categoryId, categories);
                return (
                    <li key={t.id} className="virtual-scroll-item p-1" style={{ transform: `translateY(${item.offsetTop}px)`, height: `${ITEM_HEIGHT}px`}}>
                        <TransactionItem transaction={t} category={category} categoryPath={categoryPath} onEdit={onEdit} onDelete={onDelete} isVisible={isBalanceVisible} accounts={accounts} />
                    </li>
                );
            })}
        </ul>
    );
};

const FinanceDisplayMemoized: React.FC<FinanceDisplayProps> = ({ status, transactions, allTransactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, onPayRecurring, error, onEdit, onDelete, onSettleDebt, isBalanceVisible, setIsBalanceVisible, dashboardWidgets, mainContentRef, financialProfile, onOpenFinancialHealth, isLoading, onAddTransaction, appState, ...rest }) => {
    
    const dataContext = useContext(AppDataContext);
    
    const DashboardCard = React.memo(({ title, amount, isVisible, color, currency }: {title: string, amount: number, isVisible: boolean, color: 'emerald' | 'rose' | 'primary', currency: string}) => {
        const formatCurrency = useCurrencyFormatter({ notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }, currency);
        const colorClass = {
            emerald: 'text-emerald-400',
            rose: 'text-rose-400',
            primary: 'text-primary'
        }[color];
        return (
            <div className="glass-card p-3 rounded-2xl flex-grow transition-all flex flex-col justify-between h-20">
                <div>
                    <div className="flex items-center text-sm text-secondary">
                        <span>{title}</span>
                    </div>
                </div>
                <p className={`text-xl sm:text-2xl font-bold mt-1 self-end ${colorClass}`}>{isVisible ? formatCurrency(amount) : '••••'}</p>
            </div>
        );
    });

    const CashFlowBar = ({ currency, summary }: { currency: string, summary: { income: number, expense: number } }) => {
        const formatCompact = useCurrencyFormatter({ notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }, currency);
        const total = summary.income + summary.expense;
        const incomePercent = total > 0 ? (summary.income / total) * 100 : 0;
        const expensePercent = total > 0 ? (summary.expense / total) * 100 : 0;
        const formattedIncome = formatCompact(summary.income);
        const formattedExpense = formatCompact(summary.expense);
        return (
            <div className="mt-3 px-1">
                <h4 className="text-sm font-semibold text-secondary mb-2">Cash Flow</h4>
                <div className="w-full flex h-3 rounded-full overflow-hidden bg-subtle border border-divider">
                    <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${incomePercent}%` }} title={`Income: ${formattedIncome}`}></div>
                    <div className="bg-rose-500 transition-all duration-500" style={{ width: `${expensePercent}%` }} title={`Expense: ${formattedExpense}`}></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                    <span className="text-emerald-400">Income: {formattedIncome}</span>
                    <span className="text-rose-400">Expense: {formattedExpense}</span>
                </div>
            </div>
        );
    };

    const currencySummaries = useMemo(() => {
        // 1. Determine active currencies from selected accounts.
        const activeCurrencies = new Set<string>();
        accounts.forEach(acc => {
            if (rest.selectedAccountIds.includes(acc.id)) {
                activeCurrencies.add(acc.currency);
            }
        });
    
        // Initialize summaries for all active currencies to 0
        const summaries: Record<string, { income: number, expense: number, balance: number }> = {};
        activeCurrencies.forEach(currency => {
            summaries[currency] = { income: 0, expense: 0, balance: 0 };
        });
    
        // 2. Filter ALL transactions by the current date range from props.
        let dateFilteredTransactions = allTransactions;
        const now = new Date();
        switch (rest.dateFilter) {
            case 'today':
                dateFilteredTransactions = allTransactions.filter(t => new Date(t.date).toDateString() === now.toDateString());
                break;
            case 'week':
                const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                dateFilteredTransactions = allTransactions.filter(t => new Date(t.date) >= startOfWeek);
                break;
            case 'month':
                dateFilteredTransactions = allTransactions.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear());
                break;
            case 'custom':
                 if (rest.customDateRange.start && rest.customDateRange.end) {
                    const start = rest.customDateRange.start;
                    start.setHours(0,0,0,0);
                    const end = rest.customDateRange.end;
                    end.setHours(23,59,59,999);
                    dateFilteredTransactions = allTransactions.filter(t => new Date(t.date) >= start && new Date(t.date) <= end);
                }
                break;
        }
    
        // 3. Calculate totals for selected accounts using the date-filtered list.
        const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
        for (const t of dateFilteredTransactions) {
            if (rest.selectedAccountIds.includes(t.accountId)) {
                const account = accountMap.get(t.accountId);
                if (account && summaries[account.currency]) {
                    if (t.type === TransactionType.INCOME) {
                        summaries[account.currency].income += t.amount;
                    } else {
                        summaries[account.currency].expense += t.amount;
                    }
                }
            }
        }
        
        // 4. Calculate final balances
        for (const currency in summaries) {
            summaries[currency].balance = summaries[currency].income - summaries[currency].expense;
        }
    
        return Object.entries(summaries).sort(([currA], [currB]) => currA.localeCompare(currB));
    }, [allTransactions, accounts, rest.selectedAccountIds, rest.dateFilter, rest.customDateRange]);

    const Dashboard = ({ income, expense, isVisible, currency }: { income: number, expense: number, isVisible: boolean, currency: string }) => {
        const balance = income - expense;

        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left stagger-delay">
                <div className="sm:col-span-1" style={{ '--stagger-index': 1 } as React.CSSProperties}>
                    <DashboardCard currency={currency} title="Income" amount={income} isVisible={isVisible} color="emerald" />
                </div>
                <div className="sm:col-span-1" style={{ '--stagger-index': 2 } as React.CSSProperties}>
                    <DashboardCard currency={currency} title="Expenses" amount={expense} isVisible={isVisible} color="rose" />
                </div>
                <div className="col-span-2 sm:col-span-1" style={{ '--stagger-index': 3 } as React.CSSProperties}>
                    <DashboardCard currency={currency} title="Balance" amount={balance} isVisible={isVisible} color="primary" />
                </div>
            </div>
        )
    }
    
    const renderContent = () => {
        if (status === ProcessingStatus.ERROR && error) {
            return (
                <div className="bg-rose-900/50 border border-rose-700 text-rose-200 p-4 rounded-xl my-4 text-center animate-scaleIn">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            );
        } return null;
    }

    const visibleWidgets = useMemo(() => dashboardWidgets.filter(w => w.visible), [dashboardWidgets]);
    
    const healthScoreData = { transactions: allTransactions, accounts, investmentHoldings, financialProfile, budgets, goals };

    const summaryWidget = useMemo(() => {
        if (!visibleWidgets.some(w => w.id === 'summary')) return null;

        return currencySummaries.map(([currency, summary]) => (
            <div key={currency} className="mb-3">
                <h3 className="text-lg font-semibold text-secondary mb-2 px-1">{currency} Summary</h3>
                <Dashboard currency={currency} income={summary.income} expense={summary.expense} isVisible={isBalanceVisible} />
                <CashFlowBar currency={currency} summary={summary} />
            </div>
        ));
    }, [currencySummaries, isBalanceVisible, visibleWidgets]);


    const widgetMap: Record<DashboardWidget['id'], React.ReactNode> = {
        financialHealth: <FinancialHealthScore scoreData={healthScoreData} onClick={onOpenFinancialHealth} />,
        aiCoach: <DynamicAIInsights appState={appState} dateFilter={rest.dateFilter} />,
        netWorth: <NetWorthSummary accounts={accounts} allTransactions={allTransactions} holdings={investmentHoldings} isVisible={isBalanceVisible} />,
        portfolio: <PortfolioSummary holdings={investmentHoldings} isVisible={isBalanceVisible} />,
        summary: summaryWidget,
        debts: <DebtsSummary transactions={allTransactions} accounts={accounts} onSettle={onSettleDebt} isVisible={isBalanceVisible}/>,
        upcoming: <UpcomingBills recurringTransactions={recurringTransactions} onPay={onPayRecurring} categories={categories} />,
        goals: <GoalsSummary goals={goals} isVisible={isBalanceVisible} />,
        budgets: <BudgetsSummary budgets={budgets} transactions={allTransactions} categories={categories} isVisible={isBalanceVisible} />,
        charts: (() => {
            // Group transactions by currency
            const transactionsByCurrency: Record<string, Transaction[]> = {};
            const accountMap = new Map(accounts.map(acc => [acc.id, acc]));

            transactions.forEach(t => {
                const currency = accountMap.get(t.accountId)?.currency;
                if (currency) {
                    if (!transactionsByCurrency[currency]) {
                        transactionsByCurrency[currency] = [];
                    }
                    transactionsByCurrency[currency].push(t);
                }
            });

            return Object.entries(transactionsByCurrency).map(([currency, currencyTransactions]) => (
                <div key={currency}>
                    <h4 className="font-semibold text-secondary px-1 mt-4">{currency} Charts</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CategoryPieChart title="Income Sources" transactions={currencyTransactions} categories={categories} type={TransactionType.INCOME} isVisible={isBalanceVisible} currency={currency} />
                        <CategoryPieChart title="Expense Categories" transactions={currencyTransactions} categories={categories} type={TransactionType.EXPENSE} isVisible={isBalanceVisible} currency={currency} />
                    </div>
                </div>
            ));
        })(),
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="px-4">
            <div className="flex justify-between items-center my-4">
                <h2 className="text-xl font-bold text-primary">Dashboard</h2>
                <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="p-2 rounded-full text-secondary hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isBalanceVisible ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" } /></svg>
                </button>
            </div>
            
            <TransactionFilters
                searchQuery={rest.searchQuery} setSearchQuery={rest.setSearchQuery}
                onNaturalLanguageSearch={rest.onNaturalLanguageSearch}
                dateFilter={rest.dateFilter} setDateFilter={rest.setDateFilter}
                customDateRange={rest.customDateRange} setCustomDateRange={rest.setCustomDateRange}
            />

            <div className="mt-4">
                {renderContent()}
                {visibleWidgets.map(widget => <div key={widget.id}>{widgetMap[widget.id]}</div>)}
            </div>

            <div className="mt-4">
                {transactions.length > 0 ? (
                    <VirtualizedTransactionList accounts={accounts} transactions={transactions} categories={categories} onEdit={onEdit} onDelete={onDelete} isBalanceVisible={isBalanceVisible} mainContentRef={mainContentRef} />
                ) : (
                    <EmptyState
                        icon="💸"
                        title={rest.selectedAccountIds.length > 0 ? 'No Transactions Yet' : 'Select an Account'}
                        message={rest.selectedAccountIds.length > 0 ? "Your recent transactions will appear here once you add them." : "Choose an account from the header to see your transactions."}
                        actionText="Add First Transaction"
                        onAction={onAddTransaction}
                    />
                )}
            </div>
        </div>
    );
};
const FinanceDisplay = React.memo(FinanceDisplayMemoized);
export default FinanceDisplay;
