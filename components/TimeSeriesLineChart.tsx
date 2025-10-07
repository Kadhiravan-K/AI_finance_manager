







import React, { useMemo } from 'react';
// Fix: Use 'DateRange' as 'ReportPeriod' is not an exported member.
import { Transaction, DateRange, TransactionType } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface TimeSeriesLineChartProps {
  title: string;
  transactions: Transaction[];
  period: DateRange;
  type: TransactionType;
  currency?: string;
  onPointClick: (dateKey: string) => void;
}

const TimeSeriesLineChart: React.FC<TimeSeriesLineChartProps> = ({ title, transactions, period, type, currency, onPointClick }) => {
  const formatCurrency = useCurrencyFormatter({ minimumFractionDigits: 0, maximumFractionDigits: 0 }, currency);

  const chartData = useMemo(() => {
    const dataMap: Record<string, { total: number, date: Date }> = {};
    
    transactions.filter(t => t.type === type).forEach(t => {
      const date = new Date(t.date);
      date.setHours(0,0,0,0);
      const key = date.toISOString().split('T')[0];
      
      if (!dataMap[key]) dataMap[key] = { total: 0, date: date };
      dataMap[key].total += t.amount;
    });

    const sortedData = Object.entries(dataMap).sort(([,a],[,b]) => a.date.getTime() - b.date.getTime());
    
    const maxAmount = Math.max(...sortedData.map(([, {total}]) => total), 0);
    
    return {
      points: sortedData.map(([key, {total}]) => ({ date: key, amount: total })),
      maxAmount,
    };
  }, [transactions, type]);

  const cardBaseStyle = "my-3 p-4 bg-subtle rounded-xl shadow-lg border border-divider";
  const color = type === TransactionType.INCOME ? 'var(--color-accent-emerald)' : 'var(--color-accent-rose)';

  const width = 500;
  const height = 200;
  const padding = 20;

  const { points } = chartData;
  const maxVal = chartData.maxAmount > 0 ? chartData.maxAmount : 1;
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const yRatio = (height - padding * 2) / maxVal;

  const getPointCoordinates = () => {
      return points.map((p, i) => ({
          x: padding + i * xStep,
          y: height - padding - p.amount * yRatio
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
      {title && <h3 className="text-lg font-bold mb-4 text-primary">{title}</h3>}
      <div className="h-64 relative">
        {chartData.points.length > 1 ? (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                <defs>
                    <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: color, stopOpacity: 0.4}} />
                        <stop offset="100%" style={{stopColor: color, stopOpacity: 0.05}} />
                    </linearGradient>
                </defs>
                <path d={`${path} V ${height - padding} H ${padding} Z`} fill={`url(#gradient-${type})`} />
                <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animation: 'dash 2s ease-out forwards' }}/>
                {coordinates.map((coord, index) => (
                    <g key={index} className="chart-tooltip-wrapper cursor-pointer" onClick={() => onPointClick(points[index].date)}>
                        <rect x={coord.x - xStep/2} y="0" width={xStep} height={height} fill="transparent" />
                        <circle cx={coord.x} cy={coord.y} r="8" fill="transparent" />
                        <circle cx={coord.x} cy={coord.y} r="4" fill={color} />
                        <foreignObject x={coord.x - 50} y={coord.y - 40} width="100" height="30" style={{pointerEvents: 'none'}}>
                          <div className="chart-tooltip" style={{left: '50%', bottom: '100%', transform: 'translateX(-50%)'}}>
                            {formatCurrency(points[index].amount)}
                          </div>
                        </foreignObject>
                    </g>
                ))}
                <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
            </svg>
        ) : (
            <p className="w-full h-full flex items-center justify-center text-center text-secondary">Not enough data for a trend line.</p>
        )}
      </div>
       <div className="flex justify-between text-xs text-secondary mt-2 px-5">
            <span>{points.length > 0 ? new Date(points[0].date).toLocaleDateString() : ''}</span>
            <span>{points.length > 0 ? new Date(points[points.length - 1].date).toLocaleDateString() : ''}</span>
        </div>
    </div>
  );
};

export default TimeSeriesLineChart;