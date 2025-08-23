import React from 'react';
import { Trip, TripExpense } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { calculateTripSummary } from '../utils/calculations';

interface TripDetailsScreenProps {
  trip: Trip;
  expenses: TripExpense[];
  onAddExpense: () => void;
  onBack: () => void;
}

const TripDetailsScreen: React.FC<TripDetailsScreenProps> = ({ trip, expenses, onAddExpense, onBack }) => {
  const formatCurrency = useCurrencyFormatter();
  const settlementSummary = calculateTripSummary(expenses);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex items-center gap-2">
         <button onClick={onBack} className="p-2 -ml-2 text-secondary hover:text-primary hover:bg-subtle rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-xl font-bold text-primary truncate">{trip.name}</h2>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {/* Summary Section */}
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

        {/* Settlement Section */}
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

        {/* Expenses Section */}
        <div>
          <h3 className="font-semibold text-lg text-primary mb-2">Expenses</h3>
          <div className="space-y-2">
            {expenses.map(expense => (
              <div key={expense.id} className="p-3 bg-subtle rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-primary">{expense.description}</p>
                    <p className="text-xs text-secondary">Paid by {trip.participants.find(p => p.contactId === expense.paidByContactId)?.name}</p>
                  </div>
                  <p className="font-semibold text-rose-400">{formatCurrency(expense.amount)}</p>
                </div>
              </div>
            ))}
             {expenses.length === 0 && <p className="text-center text-sm text-secondary py-4">No expenses logged for this trip yet.</p>}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-divider bg-subtle">
        <button onClick={onAddExpense} className="button-primary w-full py-2 font-semibold">
          + Add Expense
        </button>
      </div>
    </div>
  );
};

export default TripDetailsScreen;