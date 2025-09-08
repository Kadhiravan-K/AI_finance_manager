import React, { useState, useMemo } from 'react';
import { Debt } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import EmptyState from './EmptyState';

interface DebtManagerScreenProps {
    debts: Debt[];
    onAddDebt: () => void;
    onEditDebt: (debt: Debt) => void;
    onDeleteDebt: (id: string) => void;
    onSaveDebt: (debt: Omit<Debt, 'id' | 'currentBalance'>, id?: string) => void;
}

type Strategy = 'snowball' | 'avalanche';

const DebtManagerScreen: React.FC<DebtManagerScreenProps> = ({ debts, onAddDebt, onEditDebt, onDeleteDebt }) => {
    const [strategy, setStrategy] = useState<Strategy>('avalanche');
    const [extraPayment, setExtraPayment] = useState('');
    const formatCurrency = useCurrencyFormatter();

    const totalMinimumPayment = useMemo(() => debts.reduce((sum, debt) => sum + debt.minimumPayment, 0), [debts]);
    const totalDebt = useMemo(() => debts.reduce((sum, debt) => sum + debt.currentBalance, 0), [debts]);

    const payoffPlan = useMemo(() => {
        if (debts.length === 0) return { months: 0, totalInterest: 0, plan: [] };

        let remainingDebts = debts.map(d => ({ ...d }));
        
        if (strategy === 'snowball') {
            remainingDebts.sort((a, b) => a.currentBalance - b.currentBalance);
        } else { // avalanche
            remainingDebts.sort((a, b) => b.apr - a.apr);
        }

        const plan: { month: number; debtName: string; payment: number; interest: number; principal: number; remainingBalance: number }[] = [];
        let months = 0;
        let totalInterestPaid = 0;
        const extra = parseFloat(extraPayment) || 0;

        while (remainingDebts.some(d => d.currentBalance > 0) && months < 600) { // 50 year limit
            months++;
            let monthlyExtra = extra;
            const totalMinPaymentThisMonth = remainingDebts.reduce((sum, d) => d.minimumPayment, 0);

            for (let i = 0; i < remainingDebts.length; i++) {
                const debt = remainingDebts[i];
                if (debt.currentBalance <= 0) continue;

                const monthlyInterest = (debt.apr / 100 / 12) * debt.currentBalance;
                totalInterestPaid += monthlyInterest;

                let payment = debt.minimumPayment;
                if (i === 0) { // Target the first debt in the sorted list
                    payment += monthlyExtra;
                }
                
                // Ensure payment covers at least the interest
                payment = Math.max(payment, monthlyInterest);
                // Ensure payment does not exceed remaining balance
                payment = Math.min(payment, debt.currentBalance + monthlyInterest);

                const principalPaid = payment - monthlyInterest;
                const newBalance = debt.currentBalance - principalPaid;

                plan.push({
                    month: months,
                    debtName: debt.name,
                    payment: payment,
                    interest: monthlyInterest,
                    principal: principalPaid,
                    remainingBalance: newBalance,
                });
                
                debt.currentBalance = newBalance;
            }
            // After paying off a debt, its minimum payment becomes available for the next target
            const paidOffThisMonth = remainingDebts.filter(d => d.currentBalance <= 0);
            const freedUpPayments = paidOffThisMonth.reduce((sum, d) => sum + d.minimumPayment, 0);
            if (freedUpPayments > 0) {
                 setExtraPayment(prev => String((parseFloat(prev) || 0) + freedUpPayments));
            }
            
            remainingDebts = remainingDebts.filter(d => d.currentBalance > 0);
        }

        return { months, totalInterest: totalInterestPaid, plan: plan.slice(0, 12) }; // Show first year
    }, [debts, strategy, extraPayment]);

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0">
                <h2 className="text-2xl font-bold text-primary text-center">Debt Payoff Planner 💳</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {debts.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-subtle rounded-lg text-center"><p className="text-xs text-secondary">Total Debt</p><p className="text-lg font-bold text-primary">{formatCurrency(totalDebt)}</p></div>
                        <div className="p-3 bg-subtle rounded-lg text-center"><p className="text-xs text-secondary">Total Min. Payments</p><p className="text-lg font-bold text-primary">{formatCurrency(totalMinimumPayment)}/mo</p></div>
                    </div>
                )}
                 <div className="space-y-2">
                    {debts.map(debt => (
                        <div key={debt.id} className="p-3 bg-subtle rounded-lg group">
                            <div className="flex justify-between items-center">
                                <div><p className="font-semibold text-primary">{debt.name}</p><p className="text-xs text-secondary">{formatCurrency(debt.minimumPayment)}/mo @ {debt.apr}% APR</p></div>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-primary">{formatCurrency(debt.currentBalance)}</p>
                                    <div className="opacity-0 group-hover:opacity-100"><button onClick={() => onEditDebt(debt)} className="text-xs px-2 py-1 text-sky-300">Edit</button><button onClick={() => onDeleteDebt(debt.id)} className="text-xs px-2 py-1 text-rose-400">Del</button></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {debts.length > 0 && (
                    <div className="p-4 glass-card rounded-xl">
                        <h3 className="font-semibold text-lg text-primary mb-3">Payoff Strategy</h3>
                        <div className="flex items-center gap-2 p-1 rounded-full bg-subtle border border-divider">
                            <button onClick={() => setStrategy('avalanche')} className={`w-full py-2 text-sm font-semibold rounded-full ${strategy === 'avalanche' ? 'bg-emerald-500 text-white' : ''}`}>Avalanche (Highest APR)</button>
                            <button onClick={() => setStrategy('snowball')} className={`w-full py-2 text-sm font-semibold rounded-full ${strategy === 'snowball' ? 'bg-emerald-500 text-white' : ''}`}>Snowball (Lowest Balance)</button>
                        </div>
                        <div className="mt-4">
                            <label className="text-sm font-medium text-secondary mb-1">Extra Monthly Payment</label>
                            <input type="number" value={extraPayment} onChange={e => setExtraPayment(e.target.value)} className="w-full input-base p-2 rounded-lg no-spinner" placeholder="0.00" />
                        </div>
                         <div className="text-center mt-4 p-3 bg-subtle rounded-lg">
                            <p className="text-secondary">Estimated Payoff Time</p>
                            <p className="text-2xl font-bold text-emerald-400">{Math.floor(payoffPlan.months / 12)} years, {payoffPlan.months % 12} months</p>
                            <p className="text-xs text-secondary">Total interest paid: {formatCurrency(payoffPlan.totalInterest)}</p>
                        </div>
                    </div>
                )}
                {debts.length === 0 && (
                     <EmptyState
                        icon="💳"
                        title="Ready to Tackle Your Debt?"
                        message="Add your credit cards and loans to create a powerful payoff plan."
                        actionText="Add First Debt"
                        onAction={onAddDebt}
                    />
                )}
            </div>
            <div className="p-4 border-t border-divider flex-shrink-0">
                <button onClick={onAddDebt} className="button-primary w-full py-2">+ Add New Debt</button>
            </div>
        </div>
    );
};

export default DebtManagerScreen;