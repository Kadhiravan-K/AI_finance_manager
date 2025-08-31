import React, { useMemo } from 'react';
import { Transaction, ReportPeriod, TransactionType } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface TimeSeriesLineChartProps {
  title: string;
  transactions: Transaction[];
  period: ReportPeriod;
  type: TransactionType;
}

const TimeSeriesLineChart: React.FC<TimeSeriesLineChartProps> = ({ title, transactions, period, type }) => {
  const formatCurrency = useCurrencyFormatter({ minimumFractionDigits: 0, maximumFractionDigits: 0 });

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
        sortedData.sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
    }

    const maxAmount = Math.max(...sortedData.map(([, amount]) => amount), 0);
    
    return {
      labels: sortedData.map(([label]) => label),
      points: sortedData.map(([, amount]) => amount),
      maxAmount,
    };
  }, [transactions, period]);

  const cardBaseStyle = "my-3 p-4 bg-subtle rounded-xl shadow-lg border border-divider";
  const color = type === TransactionType.INCOME ? 'var(--color-accent-emerald)' : 'var(--color-accent-rose)';

  const generatePath = () => {
    if (chartData.points.length < 2) return '';
    const width = 500;
    const height = 200;
    const padding = 20;

    const points = chartData.points;
    const maxVal = chartData.maxAmount > 0 ? chartData.maxAmount : 1;
    
    const xStep = (width - padding * 2) / (points.length - 1);
    const yRatio = (height - padding * 2) / maxVal;

    let path = `M ${padding},${height - padding - points[0] * yRatio}`;
    for (let i = 1; i < points.length; i++) {
        path += ` L ${padding + i * xStep},${height - padding - points[i] * yRatio}`;
    }
    return path;
  };
  
  const path = generatePath();

  return (
    <div className={cardBaseStyle}>
      <h3 className="text-lg font-bold mb-4 text-primary">{title}</h3>
      <div className="h-64 relative">
        {chartData.points.length > 0 ? (
            <svg viewBox="0 0 500 200" className="w-full h-full">
                <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animation: 'dash 2s ease-out forwards' }}/>
                <style>{`
                  @keyframes dash { to { stroke-dashoffset: 0; } }
                `}</style>
            </svg>
        ) : (
            <p className="w-full h-full flex items-center justify-center text-center text-secondary">No trend data for this period.</p>
        )}
      </div>
       <div className="flex justify-between text-xs text-secondary mt-2 px-5">
            <span>{chartData.labels[0]}</span>
            <span>{chartData.labels[chartData.labels.length - 1]}</span>
        </div>
    </div>
  );
};

export default TimeSeriesLineChart;