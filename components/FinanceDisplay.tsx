
import React, { useMemo, useState, useEffect, useContext, useRef } from 'react';
import { ProcessingStatus, Transaction, TransactionType, Category, DateRange, CustomDateRange, Budget, RecurringTransaction, Goal, Account, InvestmentHolding, DashboardWidget, FinancialProfile, AccountType, ActiveScreen, ActiveModal, AppState, AppliedViewOptions, ViewOptions } from '../types';
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
// Fix: Corrected import path for context
import { AppDataContext } from '../contexts/SettingsContext';
import { getCategoryPath } from '../utils/categories';
import { parseNaturalLanguageQuery } from '../services/geminiService';
import NetWorthTrendChart from './NetWorthTrendChart';


interface FinanceDisplayProps {
  transactions: Transaction[];
  allTransactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  goals: Goal[];
  investmentHoldings: InvestmentHolding[];
  onPayRecurring: (item: RecurringTransaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onSettleDebt: (transactionId: string, splitDetailId: string, settlementAccountId: string, amount: number) => void;
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
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
}

const getCategory = (categoryId: string, categories: Category[]): Category | undefined => categories.find(c => c.id === categoryId);

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

const TransactionItem = React.memo(({ transaction, category, categoryPath, onEdit, onDelete, isVisible, accounts, openModal }: { transaction: Transaction, category: Category | undefined, categoryPath: string, onEdit: (t: Transaction) => void, onDelete: (id: string) => void, isVisible: boolean, accounts: Account[], openModal: FinanceDisplayProps['openModal'] }) => {
    const isIncome = transaction.type === TransactionType.INCOME;
    const isTransfer = !!transaction.transferId;
    const isSplit = !!transaction.splitDetails && transaction.splitDetails.length > 0;
    const account = accounts.find(a => a.id === transaction.accountId);
    const formatCurrency = useCurrencyFormatter(undefined, account?.currency);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="glass-card p-3 rounded-xl hover-bg-stronger transition-colors duration-200 flex items-center gap-3 h-full">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {isSplit ? '➗' : (isTransfer ? '↔️' : (category?.icon || (isIncome ? '💰' : '💸')))}
            </div>
            
            <div className="flex-grow overflow-hidden">
                <p className="text-primary truncate font-semibold">{transaction.description}</p>
                <p className="text-secondary truncate text-xs mt-0.5">{categoryPath}</p>
            </div>

            <div className="text-right flex-shrink-0">
                <span className={`font-semibold font-mono text-base ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isVisible ? `${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}` : '••••'}
                </span>
                <p className="text-tertiary truncate text-xs mt-0.5">{account?.name}</p>
            </div>

            <div className="relative flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p); }} className="p-2 text-tertiary hover:text-primary transition-colors rounded-full hover:bg-subtle" aria-label="More options">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                </button>
                {isMenuOpen && (
                    <div ref={menuRef} className="absolute right-0 top-full mt-1 w-48 bg-bg-card-strong rounded-lg shadow-xl z-30 border border-divider p-1 animate-scaleIn" style={{ transformOrigin: 'top right' }}>
                        <button onClick={() => { openModal('editNote', { transaction }); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-primary hover-bg-stronger rounded-md flex items-center gap-3">📝 <span>Edit Note</span></button>
                        <button onClick={() => { onEdit(transaction); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-primary hover-bg-stronger rounded-md flex items-center gap-3">✏️ <span>Edit Transaction</span></button>
                        <button onClick={() => { onDelete(transaction.id); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-rose-400 hover-bg-stronger rounded-md flex items-center gap-3">🗑️ <span>Delete</span></button>
                    </div>
                )}
            </div>
        </div>
    );
});


// VIRTUALIZED LIST COMPONENT
interface VirtualizedTransactionListProps {
    transactions: Transaction[];
    categories: Category[];
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
    isBalanceVisible: boolean;
    mainContentRef?: React.RefObject<HTMLElement>;
    accounts: Account[];
    openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}
const VirtualizedTransactionList = ({ transactions, categories, onEdit, onDelete, isBalanceVisible, mainContentRef, accounts, openModal }: VirtualizedTransactionListProps) => {
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
                        <TransactionItem transaction={t} category={category} categoryPath={categoryPath} onEdit={onEdit} onDelete={onDelete} isVisible={isBalanceVisible} accounts={accounts} openModal={openModal} />
                    </li>
                );
            })}
        </ul>
    );
};

const FinanceDisplayMemoized: React.FC<FinanceDisplayProps> = ({ transactions, allTransactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, onPayRecurring, onEdit, onDelete, onSettleDebt, dashboardWidgets, mainContentRef, financialProfile, onOpenFinancialHealth, isLoading, onAddTransaction, appState, openModal, baseCurrency, ...rest }) => {
    
    const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<DateRange>('month');
    const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ start: new Date(), end: new Date() });
    const [isBalanceVisible, setIsBalanceVisible] = useState(false);

    const [viewOptions, setViewOptions] = useState<AppliedViewOptions>({
        sort: { key: 'date', direction: 'desc' },
        filters: { income: true, expense: true }
    });
    
    const viewOptionsConfig: ViewOptions = {
        sortOptions: [
            { key: 'date', label: 'Date' },
            { key: 'amount', label: 'Amount' },
        ],
        filterOptions: [
            { key: 'income', label: 'Income', type: 'toggle' },
            { key: 'expense', label: 'Expense', type: 'toggle' },
        ]
    };
    
    const isViewOptionsApplied = useMemo(() => {
        return viewOptions.sort.key !== 'date' || viewOptions.sort.direction !== 'desc' || viewOptions.filters.income === false || viewOptions.filters.expense === false;
    }, [viewOptions]);

    const sortedAndFilteredTransactions = useMemo(() => {
        let result = [...transactions];

        // Apply filters
        if (viewOptions.filters.income === false) result = result.filter(t => t.type !== 'income');
        if (viewOptions.filters.expense === false) result = result.filter(t => t.type !== 'expense');

        // Apply sorters
        const { key, direction } = viewOptions.sort;
        result.sort((a, b) => {
            let comparison = 0;
            if (key === 'date') {
                comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
            } else if (key === 'amount') {
                comparison = b.amount - a.amount;
            }
            return direction === 'desc' ? comparison : -comparison;
        });

        return result;
    }, [transactions, viewOptions]);
        
    const handleNaturalLanguageSearch = async () => {
      if (!searchQuery.trim()) return;
      setStatus(ProcessingStatus.PROCESSING);
      setError('');
      try {
        const result = await parseNaturalLanguageQuery(searchQuery);
        setSearchQuery(result.searchQuery || '');
        if (result.dateFilter) {
          setDateFilter(result.dateFilter);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'AI search failed');
      } finally {
        setStatus(ProcessingStatus.IDLE);
      }
    };
    
    const DashboardCard = React.memo(({ title, amount, isVisible, color, currency }: {title: string, amount: number, isVisible: boolean, color: 'emerald' | 'rose' | 'primary', currency: string}) => {
        const formatCurrency = useCurrencyFormatter({ notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }, currency);
        const colorClass = {
            emerald: 'text-emerald-400',
            rose: 'text-rose-400',
            primary: 'text-primary'
        }[color];
        return (
            <div className="glass-card p-3 rounded-2xl flex-grow transition-all flex flex-col justify-between h-20 interactive-card">
                 <div className="glow-effect"></div>
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
        // 1. Get transactions for the currently selected accounts
        const selectedTransactions = allTransactions.filter(t => rest.selectedAccountIds.includes('all') || rest.selectedAccountIds.includes(t.accountId));

        // 2. Determine active currencies from those transactions.
        const accountMap = new Map(accounts.map(acc => [acc.id, acc.currency]));
        const activeCurrencies = new Set<string>();
        selectedTransactions.forEach(t => {
            const currency = accountMap.get(t.accountId);
            if (currency) activeCurrencies.add(currency);
        });
    
        // 3. Initialize summaries for all active currencies to 0
        const summaries: Record<string, { income: number, expense: number, balance: number }> = {};
        activeCurrencies.forEach(currency => {
            summaries[currency] = { income: 0, expense: 0, balance: 0 };
        });
    
        // 4. Filter selected transactions by the current date range
        let dateFilteredTransactions = selectedTransactions;
        const now = new Date();
        switch (dateFilter) {
            case 'today':
                dateFilteredTransactions = selectedTransactions.filter(t => new Date(t.date).toDateString() === now.toDateString());
                break;
            case 'week':
                const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                dateFilteredTransactions = selectedTransactions.filter(t => new Date(t.date) >= startOfWeek);
                break;
            case 'month':
                dateFilteredTransactions = selectedTransactions.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear());
                break;
            case 'custom':
                 if (customDateRange.start && customDateRange.end) {
                    const start = customDateRange.start;
                    start.setHours(0,0,0,0);
                    const end = customDateRange.end;
                    end.setHours(23,59,59,999);
                    dateFilteredTransactions = selectedTransactions.filter(t => new Date(t.date) >= start && new Date(t.date) <= end);
                }
                break;
        }
    
        // 5. Calculate totals for each currency using the date-filtered list.
        for (const t of dateFilteredTransactions) {
            const currency = accountMap.get(t.accountId);
            if (currency && summaries[currency]) {
                if (t.type === TransactionType.INCOME) {
                    summaries[currency].income += t.amount;
                } else {
                    summaries[currency].expense += t.amount;
                }
            }
        }
        
        // 6. Calculate final balances
        for (const currency in summaries) {
            summaries[currency].balance = summaries[currency].income - summaries[currency].expense;
        }
    
        // Fix: Cast the result of Object.entries to ensure correct type inference downstream.
        return (Object.entries(summaries) as [string, { income: number; expense: number; balance: number }][]).sort(([currA], [currB]) => currA.localeCompare(currB));
    }, [allTransactions, accounts, rest.selectedAccountIds, dateFilter, customDateRange]);

    const Dashboard = ({ income, expense, isVisible, currency }: { income: number, expense: number, isVisible: boolean, currency: string }) => {
        const balance = income - expense;

        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
                <div className="sm:col-span-1 stagger-delay" style={{ '--stagger-index': 1 } as React.CSSProperties}>
                    <DashboardCard currency={currency} title="Income" amount={income} isVisible={isVisible} color="emerald" />
                </div>
                <div className="sm:col-span-1 stagger-delay" style={{ '--stagger-index': 2 } as React.CSSProperties}>
                    <DashboardCard currency={currency} title="Expenses" amount={expense} isVisible={isVisible} color="rose" />
                </div>
                <div className="col-span-2 sm:col-span-1 stagger-delay" style={{ '--stagger-index': 3 } as React.CSSProperties}>
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
        aiCoach: <DynamicAIInsights appState={appState} dateFilter={dateFilter} />,
        netWorth: <NetWorthSummary accounts={accounts} allTransactions={allTransactions} holdings={investmentHoldings} isVisible={isBalanceVisible} />,
        netWorthTrend: <NetWorthTrendChart transactions={allTransactions} accounts={accounts} currency={baseCurrency} />,
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
        <div className="px-4 dashboard-grid-container">
            <div className="dashboard-widgets-column">
              <div className="flex justify-between items-center my-4">
                  <h2 className="text-xl font-bold text-primary">Dashboard</h2>
                  <div className="flex items-center gap-1">
                      <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="p-2 rounded-full text-secondary hover:text-primary transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isBalanceVisible ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" } /></svg>
                      </button>
                      <button onClick={() => openModal('viewOptions', { options: viewOptionsConfig, currentValues: viewOptions, onApply: setViewOptions })} className="p-2 rounded-full text-secondary hover:text-primary transition-colors relative">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 10h12M3 16h6" /> </svg>
                          {isViewOptionsApplied && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full"></div>}
                      </button>
                  </div>
              </div>
              
              <TransactionFilters
                  searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                  onNaturalLanguageSearch={handleNaturalLanguageSearch}
                  dateFilter={dateFilter} setDateFilter={setDateFilter}
                  customDateRange={customDateRange} setCustomDateRange={setCustomDateRange}
              />

              <div className="mt-4">
                  {renderContent()}
                  {visibleWidgets.map(widget => <div key={widget.id}>{widgetMap[widget.id as keyof typeof widgetMap]}</div>)}
              </div>
            </div>

            <div className="transactions-column">
                <h3 className="text-xl font-bold text-primary my-4">Recent Transactions</h3>
                <div className="flex-grow overflow-y-auto">
                    {transactions.length > 0 ? (
                        <VirtualizedTransactionList accounts={accounts} transactions={sortedAndFilteredTransactions} categories={categories} onEdit={onEdit} onDelete={onDelete} isBalanceVisible={isBalanceVisible} mainContentRef={mainContentRef} openModal={openModal} />
                    ) : (
                        <EmptyState
                            icon="💸"
                            title={rest.selectedAccountIds.includes('all') || rest.selectedAccountIds.length > 0 ? 'No Transactions Yet' : 'Select an Account'}
                            message={rest.selectedAccountIds.includes('all') || rest.selectedAccountIds.length > 0 ? "Your recent transactions will appear here once you add them." : "Choose an account from the header to see your transactions."}
                            actionText="Add First Transaction"
                            onAction={onAddTransaction}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
const FinanceDisplay = React.memo(FinanceDisplayMemoized);
export default FinanceDisplay;
