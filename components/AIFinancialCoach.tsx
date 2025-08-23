import React from 'react';

interface AIFinancialCoachProps {
  insight: string;
  isLoading: boolean;
}

const AIFinancialCoach: React.FC<AIFinancialCoachProps> = ({ insight, isLoading }) => {
  return (
    <div className="mb-6 p-4 rounded-xl glass-card animate-fadeInUp">
      <h3 className="font-bold text-lg mb-3" style={{color: 'var(--color-accent-violet)'}}>Coach's Corner 🧠</h3>
      {isLoading ? (
        <div className="flex items-center gap-3 text-secondary animate-pulse">
          <div className="w-8 h-8 rounded-full bg-subtle"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-subtle"></div>
            <div className="h-3 w-1/2 rounded bg-subtle"></div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-secondary">{insight}</p>
      )}
    </div>
  );
};

export default AIFinancialCoach;