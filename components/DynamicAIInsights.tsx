import React, { useState, useEffect } from 'react';
import { AppState, ProactiveInsight } from '../types';
import { getProactiveInsights } from '../services/geminiService';

interface DynamicAIInsightsProps {
  appState: AppState;
  dateFilter: string; // Not directly used in new logic but kept for context
}

const DynamicAIInsights: React.FC<DynamicAIInsightsProps> = ({ appState }) => {
  const [insight, setInsight] = useState<ProactiveInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      if (appState && appState.transactions.length > 2) {
        setIsLoading(true);
        try {
          // Use the full app state for a more holistic insight
          const newInsight = await getProactiveInsights(appState);
          setInsight(newInsight);
        } catch (error) {
          console.error("Failed to fetch AI proactive insights:", error);
          setInsight({
            insightType: 'generic',
            title: 'Quick Tip',
            message: "Review your budgets regularly to stay on track with your financial goals."
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setInsight({
            insightType: 'generic',
            title: 'Getting Started',
            message: "Log a few more transactions to unlock personalized AI insights and financial coaching."
        });
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchInsight, 500); // Debounce to avoid rapid calls
    return () => clearTimeout(timeoutId);
  }, [appState]); // Rerun when appState changes

  const ICONS: Record<ProactiveInsight['insightType'], string> = {
    anomaly: '⚠️',
    forecast: '🔮',
    subscription_suggestion: '🔁',
    generic: '💡'
  };

  return (
    <div className="mb-6 p-4 rounded-xl glass-card animate-fadeInUp">
       <h3 className="font-bold text-lg mb-3" style={{color: 'var(--color-accent-violet)'}}>AI Financial Coach ✨</h3>
      {isLoading ? (
        <div className="flex items-center gap-3 text-secondary animate-pulse">
          <div className="w-8 h-8 rounded-full bg-subtle"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-subtle"></div>
            <div className="h-3 w-1/2 rounded bg-subtle"></div>
          </div>
        </div>
      ) : insight ? (
         <div className="flex items-start gap-3">
            <div className="text-2xl mt-1">{ICONS[insight.insightType]}</div>
            <div>
                <h4 className="font-semibold text-primary">{insight.title}</h4>
                <p className="text-sm text-secondary">{insight.message}</p>
            </div>
         </div>
      ) : null}
    </div>
  );
};

export default DynamicAIInsights;