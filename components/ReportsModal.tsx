import React, { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType, ReportPeriod, CustomDateRange } from '../types';
import CategoryPieChart from './CategoryPieChart';
import CategoryBarChart from './CategoryBarChart';
import TimeSeriesBarChart from './TimeSeriesBarChart';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';

interface ReportsScreenProps {
  transactions: Transaction[];
  categories: Category[];
}

type ReportType = 'breakdown' | 'trend';

const ReportsScreen: React.FC<ReportsScreenProps> = ({ transactions, categories }) => {
  const [reportType, setReportType] = useState<ReportType>('breakdown');
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ start: null, end: null });

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = new Date();
    let endDate: Date | null = new Date(now.getTime() + 86400000); // Today + 1 day

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
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
  }, [transactions, period, transactionType, customDateRange]);

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
  
  const getTitle = () => {
    const type = transactionType.charAt(0).toUpperCase() + transactionType.slice(1);
    const periodLabel = periodOptions.find(p => p.value === period)?.label || 'Custom Range';
    if(period === 'custom') return `${type} for Custom Range`;
    return `${periodLabel}'s ${type}`;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="p-4 border-b border-divider flex-shrink-0 flex flex-col md:flex-row gap-4 justify-between items-center bg-subtle">
        <div className="flex w-full md:w-auto items-center gap-2 bg-subtle p-1 rounded-full border border-divider">
          <TabButton active={reportType === 'breakdown'} onClick={() => setReportType('breakdown')}>Breakdown</TabButton>
          <TabButton active={reportType === 'trend'} onClick={() => setReportType('trend')}>Trend</TabButton>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2 bg-subtle p-1 rounded-full border border-divider">
          <TabButton active={transactionType === TransactionType.EXPENSE} onClick={() => setTransactionType(TransactionType.EXPENSE)}>Expenses</TabButton>
          <TabButton active={transactionType === TransactionType.INCOME} onClick={() => setTransactionType(TransactionType.INCOME)}>Income</TabButton>
        </div>
        <div className="w-full md:w-48">
          <CustomSelect options={periodOptions} value={period} onChange={(v) => setPeriod(v as ReportPeriod)} />
        </div>
      </div>
       {period === 'custom' && (
          <div className="p-4 border-b border-divider flex-shrink-0 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-4 animate-fadeInUp bg-subtle">
              <CustomDatePicker value={customDateRange.start} onChange={date => setCustomDateRange(prev => ({...prev, start: date}))} />
              <span className="text-secondary">to</span>
              <CustomDatePicker value={customDateRange.end} onChange={date => setCustomDateRange(prev => ({...prev, end: date}))} />
          </div>
      )}

      {/* Content */}
      <div className="flex-grow p-4 overflow-y-auto">
        <h3 className="text-xl font-bold text-center mb-4 text-primary">{getTitle()}</h3>
        {filteredTransactions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-secondary">
              <p>No data available for this period.</p>
          </div>
        ) : (
          <>
            {reportType === 'breakdown' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <CategoryPieChart title={`${transactionType} Sources`} transactions={filteredTransactions} categories={categories} type={transactionType} />
                <CategoryBarChart title={`${transactionType} by Category`} transactions={filteredTransactions} categories={categories} type={transactionType} />
              </div>
            )}
            {reportType === 'trend' && (
                <TimeSeriesBarChart title={`${transactionType} Trend`} transactions={filteredTransactions} period={period} type={transactionType} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsScreen;