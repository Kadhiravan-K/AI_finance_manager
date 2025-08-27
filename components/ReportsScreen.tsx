import React, { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType, ReportPeriod, CustomDateRange, Account } from '../types';
import CategoryPieChart from './CategoryPieChart';
import CategoryBarChart from './CategoryBarChart';
import TimeSeriesBarChart from './TimeSeriesBarChart';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';
import CustomCheckbox from './CustomCheckbox';

interface ReportsScreenProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  selectedAccountIds: string[]; // This is the dashboard selection, we'll use it as a default
  baseCurrency: string;
}

type ReportType = 'breakdown' | 'trend';

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
    period: ReportPeriod, 
    customDateRange: CustomDateRange, 
    transactionType: TransactionType,
    accountIds: string[],
    categoryIds: string[],
    allCategories: Category[],
    reportCurrency: string
) => {
    const now = new Date();
    let startDate: Date | null = new Date();
    let endDate: Date | null = new Date(now.getTime() + 86400000);

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

    switch (period) {
        case 'week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'custom':
            startDate = customDateRange.start;
            endDate = customDateRange.end ? new Date(customDateRange.end.getTime() + 86400000) : null; // include end date
            break;
    }

    if (startDate) startDate.setHours(0, 0, 0, 0);

    filtered = filtered.filter(t => t.type === transactionType);
    if(startDate) filtered = filtered.filter(t => new Date(t.date) >= startDate!);
    if(endDate) filtered = filtered.filter(t => new Date(t.date) < endDate!);
    
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

  const availableCurrencies = useMemo(() => {
    const currencies = new Set(accounts.map(a => a.currency));
    return Array.from(currencies).map(c => ({ value: c, label: c }));
  }, [accounts]);
  
  const accountsForCurrency = useMemo(() => accounts.filter(a => a.currency === reportCurrency), [accounts, reportCurrency]);

  const filteredTransactions = useMemo(() => {
    return filterTransactions(
      transactions,
      accounts,
      period,
      customDateRange,
      transactionType,
      reportAccountIds,
      categoryIds,
      categories,
      reportCurrency
    );
  }, [transactions, accounts, period, customDateRange, transactionType, reportAccountIds, categoryIds, categories, reportCurrency]);
  
  const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`w-full py-2 text-sm font-semibold rounded-full transition-colors ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary'}`}>
      {children}
    </button>
  );

  return (
    <div className="p-4 flex-grow overflow-y-auto pr-2">
      <h2 className="text-2xl font-bold text-primary mb-4 text-center">Reports</h2>
      
      {/* Filters */}
      <div className="p-4 rounded-xl glass-card space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-subtle border border-divider">
            <TabButton active={transactionType === TransactionType.EXPENSE} onClick={() => setTransactionType(TransactionType.EXPENSE)}>Expense</TabButton>
            <TabButton active={transactionType === TransactionType.INCOME} onClick={() => setTransactionType(TransactionType.INCOME)}>Income</TabButton>
        </div>
         <div className="grid grid-cols-2 gap-4">
            <CustomSelect
                options={availableCurrencies}
                value={reportCurrency}
                onChange={val => { setReportCurrency(val); setReportAccountIds(['all']); }}
            />
            <ReportAccountSelector accounts={accountsForCurrency} selectedIds={reportAccountIds} onChange={setReportAccountIds} />
        </div>
        <CategorySelector categories={categories.filter(c => c.type === transactionType)} selectedIds={categoryIds} onChange={setCategoryIds} />
        <CustomSelect 
            options={[{value: 'week', label: 'This Week'}, {value: 'month', label: 'This Month'}, {value: 'year', label: 'This Year'}, {value: 'custom', label: 'Custom'}]}
            value={period}
            onChange={(val) => setPeriod(val as ReportPeriod)}
        />
        {period === 'custom' && (
            <div className="grid grid-cols-2 gap-4 animate-fadeInUp">
                <CustomDatePicker value={customDateRange.start} onChange={d => setCustomDateRange(p => ({...p, start: d}))} />
                <CustomDatePicker value={customDateRange.end} onChange={d => setCustomDateRange(p => ({...p, end: d}))} />
            </div>
        )}
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-subtle border border-divider">
        <TabButton active={reportType === 'breakdown'} onClick={() => setReportType('breakdown')}>Breakdown</TabButton>
        <TabButton active={reportType === 'trend'} onClick={() => setReportType('trend')}>Trend</TabButton>
      </div>
      
      {reportType === 'breakdown' && (
        <div className="animate-fadeInUp">
          <CategoryPieChart title="Category Overview" transactions={filteredTransactions} categories={categories} type={transactionType} isVisible={true} currency={reportCurrency} />
          <CategoryBarChart title="Top-Level Categories" transactions={filteredTransactions} categories={categories} type={transactionType} />
        </div>
      )}
      
      {reportType === 'trend' && (
        <div className="animate-fadeInUp">
          <TimeSeriesBarChart title="Spending Over Time" transactions={filteredTransactions} period={period} type={transactionType} />
        </div>
      )}
    </div>
  );
};

export default ReportsScreen;