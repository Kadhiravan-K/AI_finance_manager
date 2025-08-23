import React, { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType, ReportPeriod, CustomDateRange } from '../types';
import CategoryPieChart from './CategoryPieChart';
import CategoryBarChart from './CategoryBarChart';
import TimeSeriesBarChart from './TimeSeriesBarChart';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';
import ToggleSwitch from './ToggleSwitch';

interface ReportsScreenProps {
  transactions: Transaction[];
  categories: Category[];
}

type ReportType = 'breakdown' | 'trend';

const filterTransactionsByPeriod = (
    transactions: Transaction[], 
    period: ReportPeriod, 
    customDateRange: CustomDateRange, 
    transactionType: TransactionType
) => {
    const now = new Date();
    let startDate: Date | null = new Date();
    let endDate: Date | null = new Date(now.getTime() + 86400000);

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

    return transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const typeMatch = t.type === transactionType;
        const startDateMatch = startDate ? transactionDate >= startDate : true;
        const endDateMatch = endDate ? transactionDate < endDate : true;
        return typeMatch && startDateMatch && endDateMatch;
    });
};

const ReportsScreen: React.FC<ReportsScreenProps> = ({ transactions, categories }) => {
  const [reportType, setReportType] = useState<ReportType>('breakdown');
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [isCompareMode, setIsCompareMode] = useState(false);

  // Filter Set 1
  const [period1, setPeriod1] = useState<ReportPeriod>('month');
  const [customDateRange1, setCustomDateRange1] = useState<CustomDateRange>({ start: null, end: null });
  // Filter Set 2
  const [period2, setPeriod2] = useState<ReportPeriod>('month');
  const [customDateRange2, setCustomDateRange2] = useState<CustomDateRange>({ start: null, end: null });

  const filteredTransactions1 = useMemo(() => filterTransactionsByPeriod(transactions, period1, customDateRange1, transactionType), [transactions, period1, customDateRange1, transactionType]);
  const filteredTransactions2 = useMemo(() => isCompareMode ? filterTransactionsByPeriod(transactions, period2, customDateRange2, transactionType) : [], [isCompareMode, transactions, period2, customDateRange2, transactionType]);

  const TabButton = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void}) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors w-full ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`}>
      {children}
    </button>
  );
  
  const periodOptions: {value: ReportPeriod, label: string}[] = [
      {value: 'week', label: 'This Week'},
      {value: 'month', label: 'This Month'},
      {value: 'year', label: 'This Year'},
      {value: 'custom', label: 'Custom'},
  ];
  
  const getTitle = (period: ReportPeriod) => {
    const type = transactionType.charAt(0).toUpperCase() + transactionType.slice(1);
    const periodLabel = periodOptions.find(p => p.value === period)?.label || 'Custom Range';
    if(period === 'custom') return `${type} for Custom Range`;
    return `${periodLabel}'s ${type}`;
  }
  
  const renderFilterControls = (period: ReportPeriod, setPeriod: (p: ReportPeriod) => void, customRange: CustomDateRange, setCustomRange: (cr: CustomDateRange) => void) => (
      <div className="flex-1 space-y-2">
          <CustomSelect options={periodOptions} value={period} onChange={(v) => setPeriod(v as ReportPeriod)} />
          {period === 'custom' && (
              <div className="flex items-center justify-center gap-2 animate-fadeInUp">
                  <CustomDatePicker value={customRange.start} onChange={date => setCustomRange({...customRange, start: date})} />
                  <span className="text-secondary text-sm">to</span>
                  <CustomDatePicker value={customRange.end} onChange={date => setCustomRange({...customRange, end: date})} />
              </div>
          )}
      </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex flex-col gap-4 bg-subtle">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex w-full md:w-auto items-center gap-2 bg-subtle p-1 rounded-full border border-divider">
                <TabButton active={reportType === 'breakdown'} onClick={() => setReportType('breakdown')}>Breakdown</TabButton>
                <TabButton active={reportType === 'trend'} onClick={() => setReportType('trend')}>Trend</TabButton>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2 bg-subtle p-1 rounded-full border border-divider">
                <TabButton active={transactionType === TransactionType.EXPENSE} onClick={() => setTransactionType(TransactionType.EXPENSE)}>Expenses</TabButton>
                <TabButton active={transactionType === TransactionType.INCOME} onClick={() => setTransactionType(TransactionType.INCOME)}>Income</TabButton>
            </div>
             <div className="flex items-center gap-2">
                <label htmlFor="compare-toggle" className="text-sm font-medium text-secondary">Compare</label>
                <ToggleSwitch id="compare-toggle" checked={isCompareMode} onChange={setIsCompareMode} />
            </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-start">
            {renderFilterControls(period1, setPeriod1, customDateRange1, setCustomDateRange1)}
            {isCompareMode && <span className="text-secondary font-bold hidden md:block mt-2">vs.</span>}
            {isCompareMode && renderFilterControls(period2, setPeriod2, customDateRange2, setCustomDateRange2)}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className={`grid ${isCompareMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-4 p-4`}>
            {/* Column 1 */}
            <div>
                 <h3 className="text-xl font-bold text-center mb-4 text-primary">{getTitle(period1)}</h3>
                 {filteredTransactions1.length === 0 ? <p className="text-center text-secondary py-8">No data for this period.</p> :
                  <>
                    {reportType === 'breakdown' && <><CategoryPieChart title="" transactions={filteredTransactions1} categories={categories} type={transactionType} /><CategoryBarChart title="" transactions={filteredTransactions1} categories={categories} type={transactionType} /></>}
                    {reportType === 'trend' && <TimeSeriesBarChart title="" transactions={filteredTransactions1} period={period1} type={transactionType} />}
                  </>
                 }
            </div>
            {/* Column 2 (Compare) */}
            {isCompareMode && (
                <div>
                    <h3 className="text-xl font-bold text-center mb-4 text-primary">{getTitle(period2)}</h3>
                    {filteredTransactions2.length === 0 ? <p className="text-center text-secondary py-8">No data for this period.</p> :
                      <>
                        {reportType === 'breakdown' && <><CategoryPieChart title="" transactions={filteredTransactions2} categories={categories} type={transactionType} /><CategoryBarChart title="" transactions={filteredTransactions2} categories={categories} type={transactionType} /></>}
                        {reportType === 'trend' && <TimeSeriesBarChart title="" transactions={filteredTransactions2} period={period2} type={transactionType} />}
                      </>
                    }
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReportsScreen;