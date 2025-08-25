import React, { useMemo } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface CategoryPieChartProps {
  title: string;
  transactions: Transaction[];
  categories: Category[];
  type: TransactionType;
  isVisible: boolean;
  currency?: string;
}

const COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#8b5cf6', // violet-500
  '#eab308', // yellow-500
  '#ec4899', // pink-500
  '#64748b', // slate-500
];

const getCategory = (categoryId: string, categories: Category[]): Category | undefined => {
    return categories.find(c => c.id === categoryId);
};

const getCategoryPath = (categoryId: string, categories: Category[]): string => {
    const path: string[] = [];
    let current = getCategory(categoryId, categories);
    while (current) {
        path.unshift(current.name);
        current = categories.find(c => c.id === current.parentId);
    }
    return path.join(' / ') || 'Uncategorized';
};

const PieSlice = ({ percentage, startPercentage, color }: { percentage: number, startPercentage: number; color: string }) => {
    if (percentage >= 100) {
        return <circle cx="50" cy="50" r="40" fill={color}></circle>;
    }
    
    const r = 40;
    const cx = 50;
    const cy = 50;

    const startAngle = (startPercentage / 100) * 360;
    const endAngle = ((startPercentage + percentage) / 100) * 360;

    // Use -90 degrees offset to start from the top
    const x1 = cx + r * Math.cos(Math.PI * (startAngle - 90) / 180);
    const y1 = cy + r * Math.sin(Math.PI * (startAngle - 90) / 180);
    const x2 = cx + r * Math.cos(Math.PI * (endAngle - 90) / 180);
    const y2 = cy + r * Math.sin(Math.PI * (endAngle - 90) / 180);

    const largeArcFlag = percentage > 50 ? 1 : 0;

    const pathData = `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArcFlag},1 ${x2},${y2} Z`;

    return <path d={pathData} fill={color} />;
};


const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ title, transactions, categories, type, isVisible, currency }) => {
  const formatTotal = useCurrencyFormatter(undefined, currency);
  const formatItem = useCurrencyFormatter({ minimumFractionDigits: 0, maximumFractionDigits: 0 }, currency);

  const categoryData = useMemo(() => {
    const filtered = transactions.filter(t => t.type === type);
    const totals = filtered.reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalAmount = Object.values(totals).reduce((sum, amount) => sum + amount, 0);

    if (totalAmount === 0) {
      return { categories: [], totalAmount: 0 };
    }

    return {
      categories: Object.entries(totals)
        .sort(([, a], [, b]) => b - a)
        .map(([categoryId, amount]) => {
          const category = getCategory(categoryId, categories);
          return {
            name: getCategoryPath(categoryId, categories),
            amount,
            percentage: (amount / totalAmount) * 100,
            icon: category?.icon,
          }
        }),
      totalAmount,
    };
  }, [transactions, categories, type]);

  const cardBaseStyle = "my-3 p-4 bg-subtle rounded-xl shadow-lg border border-divider";

  if (categoryData.categories.length === 0) {
    return (
        <div className={`${cardBaseStyle} h-full flex flex-col`}>
             <h3 className="text-lg font-bold text-primary">{title}</h3>
             <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-secondary mt-2 text-center py-8">No {type} data to display.</p>
             </div>
        </div>
    );
  }
  
  let cumulativePercent = 0;

  return (
    <div className={cardBaseStyle}>
      <h3 className="text-lg font-bold mb-4 text-primary">
          {title}
          <span className="block text-sm font-normal text-secondary">{isVisible ? formatTotal(categoryData.totalAmount) : '••••'}</span>
      </h3>
      <div className="grid grid-cols-2 items-center gap-4">
        <div className="relative w-full aspect-square">
           <svg viewBox="0 0 100 100">
             {categoryData.categories.map((category, i) => {
                 const slice = <PieSlice key={category.name} percentage={category.percentage} startPercentage={cumulativePercent} color={COLORS[i % COLORS.length]} />;
                 cumulativePercent += category.percentage;
                 return slice;
             })}
           </svg>
        </div>
        <div className="w-full space-y-1 self-start max-h-40 overflow-y-auto pr-1">
            {categoryData.categories.map((category, i) => (
                <div key={category.name} className="flex items-center justify-between text-sm p-1 rounded-md transition-colors hover-bg-stronger">
                    <div className="flex items-center space-x-2 overflow-hidden">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-lg flex-shrink-0">{category.icon || '📁'}</span>
                        <span className="text-primary truncate" title={category.name}>{category.name}</span>
                    </div>
                    <span className="font-semibold text-secondary ml-2 flex-shrink-0">{isVisible ? formatItem(category.amount) : '••••'}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPieChart;
