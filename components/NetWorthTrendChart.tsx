
import React, { useMemo } from 'react';
import { Transaction, Account, AccountType, TransactionType } from '../types';
import TimeSeriesLineChart from './TimeSeriesLineChart';

interface NetWorthTrendChartProps {
  transactions: Transaction[];
  accounts: Account[];
  currency: string;
}

const NetWorthTrendChart: React.FC<NetWorthTrendChartProps> = ({ transactions, accounts, currency }) => {

  const chartData = useMemo(() => {
    const monthlyNetWorth: { date: Date, amount: number }[] = [];
    const now = new Date();

    const assetsAccounts = new Set(accounts.filter(a => a.accountType === AccountType.DEPOSITORY).map(a => a.id));
    const liabilitiesAccounts = new Set(accounts.filter(a => a.accountType === AccountType.CREDIT).map(a => a.id));

    // Calculate net worth for the end of the last 12 months
    for (let i = 11; i >= 0; i--) {
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const transactionsUpToMonth = transactions.filter(t => new Date(t.date) <= monthEnd);

        const balances = transactionsUpToMonth.reduce((acc, t) => {
            acc[t.accountId] = (acc[t.accountId] || 0) + (t.type === 'income' ? t.amount : -t.amount);
            return acc;
        }, {} as Record<string, number>);

        let assets = 0;
        let liabilities = 0;

        for (const accountId in balances) {
            if (assetsAccounts.has(accountId)) {
                assets += balances[accountId];
            } else if (liabilitiesAccounts.has(accountId)) {
                liabilities += balances[accountId]; // Liabilities are negative balances
            }
        }
        
        monthlyNetWorth.push({
            date: monthEnd,
            amount: assets + liabilities,
        });
    }

    // Convert to the format TimeSeriesLineChart expects
    const transactionsForChart: Transaction[] = monthlyNetWorth.map(point => ({
        id: point.date.toISOString(),
        date: point.date.toISOString(),
        amount: point.amount,
        type: TransactionType.INCOME, // Use 'income' type to show positive values correctly
        accountId: '',
        categoryId: '',
        description: ''
    }));

    return transactionsForChart;
  }, [transactions, accounts]);


  return (
    <TimeSeriesLineChart
      title="Net Worth Trend"
      transactions={chartData}
      period="year"
      type={TransactionType.INCOME}
      currency={currency}
      onPointClick={() => {}}
    />
  );
};

export default NetWorthTrendChart;