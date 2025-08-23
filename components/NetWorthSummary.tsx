import React, { useMemo } from 'react';
import { Account, AccountType, InvestmentHolding, Transaction } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface NetWorthSummaryProps {
  accounts: Account[];
  allTransactions: Transaction[];
  holdings: InvestmentHolding[];
  isVisible: boolean;
}

const NetWorthSummary: React.FC<NetWorthSummaryProps> = ({ accounts, allTransactions, holdings, isVisible }) => {
  const formatCurrency = useCurrencyFormatter();

  const netWorthData = useMemo(() => {
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

    let assets = 0;
    let liabilities = 0;

    accounts.forEach(acc => {
      const balance = accountBalances[acc.id];
      if (acc.accountType === AccountType.DEPOSITORY || acc.accountType === AccountType.INVESTMENT) {
        assets += balance;
      } else if (acc.accountType === AccountType.CREDIT) {
        liabilities += balance; // balance will be negative, representing debt
      }
    });
    
    // Add investment holdings value to assets
    assets += holdings.reduce((sum, holding) => sum + holding.currentValue, 0);

    return {
      assets,
      liabilities: Math.abs(liabilities),
      netWorth: assets + liabilities, // since liabilities is negative, adding it subtracts
    };

  }, [accounts, allTransactions, holdings]);

  return (
    <div className="mb-6 p-4 rounded-xl glass-card animate-fadeInUp" style={{animationDelay: '100ms'}}>
      <h3 className="font-bold text-lg mb-3 text-primary">Net Worth</h3>
      <div className="grid grid-cols-3 gap-4 text-left">
        <div>
          <p className="text-sm text-secondary">Assets</p>
          <p className="font-bold text-lg text-emerald-400">{isVisible ? formatCurrency(netWorthData.assets) : '••••'}</p>
        </div>
        <div>
          <p className="text-sm text-secondary">Liabilities</p>
          <p className="font-bold text-lg text-rose-400">{isVisible ? formatCurrency(netWorthData.liabilities) : '••••'}</p>
        </div>
        <div>
          <p className="text-sm text-secondary">Net Worth</p>
          <p className="font-bold text-lg text-primary">{isVisible ? formatCurrency(netWorthData.netWorth) : '••••'}</p>
        </div>
      </div>
    </div>
  );
};

export default NetWorthSummary;