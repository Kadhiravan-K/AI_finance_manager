import { Transaction, Budget, Goal } from '../types';

export const calculateFinancialHealthScore = (transactions: Transaction[], budgets: Budget[], goals: Goal[]) => {
  // Simple scoring logic for now
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
  
  const budgetUtilization = budgets.length > 0 ? budgets.reduce((sum, b) => sum + (b.spent / b.amount), 0) / budgets.length : 0;
  const goalProgress = goals.length > 0 ? goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / goals.length : 0;
  
  const score = (savingsRate * 0.4 + (1 - Math.min(budgetUtilization, 1)) * 0.3 + goalProgress * 0.3) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const getFinancialHealthStatus = (score: number) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
};
