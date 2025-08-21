import React, { useState, useMemo } from 'react';
import { Budget, Category, Transaction, TransactionType } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface BudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  onSaveBudget: (categoryId: string, amount: number) => void;
}

const BudgetsModal: React.FC<BudgetsModalProps> = ({ isOpen, onClose, categories, transactions, budgets, onSaveBudget }) => {
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const formatCurrency = useCurrencyFormatter();

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const monthlySpending = useMemo(() => {
    const spending: Record<string, number> = {};
    const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonth) && t.type === TransactionType.EXPENSE);
    
    for (const category of categories) {
        spending[category.id] = 0;
    }

    for (const transaction of monthlyTransactions) {
      let currentCategoryId: string | null = transaction.categoryId;
      while(currentCategoryId) {
        spending[currentCategoryId] = (spending[currentCategoryId] || 0) + transaction.amount;
        const currentCategory = categories.find(c => c.id === currentCategoryId);
        currentCategoryId = currentCategory ? currentCategory.parentId : null;
      }
    }
    return spending;
  }, [transactions, categories, currentMonth]);

  const handleBudgetChange = (categoryId: string, value: string) => {
    setBudgetAmounts(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleBudgetSave = (categoryId: string) => {
    const amount = parseFloat(budgetAmounts[categoryId]);
    if (!isNaN(amount) && amount >= 0) {
      onSaveBudget(categoryId, amount);
      setBudgetAmounts(prev => {
        const newAmounts = { ...prev };
        delete newAmounts[categoryId];
        return newAmounts;
      });
    }
  };
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
        const newSet = new Set(prev);
        if (newSet.has(categoryId)) {
            newSet.delete(categoryId);
        } else {
            newSet.add(categoryId);
        }
        return newSet;
    });
  };
  
  const topLevelCategories = useMemo(() => categories.filter(c => !c.parentId && c.type === TransactionType.EXPENSE), [categories]);

  if (!isOpen) return null;

  const renderCategoryBudget = (category: Category) => {
    const budget = budgets.find(b => b.categoryId === category.id && b.month === currentMonth);
    const spent = monthlySpending[category.id] || 0;
    const percentage = budget ? (spent / budget.amount) * 100 : 0;
    
    let progressBarColor = 'bg-emerald-500';
    if (percentage > 75) progressBarColor = 'bg-yellow-500';
    if (percentage > 100) progressBarColor = 'bg-rose-500';

    const children = categories.filter(c => c.parentId === category.id);
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className="bg-slate-700/50 rounded-lg my-2 transition-colors hover:bg-slate-700">
        <div 
          className="p-3 flex items-center justify-between cursor-pointer"
          onClick={() => toggleCategory(category.id)}
        >
          <span className="flex items-center gap-2 font-medium">
            <span className="text-lg">{category.icon}</span>
            {category.name}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={budget ? formatCurrency(budget.amount) : 'Set Budget'}
              value={budgetAmounts[category.id] || ''}
              onChange={(e) => {
                e.stopPropagation();
                handleBudgetChange(category.id, e.target.value)
              }}
              onBlur={(e) => {
                e.stopPropagation();
                handleBudgetSave(category.id);
              }}
              onClick={e => e.stopPropagation()}
              className="w-28 text-right bg-slate-800 border border-slate-600 rounded-md py-1 px-2 focus:ring-1 focus:ring-emerald-500"
            />
            {children.length > 0 && (
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            )}
          </div>
        </div>
        {budget && (
          <div className="px-3 pb-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{formatCurrency(spent)}</span>
              <span>{formatCurrency(budget.amount)}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${progressBarColor} transition-all duration-500`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
        {isExpanded && children.length > 0 && (
          <div className="pl-6 pr-3 pb-3 border-t border-slate-600/50 pt-2">
            {children.map(child => renderCategoryBudget(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] flex flex-col border border-slate-700/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-2xl font-bold text-white">Monthly Budgets</h2>
          <p className="text-sm text-slate-400">Set spending limits for your categories for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
        </div>
        <div className="flex-grow overflow-y-auto pr-2">
          {topLevelCategories.map(category => renderCategoryBudget(category))}
        </div>
        <div className="flex justify-end pt-4 mt-4 border-t border-slate-700">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600/80 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetsModal;