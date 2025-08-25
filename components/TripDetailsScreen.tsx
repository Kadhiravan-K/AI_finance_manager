import React, { useState, useMemo } from 'react';
import { Trip, TripExpense, TransactionType, Transaction, Category } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { calculateTripSummary } from '../utils/calculations';
import CategoryPieChart from './CategoryPieChart';

interface TripDetailsScreenProps {
  trip: Trip;
  expenses: TripExpense[];
  onAddExpense: () => void;
  onEditExpense: (expense: TripExpense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onBack: () => void;
  categories: Category[];
}
type TripDetailsTab = 'dashboard' | 'expenses';

const TripDetailsScreen: React.FC<TripDetailsScreenProps> = ({ trip, expenses, onAddExpense, onEditExpense, onDeleteExpense, onBack, categories }) => {
  const formatCurrency = useCurrencyFormatter(undefined, trip.currency);
  const [activeTab, setActiveTab] = useState<TripDetailsTab>('dashboard');

  const settlementSummary = useMemo(() => calculateTripSummary(expenses, [trip])[trip.currency] || [], [expenses, trip]);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const getPayerNames = (expense: TripExpense): string => {
    if (!expense.payers || expense.payers.length === 0) return 'Unknown';
    return expense.payers
      .map(payer => trip.participants.find(p => p.contactId === payer.contactId)?.name || 'Unknown')
      .join(', ');
  };
  
  const transactionsForChart = useMemo((): Transaction[] => {
    return expenses.map(e => ({
        id: e.id,
        accountId: '', // Not needed for chart
        description: e.description,
        amount: e.amount,
        type: TransactionType.EXPENSE,
        categoryId: e.categoryId,
        date: e.date,
    }));
  }, [expenses]);

  const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button onClick={onClick} className={`w-full py-2 text-sm font-semibold transition-colors ${active ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary'}`}>
        {children}
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex items-center gap-2">
         <button onClick={onBack} className="p-2 -ml-2 text-secondary hover:text-primary hover:bg-subtle rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-xl font-bold text-primary truncate">{trip.name}</h2>
      </div>

       <div className="flex border-b border-divider flex-shrink-0">
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>Dashboard</TabButton>
          <TabButton active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')}>All Expenses</TabButton>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {activeTab === 'dashboard' && (
             <div className="space-y-6 animate-fadeInUp">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-subtle rounded-lg">
                        <p className="text-sm text-secondary">Total Spent</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div className="p-3 bg-subtle rounded-lg">
                        <p className="text-sm text-secondary">Participants</p>
                        <p className="text-xl font-bold text-primary">{trip.participants.length}</p>
                    </div>
                </div>

                <CategoryPieChart 
                    title="Spending Breakdown" 
                    transactions={transactionsForChart} 
                    categories={categories} 
                    type={TransactionType.EXPENSE} 
                    isVisible={true}
                    currency={trip.currency}
                />

                <div>
                  <h3 className="font-semibold text-lg text-primary mb-2">Who Owes Whom</h3>
                  <div className="space-y-2 p-3 bg-subtle rounded-lg">
                    {settlementSummary.length > 0 ? settlementSummary.map((s, i) => (
                      <div key={i} className="flex items-center justify-center text-center text-sm">
                        <span className="font-semibold text-primary">{s.from}</span>
                        <span className="mx-2 text-secondary">&rarr;</span>
                        <span className="font-semibold text-primary">{s.to}</span>
                        <span className="ml-2 font-mono text-emerald-400">{formatCurrency(s.amount)}</span>
                      </div>
                    )) : <p className="text-center text-sm text-secondary">All settled up!</p>}
                  </div>
                </div>
             </div>
        )}

        {activeTab === 'expenses' && (
             <div className="space-y-2 animate-fadeInUp">
                {expenses.map(expense => (
                  <div key={expense.id} className="p-3 bg-subtle rounded-lg group">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-primary">{expense.description}</p>
                        <p className="text-xs text-secondary">Paid by {getPayerNames(expense)}</p>
                      </div>
                      <p className="font-semibold text-rose-400">{formatCurrency(expense.amount)}</p>
                    </div>
                     <div className="flex justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEditExpense(expense)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                        <button onClick={() => onDeleteExpense(expense.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full">Delete</button>
                    </div>
                  </div>
                ))}
                 {expenses.length === 0 && <p className="text-center text-secondary py-8">No expenses recorded for this trip yet.</p>}
              </div>
        )}
      </div>
       <div className="flex-shrink-0 p-6 border-t border-divider bg-subtle">
        <button onClick={onAddExpense} className="button-primary w-full py-2 font-semibold">
          + Add Expense
        </button>
      </div>
    </div>
  );
};

export default TripDetailsScreen;
