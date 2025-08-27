import React, { useMemo } from 'react';
import { Account, AccountType, InvestmentHolding, Transaction } from '../types';
import { getCurrencyFormatter } from '../utils/currency';

interface NetWorthSummaryProps {
  accounts: Account[];
  allTransactions: Transaction[];
  holdings: InvestmentHolding[];
  isVisible: boolean;
}

const NetWorthSummary: React.FC<NetWorthSummaryProps> = ({ accounts, allTransactions, holdings, isVisible }) => {

  const netWorthByCurrency = useMemo(() => {
    const accountBalances: Record<string, number> = {};
    accounts.forEach(acc => accountBalances[acc.id] = 0);

    allTransactions.forEach(t => {
      if (accountBalances[t.accountId] !== undefined) {
        if (t.type === 'income') {
          accountBalances[t.accountId] += t.amount;
        } else {
          accountBalances[t.accountId] -= t.amount;
        }
      }
    });

    const summaries: Record<string, { assets: number; liabilities: number; netWorth: number }> = {};

    accounts.forEach(acc => {
      const currency = acc.currency;
      if (!summaries[currency]) {
        summaries[currency] = { assets: 0, liabilities: 0, netWorth: 0 };
      }

      const balance = accountBalances[acc.id] || 0;
      if (acc.accountType === AccountType.DEPOSITORY || acc.accountType === AccountType.INVESTMENT) {
        summaries[currency].assets += balance;
      } else if (acc.accountType === AccountType.CREDIT) {
        summaries[currency].liabilities += balance; // balance will be negative, representing debt
      }
    });

    holdings.forEach(holding => {
      const account = accounts.find(a => a.id === holding.accountId);
      if (account) {
        const currency = account.currency;
        if (!summaries[currency]) {
          summaries[currency] = { assets: 0, liabilities: 0, netWorth: 0 };
        }
        summaries[currency].assets += holding.currentValue;
      }
    });

    Object.keys(summaries).forEach(currency => {
      summaries[currency].netWorth = summaries[currency].assets + summaries[currency].liabilities;
      summaries[currency].liabilities = Math.abs(summaries[currency].liabilities);
    });

    return Object.entries(summaries);
  }, [accounts, allTransactions, holdings]);

  if (netWorthByCurrency.length === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-xl glass-card animate-fadeInUp" style={{animationDelay: '100ms'}}>
      <h3 className="font-bold text-lg mb-3 text-primary">Net Worth</h3>
      <div className="space-y-4">
        {netWorthByCurrency.map(([currency, data]) => {
          const formatCurrency = getCurrencyFormatter(currency).format;
          return (
            <div key={currency}>
              <p className="text-sm font-semibold text-secondary mb-2">{currency}</p>
              <div className="grid grid-cols-3 gap-4 text-left">
                <div>
                  <p className="text-sm text-secondary">Assets</p>
                  <p className="font-bold text-lg text-emerald-400">{isVisible ? formatCurrency(data.assets) : '••••'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Liabilities</p>
                  <p className="font-bold text-lg text-rose-400">{isVisible ? formatCurrency(data.liabilities) : '••••'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Net Worth</p>
                  <p className="font-bold text-lg text-primary">{isVisible ? formatCurrency(data.netWorth) : '••••'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NetWorthSummary;
