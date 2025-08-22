import React, { useState } from 'react';
import { Goal, Account } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  accounts: Account[];
  onContribute: (goalId: string, amount: number, accountId: string) => void;
}

const GoalsModal: React.FC<GoalsModalProps> = ({ isOpen, onClose, goals, setGoals, accounts, onContribute }) => {
  const formatCurrency = useCurrencyFormatter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', icon: '🏆', targetAmount: '' });
  
  const [contributionState, setContributionState] = useState<{ goalId: string; amount: string; accountId: string; } | null>(null);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newGoal.targetAmount);
    if (newGoal.name.trim() && amount > 0) {
      const goal: Goal = {
        id: self.crypto.randomUUID(),
        name: newGoal.name.trim(),
        icon: newGoal.icon.trim() || '🏆',
        targetAmount: amount,
        currentAmount: 0,
      };
      setGoals(prev => [...prev, goal]);
      setNewGoal({ name: '', icon: '🏆', targetAmount: '' });
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
  
  const handleDeleteGoal = (id: string) => {
      if (window.confirm("Are you sure you want to delete this goal? This cannot be undone.")) {
          setGoals(prev => prev.filter(g => g.id !== id));
      }
  }

  if (!isOpen) return null;
  
  const accountOptions = accounts.map(acc => ({ value: acc.id, label: acc.name }));

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-slate-700/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Financial Goals" onClose={onClose} icon="🏆" />
        
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {goals.map(goal => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100;
            const isContributing = contributionState?.goalId === goal.id;
            return (
              <div key={goal.id} className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2">
                        <span className="text-2xl">{goal.icon}</span>{goal.name}
                    </h4>
                    <p className="text-sm text-slate-400">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                  <div className="space-x-1">
                    <button 
                        onClick={() => setContributionState({ goalId: goal.id, amount: '', accountId: accounts[0]?.id || ''})}
                        className="text-xs px-2 py-1 bg-emerald-600/80 text-white rounded-md hover:bg-emerald-600"
                    >
                        Add Funds
                    </button>
                     <button onClick={() => handleDeleteGoal(goal.id)} className="text-xs px-2 py-1 bg-rose-600/80 text-white rounded-md hover:bg-rose-600">
                        Delete
                    </button>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-4 mt-2">
                  <div
                    className="h-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                {isContributing && (
                    <form onSubmit={handleContributeSubmit} className="mt-3 p-3 bg-slate-800/50 rounded-md animate-fadeInUp space-y-2">
                         <div className="grid grid-cols-2 gap-2">
                             <input 
                                type="number" 
                                min="0.01"
                                step="0.01"
                                placeholder="Amount" 
                                value={contributionState.amount}
                                onChange={e => setContributionState(s => s ? {...s, amount: e.target.value} : null)}
                                className="w-full bg-slate-700 p-2 rounded-md border border-slate-600"
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
                            <button type="button" onClick={() => setContributionState(null)} className="px-3 py-1 text-xs bg-slate-600 rounded-md">Cancel</button>
                            <button type="submit" className="px-3 py-1 text-xs bg-emerald-600 rounded-md">Contribute</button>
                        </div>
                    </form>
                )}
              </div>
            );
          })}
          {goals.length === 0 && <p className="text-center text-slate-400 py-8">No goals yet. Create one to get started!</p>}
        </div>

        <div className="flex-shrink-0 p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-xl">
          {showAddForm ? (
            <form onSubmit={handleAddGoal} className="space-y-3 animate-fadeInUp">
              <h3 className="font-semibold">Create New Goal</h3>
              <div className="flex items-center gap-3">
                <input type="text" placeholder="🏆" value={newGoal.icon} onChange={e => setNewGoal(p => ({...p, icon: e.target.value}))} className="w-16 bg-slate-700 p-2 rounded-md text-center border border-slate-600" maxLength={2} />
                <input type="text" placeholder="Goal Name (e.g., New Laptop)" value={newGoal.name} onChange={e => setNewGoal(p => ({...p, name: e.target.value}))} className="flex-grow bg-slate-700 p-2 rounded-md border border-slate-600" required />
              </div>
              <input type="number" min="0.01" step="0.01" placeholder="Target Amount" value={newGoal.targetAmount} onChange={e => setNewGoal(p => ({...p, targetAmount: e.target.value}))} className="w-full bg-slate-700 p-2 rounded-md border border-slate-600" required />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-lg bg-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600">Create Goal</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowAddForm(true)} className="w-full py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 transition-colors font-semibold">
              Add New Goal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalsModal;