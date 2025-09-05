import React, { useState, useContext, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Goal, Account } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomSelect from './CustomSelect';
import { getAIGoalSuggestion } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { AppDataContext, SettingsContext } from '../contexts/SettingsContext';
import EmptyState from './EmptyState';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface GoalsScreenProps {
  goals: Goal[];
  onSaveGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>, id?: string) => void;
  accounts: Account[];
  onContribute: (goalId: string, amount: number, accountId: string) => void;
  onDelete: (id: string) => void;
  onEditGoal: (goal: Goal) => void;
  onGoalComplete: () => void;
}


const AddFundsModal: React.FC<{
    goal: Goal;
    accounts: Account[];
    onClose: () => void;
    onContribute: (goalId: string, amount: number, accountId: string) => void;
}> = ({ goal, accounts, onClose, onContribute }) => {
    const [amount, setAmount] = useState('');
    const [accountId, setAccountId] = useState(accounts[0]?.id || '');
    const formatCurrency = useCurrencyFormatter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const contributionAmount = parseFloat(amount);
        if (!isNaN(contributionAmount) && contributionAmount > 0 && accountId) {
            onContribute(goal.id, contributionAmount, accountId);
            onClose();
        }
    };
    
    const accountOptions = accounts.map(acc => ({ value: acc.id, label: acc.name }));

    return ReactDOM.createPortal(
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-sm p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
          <ModalHeader title={`Add Funds to ${goal.icon}`} onClose={onClose} />
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <h3 className="text-center font-semibold text-primary text-lg">{goal.name}</h3>
            <div>
              <label className="text-sm text-secondary mb-1 block">Amount</label>
              <input 
                type="number" 
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full input-base p-2 rounded-lg no-spinner"
                required
                autoFocus
              />
            </div>
             <div>
              <label className="text-sm text-secondary mb-1 block">From Account</label>
              <CustomSelect
                  value={accountId}
                  onChange={setAccountId}
                  options={accountOptions}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
              <button type="submit" className="button-primary px-4 py-2">Contribute</button>
            </div>
          </form>
        </div>
      </div>,
      modalRoot
    );
};


const GoalCard: React.FC<{
    goal: Goal;
    onAddFunds: (goal: Goal) => void;
    onEdit: (goal: Goal) => void;
    onDelete: (id: string) => void;
}> = ({ goal, onAddFunds, onEdit, onDelete }) => {
    const formatCurrency = useCurrencyFormatter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const isCompleted = percentage >= 100;
    const amountRemaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`glass-card p-4 rounded-xl relative overflow-hidden ${isCompleted ? 'goal-card-completed' : ''}`}>
            {isCompleted && <div className="absolute top-2 right-2 text-xs font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">✓ Completed!</div>}
            <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r={radius} strokeWidth="8" className="stroke-current text-subtle" fill="transparent" />
                        <circle
                            cx="40" cy="40" r={radius} strokeWidth="8"
                            stroke="var(--color-accent-emerald)" fill="transparent"
                            strokeLinecap="round" transform="rotate(-90 40 40)"
                            style={{
                                '--circumference': circumference,
                                '--offset': offset,
                            } as React.CSSProperties}
                            className="progress-circle-bar"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">{goal.icon}</div>
                </div>

                <div className="flex-grow overflow-hidden">
                    <h4 className="font-bold text-lg text-primary truncate">{goal.name}</h4>
                    <p className="text-sm font-semibold text-emerald-400 font-mono">{formatCurrency(goal.currentAmount)} <span className="text-secondary">of {formatCurrency(goal.targetAmount)}</span></p>
                    <p className="text-xs text-secondary mt-1">{isCompleted ? 'Goal achieved!' : `${formatCurrency(amountRemaining)} left to save`}</p>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <button onClick={() => onAddFunds(goal)} disabled={isCompleted} className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center hover:bg-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(p => !p)} className="w-10 h-6 text-secondary flex items-center justify-center">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                        <div className={`goal-actions-menu ${isMenuOpen ? 'open' : ''}`}>
                            <button onClick={() => { onEdit(goal); setIsMenuOpen(false); }}>Edit</button>
                            <button onClick={() => { onDelete(goal.id); setIsMenuOpen(false); }} className="text-rose-400">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GoalsScreen: React.FC<GoalsScreenProps> = ({ goals, onSaveGoal, accounts, onContribute, onDelete, onEditGoal }) => {
  const formatCurrency = useCurrencyFormatter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', icon: '🏆', targetAmount: '', productLink: '' });
  const [aiSuggestion, setAiSuggestion] = useState<{ name: string, targetAmount: number, reasoning: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const dataContext = useContext(AppDataContext);
  const settingsContext = useContext(SettingsContext);
  
  const [contributionModalState, setContributionModalState] = useState<{ goal: Goal } | null>(null);

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
  
  const handleGetAiSuggestion = async () => {
    if (!dataContext || !settingsContext) return;
    setIsAiLoading(true);
    setAiSuggestion(null);
    try {
        const suggestion = await getAIGoalSuggestion(dataContext.transactions, settingsContext.financialProfile);
        setAiSuggestion(suggestion);
    } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to get suggestion.");
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleAcceptSuggestion = () => {
      if (!aiSuggestion) return;
      setNewGoal({
          name: aiSuggestion.name,
          icon: '🎯',
          targetAmount: aiSuggestion.targetAmount.toString(),
          productLink: '',
      });
      setShowAddForm(true);
      setAiSuggestion(null);
  };

  return (
    <div className="h-full flex flex-col">
       {contributionModalState && (
          <AddFundsModal 
              goal={contributionModalState.goal}
              accounts={accounts}
              onClose={() => setContributionModalState(null)}
              onContribute={onContribute}
          />
       )}
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        <h2 className="text-2xl font-bold text-primary">Financial Goals 🏆</h2>
        
        {aiSuggestion && (
          <div className="p-4 bg-violet-900/50 border border-violet-700 rounded-lg animate-fadeInUp glass-card">
              <div className="flex items-start gap-3">
                  <span className="text-2xl mt-1">✨</span>
                  <div>
                      <h4 className="font-semibold text-violet-300">AI Goal Suggestion</h4>
                      <p className="text-sm text-secondary mt-1">{aiSuggestion.reasoning}</p>
                      <div className="flex items-center gap-4 mt-3">
                          <button onClick={handleAcceptSuggestion} className="button-primary px-3 py-1 text-sm">Set Goal: {formatCurrency(aiSuggestion.targetAmount)}</button>
                          <button onClick={() => setAiSuggestion(null)} className="text-xs text-secondary">Dismiss</button>
                      </div>
                  </div>
              </div>
          </div>
        )}
        
        {goals.map(goal => (
            <GoalCard 
                key={goal.id} 
                goal={goal} 
                // Fix: The state setter `setContributionModalState` expects an object with a `goal` property,
                // but the `onAddFunds` prop passes the `goal` object directly. This wraps the call
                // to match the expected state shape.
                onAddFunds={(goal) => setContributionModalState({ goal })}
                onEdit={onEditGoal}
                onDelete={onDelete}
            />
        ))}

        {goals.length === 0 && !showAddForm && (
            <EmptyState
                icon="🏆"
                title="Ready to Start Saving?"
                message="Create your first goal to track your progress towards something great."
                actionText="Create First Goal"
                onAction={() => setShowAddForm(true)}
            />
        )}
      </div>

      <div className="flex-shrink-0 p-6 border-t border-divider bg-subtle">
        <div className="mb-2">
            <button onClick={handleGetAiSuggestion} disabled={isAiLoading} className="w-full text-center p-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-violet-400 flex items-center justify-center gap-2">
                  {isAiLoading ? <LoadingSpinner /> : '✨ Get AI Suggestion'}
            </button>
        </div>
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
