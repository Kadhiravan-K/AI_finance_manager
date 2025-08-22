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
    <div className="mb-6 p-4 rounded-xl glass-card">
      <h3 className="font-bold text-lg mb-3 text-violet-400">Investment Portfolio</h3>
      <div className="text-center mb-4">
        <p className="text-sm text-slate-400">Total Value</p>
        <p className="text-3xl font-bold text-white">{isVisible ? formatCurrency(totalValue) : '••••'}</p>
      </div>
      {topHoldings.length > 0 && (
        <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Top Holdings</h4>
            <div className="space-y-2">
                {topHoldings.map(holding => (
                    <div key={holding.id} className="flex justify-between items-center text-sm p-2 bg-slate-700/30 rounded-lg">
                        <span className="font-medium text-slate-200 truncate">{holding.name}</span>
                        <span className="font-semibold text-slate-300">{isVisible ? formatCurrency(holding.currentValue) : '••••'}</span>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioSummary;
