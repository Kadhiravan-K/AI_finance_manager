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

const getTopLevelCategory = (categoryId: string, categories: Category[]): Category | undefined => {
    let current = categories.find(c => c.id === categoryId);
    if (!current) return undefined;
    while (current.parentId) {
        const parent = categories.find(c => c.id === current.parentId);
        if (!parent) break;
        current = parent;
    }
    return current;
};

const PieSlice = ({ percentage, startPercentage, color }: { percentage: number, startPercentage: number; color: string }) => {
    if (percentage >= 99.99) { // Use a threshold to handle floating point issues
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
  const formatCurrency = useCurrencyFormatter({ minimumFractionDigits: 0, maximumFractionDigits: 0 }, currency);

  const categoryData = useMemo(() => {
    const topLevelTotals: Record<string, { total: number; icon: string, name: string }> = {};

    transactions.filter(t => t.type === type).forEach(t => {
      const topLevelCat = getTopLevelCategory(t.categoryId, categories);
      if (topLevelCat) {
        if (!topLevelTotals[topLevelCat.id]) {
          topLevelTotals[topLevelCat.id] = { total: 0, icon: topLevelCat.icon || '📁', name: topLevelCat.name };
        }
        topLevelTotals[topLevelCat.id].total += t.amount;
      }
    });

    const totalAmount = Object.values(topLevelTotals).reduce((sum, item) => sum + item.total, 0);

    if (totalAmount === 0) {
      return { categories: [], totalAmount: 0 };
    }

    return {
      categories: Object.entries(topLevelTotals)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([categoryId, data]) => ({
          id: categoryId,
          name: data.name,
          amount: data.total,
          percentage: (data.total / totalAmount) * 100,
          icon: data.icon,
        })),
      totalAmount,
    };
  }, [transactions, categories, type]);

  const cardBaseStyle = "my-3 p-4 bg-subtle rounded-xl shadow-lg border border-divider h-full flex flex-col";

  if (categoryData.categories.length === 0) {
    return (
        <div className={cardBaseStyle}>
             <h3 className="text-lg font-bold text-primary">{title}</h3>
             <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-secondary mt-2 text-center py-8">No data available for this period.</p>
             </div>
        </div>
    );
  }

  let startPercentage = 0;

  return (
    <div className={cardBaseStyle}>
      <h3 className="text-lg font-bold mb-4 text-primary">{title}</h3>
      <div className="flex-grow flex flex-col sm:flex-row items-center gap-4">
        <div className="w-40 h-40 flex-shrink-0">
          <svg viewBox="0 0 100 100">
            {categoryData.categories.map((category, i) => {
              const currentStart = startPercentage;
              startPercentage += category.percentage;
              return (
                <PieSlice
                  key={category.id}
                  percentage={category.percentage}
                  startPercentage={currentStart}
                  color={COLORS[i % COLORS.length]}
                />
              );
            })}
          </svg>
        </div>
        <div className="flex-grow w-full space-y-2 overflow-y-auto max-h-40 pr-2">
          {categoryData.categories.map((category, i) => (
            <div key={category.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                ></div>
                <span className="text-primary truncate">{category.name}</span>
              </div>
              <span className="font-semibold text-secondary">
                {isVisible ? formatCurrency(category.amount) : '••••'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="text-right text-primary font-bold mt-4 border-t border-divider pt-2">
        Total: {isVisible ? formatCurrency(categoryData.totalAmount) : '••••'}
      </div>
    </div>
  );
};

export default CategoryPieChart;