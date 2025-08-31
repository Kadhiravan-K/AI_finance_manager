import React, { useState, useEffect, useContext } from 'react';
import { Transaction, Category, DateRange } from '../types';
import { getDashboardInsights } from '../services/geminiService';
import { SettingsContext } from '../contexts/SettingsContext';

interface DynamicAIInsightsProps {
  transactions: Transaction[];
  categories: Category[];
  dateFilter: DateRange;
}

const DynamicAIInsights: React.FC<DynamicAIInsightsProps> = ({ transactions, categories, dateFilter }) => {
  const [insight, setInsight] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      if (transactions.length > 0) {
        setIsLoading(true);
        try {
          const dateFilterLabel = dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1);
          const newInsight = await getDashboardInsights(transactions, categories, dateFilterLabel);
          setInsight(newInsight);
        } catch (error) {
          console.error("Failed to fetch AI dashboard insights:", error);
          setInsight("Could not load financial tips at the moment.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setInsight("No transactions in this period to analyze.");
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchInsight, 500); // Debounce to avoid rapid calls
    return () => clearTimeout(timeoutId);
  }, [transactions, categories, dateFilter]);

  return (
    <div className="mb-6 p-4 rounded-xl glass-card animate-fadeInUp">
      <h3 className="font-bold text-lg mb-3" style={{color: 'var(--color-accent-violet)'}}>AI Insights ✨</h3>
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

export default DynamicAIInsights;