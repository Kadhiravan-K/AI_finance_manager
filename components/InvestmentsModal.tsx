import React, { useState } from 'react';
import { InvestmentHolding, Account, AccountType } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomSelect from './CustomSelect';

interface InvestmentsScreenProps {
  accounts: Account[];
  holdings: InvestmentHolding[];
  onBuy: (investmentAccountId: string, name: string, quantity: number, price: number, fromAccountId: string) => void;
  onSell: (holdingId: string, quantity: number, price: number, toAccountId: string) => void;
  onUpdateValue: (holdingId: string, newCurrentValue: number) => void;
}

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const InvestmentsScreen: React.FC<InvestmentsScreenProps> = ({ accounts, holdings, onBuy, onSell, onUpdateValue }) => {
  const [view, setView] = useState<'list' | 'buy' | 'sell' | 'update'>('list');
  const [selectedHolding, setSelectedHolding] = useState<InvestmentHolding | null>(null);
  const [formData, setFormData] = useState({ name: '', quantity: '', price: '', accountId: '', linkedAccountId: '', currentValue: '' });
  const formatCurrency = useCurrencyFormatter();

  const investmentAccounts = accounts.filter(a => a.accountType === AccountType.INVESTMENT);
  const depositoryAccounts = accounts.filter(a => a.accountType === AccountType.DEPOSITORY);
  
  const resetForm = () => {
      setFormData({ name: '', quantity: '', price: '', accountId: '', linkedAccountId: '', currentValue: ''});
      setSelectedHolding(null);
      setView('list');
  }

  const handleBuySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBuy(formData.accountId, formData.name, parseFloat(formData.quantity), parseFloat(formData.price), formData.linkedAccountId);
    resetForm();
  }

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolding) return;
    onSell(selectedHolding.id, parseFloat(formData.quantity), parseFloat(formData.price), formData.linkedAccountId);
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
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {holdings.length === 0 ? <p className="text-secondary text-center py-8">No investments tracked yet. Click "Buy Investment" to start.</p> : null}
        {holdings.map(h => {
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
                <button onClick={() => { setSelectedHolding(h); setView('sell'); setFormData(f => ({...f, linkedAccountId: depositoryAccounts[0]?.id}))}} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full">Sell</button>
              </div>
            </div>
          )
        })}
      </div>
      <div className="p-4 border-t border-divider flex-shrink-0">
        <button onClick={() => { setView('buy'); setFormData(f => ({...f, accountId: investmentAccounts[0]?.id, linkedAccountId: depositoryAccounts[0]?.id}))}} className="button-primary w-full px-4 py-2">Buy Investment</button>
      </div>
    </div>
  );

  const renderForm = () => {
    let title = 'Buy Investment';
    let handleSubmit = handleBuySubmit;
    if (view === 'sell') { title = `Sell ${selectedHolding?.name}`; handleSubmit = handleSellSubmit; }
    if (view === 'update') { title = `Update ${selectedHolding?.name}`; handleSubmit = handleUpdateSubmit; }

    return (
      <form onSubmit={handleSubmit} className="p-6 space-y-4 animate-fadeInUp">
        <h3 className="font-bold text-xl text-primary">{title}</h3>
        
        {view === 'buy' && (
             <div>
                <label className={labelStyle}>Investment Account</label>
                <CustomSelect value={formData.accountId} onChange={v => setFormData(f => ({...f, accountId: v}))} options={investmentAccounts.map(a => ({value: a.id, label: a.name}))} />
            </div>
        )}

        {view !== 'update' && (
          <>
            {view === 'buy' && (
                <div>
                    <label className={labelStyle}>Holding Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} className="input-base w-full rounded-lg py-2 px-3" required />
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Quantity</label>
                <input type="number" step="any" min="0" value={formData.quantity} onChange={e => setFormData(f => ({...f, quantity: e.target.value}))} className="input-base w-full rounded-lg py-2 px-3" required />
              </div>
              <div>
                <label className={labelStyle}>Price per Unit</label>
                <input type="number" step="any" min="0.01" value={formData.price} onChange={e => setFormData(f => ({...f, price: e.target.value}))} className="input-base w-full rounded-lg py-2 px-3" required />
              </div>
            </div>
             <div>
                <label className={labelStyle}>{view === 'buy' ? 'Pay From' : 'Deposit To'}</label>
                <CustomSelect value={formData.linkedAccountId} onChange={v => setFormData(f => ({...f, linkedAccountId: v}))} options={depositoryAccounts.map(a => ({value: a.id, label: a.name}))} />
            </div>
          </>
        )}
        
        {view === 'update' && (
             <div>
                <label className={labelStyle}>New Total Current Value</label>
                <input type="number" step="any" min="0" value={formData.currentValue} onChange={e => setFormData(f => ({...f, currentValue: e.target.value}))} className="input-base w-full rounded-lg py-2 px-3" required autoFocus/>
            </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={resetForm} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2">Confirm</button>
        </div>
      </form>
    );
  }

  return (
    <div className="h-full flex flex-col">
       {view === 'list' ? renderList() : renderForm()}
    </div>
  );
};

export default InvestmentsScreen;