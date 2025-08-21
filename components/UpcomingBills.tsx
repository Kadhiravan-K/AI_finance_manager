import React, { useMemo } from 'react';
import { RecurringTransaction, Category } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface UpcomingBillsProps {
  recurringTransactions: RecurringTransaction[];
  onPay: (item: RecurringTransaction) => void;
  categories: Category[];
}

const UpcomingBills: React.FC<UpcomingBillsProps> = ({ recurringTransactions, onPay, categories }) => {
  const formatCurrency = useCurrencyFormatter();

  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return recurringTransactions
      .filter(rt => new Date(rt.nextDueDate) <= today)
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [recurringTransactions]);

  const getCategory = (categoryId: string) => categories.find(c => c.id === categoryId);

  if (upcomingBills.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 rounded-xl glass-card">
      <h3 className="font-bold text-lg mb-3 text-yellow-400">Upcoming / Due Bills</h3>
      <div className="space-y-3">
        {upcomingBills.map(bill => (
          <div key={bill.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-3">
                <span className="text-xl">{getCategory(bill.categoryId)?.icon || '💸'}</span>
                <div>
                    <p className="font-semibold text-slate-200">{bill.description}</p>
                    <p className="text-xs text-slate-400">Due: {new Date(bill.nextDueDate).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="font-bold text-rose-400">{formatCurrency(bill.amount)}</span>
                <button onClick={() => onPay(bill)} className="px-3 py-1 text-sm font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-500 transition-colors">
                    Pay
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingBills;