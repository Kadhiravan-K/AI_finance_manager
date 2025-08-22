import React, { useMemo } from 'react';
import { InvestmentHolding } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface PortfolioSummaryProps {
  holdings: InvestmentHolding[];
  isVisible: boolean;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ holdings, isVisible }) => {
  const formatCurrency = useCurrencyFormatter();

  const totalValue = useMemo(() => holdings.reduce((sum, h) => sum + h.currentValue, 0), [holdings]);
  
  const topHoldings = useMemo(() => 
    [...holdings]
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 3), 
  [holdings]);

  if (holdings.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 rounded-xl glass-card animate-fadeInUp" style={{animationDelay: '150ms'}}>
      <h3 className="font-bold text-lg mb-3" style={{color: 'var(--color-accent-violet)'}}>Investment Portfolio</h3>
      <div className="text-center mb-4">
        <p className="text-sm text-secondary">Total Value</p>
        <p className="text-3xl font-bold text-primary">{isVisible ? formatCurrency(totalValue) : '••••'}</p>
      </div>
      {topHoldings.length > 0 && (
        <div>
            <h4 className="text-sm font-semibold text-secondary mb-2">Top Holdings</h4>
            <div className="space-y-2">
                {topHoldings.map(holding => (
                    <div key={holding.id} className="flex justify-between items-center text-sm p-2 bg-subtle rounded-lg">
                        <span className="font-medium text-primary truncate">{holding.name}</span>
                        <span className="font-semibold text-secondary">{isVisible ? formatCurrency(holding.currentValue) : '••••'}</span>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioSummary;