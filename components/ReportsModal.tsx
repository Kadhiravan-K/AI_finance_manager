import React, { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType, ReportPeriod, CustomDateRange } from '../types';
import CategoryPieChart from './CategoryPieChart';
import CategoryBarChart from './CategoryBarChart';
import TimeSeriesBarChart from './TimeSeriesBarChart';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
}

type ReportType = 'breakdown' | 'trend';

const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose, transactions, categories }) => {
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
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${active ? 'bg-emerald-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
      {children}
    </button>
  );

  if (!isOpen) return null;
  
  const getTitle = () => {
    const type = transactionType.charAt(0).toUpperCase() + transactionType.slice(1);
    if(period === 'custom') return `${type} for Custom Range`;
    return `This ${period.charAt(0).toUpperCase() + period.slice(1)}'s ${type}`;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-700/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 flex-shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Financial Reports</h2>
            <p className="text-sm text-slate-400">{getTitle()}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {/* Controls */}
        <div className="p-4 border-b border-slate-700/50 flex-shrink-0 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
            <TabButton active={reportType === 'breakdown'} onClick={() => setReportType('breakdown')}>Breakdown</TabButton>
            <TabButton active={reportType === 'trend'} onClick={() => setReportType('trend')}>Trend</TabButton>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
            <TabButton active={transactionType === TransactionType.EXPENSE} onClick={() => setTransactionType(TransactionType.EXPENSE)}>Expenses</TabButton>
            <TabButton active={transactionType === TransactionType.INCOME} onClick={() => setTransactionType(TransactionType.INCOME)}>Income</TabButton>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
            <TabButton active={period === 'week'} onClick={() => setPeriod('week')}>Week</TabButton>
            <TabButton active={period === 'month'} onClick={() => setPeriod('month')}>Month</TabButton>
            <TabButton active={period === 'year'} onClick={() => setPeriod('year')}>Year</TabButton>
            <TabButton active={period === 'custom'} onClick={() => setPeriod('custom')}>Custom</TabButton>
          </div>
        </div>
         {period === 'custom' && (
            <div className="p-4 border-b border-slate-700/50 flex-shrink-0 flex items-center justify-center gap-4 animate-fadeInUp">
                <input type="date" value={customDateRange.start ? customDateRange.start.toISOString().split('T')[0] : ''} onChange={e => setCustomDateRange(prev => ({...prev, start: e.target.value ? new Date(e.target.value) : null}))} className="bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white"/>
                <span className="text-slate-400">to</span>
                <input type="date" value={customDateRange.end ? customDateRange.end.toISOString().split('T')[0] : ''} onChange={e => setCustomDateRange(prev => ({...prev, end: e.target.value ? new Date(e.target.value) : null}))} className="bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white"/>
            </div>
        )}

        {/* Content */}
        <div className="flex-grow p-4 overflow-y-auto">
          {filteredTransactions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
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
    </div>
  );
};

export default ReportsModal;