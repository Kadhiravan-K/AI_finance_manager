import React, { useState } from 'react';
import { InvestmentHolding, Account, AccountType } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import EmptyState from './EmptyState';

interface InvestmentsScreenProps {
  accounts: Account[];
  holdings: InvestmentHolding[];
  onBuy: () => void;
  onSell: (holdingId: string, quantity: number, price: number, toAccountId: string) => void;
  onUpdateValue: (holdingId: string, newCurrentValue: number) => void;
  onRefresh: () => void;
}


const InvestmentsScreen: React.FC<InvestmentsScreenProps> = ({ accounts, holdings, onBuy, onSell, onUpdateValue, onRefresh }) => {
  const [view, setView] = useState<'list' | 'sell' | 'update'>('list');
  const [selectedHolding, setSelectedHolding] = useState<InvestmentHolding | null>(null);
  const [formData, setFormData] = useState({ quantity: 0, price: '', linkedAccountId: '', currentValue: '' });
  const formatCurrency = useCurrencyFormatter();
  
  const depositoryAccounts = accounts.filter(a => a.accountType === AccountType.DEPOSITORY);
  
  const resetForm = () => {
      setFormData({ quantity: 0, price: '', linkedAccountId: '', currentValue: ''});
      setSelectedHolding(null);
      setView('list');
  }

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolding) return;
    onSell(selectedHolding.id, formData.quantity, parseFloat(formData.price), formData.linkedAccountId);
    resetForm();
  }
  
  const handleUpdateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedHolding) return;
      onUpdateValue(selectedHolding.id, parseFloat(formData.currentValue));
      resetForm();
  }

  const renderList = () => (
    <div className="h-full flex flex-col">
       <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary">Investments 📈</h2>
            <button 
                onClick={onRefresh}
                className="button-secondary text-sm px-3 py-1.5 flex items-center gap-2"
                aria-label="Refresh market data"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5" /></svg>
                Refresh Data
            </button>
       </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {holdings.length === 0 ? (
            <EmptyState
                icon="💹"
                title="Start Your Investment Journey"
                message="Track your stocks, funds, and other assets to see your portfolio grow."
                actionText="Track First Investment"
                onAction={onBuy}
            />
        ) : holdings.map(h => {
          const gainLoss = h.currentValue - (h.quantity * h.averageCost);
          const isGain = gainLoss >= 0;
          return (
            <div key={h.id} className="p-3 bg-subtle rounded-lg">
              <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-primary">{h.name}</p>
                    <p className="text-xs text-secondary">{h.quantity} units @ {formatCurrency(h.averageCost)} avg.</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatCurrency(h.currentValue)}</p>
                    <p className={`text-xs font-medium ${isGain ? 'text-[var(--color-accent-emerald)]' : 'text-[var(--color-accent-rose)]'}`}>
                        {isGain ? '+' : ''}{formatCurrency(gainLoss)}
                    </p>
                  </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => { setSelectedHolding(h); setView('update'); setFormData(f => ({...f, currentValue: h.currentValue.toString()}))}} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Update Value</button>
                <button onClick={() => { setSelectedHolding(h); setView('sell'); setFormData(f => ({...f, quantity: h.quantity, linkedAccountId: depositoryAccounts[0]?.id}))}} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full">Sell</button>
              </div>
            </div>
          )
        })}
      </div>
      <div className="p-4 border-t border-divider flex-shrink-0">
        <button onClick={onBuy} className="button-primary w-full px-4 py-2">Buy Investment</button>
      </div>
    </div>
  );
  
  return renderList();
};

export default InvestmentsScreen;