import React from 'react';
import { Transaction, Category } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

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

export default RefundsScreen;