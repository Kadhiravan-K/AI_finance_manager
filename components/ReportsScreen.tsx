import React, { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType, ReportPeriod, CustomDateRange, Account } from '../types';
import CategoryPieChart from './CategoryPieChart';
import CategoryBarChart from './CategoryBarChart';
import TimeSeriesBarChart from './TimeSeriesBarChart';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';
import AccountSelector from './AccountSelector';
import CategorySelector from './CategorySelector';

interface ReportsScreenProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  selectedAccountIds: string[];
  baseCurrency: string;
}

type ReportType = 'breakdown' | 'trend';

const filterTransactions = (
    transactions: Transaction[], 
    period: ReportPeriod, 
    customDateRange: CustomDateRange, 
    transactionType: TransactionType,
    accountIds: string[],
    categoryIds: string[],
    allCategories: Category[]
) => {
    const now = new Date();
    let startDate: Date | null = new Date();
    let endDate: Date | null = new Date(now.getTime() + 86400000);

    let filtered = accountIds.includes('all')
      ? transactions
      : transactions.filter(t => accountIds.includes(t.accountId));

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
      case 'week': startDate.setDate(now.getDate() - now.getDay()); break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
      case 'custom':
        startDate = customDateRange.start;
        endDate = customDateRange.end ? new Date(customDateRange.end.getTime() + 86400000) : null;
        break;
    }
    
    if (startDate) startDate.setHours(0, 0, 0, 0);

    return filtered.filter(t => {
        const transactionDate = new Date(t.date);
        const typeMatch = t.type === transactionType;
        const startDateMatch = startDate ? transactionDate >= startDate : true;
        const endDateMatch = endDate ? transactionDate < endDate : true;
        return typeMatch && startDateMatch && endDateMatch;
    });
};

const ReportsScreen: React.FC<ReportsScreenProps> = ({ transactions, categories, accounts, selectedAccountIds: dashboardSelectedAccountIds, baseCurrency }) => {
  const [reportType, setReportType] = useState<ReportType>('breakdown');
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [reportAccountIds, setReportAccountIds] = useState<string[]>(dashboardSelectedAccountIds);
  const [reportCategoryIds, setReportCategoryIds] = useState<string[]>(['all']);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ start: null, end: null });

  const filteredTransactions = useMemo(() => 
    filterTransactions(transactions, period, customDateRange, transactionType, reportAccountIds, reportCategoryIds, categories), 
    [transactions, period, customDateRange, transactionType, reportAccountIds, reportCategoryIds, categories]
  );
  
  const TabButton = ({ active, children, onClick, activeClass = 'bg-emerald-500 text-white' }: { active: boolean, children: React.ReactNode, onClick: () => void, activeClass?: string}) => (
    <button onClick={onClick} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors w-full ${active ? activeClass : 'bg-subtle text-primary hover-bg-stronger'}`}>
      {children}
    </button>
  );
  
  const periodOptions: {value: ReportPeriod, label: string}[] = [
      {value: 'week', label: 'This Week'},
      {value: 'month', label: 'This Month'},
      {value: 'year', label: 'This Year'},
      {value: 'custom', label: 'Custom'},
  ];
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Reports</h2>
            <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="button-secondary text-sm px-3 py-1.5 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L12 14.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 016 17V4a1 1 0 011-1z" /></svg>
                Filters
            </button>
        </div>
        {isFiltersOpen && (
             <div className="p-4 bg-subtle rounded-lg border border-divider space-y-4 animate-fadeInUp">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-semibold text-tertiary block mb-1">View Type</label>
                        <div className="flex items-center gap-1 bg-subtle p-1 rounded-full border border-divider">
                            <TabButton active={reportType === 'breakdown'} onClick={() => setReportType('breakdown')}>Breakdown</TabButton>
                            <TabButton active={reportType === 'trend'} onClick={() => setReportType('trend')}>Trend</TabButton>
                        </div>
                    </div>
                     <div>
                         <label className="text-xs font-semibold text-tertiary block mb-1">Transaction Type</label>
                         <div className="flex items-center gap-1 bg-subtle p-1 rounded-full border border-divider">
                            <TabButton active={transactionType === TransactionType.EXPENSE} onClick={() => setTransactionType(TransactionType.EXPENSE)} activeClass="bg-rose-500 text-white">Expenses</TabButton>
                            <TabButton active={transactionType === TransactionType.INCOME} onClick={() => setTransactionType(TransactionType.INCOME)} activeClass="bg-emerald-500 text-white">Income</TabButton>
                         </div>
                    </div>
                </div>
                 <div>
                    <label className="text-xs font-semibold text-tertiary block mb-1">Period</label>
                    <CustomSelect options={periodOptions} value={period} onChange={(v) => setPeriod(v as ReportPeriod)} />
                 </div>
                {period === 'custom' && (
                    <div className="flex items-center justify-center gap-2 animate-fadeInUp">
                        <CustomDatePicker value={customDateRange.start} onChange={date => setCustomDateRange({...customDateRange, start: date})} />
                        <span className="text-secondary text-sm">to</span>
                        <CustomDatePicker value={customDateRange.end} onChange={date => setCustomDateRange({...customDateRange, end: date})} />
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-tertiary block mb-1">Accounts</label>
                        <AccountSelector accounts={accounts} selectedAccountIds={reportAccountIds} onAccountChange={setReportAccountIds} onAddAccount={()=>{}} onEditAccount={()=>{}} onDeleteAccount={()=>{}} baseCurrency={baseCurrency} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-tertiary block mb-1">Categories</label>
                        <CategorySelector categories={categories.filter(c => c.type === transactionType)} selectedCategoryIds={reportCategoryIds} onCategoryChange={setReportCategoryIds} />
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        {filteredTransactions.length === 0 ? <p className="text-center text-secondary py-8">No data for the selected filters.</p> :
          <>
            {reportType === 'breakdown' && <><CategoryPieChart title="" transactions={filteredTransactions} categories={categories} type={transactionType} isVisible={true} /><CategoryBarChart title="" transactions={filteredTransactions} categories={categories} type={transactionType} /></>}
            {reportType === 'trend' && <TimeSeriesBarChart title="" transactions={filteredTransactions} period={period} type={transactionType} />}
          </>
        }
      </div>
    </div>
  );
};

export default ReportsScreen;