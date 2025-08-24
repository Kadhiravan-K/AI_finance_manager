import React, { useMemo } from 'react';
import { Transaction, Account, InvestmentHolding, FinancialProfile, Budget, Goal } from '../types';
import { calculateFinancialHealthScore } from '../utils/financialHealth';

interface ScoreData {
    transactions: Transaction[];
    accounts: Account[];
    investmentHoldings: InvestmentHolding[];
    financialProfile: FinancialProfile;
    budgets: Budget[];
    goals: Goal[];
}

interface FinancialHealthScoreProps {
  scoreData: ScoreData;
  onClick: () => void;
}

const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({ scoreData, onClick }) => {
  const { totalScore } = useMemo(() => calculateFinancialHealthScore(scoreData), [scoreData]);

  const getScoreColor = () => {
    if (totalScore >= 80) return 'var(--color-accent-emerald)';
    if (totalScore >= 50) return 'var(--color-accent-yellow)';
    return 'var(--color-accent-rose)';
  };
  
  const circumference = 2 * Math.PI * 45; // 2 * pi * radius
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <button onClick={onClick} className="w-full mb-6 p-4 rounded-xl glass-card animate-fadeInUp flex items-center gap-4 text-left">
        <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    strokeWidth="8"
                    className="stroke-current text-subtle"
                    fill="transparent"
                />
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    strokeWidth="8"
                    stroke={getScoreColor()}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                    transform="rotate(-90 50 50)"
                />
            </svg>
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: getScoreColor() }}>{totalScore}</span>
            </div>
        </div>
        <div>
            <h3 className="font-bold text-lg text-primary">Financial Health</h3>
            <p className="text-sm text-secondary">You're on the right track. Tap to see your detailed score breakdown and get personalized AI advice.</p>
        </div>
    </button>
  );
};

export default FinancialHealthScore;