
import React, { useMemo } from 'react';
import { Transaction, RecurringTransaction, Account, AccountType } from '@/types';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

interface BalanceForecastProps {
  transactions: Transaction[];
  accounts: Account[];
  recurring: RecurringTransaction[];
  isVisible: boolean;
}

const BalanceForecast: React.FC<BalanceForecastProps> = ({ transactions, accounts, recurring, isVisible }) => {
  const formatCurrency = useCurrencyFormatter();

  const forecast = useMemo(() => {
    // 1. Calculate Current Balances for Depository Accounts
    const balances = transactions.reduce((acc, t) => {
        acc[t.accountId] = (acc[t.accountId] || 0) + (t.type === 'income' ? t.amount : -t.amount);
        return acc;
    }, {} as Record<string, number>);

    const currentTotal = accounts
        .filter(a => a.accountType === AccountType.DEPOSITORY)
        .reduce((sum, a) => sum + (balances[a.id] || 0), 0);

    // 2. Identify Pending Bills for this Month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const pendingBills = recurring.filter(r => {
        const dueDate = new Date(r.nextDueDate);
        return dueDate >= now && dueDate <= endOfMonth;
    });

    const pendingTotal = pendingBills.reduce((sum, r) => {
        return sum + (r.type === 'expense' ? r.amount : -r.amount);
    }, 0);

    const projectedBalance = currentTotal - pendingTotal;
    const safetyMargin = projectedBalance > 0 ? (projectedBalance / currentTotal) * 100 : 0;

    return { projectedBalance, pendingTotal, currentTotal, safetyMargin, billCount: pendingBills.length };
  }, [transactions, accounts, recurring]);

  if (forecast.currentTotal === 0 && forecast.billCount === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-xl glass-card animate-fadeInUp border-l-4 border-sky-500">
      <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-primary">Monthly Forecast</h3>
            <p className="text-xs text-secondary">Based on {forecast.billCount} upcoming bills</p>
          </div>
          <span className="text-xl">🔮</span>
      </div>
      
      <div className="flex items-center justify-between mt-4">
          <div>
              <p className="text-xs text-secondary uppercase font-bold tracking-tighter">Est. Month-End Balance</p>
              <p className={`text-2xl font-bold ${forecast.projectedBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isVisible ? formatCurrency(forecast.projectedBalance) : '••••'}
              </p>
          </div>
          <div className="text-right">
              <p className="text-xs text-secondary uppercase font-bold tracking-tighter">Bills Remaining</p>
              <p className="text-lg font-bold text-rose-400">
                {isVisible ? formatCurrency(forecast.pendingTotal) : '••••'}
              </p>
          </div>
      </div>

      <div className="mt-4">
          <div className="flex justify-between text-[10px] text-tertiary mb-1 font-bold uppercase">
              <span>Safety Margin</span>
              <span>{isVisible ? `${Math.round(forecast.safetyMargin)}%` : '••%'}</span>
          </div>
          <div className="w-full bg-subtle rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${forecast.safetyMargin > 30 ? 'bg-emerald-500' : forecast.safetyMargin > 10 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(forecast.safetyMargin, 100)}%` }}
              />
          </div>
      </div>
    </div>
  );
};

export default BalanceForecast;
