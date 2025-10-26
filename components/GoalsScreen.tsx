
import React, { useState, useContext, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
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

    const priorities: Priority[] = [Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH];
    const priorityStyles: Record<Priority, { buttonClass: string; }> = {
        [Priority.HIGH]: { buttonClass: 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30' },
        [Priority.MEDIUM]: { buttonClass: 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' },
        [Priority.LOW]: { buttonClass: 'bg-green-500/20 text-green-300 hover:bg-green-500/30' },
        [Priority.NONE]: { buttonClass: 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/30' },
    };

    const handlePriorityChange = () => {
        const currentPriority = goal.priority || Priority.NONE;
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
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
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
                        className={`text-xs font-semibold px-2 py-1 rounded-full transition-colors w-16 text-center ${priorityStyles[goal.priority || Priority.NONE].buttonClass}`}
                    >
                        {goal.priority || Priority.NONE}
                    </button>
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(p => !p)} className="w-10 h-6 text-secondary flex items-center justify-center">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-card-strong rounded-lg shadow-xl z-10 border border-divider">
                                <button onClick={() => { onEdit(goal); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-primary hover-bg-stronger rounded-t-lg">Edit</button>
                                <a href={goal.productLink} target="_blank" rel="noopener noreferrer" className={`w-full text-left px-3 py-2 text-sm text-primary hover-bg-stronger ${!goal.productLink ? 'opacity-50 cursor-not-allowed' : ''}`}>View Product</a>
                                <button onClick={() => { onDelete(goal.id); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-rose-400 hover-bg-stronger rounded-b-lg">Delete</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-3">
                <button
                    onClick={() => onAddFunds(goal)}
                    disabled={isCompleted}
                    className="w-full button-primary py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    + Add Funds
                </button>
            </div>
        </div>
    );
};

const GoalsScreen: React.FC<GoalsScreenProps> = ({ goals, onSaveGoal, accounts, onContribute, onDelete, onEditGoal, onGoalComplete, onUpdateGoal, openModal }) => {
  const formatCurrency = useCurrencyFormatter();
  const [addFundsGoal, setAddFundsGoal] = useState<Goal | null>(null);
  const dataContext = useContext(AppDataContext);
  const settingsContext = useContext(SettingsContext);
  const [aiSuggestion, setAiSuggestion] = useState<{ name: string, targetAmount: number, reasoning: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [viewOptions, setViewOptions] = useState<AppliedViewOptions>({
    sort: { key: 'priority', direction: 'asc' },
    filters: { completed: false, inProgress: true }
  });

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
          name: aiSuggestion.name,
          icon: '🎯',
          targetAmount: aiSuggestion.targetAmount,
      } as Goal);
      setAiSuggestion(null);
  };
  
  const priorityOrder: Record<Priority, number> = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2, [Priority.NONE]: 3 };

  const sortedAndFilteredGoals = useMemo(() => {
    let result = [...goals];

    if (!viewOptions.filters.inProgress) result = result.filter(g => g.currentAmount >= g.targetAmount);
    if (!viewOptions.filters.completed) result = result.filter(g => g.currentAmount < g.targetAmount);

    const { key, direction } = viewOptions.sort;
    result.sort((a, b) => {
        let comparison = 0;
        switch(key) {
            case 'progress':
                const progressA = (a.currentAmount / a.targetAmount) * 100;
                const progressB = (b.currentAmount / b.targetAmount) * 100;
                comparison = progressA - progressB;
                break;
            case 'priority':
                comparison = priorityOrder[a.priority || Priority.NONE] - priorityOrder[b.priority || Priority.NONE];
                break;
        }
        return direction === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [goals, viewOptions, priorityOrder]);

  const viewOptionsConfig: ViewOptions = {
    sortOptions: [
        { key: 'priority', label: 'Priority' },
        { key: 'progress', label: 'Progress %' },
    ],
    filterOptions: [
        { key: 'inProgress', label: 'In Progress', type: 'toggle' },
        { key: 'completed', label: 'Completed', type: 'toggle' },
    ]
  };
  
  const isViewOptionsApplied = useMemo(() => {
    return viewOptions.sort.key !== 'priority' || viewOptions.sort.direction !== 'asc' || !viewOptions.filters.inProgress || viewOptions.filters.completed;
  }, [viewOptions]);


  return (
    <div className="h-full flex flex-col">
       {addFundsGoal && <AddFundsModal goal={addFundsGoal} accounts={accounts} onClose={() => setAddFundsGoal(null)} onContribute={onContribute} />}
      <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between">
         <h2 className="text-2xl font-bold text-primary text-center flex-grow">Financial Goals 🏆</h2>
         <button onClick={() => openModal('viewOptions', { options: viewOptionsConfig, currentValues: viewOptions, onApply: setViewOptions })} className="button-secondary text-sm px-3 py-1.5 flex items-center gap-2 relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 10h12M3 16h6" /></svg>
            <span>Filter & Sort</span>
            {isViewOptionsApplied && <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[var(--color-bg-app)]"></div>}
        </button>
       </div>
      
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {sortedAndFilteredGoals.map(goal => (
            <GoalCard 
                key={goal.id} 
                goal={goal} 
                onAddFunds={setAddFundsGoal}
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
         {goals.length > 0 && sortedAndFilteredGoals.length === 0 && (
             <p className="text-center text-secondary py-8">No goals match your current filters.</p>
         )}
      </div>

      <div className="flex-shrink-0 p-6 border-t border-divider bg-subtle space-y-2">
           <button onClick={handleGetAiSuggestion} disabled={isAiLoading} className="w-full text-center p-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-violet-400 flex items-center justify-center gap-2">
                {isAiLoading ? <LoadingSpinner /> : '✨ Get AI Suggestion'}
            </button>
          <button onClick={() => onEditGoal({} as Goal)} className="button-primary w-full py-2 font-semibold">
            + Add New Goal
          </button>
      </div>
    </div>
  );
};

export default GoalsScreen;