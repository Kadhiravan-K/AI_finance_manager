import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Trip, TripExpense } from '../types';
import { calculateTripSummary } from '../utils/calculations';
import { getCurrencyFormatter } from '../utils/currency';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface GlobalTripSummaryModalProps {
  allExpenses: TripExpense[];
  trips: Trip[];
  onClose: () => void;
  onSettle: (from: string, to: string, currency: string, amount: number) => void;
}

const GlobalTripSummaryModal: React.FC<GlobalTripSummaryModalProps> = ({ allExpenses, trips, onClose, onSettle }) => {
  const settlementsByCurrency = calculateTripSummary(allExpenses, trips);
  const [settling, setSettling] = useState<{from: string, to: string, currency: string, amount: number} | null>(null);
  const [settleAmount, setSettleAmount] = useState('');

  const handleSettleClick = (settlement: {from: string, to: string, amount: number}, currency: string) => {
    setSettling({ ...settlement, currency });
    setSettleAmount(settlement.amount.toString());
  };

  const handleConfirmSettle = () => {
    if (settling) {
      const amount = parseFloat(settleAmount);
      if (!isNaN(amount) && amount > 0) {
        onSettle(settling.from, settling.to, settling.currency, amount);
        setSettling(null);
        setSettleAmount('');
      }
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Overall Trip Summary" onClose={onClose} icon="🌍" />
        <div className="p-6 flex-grow overflow-y-auto">
          <p className="text-sm text-secondary mb-4">This is a combined summary of who owes whom across all of your trips, broken down by currency.</p>
          <div className="space-y-4">
            {Object.keys(settlementsByCurrency).length > 0 ? Object.entries(settlementsByCurrency).map(([currency, settlements]) => {
                const formatCurrency = getCurrencyFormatter(currency).format;
                return (
                  <div key={currency}>
                    <h3 className="font-semibold text-lg text-primary mb-2 border-b border-divider pb-1">{currency} Settlements</h3>
                    <div className="space-y-3 p-3 bg-subtle rounded-lg">
                      {settlements.length > 0 ? settlements.map((s, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-center">
                                <span className="font-semibold text-primary">{s.from}</span>
                                <span className="mx-2 text-secondary">&rarr;</span>
                                <span className="font-semibold text-primary">{s.to}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <span className="font-mono text-emerald-400">{formatCurrency(s.amount)}</span>
                                {settling?.from === s.from && settling?.to === s.to ? null : (
                                    <button onClick={() => handleSettleClick(s, currency)} className="button-secondary px-3 py-1 text-xs">Settle</button>
                                )}
                             </div>
                          </div>
                          {settling?.from === s.from && settling?.to === s.to && (
                            <div className="mt-2 p-2 bg-slate-800/50 rounded-md space-y-2 animate-fadeInUp">
                                <input type="number" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} className="w-full input-base p-2 rounded-md no-spinner" max={s.amount} step="0.01" />
                                <div className="flex justify-end gap-2">
                                    <button onClick={handleConfirmSettle} className="button-primary px-3 py-1 text-xs">Confirm</button>
                                    <button onClick={() => setSettling(null)} className="button-secondary px-3 py-1 text-xs">Cancel</button>
                                </div>
                            </div>
                          )}
                        </div>
                      )) : <p className="text-center text-sm text-secondary">All settled up for {currency}!</p>}
                    </div>
                  </div>
                )
            }) : (
              <p className="text-center text-secondary py-8">Everyone is settled up across all trips!</p>
            )}
          </div>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default GlobalTripSummaryModal;