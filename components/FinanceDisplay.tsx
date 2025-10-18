import React, { useMemo, useState, useEffect, useContext } from 'react';
// Fix: Added missing type imports
import { Transaction, TransactionType, DateRange, CustomDateRange, DashboardWidget, AppState, ActiveModal, Category, Account } from '../types';
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
import { getCategoryPath } from '../utils/categories';
import { parseNaturalLanguageQuery } from '../services/geminiService';
import NetWorthTrendChart from './NetWorthTrendChart';
import CategoryPieChart from './CategoryPieChart';

interface FinanceDisplayProps {
  transactions: Transaction[];
  allTransactions: AppState['transactions'];
  accounts: AppState['accounts'];
  categories: AppState['categories'];
  budgets: AppState['budgets'];
  recurringTransactions: AppState['recurringTransactions'];
  goals: AppState['goals'];
  investmentHoldings: AppState['investmentHoldings'];
  onPayRecurring: (item: AppState['recurringTransactions'][0]) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onSettleDebt: (transactionId: string, splitDetailId: string, settlementAccountId: string, amount: number) => void;
  dashboardWidgets: DashboardWidget[];
  financialProfile: AppState['financialProfile'];
  onOpenFinancialHealth: () => void;
  onAddTransaction: () => void;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  baseCurrency: string;
}

const FinanceDisplay: React.FC<FinanceDisplayProps> = (props) => {
  const { transactions, allTransactions, accounts, categories, dashboardWidgets, onEdit } = props;
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange>('month');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ start: null, end: null });
  const formatCurrency = useCurrencyFormatter();
  const dataContext = useContext(AppDataContext);
  
  const onNaturalLanguageSearch = async () => {
      try {
        const result = await parseNaturalLanguageQuery(searchQuery);
        if (result.dateFilter) setDateFilter(result.dateFilter);
        setSearchQuery(result.searchQuery);
      } catch (error) {
          console.error("NLP search failed:", error);
      }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (searchQuery) {
      filtered = filtered.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  }, [transactions, searchQuery]);
  
  const { totalIncome, totalExpenses, netChange } = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) acc.totalIncome += t.amount;
      else acc.totalExpenses += t.amount;
      acc.netChange = acc.totalIncome - acc.totalExpenses;
      return acc;
    }, { totalIncome: 0, totalExpenses: 0, netChange: 0 });
  }, [filteredTransactions]);

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.id) {
      case 'summary': return <PeriodSummary key={widget.id} income={totalIncome} expense={totalExpenses} net={netChange} />;
      case 'netWorth': return <NetWorthSummary key={widget.id} accounts={accounts} allTransactions={allTransactions} holdings={props.investmentHoldings} isVisible={true} />;
      case 'financialHealth': return <FinancialHealthScore key={widget.id} scoreData={props as unknown as AppState} onClick={props.onOpenFinancialHealth} />;
      case 'aiCoach': return <DynamicAIInsights key={widget.id} appState={props as unknown as AppState} dateFilter={dateFilter} />;
      case 'portfolio': return <PortfolioSummary key={widget.id} holdings={props.investmentHoldings} isVisible={true} />;
      case 'goals': return <GoalsSummary key={widget.id} goals={props.goals} isVisible={true} />;
      case 'budgets': return <BudgetsSummary key={widget.id} budgets={props.budgets} transactions={allTransactions} categories={categories} isVisible={true} />;
      case 'upcoming': return <UpcomingBills key={widget.id} recurringTransactions={props.recurringTransactions} onPay={props.onPayRecurring} categories={categories} />;
      case 'debts': return <DebtsSummary key={widget.id} transactions={allTransactions} accounts={accounts} onSettle={props.onSettleDebt} isVisible={true} />;
      case 'netWorthTrend': return <NetWorthTrendChart key={widget.id} transactions={allTransactions} accounts={accounts} currency={props.baseCurrency} />;
      case 'charts': return <CategoryPieChart key={widget.id} title="Expense Breakdown" transactions={filteredTransactions} categories={categories} type={TransactionType.EXPENSE} isVisible={true} />;
      default: return null;
    }
  };

  return (
    <div className="dashboard-grid-container p-4 gap-4">
      <div className="dashboard-widgets-column pb-4 pr-1">
        {dashboardWidgets.filter(w => w.visible).map(renderWidget)}
      </div>
      <div className="transactions-column">
        <div className="flex-shrink-0">
          <TransactionFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onNaturalLanguageSearch={onNaturalLanguageSearch}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
          />
        </div>
        <div className="flex-grow overflow-y-auto mt-4 pr-1">
          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon="🤷"
              title="No Transactions Found"
              message="No transactions match your current filters. Try a different date range or add a new transaction!"
              actionText="Add Transaction"
              onAction={props.onAddTransaction}
            />
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((t, index) => (
                <TransactionItem key={t.id} transaction={t} onEdit={onEdit} categories={categories} accounts={accounts} style={{'--stagger-index': index} as React.CSSProperties} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const PeriodSummary: React.FC<{income: number, expense: number, net: number}> = ({income, expense, net}) => {
    const formatCurrency = useCurrencyFormatter();
    return (
        <div className="mb-6 p-4 rounded-xl glass-card animate-fadeInUp">
            <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-sm text-secondary">Income</p><p className="font-bold text-lg text-emerald-400">{formatCurrency(income)}</p></div>
                <div><p className="text-sm text-secondary">Expenses</p><p className="font-bold text-lg text-rose-400">{formatCurrency(expense)}</p></div>
                <div><p className="font-bold text-lg text-primary">{formatCurrency(net)}</p></div>
            </div>
        </div>
    );
};

const TransactionItem: React.FC<{transaction: Transaction, onEdit: (t: Transaction) => void, categories: Category[], accounts: Account[], style: React.CSSProperties}> = ({transaction: t, onEdit, categories, accounts, style}) => {
    const account = accounts.find(a => a.id === t.accountId);
    const formatCurrency = useCurrencyFormatter(undefined, account?.currency);
    const category = categories.find(c => c.id === t.categoryId);
    return (
        <button onClick={() => onEdit(t)} style={style} className="w-full text-left p-3 glass-card rounded-lg stagger-delay flex justify-between items-center">
            <div className="flex items-center gap-3">
                <span className="text-xl">{category?.icon || '📁'}</span>
                <div>
                    <p className="font-semibold text-primary">{t.description}</p>
                    <p className="text-xs text-secondary">{getCategoryPath(t.categoryId, categories)}</p>
                </div>
            </div>
            <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(t.amount)}</span>
        </button>
    );
};

export default FinanceDisplay;