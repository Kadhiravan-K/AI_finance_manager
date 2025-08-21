import React from 'react';
import { Goal } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface GoalsSummaryProps {
  goals: Goal[];
  isVisible: boolean;
}

const GoalsSummary: React.FC<GoalsSummaryProps> = ({ goals, isVisible }) => {
  const formatCurrency = useCurrencyFormatter({ minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount).slice(0, 3);

  if (activeGoals.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 rounded-xl glass-card">
      <h3 className="font-bold text-lg mb-3 text-slate-200">Your Goals</h3>
      <div className="space-y-4">
        {activeGoals.map(goal => {
          const percentage = (goal.currentAmount / goal.targetAmount) * 100;
          return (
            <div key={goal.id}>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="flex items-center gap-2 text-slate-300 font-medium">
                  <span className="text-lg">{goal.icon}</span>
                  {goal.name}
                </span>
                <span className="text-slate-400 font-semibold">
                  {isVisible ? formatCurrency(goal.currentAmount) : '••••'}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 relative">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/80">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalsSummary;