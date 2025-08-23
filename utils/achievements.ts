import { AppState, Achievement } from '../types';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_transaction', name: 'First Step', description: 'Log your very first transaction.', icon: '👣' },
  { id: 'first_goal', name: 'Dreamer', description: 'Set up your first financial goal.', icon: '🌟' },
  { id: 'first_budget', name: 'Planner', description: 'Create your first budget.', icon: '🗺️' },
  { id: 'goal_smasher', name: 'Goal Smasher!', description: 'Successfully complete a financial goal.', icon: '💥' },
  { id: 'transaction_novice', name: 'Getting Started', description: 'Log 10 transactions.', icon: '📝' },
  { id: 'transaction_pro', name: 'Record Keeper', description: 'Log 50 transactions.', icon: '📚' },
  { id: 'investment_starter', name: 'Investor', description: 'Make your first investment.', icon: '📈' },
];

export const checkAchievements = (
  appState: AppState,
  unlockedIds: Set<string>
): string[] => {
  const newlyUnlocked: string[] = [];
  const { transactions, goals, budgets, investmentHoldings } = appState;

  // First Transaction
  if (transactions.length > 0 && !unlockedIds.has('first_transaction')) {
    newlyUnlocked.push('first_transaction');
  }

  // First Goal
  if (goals.length > 0 && !unlockedIds.has('first_goal')) {
    newlyUnlocked.push('first_goal');
  }
  
  // First Budget
  if (budgets.length > 0 && !unlockedIds.has('first_budget')) {
    newlyUnlocked.push('first_budget');
  }
  
  // Goal Smasher
  const hasCompletedGoal = goals.some(g => g.currentAmount >= g.targetAmount);
  if (hasCompletedGoal && !unlockedIds.has('goal_smasher')) {
      newlyUnlocked.push('goal_smasher');
  }
  
  // Transaction Novice (10 transactions)
  if (transactions.length >= 10 && !unlockedIds.has('transaction_novice')) {
      newlyUnlocked.push('transaction_novice');
  }
  
  // Transaction Pro (50 transactions)
  if (transactions.length >= 50 && !unlockedIds.has('transaction_pro')) {
      newlyUnlocked.push('transaction_pro');
  }

  // Investment Starter
  if (investmentHoldings.length > 0 && !unlockedIds.has('investment_starter')) {
      newlyUnlocked.push('investment_starter');
  }

  return newlyUnlocked;
};
