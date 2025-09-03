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
    <div className="mb-6 p-4 rounded-xl glass-card animate-fadeInUp" style={{animationDelay: '250ms'}}>
      <h3 className="font-bold text-lg mb-3 text-primary" style={{color: 'var(--color-accent-yellow)'}}>Upcoming / Due Bills</h3>
      <div className="space-y-3">
        {upcomingBills.map(bill => (
          <div key={bill.id} className="flex items-center justify-between p-2 bg-subtle rounded-lg">
            <div className="flex items-center gap-3">
                <span className="text-xl">{getCategory(bill.categoryId)?.icon || '💸'}</span>
                <div>
                    <p className="font-semibold text-primary">{bill.description}</p>
                    <p className="text-xs text-secondary">Due: {new Date(bill.nextDueDate).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="font-bold" style={{color: 'var(--color-accent-rose)'}}>{formatCurrency(bill.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingBills;