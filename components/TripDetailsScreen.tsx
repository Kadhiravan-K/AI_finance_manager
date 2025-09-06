
import React, { useState, useMemo, useRef } from 'react';
import { Trip, TripExpense, TransactionType, Transaction, Category, TripDayPlan, TripItineraryItem } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { calculateTripSummary } from '../utils/calculations';
import CategoryPieChart from './CategoryPieChart';
import { generateAITripPlan } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import CustomCheckbox from './CustomCheckbox';

interface TripDetailsScreenProps {
  trip: Trip;
  expenses: TripExpense[];
  onAddExpense: () => void;
  onEditExpense: (expense: TripExpense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onBack: () => void;
  categories: Category[];
  onUpdateTrip: (trip: Trip) => void;
  initialTab?: TripDetailsTab;
}
type TripDetailsTab = 'dashboard' | 'expenses' | 'planner';

const ItineraryTimeline: React.FC<{
    plan: TripDayPlan[];
    setPlan: React.Dispatch<React.SetStateAction<TripDayPlan[]>>;
}> = ({ plan, setPlan }) => {
    
    const [draggedItemInfo, setDraggedItemInfo] = useState<{ dayId: string; itemId: string } | null>(null);
    const [dropTarget, setDropTarget] = useState<{ dayId: string; beforeItemId: string | null } | null>(null);
    const draggedItemNodeRef = useRef<HTMLDivElement | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, dayId: string, itemId: string) => {
        setDraggedItemInfo({ dayId, itemId });
        draggedItemNodeRef.current = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            draggedItemNodeRef.current?.classList.add('dragging');
        }, 0);
    };

    const handleDragEnd = () => {
        draggedItemNodeRef.current?.classList.remove('dragging');
        setDraggedItemInfo(null);
        setDropTarget(null);
        draggedItemNodeRef.current = null;
    };
    
    const handleDragOverItem = (e: React.DragEvent<HTMLDivElement>, dayId: string, itemId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItemInfo || (draggedItemInfo.dayId === dayId && draggedItemInfo.itemId === itemId)) {
             setDropTarget(null);
             return;
        }

        const targetElement = e.currentTarget;
        const rect = targetElement.getBoundingClientRect();
        const isAfter = e.clientY > rect.top + rect.height / 2;

        let newTarget;
        if (isAfter) {
            const day = plan.find(d => d.id === dayId);
            if (!day) return;
            const itemIndex = day.items.findIndex(i => i.id === itemId);
            const nextItem = day.items[itemIndex + 1];
            newTarget = { dayId, beforeItemId: nextItem ? nextItem.id : null };
        } else {
            newTarget = { dayId, beforeItemId: itemId };
        }

        if (JSON.stringify(newTarget) !== JSON.stringify(dropTarget)) {
            setDropTarget(newTarget);
        }
    };
    
    const handleDragOverDay = (e: React.DragEvent<HTMLDivElement>, dayId: string) => {
        e.preventDefault();
        const day = plan.find(d => d.id === dayId);
        if (day && day.items.length === 0 && (!dropTarget || dropTarget.dayId !== dayId)) {
            setDropTarget({ dayId, beforeItemId: null });
        }
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItemInfo || !dropTarget) {
            handleDragEnd();
            return;
        };

        setPlan(currentPlan => {
            const planClone = JSON.parse(JSON.stringify(currentPlan));
            const sourceDay = planClone.find((d: TripDayPlan) => d.id === draggedItemInfo.dayId);
            if (!sourceDay) return currentPlan;
            
            const itemIndex = sourceDay.items.findIndex((i: TripItineraryItem) => i.id === draggedItemInfo.itemId);
            if (itemIndex === -1) return currentPlan;
            
            const [draggedItem] = sourceDay.items.splice(itemIndex, 1);
            
            const targetDay = planClone.find((d: TripDayPlan) => d.id === dropTarget.dayId);
            if (!targetDay) return currentPlan;
            
            if (dropTarget.beforeItemId === null) {
                targetDay.items.push(draggedItem);
            } else {
                const targetIndex = targetDay.items.findIndex((i: TripItineraryItem) => i.id === dropTarget.beforeItemId);
                targetDay.items.splice(targetIndex !== -1 ? targetIndex : targetDay.items.length, 0, draggedItem);
            }
            return planClone;
        });

        handleDragEnd();
    };


    const handleDayChange = (dayId: string, field: 'title' | 'date', value: string) => {
        setPlan(prev => prev.map(day => day.id === dayId ? { ...day, [field]: value } : day));
    };

    const handleItemChange = (dayId: string, itemId: string, field: keyof TripItineraryItem, value: string | boolean) => {
        setPlan(prev => prev.map(day => {
            if (day.id === dayId) {
                return { ...day, items: day.items.map(item => item.id === itemId ? { ...item, [field]: value } : item) };
            }
            return day;
        }));
    };
    
    const handleAddItem = (dayId: string) => {
        const newItem: TripItineraryItem = { id: self.crypto.randomUUID(), time: '12:00', activity: 'New Activity', type: 'activity', notes: '', isCompleted: false };
        setPlan(prev => prev.map(day => day.id === dayId ? { ...day, items: [...day.items, newItem] } : day));
    };

    const handleAddDay = () => {
        const lastDay = plan[plan.length - 1];
        const newDate = new Date(lastDay ? lastDay.date : new Date());
        newDate.setDate(newDate.getDate() + 2); // To avoid timezone issues with just +1
        const newDay: TripDayPlan = {
            id: self.crypto.randomUUID(),
            date: newDate.toISOString().split('T')[0],
            title: `Day ${plan.length + 1}`,
            items: []
        };
        setPlan(prev => [...prev, newDay]);
    };

    const itemIcons: Record<TripItineraryItem['type'], string> = {
        food: '🍴', travel: '✈️', activity: '🏞️', lodging: '🏨', other: '📌'
    };

    return (
        <div className="timeline-container">
            {plan.map(day => (
                <div 
                  key={day.id}
                  onDrop={handleDrop}
                  onDragOver={(e) => handleDragOverDay(e, day.id)}
                  onDragLeave={() => setDropTarget(null)}
                >
                    <div className="timeline-day-header">
                        <input value={day.title} onChange={e => handleDayChange(day.id, 'title', e.target.value)} className="timeline-editable-input font-bold text-lg text-slate-100" />
                    </div>
                    {day.items.map(item => (
                        <React.Fragment key={item.id}>
                            {dropTarget?.dayId === day.id && dropTarget.beforeItemId === item.id && <div className="drop-indicator"></div>}
                            <div
                                className="timeline-item"
                                draggable
                                onDragStart={(e) => handleDragStart(e, day.id, item.id)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOverItem(e, day.id, item.id)}
                            >
                                <div className="timeline-drag-handle" title="Drag to reorder">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                                </div>
                                <div className="timeline-item-icon">{itemIcons[item.type]}</div>
                                <div className={`timeline-item-content ${item.isCompleted ? 'opacity-60' : ''}`}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="pt-1">
                                            <CustomCheckbox
                                                id={`item-complete-${item.id}`}
                                                checked={!!item.isCompleted}
                                                onChange={(checked) => handleItemChange(day.id, item.id, 'isCompleted', checked)}
                                                label=""
                                            />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2">
                                                <input type="time" value={item.time} onChange={e => handleItemChange(day.id, item.id, 'time', e.target.value)} className={`timeline-editable-input font-semibold text-slate-300 w-20 ${item.isCompleted ? 'line-through' : ''}`} />
                                                <input value={item.activity} onChange={e => handleItemChange(day.id, item.id, 'activity', e.target.value)} className={`timeline-editable-input font-semibold text-slate-100 ${item.isCompleted ? 'line-through' : ''}`} />
                                            </div>
                                            <textarea value={item.notes || ''} onChange={e => handleItemChange(day.id, item.id, 'notes', e.target.value)} placeholder="Add notes..." className={`timeline-editable-input text-sm text-slate-400 mt-1 w-full resize-none ${item.isCompleted ? 'line-through' : ''}`} rows={1}></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    ))}
                    {dropTarget?.dayId === day.id && dropTarget.beforeItemId === null && <div className="drop-indicator"></div>}
                    <button onClick={() => handleAddItem(day.id)} className="text-sm text-sky-400 hover:text-sky-300 ml-2 mb-4">+ Add Activity</button>
                </div>
            ))}
            <button onClick={handleAddDay} className="w-full button-secondary py-2 mt-4">+ Add Day</button>
        </div>
    );
};

const TripBudgetSummary: React.FC<{ budget: number; totalSpent: number; currency: string }> = ({ budget, totalSpent, currency }) => {
    const formatCurrency = useCurrencyFormatter(undefined, currency);
    const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
    const remaining = budget - totalSpent;
    
    let progressBarColor = 'var(--color-accent-emerald)';
    if (percentage > 75) progressBarColor = 'var(--color-accent-yellow)';
    if (percentage > 100) progressBarColor = 'var(--color-accent-rose)';

    return (
        <div className="p-4 bg-subtle rounded-lg">
            <h3 className="font-semibold text-lg text-primary mb-2">Budget Status</h3>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-secondary">Spent: <strong className="text-primary">{formatCurrency(totalSpent)}</strong></span>
                <span className="text-secondary">Total: <strong className="text-primary">{formatCurrency(budget)}</strong></span>
            </div>
            <div className="w-full rounded-full h-2.5 bg-subtle border border-divider">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: progressBarColor }}></div>
            </div>
            <p className={`text-center text-sm mt-2 font-semibold ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {remaining >= 0 ? `${formatCurrency(remaining)} Remaining` : `${formatCurrency(Math.abs(remaining))} Overspent`}
            </p>
        </div>
    );
};


const TripDetailsScreen: React.FC<TripDetailsScreenProps> = ({ trip, expenses, onAddExpense, onEditExpense, onDeleteExpense, onBack, categories, onUpdateTrip, initialTab }) => {
  const formatCurrency = useCurrencyFormatter(undefined, trip.currency);
  const [activeTab, setActiveTab] = useState<TripDetailsTab>(initialTab || 'dashboard');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<TripDayPlan[]>(trip.plan || []);
  
  const validParticipants = useMemo(() => (trip.participants || []).filter(Boolean), [trip.participants]);

  const settlementSummary = useMemo(() => calculateTripSummary(expenses, [trip])[trip.currency] || [], [expenses, trip]);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const getPayerNames = (expense: TripExpense): string => {
    if (!expense.payers || expense.payers.length === 0) return 'Unknown';
    return expense.payers
      .map(payer => validParticipants.find(p => p.contactId === payer.contactId)?.name || 'Unknown')
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

  const handleGeneratePlan = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
        const newPlan = await generateAITripPlan(aiPrompt, trip.plan);
        setPlan(newPlan);
        onUpdateTrip({ ...trip, plan: newPlan });
        setAiPrompt('');
    } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to generate plan.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleBackWithSave = () => {
      if (JSON.stringify(plan) !== JSON.stringify(trip.plan)) {
        onUpdateTrip({ ...trip, plan });
      }
      onBack();
  };

  const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button onClick={onClick} className={`w-full py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${ active ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary' }`}>
        {children}
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex items-center gap-2">
         <button onClick={handleBackWithSave} className="p-2 -ml-2 text-secondary hover:text-primary hover:bg-subtle rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-xl font-bold text-primary truncate">{trip.name}</h2>
      </div>

       <div className="flex border-b border-divider flex-shrink-0">
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>Dashboard</TabButton>
          <TabButton active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')}>All Expenses</TabButton>
          <TabButton active={activeTab === 'planner'} onClick={() => setActiveTab('planner')}>AI Planner</TabButton>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {activeTab === 'dashboard' && (
             <div className="space-y-6 animate-fadeInUp">
                {trip.budget && trip.budget > 0 && (
                    <TripBudgetSummary budget={trip.budget} totalSpent={totalSpent} currency={trip.currency} />
                )}
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-subtle rounded-lg">
                        <p className="text-sm text-secondary">Total Spent</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div className="p-3 bg-subtle rounded-lg">
                        <p className="text-sm text-secondary">Participants</p>
                        <p className="text-xl font-bold text-primary">{validParticipants.length}</p>
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
                        <span className="font-semibold text-primary">{s.fromName}</span>
                        <span className="mx-2 text-secondary">&rarr;</span>
                        <span className="font-semibold text-primary">{s.toName}</span>
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
                        <button onClick={() => onDeleteExpense(expense.id)} className="text-xs px-2 py-1 text-rose-400 hover:bg-rose-500/20 rounded-full transition-colors">Delete</button>
                    </div>
                  </div>
                ))}
                 {expenses.length === 0 && <p className="text-center text-secondary py-8">No expenses recorded for this trip yet.</p>}
              </div>
        )}

        {activeTab === 'planner' && (
            <div className="space-y-4 animate-fadeInUp">
                <div className="space-y-2">
                    <textarea 
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="e.g., 'Add a visit to a museum on day 2' or 'Find a good place for dinner tonight'."
                        className="w-full h-24 themed-textarea p-3"
                        disabled={isGenerating}
                    />
                    <button onClick={handleGeneratePlan} disabled={isGenerating || !aiPrompt.trim()} className="button-primary w-full py-2 flex items-center justify-center">
                        {isGenerating ? <LoadingSpinner /> : 'Generate / Update Plan'}
                    </button>
                </div>
                <div className="p-4 bg-subtle rounded-lg border border-divider">
                    <h3 className="font-semibold text-lg text-primary mb-3">Trip Itinerary</h3>
                    {plan && plan.length > 0 ? (
                        <ItineraryTimeline plan={plan} setPlan={setPlan} />
                    ) : (
                        <p className="text-sm text-secondary text-center py-8">No plan has been generated yet. Use the prompt above to create one!</p>
                    )}
                </div>
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
