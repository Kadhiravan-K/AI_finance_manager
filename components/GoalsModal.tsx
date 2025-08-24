import React, { useState } from 'react';
import { Goal, Account } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomSelect from './CustomSelect';

interface GoalsScreenProps {
  goals: Goal[];
  onSaveGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>, id?: string) => void;
  accounts: Account[];
  onContribute: (goalId: string, amount: number, accountId: string) => void;
  onDelete: (id: string) => void;
  onEditGoal: (goal: Goal) => void;
}

const GoalsScreen: React.FC<GoalsScreenProps> = ({ goals, onSaveGoal, accounts, onContribute, onDelete, onEditGoal }) => {
  const formatCurrency = useCurrencyFormatter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', icon: '🏆', targetAmount: '', productLink: '' });
  
  const [contributionState, setContributionState] = useState<{ goalId: string; amount: string; accountId: string; } | null>(null);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newGoal.targetAmount);
    if (newGoal.name.trim() && amount > 0) {
      onSaveGoal({
        name: newGoal.name.trim(),
        icon: newGoal.icon.trim() || '🏆',
        targetAmount: amount,
        productLink: newGoal.productLink.trim() || undefined,
      });
      setNewGoal({ name: '', icon: '🏆', targetAmount: '', productLink: '' });
      setShowAddForm(false);
    }
  };

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contributionState) {
        const amount = parseFloat(contributionState.amount);
        if(amount > 0 && contributionState.accountId) {
            onContribute(contributionState.goalId, amount, contributionState.accountId);
            setContributionState(null);
        }
    }
  };
  
  const accountOptions = accounts.map(acc => ({ value: acc.id, label: acc.name }));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        <h2 className="text-2xl font-bold text-primary">Financial Goals 🏆</h2>
        {goals.map(goal => {
          const percentage = (goal.currentAmount / goal.targetAmount) * 100;
          const isContributing = contributionState?.goalId === goal.id;
          return (
            <div key={goal.id} className="p-4 bg-subtle rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg flex items-center gap-2 text-primary">
                      <span className="text-2xl">{goal.icon}</span>{goal.name}
                  </h4>
                  <p className="text-sm text-secondary">
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </p>
                </div>
                <div className="space-x-1">
                  <button 
                      onClick={() => setContributionState({ goalId: goal.id, amount: '', accountId: accounts[0]?.id || ''})}
                      className="text-xs px-2 py-1 bg-emerald-600/80 text-white rounded-full hover:bg-emerald-600"
                  >
                      Add Funds
                  </button>
                  <button onClick={() => onEditGoal(goal)} className="text-xs px-2 py-1 bg-sky-600/80 text-white rounded-full hover:bg-sky-600">
                    Edit
                  </button>
                   <button onClick={() => onDelete(goal.id)} className="text-xs px-2 py-1 bg-rose-600/80 text-white rounded-full hover:bg-rose-600">
                      Delete
                  </button>
                </div>
              </div>
              <div className="w-full bg-subtle rounded-full h-4 mt-2 border border-divider">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              {isContributing && (
                  <form onSubmit={handleContributeSubmit} className="mt-3 p-3 bg-subtle rounded-md animate-fadeInUp space-y-2 border border-divider">
                       <div className="grid grid-cols-2 gap-2">
                           <input 
                              type="number" 
                              min="0.01"
                              step="0.01"
                              placeholder="Amount" 
                              value={contributionState.amount}
                              onChange={e => setContributionState(s => s ? {...s, amount: e.target.value} : null)}
                              className="w-full input-base p-2 rounded-md no-spinner"
                              required
                              autoFocus
                          />
                          <CustomSelect
                              value={contributionState.accountId}
                              onChange={value => setContributionState(s => s ? {...s, accountId: value} : null)}
                              options={accountOptions}
                          />
                      </div>
                      <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setContributionState(null)} className="button-secondary px-3 py-1 text-xs">Cancel</button>
                          <button type="submit" className="button-primary px-3 py-1 text-xs">Contribute</button>
                      </div>
                  </form>
              )}
            </div>
          );
        })}
        {goals.length === 0 && <p className="text-center text-secondary py-8">No goals yet. Create one to get started!</p>}
      </div>

      <div className="flex-shrink-0 p-6 border-t border-divider bg-subtle">
        {showAddForm ? (
          <form onSubmit={handleAddGoal} className="space-y-3 animate-fadeInUp">
            <h3 className="font-semibold text-primary">Create New Goal</h3>
            <div className="flex items-center gap-3">
              <input type="text" placeholder="🏆" value={newGoal.icon} onChange={e => setNewGoal(p => ({...p, icon: e.target.value}))} className="w-16 input-base p-2 rounded-md text-center" maxLength={2} />
              <input type="text" placeholder="Goal Name (e.g., New Laptop)" value={newGoal.name} onChange={e => setNewGoal(p => ({...p, name: e.target.value}))} className="flex-grow input-base p-2 rounded-md" required />
            </div>
             <input type="number" min="0.01" step="0.01" placeholder="Target Amount" value={newGoal.targetAmount} onChange={e => setNewGoal(p => ({...p, targetAmount: e.target.value}))} className="w-full input-base p-2 rounded-md no-spinner" required />
             <input type="text" placeholder="Product Link (Optional)" value={newGoal.productLink} onChange={e => setNewGoal(p => ({...p, productLink: e.target.value}))} className="w-full input-base p-2 rounded-md" />
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="button-secondary px-4 py-2">Cancel</button>
              <button type="submit" className="button-primary px-4 py-2">Create Goal</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowAddForm(true)} className="button-primary w-full py-2 font-semibold">
            Add New Goal
          </button>
        )}
      </div>
    </div>
  );
};

export default GoalsScreen;