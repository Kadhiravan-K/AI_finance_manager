import React, { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType, ReportPeriod, CustomDateRange, Account } from '../types';
import CategoryPieChart from './CategoryPieChart';
import CategoryBarChart from './CategoryBarChart';
import TimeSeriesBarChart from './TimeSeriesBarChart';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';
import CustomCheckbox from './CustomCheckbox';
import ToggleSwitch from './ToggleSwitch';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface ReportsScreenProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  selectedAccountIds: string[]; // This is the dashboard selection, we'll use it as a default
  baseCurrency: string;
}

type ReportType = 'breakdown' | 'trend';
type ComparePeriodType = 'previous' | 'last_year' | 'last_month' | 'last_quarter' | 'custom';

// A functional AccountSelector for this screen's needs
const ReportAccountSelector: React.FC<{ accounts: Account[], selectedIds: string[], onChange: (ids: string[]) => void }> = ({ accounts, selectedIds, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleSelectionChange = (accountId: string) => {
        let newSelection: string[];
        if (accountId === 'all') {
            newSelection = selectedIds.includes('all') ? [] : ['all'];
        } else {
            const currentSelection = selectedIds.filter(id => id !== 'all');
            if (currentSelection.includes(accountId)) {
                newSelection = currentSelection.filter(id => id !== accountId);
            } else {
                newSelection = [...currentSelection, accountId];
            }
            if (newSelection.length === accounts.length || newSelection.length === 0) {
                newSelection = ['all'];
            }
        }
        onChange(newSelection);
    };
    
     const getButtonLabel = () => {
        if (selectedIds.includes('all') || selectedIds.length === 0) return 'All Accounts';
        if (selectedIds.length === 1) return accounts.find(a => a.id === selectedIds[0])?.name || 'Select Account';
        return `${selectedIds.length} Accounts Selected`;
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full input-base rounded-lg py-2 px-3 text-left flex justify-between items-center">
                <span className="truncate">{getButtonLabel()}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform ${isOpen ? 'rotate-180':''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full glass-card rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto">
                    <div className="p-1"><CustomCheckbox id="rep-acc-all" label="All Accounts" checked={selectedIds.includes('all')} onChange={() => handleSelectionChange('all')} /></div>
                    {accounts.map(acc => (
                         <div key={acc.id} className="p-1"><CustomCheckbox id={`rep-acc-${acc.id}`} label={acc.name} checked={selectedIds.includes('all') || selectedIds.includes(acc.id)} onChange={() => handleSelectionChange(acc.id)} /></div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CategorySelector: React.FC<{ categories: Category[], selectedIds: string[], onChange: (ids: string[]) => void }> = ({ categories, selectedIds, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleSelectionChange = (categoryId: string) => {
        let newSelection: string[];
        if (categoryId === 'all') {
            newSelection = selectedIds.includes('all') ? [] : ['all'];
        } else {
            const currentSelection = selectedIds.filter(id => id !== 'all');
            if (currentSelection.includes(categoryId)) {
                newSelection = currentSelection.filter(id => id !== categoryId);
            } else {
                newSelection = [...currentSelection, categoryId];
            }
            if (newSelection.length === 0 || categories.filter(c => !c.parentId).length === newSelection.length) {
                newSelection = ['all'];
            }
        }
        onChange(newSelection);
    };

    const getButtonLabel = () => {
        if (selectedIds.includes('all') || selectedIds.length === 0) return 'All Categories';
        if (selectedIds.length === 1) return categories.find(c => c.id === selectedIds[0])?.name || '1 Category';
        return `${selectedIds.length} Categories`;
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full input-base rounded-lg py-2 px-3 text-left flex justify-between items-center">
                <span className="truncate">{getButtonLabel()}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform ${isOpen ? 'rotate-180':''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full glass-card rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto">
                    <div className="p-1"><CustomCheckbox id="cat-all" label="All Categories" checked={selectedIds.includes('all')} onChange={() => handleSelectionChange('all')} /></div>
                    {categories.filter(c => !c.parentId).map(cat => (
                         <div key={cat.id} className="p-1"><CustomCheckbox id={`cat-${cat.id}`} label={cat.name} checked={selectedIds.includes('all') || selectedIds.includes(cat.id)} onChange={() => handleSelectionChange(cat.id)} /></div>
                    ))}
                </div>
            )}
        </div>
    )
};


const filterTransactions = (
    transactions: Transaction[], 
    accounts: Account[],
    allCategories: Category[],
    accountIds: string[],
    categoryIds: string[],
    reportCurrency: string,
    period: ReportPeriod, 
    customDateRange: CustomDateRange,
) => {
    let startDate: Date | null = new Date();
    let endDate: Date | null = new Date();
    
    const now = new Date();
    switch (period) {
        case 'week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            endDate = new Date();
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date();
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date();
            break;
        case 'custom':
            startDate = customDateRange.start;
            endDate = customDateRange.end;
            break;
    }

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);

    // Primary currency filter
    const accountsInCurrency = new Set(accounts.filter(a => a.currency === reportCurrency).map(a => a.id));
    let filtered = transactions.filter(t => accountsInCurrency.has(t.accountId));

    // Secondary account filter (within the selected currency)
    if (!accountIds.includes('all')) {
        filtered = filtered.filter(t => accountIds.includes(t.accountId));
    }

    if (!categoryIds.includes('all')) {
        const selectedCategorySet = new Set<string>();
        categoryIds.forEach(catId => {
            const queue = [catId];
            while(queue.length > 0) {
                const currentId = queue.shift()!;
                selectedCategorySet.add(currentId);
                allCategories.forEach(child => {
                    if (child.parentId === currentId) queue.push(child.id);
                });
            }
        });
        filtered = filtered.filter(t => selectedCategorySet.has(t.categoryId));
    }

    if(startDate) filtered = filtered.filter(t => new Date(t.date) >= startDate!);
    if(endDate) filtered = filtered.filter(t => new Date(t.date) <= endDate!);
    
    return filtered;
};

const ReportsScreen: React.FC<ReportsScreenProps> = ({ transactions, categories, accounts, selectedAccountIds, baseCurrency }) => {
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [reportType, setReportType] = useState<ReportType>('breakdown');
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ start: new Date(), end: new Date() });
  const [reportAccountIds, setReportAccountIds] = useState(selectedAccountIds);
  const [categoryIds, setCategoryIds] = useState(['all']);
  const [reportCurrency, setReportCurrency] = useState(baseCurrency);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const formatCurrency = useCurrencyFormatter(undefined, reportCurrency);

  // Comparison state
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [comparePeriodType, setComparePeriodType] = useState<ComparePeriodType>('previous');
  const [compareCustomDateRange, setCompareCustomDateRange] = useState<CustomDateRange>({ start: null, end: null });

  const availableCurrencies = useMemo(() => {
    const currencies = new Set(accounts.map(a => a.currency));
    return Array.from(currencies).map(c => ({ value: c, label: c }));
  }, [accounts]);
  
  const accountsForCurrency = useMemo(() => accounts.filter(a => a.currency === reportCurrency), [accounts, reportCurrency]);

  const { filteredTransactions, compareTransactions } = useMemo(() => {
    const baseTxs = filterTransactions(
      transactions, accounts, categories, reportAccountIds, categoryIds, reportCurrency,
      period, customDateRange
    );

    let compareTxs: Transaction[] = [];
    if (isCompareMode) {
      let compareStartDate: Date | null = null;
      let compareEndDate: Date | null = null;
      
      const getPrimaryDateRange = () => {
          const now = new Date();
          switch (period) {
              case 'week': return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()), end: now };
              case 'month': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
              case 'year': return { start: new Date(now.getFullYear(), 0, 1), end: now };
              case 'custom': return { start: customDateRange.start, end: customDateRange.end };
          }
      };

      const primaryRange = getPrimaryDateRange();
      const now = new Date();

      if (primaryRange.start) {
        if (comparePeriodType === 'previous') {
            const duration = (primaryRange.end?.getTime() || now.getTime()) - primaryRange.start.getTime();
            compareEndDate = new Date(primaryRange.start.getTime() - 1);
            compareStartDate = new Date(compareEndDate.getTime() - duration);
        } else if (comparePeriodType === 'last_month') {
            compareEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
            compareStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        } else if (comparePeriodType === 'last_quarter') {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const lastQuarterStartMonth = currentQuarter * 3 - 3;
            compareStartDate = new Date(now.getFullYear(), lastQuarterStartMonth, 1);
            compareEndDate = new Date(now.getFullYear(), lastQuarterStartMonth + 3, 0);
        } else if (comparePeriodType === 'last_year') {
            compareStartDate = new Date(primaryRange.start);
            compareStartDate.setFullYear(compareStartDate.getFullYear() - 1);
            if (primaryRange.end) {
                compareEndDate = new Date(primaryRange.end);
                compareEndDate.setFullYear(compareEndDate.getFullYear() - 1);
            }
        } else if (comparePeriodType === 'custom') {
            compareStartDate = compareCustomDateRange.start;
            compareEndDate = compareCustomDateRange.end;
        }
      }
      
      compareTxs = filterTransactions(
          transactions, accounts, categories, reportAccountIds, categoryIds, reportCurrency,
          'custom', { start: compareStartDate, end: compareEndDate }
      );
    }
    
    return {
      filteredTransactions: baseTxs,
      compareTransactions: compareTxs,
    };
  }, [
    transactions, accounts, categories, reportAccountIds, categoryIds, reportCurrency,
    period, customDateRange, isCompareMode, comparePeriodType, compareCustomDateRange
  ]);

  const incomeTransactions = filteredTransactions.filter(t => t.type === TransactionType.INCOME);
  const expenseTransactions = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE);
  const compareIncomeTxs = compareTransactions.filter(t => t.type === TransactionType.INCOME);
  const compareExpenseTxs = compareTransactions.filter(t => t.type === TransactionType.EXPENSE);

  const totalPrimary = (transactionType === TransactionType.EXPENSE ? expenseTransactions : incomeTransactions).reduce((sum, t) => sum + t.amount, 0);
  const totalCompare = (transactionType === TransactionType.EXPENSE ? compareExpenseTxs : compareIncomeTxs).reduce((sum, t) => sum + t.amount, 0);
  const percentageChange = totalCompare > 0 ? ((totalPrimary - totalCompare) / totalCompare) * 100 : totalPrimary > 0 ? 100 : 0;
  
  const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`w-full py-2 text-sm font-semibold rounded-full transition-colors ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary'}`}>
      {children}
    </button>
  );
  
  const ChartContainer: React.FC<{children: React.ReactNode}> = ({children}) => <div className={isCompareMode ? 'md:col-span-1' : 'md:col-span-2'}>{children}</div>;
  
  const ReportDataView: React.FC<{txs: Transaction[], title: string}> = ({ txs, title }) => (
    <div className="animate-fadeInUp">
        {title && <h3 className="text-center font-semibold text-secondary mb-2">{title}</h3>}
        {reportType === 'breakdown' ? (
        <>
            <CategoryPieChart title="Category Overview" transactions={txs} categories={categories} type={transactionType} isVisible={true} currency={reportCurrency} />
            <CategoryBarChart title="Top-Level Categories" transactions={txs} categories={categories} type={transactionType} />
        </>
        ) : (
            <TimeSeriesBarChart title="Trend Over Time" transactions={txs} period={period} type={transactionType} />
        )}
    </div>
  );

  return (
    <div className="p-4 flex-grow overflow-y-auto pr-2">
      <h2 className="text-2xl font-bold text-primary mb-4 text-center">Reports</h2>
      
      <div className="rounded-xl glass-card mb-6 relative z-20 overflow-hidden">
        <button type="button" onClick={() => setFiltersOpen(!filtersOpen)} className="w-full p-4 flex justify-between items-center">
            <h3 className="text-lg font-bold text-primary">Filters</h3>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-secondary transition-transform duration-300 ${filtersOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </button>

        {filtersOpen && (
          <div className="p-4 pt-0 space-y-4 animate-fadeInUp">
            <div className="border-t border-divider pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-subtle border border-divider">
                  <TabButton active={transactionType === TransactionType.EXPENSE} onClick={() => setTransactionType(TransactionType.EXPENSE)}>Expense</TabButton>
                  <TabButton active={transactionType === TransactionType.INCOME} onClick={() => setTransactionType(TransactionType.INCOME)}>Income</TabButton>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <CustomSelect options={availableCurrencies} value={reportCurrency} onChange={val => { setReportCurrency(val); setReportAccountIds(['all']); }} />
                  <ReportAccountSelector accounts={accountsForCurrency} selectedIds={reportAccountIds} onChange={setReportAccountIds} />
              </div>
              <CategorySelector categories={categories.filter(c => c.type === transactionType)} selectedIds={categoryIds} onChange={setCategoryIds} />
              <CustomSelect 
                  options={[{value: 'week', label: 'This Week'}, {value: 'month', label: 'This Month'}, {value: 'year', label: 'This Year'}, {value: 'custom', label: 'Custom'}]}
                  value={period} onChange={(val) => setPeriod(val as ReportPeriod)}
              />
              {period === 'custom' && (<div className="grid grid-cols-2 gap-4 animate-fadeInUp"><CustomDatePicker value={customDateRange.start} onChange={d => setCustomDateRange(p => ({...p, start: d}))} /><CustomDatePicker value={customDateRange.end} onChange={d => setCustomDateRange(p => ({...p, end: d}))} /></div>)}
              <div className="pt-2 border-t border-divider"><ToggleSwitch checked={isCompareMode} onChange={setIsCompareMode} label="Compare Periods" /></div>
              {isCompareMode && (
                <div className="space-y-2 animate-fadeInUp">
                  <CustomSelect
                    options={[
                        {value: 'previous', label: 'Previous Period'},
                        {value: 'last_month', label: 'Last Month'},
                        {value: 'last_quarter', label: 'Last Quarter'},
                        {value: 'last_year', label: 'Same Period Last Year'},
                        {value: 'custom', label: 'Custom'}
                    ]}
                    value={comparePeriodType} onChange={(v) => setComparePeriodType(v as ComparePeriodType)}
                  />
                  {comparePeriodType === 'custom' && (<div className="grid grid-cols-2 gap-4"><CustomDatePicker value={compareCustomDateRange.start} onChange={d => setCompareCustomDateRange(p => ({...p, start: d}))} /><CustomDatePicker value={compareCustomDateRange.end} onChange={d => setCompareCustomDateRange(p => ({...p, end: d}))} /></div>)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {isCompareMode && (
          <div className="p-4 rounded-xl glass-card text-center mb-6 animate-fadeInUp">
              <h3 className="font-semibold text-lg text-primary">Comparison Summary</h3>
              <div className="grid grid-cols-3 gap-2 items-center mt-2">
                  <div><p className="text-sm text-secondary">Current</p><p className="font-bold text-xl text-primary">{formatCurrency(totalPrimary)}</p></div>
                  <div><p className="text-sm text-secondary">vs. Previous</p><p className="font-bold text-xl text-primary">{formatCurrency(totalCompare)}</p></div>
                  <div><p className="text-sm text-secondary">Change</p><p className={`font-bold text-xl ${percentageChange >= 0 ? (transactionType === 'income' ? 'text-emerald-400' : 'text-rose-400') : (transactionType === 'income' ? 'text-rose-400' : 'text-emerald-400')}`}>{percentageChange >= 0 ? '▲' : '▼'}{Math.abs(percentageChange).toFixed(1)}%</p></div>
              </div>
          </div>
      )}
      
      <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-subtle border border-divider">
        <TabButton active={reportType === 'breakdown'} onClick={() => setReportType('breakdown')}>Breakdown</TabButton>
        <TabButton active={reportType === 'trend'} onClick={() => setReportType('trend')}>Trend</TabButton>
      </div>
      
      <div className={`grid grid-cols-1 ${isCompareMode ? 'md:grid-cols-2' : ''} gap-4`}>
          <ChartContainer>
            <ReportDataView txs={transactionType === 'expense' ? expenseTransactions : incomeTransactions} title={isCompareMode ? "Current Period" : ""} />
          </ChartContainer>
          {isCompareMode && (
              <ChartContainer>
                <ReportDataView txs={transactionType === 'expense' ? compareExpenseTxs : compareIncomeTxs} title="Comparison Period" />
              </ChartContainer>
          )}
      </div>
    </div>
  );
};

export default ReportsScreen;
