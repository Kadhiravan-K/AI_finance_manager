import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, Category } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface RefundsScreenProps {
  transactions: Transaction[];
  categories: Category[];
  onEditTransaction: (transaction: Transaction) => void;
}

const getCategoryPath = (categoryId: string, categories: Category[]): string => {
    let path: string[] = [], current = categories.find(c => c.id === categoryId);
    while (current) { path.unshift(current.name); current = categories.find(c => c.id === current.parentId); }
    return path.join(' / ') || 'Uncategorized';
};

const RefundsScreen: React.FC<RefundsScreenProps> = ({ transactions, categories, onEditTransaction }) => {
  const formatCurrency = useCurrencyFormatter();
  const refundTransactions = transactions.filter(t => t.isRefundFor);
  const originalTransactions = new Map(transactions.map(t => [t.id, t]));

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0">
        <h2 className="text-2xl font-bold text-primary text-center">Refunds ↩️</h2>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-3">
        {refundTransactions.map(refund => {
          const original = refund.isRefundFor ? originalTransactions.get(refund.isRefundFor) : null;
          return (
            <div key={refund.id} className="p-3 bg-subtle rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-primary">{refund.description}</p>
                  <p className="text-xs text-secondary">{new Date(refund.date).toLocaleDateString()}</p>
                </div>
                <p className="font-semibold text-emerald-400">{formatCurrency(refund.amount)}</p>
              </div>
              {original && (
                <div className="mt-2 pt-2 border-t border-divider text-xs text-secondary">
                  <p>Refund for: "{original.description}" ({formatCurrency(original.amount)}) on {new Date(original.date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          );
        })}
        {refundTransactions.length === 0 && <p className="text-center text-secondary py-8">No refunds have been processed yet.</p>}
      </div>
    </div>
  );
};

interface RefundTransactionSelectorProps {
  transactions: Transaction[];
  categories: Category[];
  onSelect: (transaction: Transaction) => void;
  onCancel: () => void;
}

export const RefundTransactionSelector: React.FC<RefundTransactionSelectorProps> = ({ transactions, categories, onSelect, onCancel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const formatCurrency = useCurrencyFormatter();

  const refundableTransactions = useMemo(() => {
    const refundedIds = new Set(transactions.map(t => t.isRefundFor).filter(Boolean));
    return transactions.filter(t => t.type === 'expense' && !refundedIds.has(t.id));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    if (!lowerCaseQuery) return refundableTransactions;
    return refundableTransactions.filter(t =>
      t.description.toLowerCase().includes(lowerCaseQuery)
    );
  }, [refundableTransactions, searchQuery]);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[55] p-4" onClick={onCancel}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Select Expense to Refund" onClose={onCancel} />
        <div className="p-4 border-b border-divider">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for an expense..."
            className="w-full input-base p-2 rounded-lg"
            autoFocus
          />
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          {filteredTransactions.map(t => (
            <button key={t.id} onClick={() => onSelect(t)} className="w-full text-left p-3 bg-subtle rounded-lg group transition-colors hover-bg-stronger">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-primary">{t.description}</p>
                  <p className="text-xs text-secondary">{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <span className="font-semibold text-rose-400">{formatCurrency(t.amount)}</span>
              </div>
            </button>
          ))}
           {filteredTransactions.length === 0 && <p className="text-center text-secondary py-4">No matching expenses found.</p>}
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default RefundsScreen;