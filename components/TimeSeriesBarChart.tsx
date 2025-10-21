

import React, { useMemo } from 'react';
// Fix: Use 'DateRange' as 'ReportPeriod' is not an exported member.
import { Transaction, DateRange, TransactionType, Category } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface TimeSeriesBarChartProps {
  title: string;
  transactions: Transaction[];
  period: DateRange;
  type: TransactionType;
  currency?: string;
}

const TimeSeriesBarChart: React.FC<TimeSeriesBarChartProps> = ({ title, transactions, period, type, currency }) => {
  const formatCurrency = useCurrencyFormatter({ minimumFractionDigits: 0, maximumFractionDigits: 0 }, currency);

  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      let key = '';
      if (period === 'year') {
        key = date.toLocaleString('default', { month: 'short' });
      } else { // week or month or custom
        key = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      }
      
      if (!dataMap[key]) dataMap[key] = 0;
      dataMap[key] += t.amount;
    });

    let sortedData = Object.entries(dataMap);

    if (period === 'year') {
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      sortedData.sort(([a], [b]) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    } else {
        // Sort by date for week/month/custom view
        sortedData.sort(([a], [b]) => {
            // This needs a more robust date parsing to be perfectly accurate for sorting across years.
            // For now, assuming data is within the same year for simplicity in this view.
            const dateA = new Date(a + ', ' + new Date().getFullYear());
            const dateB = new Date(b + ', ' + new Date().getFullYear());
            return dateA.getTime() - dateB.getTime();
        });
    }

    const maxAmount = Math.max(...sortedData.map(([, amount]) => amount), 0);
    
    return {
      labels: sortedData.map(([label]) => label),
      data: sortedData.map(([, amount]) => ({
        amount,
        height: maxAmount > 0 ? (amount / maxAmount) * 100 : 0,
      })),
      maxAmount,
    };
  }, [transactions, period]);

  const cardBaseStyle = "my-3 p-4 bg-subtle rounded-xl shadow-lg border border-divider";
  const color = type === TransactionType.INCOME ? 'var(--color-accent-emerald)' : 'var(--color-accent-rose)';

  return (
    <div className={cardBaseStyle}>
      <h3 className="text-lg font-bold mb-4 text-primary">{title}</h3>
       <div className="overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        <div className="no-scrollbar flex items-end h-64 space-x-4" style={{ minWidth: `${chartData.labels.length * 3}rem` }}>
            {chartData.labels.length > 0 ? chartData.labels.map((label, index) => (
            <div key={label} className="flex-1 flex flex-col items-center justify-end h-full group chart-tooltip-wrapper" style={{ minWidth: '2rem' }}>
                <div className="chart-tooltip">{formatCurrency(chartData.data[index].amount)}</div>
                <div className="relative w-full h-full flex items-end justify-center">
                    <div
                        className="w-3/4 rounded-t-md transition-all duration-300 group-hover:brightness-125"
                        style={{ height: `${chartData.data[index].height}%`, animation: 'growUp 1s ease-out forwards', backgroundColor: color }}
                    >
                    </div>
                </div>
                <span className="text-xs text-secondary mt-2 text-center">{label}</span>
            </div>
            )) : <p className="w-full text-center text-secondary">No trend data for this period.</p>}
        </div>
      </div>
      <style>{`
        @keyframes growUp {
          from { transform: scaleY(0); transform-origin: bottom; }
          to { transform: scaleY(1); transform-origin: bottom; }
        }
      `}</style>
    </div>
  );
};

export default TimeSeriesBarChart;