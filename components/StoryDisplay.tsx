import React, { useMemo, useState, useEffect } from 'react';
import { ProcessingStatus, Transaction, TransactionType, Category, DateRange, CustomDateRange, Budget, RecurringTransaction, Goal, Account, InvestmentHolding, DashboardWidget, FinancialProfile } from '../types';
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
  onSettleDebt: (transactionId: string, splitDetailId: string, settlementAccountId: string) => void;
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
  isInsightLoading: boolean;
  mainContentRef?: React.RefObject<HTMLElement>;
  financialProfile: FinancialProfile;
  onOpenFinancialHealth: () => void;
  selectedAccountIds: string[];
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

const DashboardCard = ({ title, amount, color, isVisible, children, style, currency }: {title: string, amount: number, color: string, isVisible: boolean, children: React.ReactNode, style?: React.CSSProperties, currency: string}) => {
    const formatCurrency = useCurrencyFormatter(undefined, currency);
    return (
        <div style={style} className={`p-4 rounded-xl glass-card`}>
            <div className="flex items-center justify-between text-sm text-secondary mb-1">
              <span>{title}</span>
              {children}
            </div>
            <p className="text-2xl font-bold" style={{ color }}>{isVisible ? formatCurrency(amount) : '••••'}</p>
        </div>
    );
};


const Dashboard = ({ income, expense, isVisible, currency }: { income: number, expense: number, isVisible: boolean, currency: string }) => {
    const balance = income - expense;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-6 stagger-delay">
            <DashboardCard currency={currency} title="Income" amount={income} color="var(--color-accent-emerald)" isVisible={isVisible} style={{ '--stagger-index': 1 } as React.CSSProperties}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--color-accent-emerald)"}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></DashboardCard>
            <DashboardCard currency={currency} title="Expenses" amount={expense} color="var(--color-accent-rose)" isVisible={isVisible} style={{ '--stagger-index': 2 } as React.CSSProperties}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--color-accent-rose)"}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" /></svg></DashboardCard>
            <DashboardCard currency={currency} title="Balance" amount={balance} color={balance >= 0 ? 'var(--color-text-primary)' : 'var(--color-accent-rose)'} isVisible={isVisible} style={{ '--stagger-index': 3 } as React.CSSProperties}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 6-3 6m18-12l-3 6 3 6" /></svg></DashboardCard>
        </div>
    );
}

const TransactionItem = ({ transaction, category, categoryPath, onEdit, onDelete, isVisible }: { transaction: Transaction, category: Category | undefined, categoryPath: string, onEdit: (t: Transaction) => void, onDelete: (id: string) => void, isVisible: boolean }) => {
    const isIncome = transaction.type === TransactionType.INCOME, isTransfer = !!transaction.transferId, isSplit = !!transaction.splitDetails && transaction.splitDetails.length > 0;
    const formatCurrency = useCurrencyFormatter();
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
};

// VIRTUALIZED LIST COMPONENT
const VirtualizedTransactionList = ({ transactions, categories, onEdit, onDelete, isBalanceVisible, mainContentRef }: Pick<FinanceDisplayProps, 'transactions' | 'categories' | 'onEdit' | 'onDelete' | 'isBalanceVisible' | 'mainContentRef'>) => {
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
                        <TransactionItem transaction={t} category={category} categoryPath={categoryPath} onEdit={onEdit} onDelete={onDelete} isVisible={isBalanceVisible} />
                    </div>
                );
            })}
        </div>
    );
};

const FinanceDisplay: React.FC<FinanceDisplayProps> = ({ status, transactions, allTransactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, onPayRecurring, error, onEdit, onDelete, onSettleDebt, isBalanceVisible, setIsBalanceVisible, dashboardWidgets, isInsightLoading, mainContentRef, financialProfile, onOpenFinancialHealth, selectedAccountIds, ...filterProps }) => {
    
    const currencySummaries = useMemo(() => {
        // 1. Determine active currencies from selected accounts to ensure cards are always shown.
        const activeCurrencies = new Set<string>();
        if (selectedAccountIds.includes('all')) {
            accounts.forEach(acc => activeCurrencies.add(acc.currency));
        } else {
            accounts.forEach(acc => {
                if (selectedAccountIds.includes(acc.id)) {
                    activeCurrencies.add(acc.currency);
                }
            });
        }
    
        // Initialize summaries for all active currencies to 0
        const summaries: Record<string, { income: number, expense: number, balance: number }> = {};
        activeCurrencies.forEach(currency => {
            summaries[currency] = { income: 0, expense: 0, balance: 0 };
        });
    
        // 2. Filter ALL transactions by the current date range from props.
        let dateFilteredTransactions = allTransactions;
        const now = new Date();
        switch (filterProps.dateFilter) {
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
                 if (filterProps.customDateRange.start && filterProps.customDateRange.end) {
                    const start = filterProps.customDateRange.start;
                    start.setHours(0,0,0,0);
                    const end = filterProps.customDateRange.end;
                    end.setHours(23,59,59,999);
                    dateFilteredTransactions = allTransactions.filter(t => new Date(t.date) >= start && new Date(t.date) <= end);
                }
                break;
        }
    
        // 3. Calculate totals for selected accounts using the date-filtered list.
        const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
        for (const t of dateFilteredTransactions) {
            if (selectedAccountIds.includes('all') || selectedAccountIds.includes(t.accountId)) {
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
    }, [allTransactions, accounts, selectedAccountIds, filterProps.dateFilter, filterProps.customDateRange]);
    
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
            </div>
        ));
    }, [currencySummaries, isBalanceVisible, visibleWidgets]);


    const widgetMap: Record<DashboardWidget['id'], React.ReactNode> = {
        financialHealth: <FinancialHealthScore scoreData={healthScoreData} onClick={onOpenFinancialHealth} />,
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

    return (
        <div className="px-4">
            <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold text-primary">Dashboard</h2>
                <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="p-2 text-secondary hover:text-primary" aria-label="Toggle balance visibility">
                    {isBalanceVisible ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.05 10.05 0 015.396-6.175M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 2l20 20" /></svg>}
                </button>
            </div>
            {renderContent()}

            {visibleWidgets.map(widget => <div key={widget.id}>{widgetMap[widget.id]}</div>)}

            <div className="my-6 relative z-20"><TransactionFilters {...filterProps} /></div>
            
            {status === ProcessingStatus.LOADING && (
                <div className="text-center text-secondary p-4 animate-pulse"><p>Analyzing transaction...</p></div>
            )}
            
            {transactions.length > 0 && (
                <VirtualizedTransactionList
                    transactions={transactions} categories={categories} onEdit={onEdit}
                    onDelete={onDelete} isBalanceVisible={isBalanceVisible} mainContentRef={mainContentRef}
                />
            )}
            
            {transactions.length === 0 && status !== ProcessingStatus.LOADING && (
                 allTransactions.length === 0 ? (
                    <div className="text-center text-secondary p-8 rounded-xl glass-card mt-4 border border-dashed border-divider">
                        <p className="text-2xl mb-4">👋</p>
                        <p className="font-semibold text-primary text-lg">Welcome to Finance Hub!</p>
                        <p className="text-sm">Click the big '+' button below to add your first transaction.</p>
                    </div>
                ) : (
                    <div className="text-center text-secondary p-8 rounded-xl glass-card mt-4 border border-dashed border-divider">
                        <p className="font-semibold text-primary">No transactions match your filters.</p>
                        <p className="text-sm">Try adjusting your search or date range!</p>
                    </div>
                )
            )}
        </div>
    );
};

export default FinanceDisplay;