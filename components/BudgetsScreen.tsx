import React, { useState, useMemo } from 'react';
import { Budget, Category, Transaction, TransactionType, FinancialProfile } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { getAIBudgetSuggestion } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface BudgetsScreenProps {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  onSaveBudget: (categoryId: string, amount: number) => void;
  onAddBudget: () => void;
  financialProfile: FinancialProfile;
  findOrCreateCategory: (name: string, type: TransactionType) => string;
  onSaveProfile: (profile: FinancialProfile) => void;
}

const BudgetsScreen: React.FC<BudgetsScreenProps> = ({ categories, transactions, budgets, onSaveBudget, onAddBudget, financialProfile, findOrCreateCategory, onSaveProfile }) => {
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [aiSuggestions, setAiSuggestions] = useState<{ categoryName: string, amount: string, reasoning: string }[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const formatCurrency = useCurrencyFormatter();
  const [isSalaryPromptVisible, setIsSalaryPromptVisible] = useState(false);
  const [tempSalary, setTempSalary] = useState('');

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

  const fetchSuggestions = async (profile: FinancialProfile) => {
    setIsAiLoading(true);
    setAiSuggestions(null);
    try {
        const suggestions = await getAIBudgetSuggestion(profile, categories);
        setAiSuggestions(suggestions.map(s => ({ ...s, amount: String(s.amount) })));
    } catch (error) {
        alert("Could not fetch AI suggestions. Please ensure you've set your monthly income in your profile.");
    }
    setIsAiLoading(false);
  }

  const handleGetAiSuggestions = async () => {
    if (!financialProfile || !financialProfile.monthlySalary || financialProfile.monthlySalary <= 0) {
        setIsSalaryPromptVisible(true);
        return;
    }
    fetchSuggestions(financialProfile);
  };

  const handleSaveSalaryAndSuggest = async () => {
    const salary = parseFloat(tempSalary);
    if (isNaN(salary) || salary <= 0) {
        alert("Please enter a valid monthly salary.");
        return;
    }
    const newProfile = { ...financialProfile, monthlySalary: salary };
    await onSaveProfile(newProfile);
    setIsSalaryPromptVisible(false);
    setTempSalary('');
    fetchSuggestions(newProfile);
  };
  
  const handleSuggestionAmountChange = (index: number, value: string) => {
    if (aiSuggestions) {
      const newSuggestions = [...aiSuggestions];
      newSuggestions[index] = { ...newSuggestions[index], amount: value };
      setAiSuggestions(newSuggestions);
    }
  };
  
  const handleApplySuggestion = (categoryName: string, amount: number) => {
      const categoryId = findOrCreateCategory(categoryName, TransactionType.EXPENSE);
      if (categoryId) {
          onSaveBudget(categoryId, amount);
          setAiSuggestions(prev => prev ? prev.filter(s => s.categoryName !== categoryName) : null);
      }
  };
  
  const topLevelCategories = useMemo(() => categories.filter(c => !c.parentId && c.type === TransactionType.EXPENSE), [categories]);

  const renderCategoryBudget = (category: Category) => {
    const budget = budgets.find(b => b.categoryId === category.id && b.month === currentMonth);
    const spent = monthlySpending[category.id] || 0;
    const percentage = budget ? (spent / budget.amount) * 100 : 0;
    
    let progressBarColor = 'var(--color-accent-emerald)';
    if (percentage > 75) progressBarColor = 'var(--color-accent-yellow)';
    if (percentage > 100) progressBarColor = 'var(--color-accent-rose)';

    const children = categories.filter(c => c.parentId === category.id);
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className="bg-subtle rounded-lg my-2 transition-colors hover-bg-stronger">
        <div 
          className="p-3 flex items-center justify-between cursor-pointer"
          onClick={() => toggleCategory(category.id)}
        >
          <span className="flex items-center gap-2 font-medium text-primary">
            <span className="text-lg">{category.icon}</span>
            {category.name}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              onWheel={e => e.currentTarget.blur()}
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
              className="w-28 text-right rounded-md py-1 px-2 input-base no-spinner"
            />
            {children.length > 0 && (
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            )}
          </div>
        </div>
        {budget && (
          <div className="px-3 pb-3">
            <div className="flex justify-between text-xs text-secondary mb-1">
              <span>{formatCurrency(spent)}</span>
              <span>{formatCurrency(budget.amount)}</span>
            </div>
            <div className="w-full rounded-full h-2 bg-subtle border border-divider">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: progressBarColor }}
              ></div>
            </div>
          </div>
        )}
        {isExpanded && children.length > 0 && (
          <div className="pl-6 pr-3 pb-3 border-t border-divider pt-2">
            {children.map(child => renderCategoryBudget(child))}
          </div>
        )}
      </div>
    );
  };

  const hasBudgets = budgets.some(b => b.month === currentMonth);

  return (
    <div className="p-6 flex-grow overflow-y-auto pr-2">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h2 className="text-2xl font-bold text-primary mb-2">Monthly Budgets</h2>
            <p className="text-sm text-secondary">Set spending limits for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
        </div>
        <button onClick={handleGetAiSuggestions} disabled={isAiLoading} className="button-secondary px-3 py-1.5 flex items-center gap-2">
            {isAiLoading ? <LoadingSpinner /> : '✨'}
            <span>Get AI Suggestions</span>
        </button>
      </div>
      
      {isSalaryPromptVisible && (
        <div className="p-4 mb-4 bg-sky-900/50 border border-sky-700 rounded-lg space-y-2 animate-fadeInUp">
            <h4 className="font-semibold text-primary">Set Your Monthly Income</h4>
            <p className="text-sm text-secondary">AI needs your monthly income to provide personalized budget suggestions.</p>
            <div className="flex gap-2">
                <input 
                    type="number" 
                    value={tempSalary} 
                    onChange={e => setTempSalary(e.target.value)}
                    placeholder="e.g., 50000"
                    className="input-base w-full p-2 rounded-lg"
                    autoFocus
                />
                <button onClick={handleSaveSalaryAndSuggest} className="button-primary px-4 py-2">Suggest</button>
                <button onClick={() => setIsSalaryPromptVisible(false)} className="button-secondary px-4 py-2">Cancel</button>
            </div>
        </div>
      )}

      {aiSuggestions && (
          <div className="p-4 mb-4 bg-violet-900/50 border border-violet-700 rounded-lg space-y-2 animate-fadeInUp">
              <h4 className="font-semibold text-primary">AI Budget Suggestions</h4>
              {aiSuggestions.map((s, index) => (
                  <div key={s.categoryName} className="p-2 bg-subtle rounded-md">
                      <div className="flex justify-between items-center">
                          <p className="font-medium text-primary">{s.categoryName}:</p>
                          <div className="flex items-center gap-2">
                              <input
                                  type="number"
                                  value={s.amount}
                                  onChange={(e) => handleSuggestionAmountChange(index, e.target.value)}
                                  className="input-base w-24 p-1 rounded-md text-right no-spinner"
                              />
                              <button 
                                  onClick={() => handleApplySuggestion(s.categoryName, parseFloat(s.amount) || 0)} 
                                  className="button-primary px-3 py-1 text-xs"
                              >
                                  Apply
                              </button>
                          </div>
                      </div>
                      <p className="text-xs text-secondary mt-1">{s.reasoning}</p>
                  </div>
              ))}
          </div>
      )}
      
      {!hasBudgets && !aiSuggestions && !isAiLoading && !isSalaryPromptVisible ? (
        <div className="text-center py-12">
          <p className="text-lg font-medium text-secondary">No budgets set for this month.</p>
          <p className="text-sm text-tertiary">Start by setting a budget for a category below, or ask the AI for suggestions.</p>
        </div>
      ) : null}

      {topLevelCategories.map(category => renderCategoryBudget(category))}
    </div>
  );
};

export default BudgetsScreen;