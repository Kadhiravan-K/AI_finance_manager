import React, { useState, useContext, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
// Fix: Import ActiveModal to use in props.
import { Goal, Account, Priority, ActiveModal, AppliedViewOptions, ViewOptions } from '../types';
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
  onUpdateGoal: (goal: Goal) => void;
  // Fix: Add missing openModal prop to match usage in StoryGenerator.tsx.
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
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
    onUpdateGoal: (goal: Goal) => void;
}> = ({ goal, onAddFunds, onEdit, onDelete, onUpdateGoal }) => {
    const formatCurrency = useCurrencyFormatter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const isCompleted = percentage >= 100;
    const amountRemaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const priorities: Priority[] = ['None', 'Low', 'Medium', 'High'];
    const priorityStyles: Record<Priority, { buttonClass: string; }> = {
        'High': { buttonClass: 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30' },
        'Medium': { buttonClass: 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' },
        'Low': { buttonClass: 'bg-green-500/20 text-green-300 hover:bg-green-500/30' },
        'None': { buttonClass: 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/30' },
    };

    const handlePriorityChange = () => {
        const currentPriority = goal.priority || 'None';
        const currentIndex = priorities.indexOf(currentPriority);
        const nextIndex = (currentIndex + 1) % priorities.length;
        const nextPriority = priorities[nextIndex];
        onUpdateGoal({ ...goal, priority: nextPriority });
    };

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
                
                <div className="flex flex-col items-center gap-1">
                     <button
                        onClick={handlePriorityChange}
                        className={`text-xs font-semibold px-2 py-1 rounded-full transition-colors w-16 text-center ${priorityStyles[goal.priority || 'None'].buttonClass}`}
                    >
                        {goal.priority || 'None'}
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

                <div className="flex flex-col items-center gap-2">
                    <button onClick={() => onAddFunds(goal)} disabled={isCompleted} className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center hover:bg-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

const GoalsScreen: React.FC<GoalsScreenProps> = ({ goals, onSaveGoal, accounts, onContribute, onDelete, onEditGoal, onGoalComplete, onUpdateGoal, openModal }) => {
  const formatCurrency = useCurrencyFormatter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', icon: '🏆', targetAmount: '', productLink: '' });
  const [aiSuggestion, setAiSuggestion] = useState<{ name: string, targetAmount: number, reasoning: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const dataContext = useContext(AppDataContext);
  const settingsContext = useContext(SettingsContext);
  
  const [contributionModalState, setContributionModalState] = useState<{ goal: Goal } | null>(null);
  const [viewOptions, setViewOptions] = useState<AppliedViewOptions>({
    sort: { key: 'priority', direction: 'asc' },
    filters: { active: true, completed: true }
  });

  const priorityOrder: Record<Priority, number> = { 'High': 0, 'Medium': 1, 'Low': 2, 'None': 3 };

  const sortedAndFilteredGoals = useMemo(() => {
    let result = [...goals];

    if (!viewOptions.filters.active) result = result.filter(g => g.currentAmount >= g.targetAmount);
    if (!viewOptions.filters.completed) result = result.filter(g => g.currentAmount < g.targetAmount);

    const { key, direction } = viewOptions.sort;
    result.sort((a, b) => {
        let comparison = 0;
        switch (key) {
            case 'priority':
                comparison = priorityOrder[a.priority || 'None'] - priorityOrder[b.priority || 'None'];
                break;
            case 'progress':
                const progressA = (a.currentAmount / a.targetAmount) * 100;
                const progressB = (b.currentAmount / b.targetAmount) * 100;
                comparison = progressB - progressA;
                break;
            case 'targetAmount':
                comparison = b.targetAmount - a.targetAmount;
                break;
        }
        return direction === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [goals, viewOptions]);

  const viewOptionsConfig: ViewOptions = {
    sortOptions: [
        { key: 'priority', label: 'Priority' },
        { key: 'progress', label: 'Progress (%)' },
        { key: 'targetAmount', label: 'Target Amount' },
    ],
    filterOptions: [
        { key: 'active', label: 'Active Goals', type: 'toggle' },
        { key: 'completed', label: 'Completed Goals', type: 'toggle' },
    ]
  };

  const isViewOptionsApplied = useMemo(() => {
    return viewOptions.sort.key !== 'priority' || viewOptions.sort.direction !== 'asc' || !viewOptions.filters.active || !viewOptions.filters.completed;
  }, [viewOptions]);

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
      onEditGoal({
        id: '',
        name: aiSuggestion.name,
        icon: '🎯',
        targetAmount: aiSuggestion.targetAmount,
        currentAmount: 0,
        productLink: '',
      });
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
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-primary">Financial Goals 🏆</h2>
            <button onClick={() => openModal('viewOptions', { options: viewOptionsConfig, currentValues: viewOptions, onApply: setViewOptions })} className="button-secondary text-sm px-3 py-1.5 flex items-center gap-2 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 10h12M3 16h6" /></svg>
                <span>Filter & Sort</span>
                {isViewOptionsApplied && <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[var(--color-bg-app)]"></div>}
            </button>
        </div>
        
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
        
        {sortedAndFilteredGoals.map(goal => (
            <GoalCard 
                key={goal.id} 
                goal={goal} 
                onAddFunds={(goal) => setContributionModalState({ goal })}
                onEdit={onEditGoal}
                onDelete={onDelete}
                onUpdateGoal={onUpdateGoal}
            />
        ))}

        {goals.length === 0 && (
            <EmptyState
                icon="🏆"
                title="Ready to Start Saving?"
                message="Create your first goal to track your progress towards something great."
                actionText="Create First Goal"
                onAction={() => onEditGoal({} as Goal)}
            />
        )}
      </div>

      <div className="flex-shrink-0 p-6 border-t border-divider bg-subtle space-y-2">
        <button onClick={handleGetAiSuggestion} disabled={isAiLoading} className="w-full text-center p-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-violet-400 flex items-center justify-center gap-2">
            {isAiLoading ? <LoadingSpinner /> : '✨ Get AI Suggestion'}
        </button>
        <button onClick={() => onEditGoal({} as Goal)} className="button-primary w-full py-2 font-semibold">
            Add New Goal
        </button>
      </div>
    </div>
  );
};

export default GoalsScreen;