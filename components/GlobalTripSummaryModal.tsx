import React from 'react';
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
}

const GlobalTripSummaryModal: React.FC<GlobalTripSummaryModalProps> = ({ allExpenses, trips, onClose }) => {
  const settlementsByCurrency = calculateTripSummary(allExpenses, trips);

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Overall Trip Summary" onClose={onClose} icon="🌍" />
        <div className="p-6 flex-grow overflow-y-auto">
          <p className="text-sm text-secondary mb-4">This is a combined summary of who owes whom across all of your trips, broken down by currency.</p>
          <div className="space-y-4">
            {Object.keys(settlementsByCurrency).length > 0 ? Object.entries(settlementsByCurrency).map(([currency, settlements]) => (
              <div key={currency}>
                <h3 className="font-semibold text-lg text-primary mb-2 border-b border-divider pb-1">{currency} Settlements</h3>
                <div className="space-y-3 p-3 bg-subtle rounded-lg">
                  {settlements.length > 0 ? settlements.map((s, i) => (
                    <div key={i} className="flex items-center justify-center text-center text-sm">
                      <span className="font-semibold text-primary">{s.from}</span>
                      <span className="mx-2 text-secondary">&rarr;</span>
                      <span className="font-semibold text-primary">{s.to}</span>
                      <span className="ml-2 font-mono text-emerald-400">{getCurrencyFormatter(currency).format(s.amount)}</span>
                    </div>
                  )) : <p className="text-center text-sm text-secondary">All settled up for {currency}!</p>}
                </div>
              </div>
            )) : (
              <p className="text-center text-secondary py-8">Everyone is settled up across all trips!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default GlobalTripSummaryModal;