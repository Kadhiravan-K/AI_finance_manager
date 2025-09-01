import React, { useMemo, useState } from 'react';
import { Transaction, Account } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomSelect from './CustomSelect';

interface DebtsSummaryProps {
  transactions: Transaction[];
  accounts: Account[];
  onSettle: (transactionId: string, splitDetailId: string, settlementAccountId: string, amount: number) => void;
  isVisible: boolean;
}

interface UnsettledDebt {
    transactionId: string;
    transactionDescription: string;
    id: string; // splitDetailId
    personName: string;
    amount: number;
}

const DebtsSummary: React.FC<DebtsSummaryProps> = ({ transactions, accounts, onSettle, isVisible }) => {
  const formatCurrency = useCurrencyFormatter();
  const [settlingDebt, setSettlingDebt] = useState<UnsettledDebt | null>(null);
  const [settlementAccountId, setSettlementAccountId] = useState<string>(accounts[0]?.id || '');
  const [settlementAmount, setSettlementAmount] = useState<string>('');
  
  const unsettledDebts = useMemo(() => {
    const debts: UnsettledDebt[] = [];
    transactions.forEach(t => {
      if (t.splitDetails) {
        t.splitDetails.forEach(split => {
          if (!split.isSettled && split.personName.toLowerCase() !== 'you' && split.amount > 0) {
            debts.push({
              transactionId: t.id,
              transactionDescription: t.description,
              id: split.id,
              personName: split.personName,
              amount: split.amount
            });
          }
        });
      }
    });
    return debts;
  }, [transactions]);
  
  const totalOwed = useMemo(() => unsettledDebts.reduce((sum, debt) => sum + debt.amount, 0), [unsettledDebts]);

  if (unsettledDebts.length === 0) {
    return null;
  }

  const handleSettleClick = (debt: UnsettledDebt) => {
      setSettlingDebt(debt);
      setSettlementAccountId(accounts[0]?.id || '');
      setSettlementAmount(String(debt.amount));
  }

  const handleConfirmSettle = () => {
      const amount = parseFloat(settlementAmount);
      if (settlingDebt && settlementAccountId && amount > 0) {
          onSettle(settlingDebt.transactionId, settlingDebt.id, settlementAccountId, amount);
          setSettlingDebt(null);
          setSettlementAmount('');
      }
  }

  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));

  return (
    <div className="mb-6 p-4 rounded-xl glass-card animate-fadeInUp" style={{animationDelay: '200ms'}}>
      <h3 className="font-bold text-lg mb-3" style={{color: 'var(--color-accent-sky)'}}>Debts (Owed to You)</h3>
      <div className="text-primary font-semibold mb-3">Total Owed: <span className="text-primary">{isVisible ? formatCurrency(totalOwed) : '••••'}</span></div>
      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
        {unsettledDebts.map(debt => (
          <div key={debt.id} className="p-2 bg-subtle rounded-lg">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-primary">{debt.personName} owes {isVisible ? formatCurrency(debt.amount) : '••••'}</p>
                    <p className="text-xs text-secondary">For: {debt.transactionDescription}</p>
                </div>
                {settlingDebt?.id !== debt.id && (
                    <button onClick={() => handleSettleClick(debt)} className="px-3 py-1 text-sm font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-500 transition-colors">
                        Settle
                    </button>
                )}
            </div>
            {settlingDebt?.id === debt.id && (
                <div className="mt-2 pt-2 border-t border-divider space-y-2 animate-fadeInUp">
                    <div className="grid grid-cols-2 gap-2">
                         <input
                            type="number"
                            value={settlementAmount}
                            onChange={e => setSettlementAmount(e.target.value)}
                            className="w-full input-base p-2 rounded-md no-spinner"
                            max={debt.amount}
                            step="0.01"
                        />
                        <CustomSelect options={accountOptions} value={settlementAccountId} onChange={setSettlementAccountId} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={handleConfirmSettle} className="button-primary px-3 py-1 text-sm">Confirm</button>
                        <button onClick={() => setSettlingDebt(null)} className="button-secondary px-3 py-1 text-sm">Cancel</button>
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebtsSummary;