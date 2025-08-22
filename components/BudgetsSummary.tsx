import React, { useMemo } from 'react';
import { Budget, Category, Transaction, TransactionType } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface BudgetsSummaryProps {
  budgets: Budget[];
  transactions: Transaction[];
  categories: Category[];
  isVisible: boolean;
}

const BudgetsSummary: React.FC<BudgetsSummaryProps> = ({ budgets, transactions, categories, isVisible }) => {
  const formatCurrency = useCurrencyFormatter({ minimumFractionDigits: 0 });
  const currentMonth = new Date().toISOString().slice(0, 7);

  const budgetData = useMemo(() => {
    const currentMonthBudgets = budgets.filter(b => b.month === currentMonth);
    if (currentMonthBudgets.length === 0) return [];
    
    const monthlySpending: Record<string, number> = {};
    const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonth) && t.type === TransactionType.EXPENSE);

    for (const transaction of monthlyTransactions) {
      let currentCategoryId: string | null = transaction.categoryId;
      // Accumulate spending up the parent chain
      while (currentCategoryId) {
        monthlySpending[currentCategoryId] = (monthlySpending[currentCategoryId] || 0) + transaction.amount;
        const category = categories.find(c => c.id === currentCategoryId);
        currentCategoryId = category ? category.parentId : null;
      }
    }
    
    return currentMonthBudgets.map(budget => {
      const category = categories.find(c => c.id === budget.categoryId);
      const spent = monthlySpending[budget.categoryId] || 0;
      const percentage = (spent / budget.amount) * 100;
      return {
        ...budget,
        categoryName: category?.name || 'Unknown',
        categoryIcon: category?.icon || '📁',
        spent,
        percentage,
      };
    }).sort((a, b) => b.percentage - a.percentage).slice(0, 4); // Show top 4 most critical budgets
  }, [budgets, transactions, categories, currentMonth]);

  if (budgetData.length === 0) {
    return null;
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage > 100) return 'bg-rose-500';
    if (percentage > 75) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="mb-6 p-4 rounded-xl glass-card animate-fadeInUp" style={{animationDelay: '350ms'}}>
      <h3 className="font-bold text-lg mb-3 text-primary">This Month's Budgets</h3>
      <div className="space-y-3">
        {budgetData.map(budget => (
          <div key={budget.categoryId}>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="flex items-center gap-2 text-primary font-medium">
                <span className="text-lg">{budget.categoryIcon}</span>
                {budget.categoryName}
              </span>
              <span className="text-secondary">
                {isVisible ? `${formatCurrency(budget.spent)} / ` : '•••• / '}
                <span className="text-primary">{isVisible ? formatCurrency(budget.amount) : '••••'}</span>
              </span>
            </div>
            <div className="w-full bg-subtle rounded-full h-2.5 border border-divider">
              <div
                className={`h-full rounded-full ${getProgressBarColor(budget.percentage)} transition-all duration-500`}
                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetsSummary;