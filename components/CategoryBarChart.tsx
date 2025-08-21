import React, { useMemo } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface CategoryBarChartProps {
  title: string;
  transactions: Transaction[];
  categories: Category[];
  type: TransactionType;
}

const COLORS = [
  '#10b981', '#3b82f6', '#ef4444', '#f97316', '#8b5cf6', '#eab308', '#ec4899', '#64748b'
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

const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ title, transactions, categories, type }) => {
  const formatCurrency = useCurrencyFormatter({ minimumFractionDigits: 0 });

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

  const cardBaseStyle = "my-3 p-4 bg-slate-800/50 rounded-xl shadow-lg border border-slate-700/50";

  if (categoryData.categories.length === 0) {
    return (
        <div className={`${cardBaseStyle} h-full flex flex-col`}>
             <h3 className="text-lg font-bold text-slate-200">{title}</h3>
             <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-slate-400 mt-2 text-center py-8">No data available.</p>
             </div>
        </div>
    );
  }

  return (
    <div className={cardBaseStyle}>
      <h3 className="text-lg font-bold mb-4 text-slate-200">{title}</h3>
      <div className="space-y-3">
        {categoryData.categories.map((category, i) => (
          <div key={category.id} className="group">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <span className="text-lg">{category.icon}</span>
                {category.name}
              </span>
              <span className="text-slate-200 font-semibold">{formatCurrency(category.amount)}</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-4 relative overflow-hidden">
              <div
                className="h-4 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                    width: `${category.percentage}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                    animation: 'slideIn 1s ease-out forwards'
                }}
              ></div>
              <style>{`
                @keyframes slideIn {
                  from { width: 0%; }
                  to { width: ${category.percentage}%; }
                }
              `}</style>
              <div className="absolute inset-0 px-2 flex items-center justify-end text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {category.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryBarChart;