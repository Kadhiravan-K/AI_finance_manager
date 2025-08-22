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
    <div className="mb-6 p-4 rounded-xl glass-card animate-fadeInUp" style={{animationDelay: '300ms'}}>
      <h3 className="font-bold text-lg mb-3 text-primary">Your Goals</h3>
      <div className="space-y-4">
        {activeGoals.map(goal => {
          const percentage = (goal.currentAmount / goal.targetAmount) * 100;
          return (
            <div key={goal.id}>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="flex items-center gap-2 text-primary font-medium">
                  <span className="text-lg">{goal.icon}</span>
                  {goal.name}
                  {goal.productLink && (
                    <a href={goal.productLink} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-accent-sky transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  )}
                </span>
                <span className="text-secondary font-semibold">
                  {isVisible ? formatCurrency(goal.currentAmount) : '••••'}
                </span>
              </div>
              <div className="w-full bg-subtle rounded-full h-2.5 relative border border-divider">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all duration-500"
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