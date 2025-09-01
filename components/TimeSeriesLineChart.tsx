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
        sortedData.sort(([a], [b]) => new Date(a + ', ' + new Date().getFullYear()).getTime() - new Date(b + ', ' + new Date().getFullYear()).getTime());
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

  const width = 500;
  const height = 200;
  const padding = 20;

  const points = chartData.points;
  const maxVal = chartData.maxAmount > 0 ? chartData.maxAmount : 1;
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const yRatio = (height - padding * 2) / maxVal;

  const getPointCoordinates = () => {
      return points.map((p, i) => ({
          x: padding + i * xStep,
          y: height - padding - p * yRatio
      }));
  };
  const coordinates = getPointCoordinates();

  const generatePath = () => {
    if (coordinates.length < 2) return '';
    let path = `M ${coordinates[0].x},${coordinates[0].y}`;
    for (let i = 1; i < coordinates.length; i++) {
        path += ` L ${coordinates[i].x},${coordinates[i].y}`;
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
                <defs>
                    <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: color, stopOpacity: 0.4}} />
                        <stop offset="100%" style={{stopColor: color, stopOpacity: 0.05}} />
                    </linearGradient>
                </defs>
                <path d={`${path} V ${height - padding} H ${padding} Z`} fill={`url(#gradient-${type})`} />
                <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animation: 'dash 2s ease-out forwards' }}/>
                {coordinates.map((coord, index) => (
                    <g key={index} className="chart-tooltip-wrapper">
                        <circle cx={coord.x} cy={coord.y} r="8" fill="transparent" />
                        <circle cx={coord.x} cy={coord.y} r="4" fill={color} />
                        <text className="chart-tooltip" x={coord.x} y={coord.y - 10} textAnchor="middle">{formatCurrency(points[index])}</text>
                    </g>
                ))}
                <style>{`
                  @keyframes dash { to { stroke-dashoffset: 0; } }
                  .chart-tooltip-wrapper text {
                    opacity: 0;
                    transition: opacity 0.2s ease;
                  }
                   .chart-tooltip-wrapper:hover text {
                    opacity: 1;
                  }
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