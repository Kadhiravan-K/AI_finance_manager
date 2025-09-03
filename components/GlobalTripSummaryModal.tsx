
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Trip, TripExpense, Settlement } from '../types';
import { calculateTripSummary, SettlementSuggestion } from '../utils/calculations';
import { getCurrencyFormatter } from '../utils/currency';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface GlobalTripSummaryModalProps {
  allExpenses: TripExpense[];
  trips: Trip[];
  settlements: Settlement[];
  onClose: () => void;
  onSettle: (fromId: string, toId: string, amount: number, currency: string) => void;
}

const GlobalTripSummaryModal: React.FC<GlobalTripSummaryModalProps> = ({ allExpenses, trips, settlements, onClose, onSettle }) => {
  const settlementsByCurrency = calculateTripSummary(allExpenses, trips, settlements);
  const [settling, setSettling] = useState<(SettlementSuggestion & { currency: string }) | null>(null);
  const [settleAmount, setSettleAmount] = useState('');

  const handleSettleClick = (settlement: SettlementSuggestion, currency: string) => {
    setSettling({ ...settlement, currency });
    setSettleAmount(settlement.amount.toString());
  };

  const handleConfirmSettle = (isFullAmount: boolean) => {
    if (settling) {
      const amount = isFullAmount ? settling.amount : parseFloat(settleAmount);
      if (!isNaN(amount) && amount > 0) {
        onSettle(settling.fromId, settling.toId, amount, settling.currency);
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
          <p className="text-sm text-secondary mb-4">This is a combined summary of who owes whom across all of your trips, broken down by currency. Settling a debt here will create corresponding transactions in your ledger.</p>
          <div className="space-y-4">
            {Object.keys(settlementsByCurrency).length > 0 ? Object.entries(settlementsByCurrency).map(([currency, settlementSuggestions]) => {
                const formatCurrency = getCurrencyFormatter(currency).format;
                return (
                  <div key={currency}>
                    <h3 className="font-semibold text-lg text-primary mb-2 border-b border-divider pb-1">{currency} Settlements</h3>
                    <div className="space-y-3 p-3 bg-subtle rounded-lg">
                      {settlementSuggestions.length > 0 ? settlementSuggestions.map((s, i) => (
                        <div key={`${s.fromId}-${s.toId}`}>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-center">
                                <span className="font-semibold text-primary">{s.fromName}</span>
                                <span className="mx-2 text-secondary">&rarr;</span>
                                <span className="font-semibold text-primary">{s.toName}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <span className="font-mono text-emerald-400">{formatCurrency(s.amount)}</span>
                                {settling?.fromId === s.fromId && settling?.toId === s.toId ? null : (
                                    <button onClick={() => handleSettleClick(s, currency)} className="button-secondary px-3 py-1 text-xs">Settle</button>
                                )}
                             </div>
                          </div>
                          {settling?.fromId === s.fromId && settling?.toId === s.toId && (
                            <div className="mt-2 p-3 bg-subtle rounded-md space-y-3 animate-fadeInUp border border-divider">
                               <button onClick={() => handleConfirmSettle(true)} className="w-full button-primary text-sm py-2">Settle Full Amount ({formatCurrency(settling.amount)})</button>
                               <div className="flex items-center gap-2">
                                  <input type="text" inputMode="decimal" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} className="w-full input-base p-2 rounded-md no-spinner" max={s.amount} />
                                  <button onClick={() => handleConfirmSettle(false)} className="button-secondary px-3 py-2 text-sm">Settle</button>
                               </div>
                               <button onClick={() => setSettling(null)} className="w-full text-xs text-secondary hover:text-primary mt-1">Cancel</button>
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
