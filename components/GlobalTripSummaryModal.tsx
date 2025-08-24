import React from 'react';
import ReactDOM from 'react-dom';
import { TripExpense } from '../types';
import { calculateTripSummary } from '../utils/calculations';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface GlobalTripSummaryModalProps {
  allExpenses: TripExpense[];
  onClose: () => void;
}

const GlobalTripSummaryModal: React.FC<GlobalTripSummaryModalProps> = ({ allExpenses, onClose }) => {
  const formatCurrency = useCurrencyFormatter();
  const settlements = calculateTripSummary(allExpenses);

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Overall Trip Summary" onClose={onClose} icon="🌍" />
        <div className="p-6 flex-grow overflow-y-auto">
          <p className="text-sm text-secondary mb-4">This is a combined summary of who owes whom across all of your trips.</p>
          <div className="space-y-3">
            {settlements.length > 0 ? settlements.map((s, i) => (
              <div key={i} className="flex items-center justify-center text-center p-3 bg-subtle rounded-lg text-lg">
                <span className="font-semibold text-primary">{s.from}</span>
                <span className="mx-3 text-secondary text-2xl">&rarr;</span>
                <span className="font-semibold text-primary">{s.to}</span>
                <span className="ml-4 font-mono text-emerald-400">{formatCurrency(s.amount)}</span>
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