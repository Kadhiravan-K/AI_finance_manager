import React, { useMemo } from 'react';
import { Transaction, ReportPeriod, TransactionType } from '../types';

interface TimeSeriesBarChartProps {
  title: string;
  transactions: Transaction[];
  period: ReportPeriod;
  type: TransactionType;
}

const CurrencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
});

const TimeSeriesBarChart: React.FC<TimeSeriesBarChartProps> = ({ title, transactions, period, type }) => {
  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      let key = '';
      if (period === 'year') {
        key = date.toLocaleString('default', { month: 'short' });
      } else { // week or month
        key = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      }
      
      if (!dataMap[key]) dataMap[key] = 0;
      dataMap[key] += t.amount;
    });

    let sortedData = Object.entries(dataMap);

    if (period === 'year') {
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      sortedData.sort(([a], [b]) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    } else {
        // Sort by date for week/month view
        sortedData.sort(([a], [b]) => {
            // A bit of a hack to extract the date part for sorting
            const dateA = new Date(`${a.split(' ')[1]} ${new Date().getFullYear()}`);
            const dateB = new Date(`${b.split(' ')[1]} ${new Date().getFullYear()}`);
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

  const cardBaseStyle = "my-3 p-4 bg-slate-800/50 rounded-xl shadow-lg border border-slate-700/50";
  const colorClass = type === TransactionType.INCOME ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div className={cardBaseStyle}>
      <h3 className="text-lg font-bold mb-4 text-slate-200">{title}</h3>
      <div className="flex justify-between items-end h-64 space-x-2">
        {chartData.labels.length > 0 ? chartData.labels.map((label, index) => (
          <div key={label} className="flex-1 flex flex-col items-center justify-end h-full group">
            <div className="relative w-full h-full flex items-end justify-center">
              <div
                className={`w-3/4 rounded-t-md ${colorClass} transition-all duration-300 group-hover:opacity-80`}
                style={{ height: `${chartData.data[index].height}%`, animation: 'growUp 1s ease-out forwards' }}
              >
                  <div className="absolute bottom-full mb-1 w-max px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {CurrencyFormatter.format(chartData.data[index].amount)}
                  </div>
              </div>
            </div>
            <span className="text-xs text-slate-400 mt-2">{label}</span>
          </div>
        )) : <p className="w-full text-center text-slate-400">No trend data for this period.</p>}
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
