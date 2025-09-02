import React, { useMemo, useState, useEffect } from 'react';
import { ProcessingStatus, Transaction, TransactionType, Category, DateRange, CustomDateRange, Budget, RecurringTransaction, Goal, Account, InvestmentHolding, DashboardWidget, FinancialProfile, AccountType } from '../types';
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
    const isIncome = transaction.type === TransactionType.INCOME, isTransfer = !!transaction.transferId, isSplit = !!transaction.splitDetails && transaction.splitDetails.length > 0;
    const account = accounts.find(a => a.id === transaction.accountId);
    const formatCurrency = useCurrencyFormatter(undefined, account?.currency);
    const totalOwed = isSplit ? transaction.splitDetails?.filter(s => s.personName.toLowerCase() !== 'you' && !s.isSettled).reduce((acc, s) => acc + s.amount, 0) : 0;
    return (
        <li className="flex flex-col glass-card p-3 rounded-xl group">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 overflow-hidden">
                    <div className="transaction-item-icon">{isSplit ? '➗' : (isTransfer ? '↔️' : (category?.icon || (isIncome ? '💰' : '💸')))}</div>
                    <div className="overflow-hidden">
                        <p className="text-primary truncate font-medium">{transaction.description}</p>
                        <p className="text-xs text-tertiary">{categoryPath}</p>
                        {transaction.notes && <p className="text-xs text-secondary/70 truncate italic mt-1">Note: {transaction.notes}</p>}
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="font-semibold" style={{ color: isIncome ? 'var(--color-accent-emerald)' : 'var(--color-accent-rose)' }}>{isVisible ? `${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}` : '••••'}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                        <button onClick={() => onEdit(transaction)} className="p-1 text-secondary hover:text-primary" aria-label="Edit transaction"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg></button>
                        <button onClick={() => onDelete(transaction.id)} className="p-1 text-secondary" style={{ '--hover-color': 'var(--color-accent-rose)' } as React.CSSProperties} onMouseOver={e => e.currentTarget.style.color = 'var(--hover-color)'} onMouseOut={e => e.currentTarget.style.color = ''} aria-label="Delete transaction"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                </div>
            </div>
             {isSplit && totalOwed > 0 && <div className="mt-2 pl-16 text-xs" style={{ color: 'var(--color-accent-yellow)' }}>Owed to you: {isVisible ? formatCurrency(totalOwed) : '••••'}</div>}
        </li>
    );
});

// VIRTUALIZED LIST COMPONENT
const VirtualizedTransactionList = ({ transactions, categories, onEdit, onDelete, isBalanceVisible, mainContentRef, accounts }: Pick<FinanceDisplayProps, 'transactions' | 'categories' | 'onEdit' | 'onDelete' | 'isBalanceVisible' | 'mainContentRef' | 'accounts'>) => {
    const ITEM_HEIGHT = 92; // Estimated height for a transaction item
    const HEADER_HEIGHT = 40; // Estimated height for a date header
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
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            {visibleItems.map(item => {
                if (item.type === 'header') {
                    return (
                        <div key={item.data} className="virtual-scroll-item" style={{ transform: `translateY(${item.offsetTop}px)` }}>
                            <div className="sticky-header" style={{top: 0}}>
                                <h3 className="font-semibold text-secondary text-sm">{formatDateGroup(item.data)}</h3>
                            </div>
                        </div>
                    );
                }
                const t: Transaction = item.data;
                const category = getCategory(t.categoryId, categories);
                const categoryPath = getCategoryPath(t.categoryId, categories);
                return (
                    <div key={t.id} className="virtual-scroll-item" style={{ transform: `translateY(${item.offsetTop}px)`, height: `${ITEM_HEIGHT}px`, paddingTop: '0.75rem'}}>
                        <TransactionItem transaction={t} category={category} categoryPath={categoryPath} onEdit={onEdit} onDelete={onDelete} isVisible={isBalanceVisible} accounts={accounts} />
                    </div>
                );
            })}
        </div>
    );
};

const FinanceDisplayMemoized: React.FC<FinanceDisplayProps> = ({ status, transactions, allTransactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, onPayRecurring, error, onEdit, onDelete, onSettleDebt, isBalanceVisible, setIsBalanceVisible, dashboardWidgets, mainContentRef, financialProfile, onOpenFinancialHealth, isLoading, onAddTransaction, ...rest }) => {
    
    const DashboardCard = React.memo(({ title, amount, isVisible, color, currency }: {title: string, amount: number, isVisible: boolean, color: 'emerald' | 'rose' | 'primary', currency: string}) => {
        const formatCurrency = useCurrencyFormatter({ notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }, currency);
        const colorClass = {
            emerald: 'text-emerald-400',
            rose: 'text-rose-400',
            primary: 'text-primary'
        }[color];
        return (
            <div className="glass-card p-4 rounded-2xl flex-grow transition-all flex flex-col justify-between h-28">
                <div>
                    <div className="flex items-center text-base text-secondary">
                        <span>{title}</span>
                    </div>
                </div>
                <p className={`text-3xl lg:text-4xl font-bold mt-1 self-end ${colorClass}`}>{isVisible ? formatCurrency(amount) : '••••'}</p>
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
            <div className="mt-4 px-1">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left stagger-delay">
                 <div style={{ '--stagger-index': 1 } as React.CSSProperties}>
                    <DashboardCard currency={currency} title="Income" amount={income} isVisible={isVisible} color="emerald" />
                </div>
                <div style={{ '--stagger-index': 2 } as React.CSSProperties}>
                    <DashboardCard currency={currency} title="Expenses" amount={expense} isVisible={isVisible} color="rose" />
                </div>
                <div style={{ '--stagger-index': 3 } as React.CSSProperties}>
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
            <div key={currency} className="mb-4">
                <h3 className="text-lg font-semibold text-secondary mb-2 px-1">{currency} Summary</h3>
                <Dashboard currency={currency} income={summary.income} expense={summary.expense} isVisible={isBalanceVisible} />
                <CashFlowBar currency={currency} summary={summary} />
            </div>
        ));
    }, [currencySummaries, isBalanceVisible, visibleWidgets]);


    const widgetMap: Record<DashboardWidget['id'], React.ReactNode> = {
        financialHealth: <FinancialHealthScore scoreData={healthScoreData} onClick={onOpenFinancialHealth} />,
        aiCoach: <DynamicAIInsights transactions={transactions} categories={categories} dateFilter={rest.dateFilter} />,
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

            <div className="mt-6">
                {renderContent()}
                {visibleWidgets.map(widget => <div key={widget.id}>{widgetMap[widget.id]}</div>)}
            </div>

            <div className="mt-6">
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