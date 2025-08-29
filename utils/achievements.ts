import { AppState, Achievement, AccountType } from '../types';
import { calculateFinancialHealthScore } from '../utils/financialHealth';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_transaction', name: 'First Step', description: 'Log your very first transaction.', icon: '👣' },
  { id: 'first_goal', name: 'Dreamer', description: 'Set up your first financial goal.', icon: '🌟' },
  { id: 'first_budget', name: 'Planner', description: 'Create your first budget.', icon: '🗺️' },
  { id: 'goal_smasher', name: 'Goal Smasher!', description: 'Successfully complete a financial goal.', icon: '💥' },
  { id: 'transaction_novice', name: 'Getting Started', description: 'Log 10 transactions.', icon: '📝' },
  { id: 'transaction_pro', name: 'Record Keeper', description: 'Log 50 transactions.', icon: '📚' },
  { id: 'investment_starter', name: 'Investor', description: 'Make your first investment.', icon: '📈' },
  { id: 'streak_7', name: 'Week-Long Warrior', description: 'Maintain a 7-day usage streak.', icon: '📅' },
  { id: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day usage streak.', icon: '🗓️' },
  { id: 'financially_fit', name: 'Financially Fit', description: 'Reach a financial health score of 80+.', icon: '💪' },
  { id: 'world_traveler', name: 'World Traveler', description: 'Create your first trip.', icon: '✈️' },
  { id: 'shopkeeper', name: 'Shopkeeper', description: 'Set up your first shop in the Shop Hub.', icon: '🏪' },
  { id: 'debt_settler', name: 'Fair Play', description: 'Settle a shared expense with someone.', icon: '🤝' },
  { id: 'savings_starter', name: 'Savings Starter', description: 'Accumulate 1,000 in your base currency.', icon: '💰' },
  { id: 'serious_saver', name: 'Serious Saver', description: 'Accumulate 10,000 in your base currency.', icon: '🏦' },
  { id: 'categorizer', name: 'The Organizer', description: 'Categorize at least 25 transactions.', icon: '🗂️' },
];

export const checkAchievements = (
  appState: AppState,
  unlockedIds: Set<string>
): string[] => {
  const newlyUnlocked: string[] = [];
  // FIX: Destructured `financialProfile` to make it available within the function scope and resolve a "Cannot find name" error.
  const { transactions, goals, budgets, investmentHoldings, streaks, trips, shops, accounts, settings, financialProfile } = appState;
  
  if (!streaks || !transactions || !goals || !budgets || !accounts || !settings) return [];

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
  if (goals.some(g => g.currentAmount >= g.targetAmount) && !unlockedIds.has('goal_smasher')) {
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
  
  // Streaks
  if (streaks.currentStreak >= 7 && !unlockedIds.has('streak_7')) newlyUnlocked.push('streak_7');
  if (streaks.currentStreak >= 30 && !unlockedIds.has('streak_30')) newlyUnlocked.push('streak_30');

  // Financially Fit
  if (!unlockedIds.has('financially_fit') && financialProfile) {
      const { totalScore } = calculateFinancialHealthScore(appState);
      if (totalScore >= 80) newlyUnlocked.push('financially_fit');
  }

  if (trips && trips.length > 0 && !unlockedIds.has('world_traveler')) newlyUnlocked.push('world_traveler');
  if (shops && shops.length > 0 && !unlockedIds.has('shopkeeper')) newlyUnlocked.push('shopkeeper');
  
  // Debt Settler
  if (transactions.some(t => t.splitDetails && t.splitDetails.some(s => s.isSettled && s.personName.toLowerCase() !== 'you')) && !unlockedIds.has('debt_settler')) {
    newlyUnlocked.push('debt_settler');
  }

  // Savings
  if (!unlockedIds.has('savings_starter') || !unlockedIds.has('serious_saver')) {
      const accountBalances = transactions.reduce((acc, t) => {
          acc[t.accountId] = (acc[t.accountId] || 0) + (t.type === 'income' ? t.amount : -t.amount);
          return acc;
      }, {} as Record<string, number>);

      const totalSavings = accounts
          .filter(a => a.accountType === AccountType.DEPOSITORY && a.currency === settings.currency)
          .reduce((sum, acc) => sum + (accountBalances[acc.id] || 0), 0);
      
      if (totalSavings >= 1000 && !unlockedIds.has('savings_starter')) newlyUnlocked.push('savings_starter');
      if (totalSavings >= 10000 && !unlockedIds.has('serious_saver')) newlyUnlocked.push('serious_saver');
  }

  // Categorizer
  const categorizedCount = transactions.filter(t => t.categoryId).length;
  if (categorizedCount >= 25 && !unlockedIds.has('categorizer')) newlyUnlocked.push('categorizer');

  return newlyUnlocked;
};