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
  hoveredId?: string | null;
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

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ title, transactions, categories, type, isVisible, currency, hoveredId }) => {
  const formatCurrency = useCurrencyFormatter({ minimumFractionDigits: 0, maximumFractionDigits: 0, notation: 'compact' }, currency);

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
             {title && <h3 className="text-lg font-bold text-primary">{title}</h3>}
             <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-secondary mt-2 text-center py-8">No data available for this period.</p>
             </div>
        </div>
    );
  }

  let accumulatedPercentage = 0;
  const circumference = 2 * Math.PI * 40; // radius = 40

  return (
    <div className={cardBaseStyle}>
      {title && <h3 className="text-lg font-bold mb-4 text-primary">{title}</h3>}
      <div className="flex-grow flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="w-40 h-40 flex-shrink-0 relative">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            <circle cx="50" cy="50" r="40" stroke="var(--color-border-divider)" strokeWidth="12" fill="transparent" />
            {categoryData.categories.map((category, i) => {
              const dash = (category.percentage / 100) * circumference;
              const offset = (accumulatedPercentage / 100) * circumference;
              accumulatedPercentage += category.percentage;
              const isHovered = category.id === hoveredId;

              return (
                <g key={category.id}>
                  <circle
                    cx="50" cy="50" r="40"
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${dash} ${circumference}`}
                    strokeDashoffset={-offset}
                    className="transition-all duration-300 ease-out"
                    style={{ transformOrigin: 'center center', transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                  />
                </g>
              );
            })}
          </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xs text-secondary">Total</span>
                <span className="font-bold text-lg text-primary">{isVisible ? formatCurrency(categoryData.totalAmount) : '••••'}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPieChart;
