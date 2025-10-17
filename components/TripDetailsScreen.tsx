
import React, { useState, useMemo, useContext, useRef } from 'react';
import { Trip, TripExpense, Category, ActiveModal, ActiveScreen, TripDayPlan, Note, TripDayPlanItem, TransactionType } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';
import { calculateTripSummary } from '../utils/calculations';
import { AppDataContext } from '../contexts/SettingsContext';
import TripChat from './TripChat';
import TripHistory from './TripHistory';
import CategoryPieChart from './CategoryPieChart';
import CustomCheckbox from './CustomCheckbox';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import { generateAITripPlan } from '../services/geminiService';

interface TripDetailsScreenProps {
  trip: Trip;
  expenses: TripExpense[];
  categories: Category[];
  onAddExpense: () => void;
  onEditExpense: (expense: TripExpense) => void;
  onDeleteExpense: (id: string) => void;
  onBack: () => void;
  onUpdateTrip: (trip: Trip) => void;
  openModal: (name: ActiveModal, props?: any) => void;
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => void;
}

type TripTab = 'dashboard' | 'expenses' | 'plan' | 'settle' | 'notes' | 'chat' | 'history';


const TripDetailsScreen: React.FC<TripDetailsScreenProps> = ({ trip, expenses, categories, onAddExpense, onEditExpense, onDeleteExpense, onBack, onUpdateTrip, openModal, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<TripTab>('plan');
  const dataContext = useContext(AppDataContext);
  
  const TabButton = ({ tab, label }: { tab: TripTab; label: string }) => (
    <button onClick={() => setActiveTab(tab)} className={`trip-details-tab px-4 font-semibold text-sm ${activeTab === tab ? 'active' : ''}`}>
      {label}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <TripDashboard trip={trip} expenses={expenses} categories={categories} openModal={openModal} onUpdateTrip={onUpdateTrip} />;
      case 'expenses': return <TripExpensesList expenses={expenses} categories={categories} onEditExpense={onEditExpense} currency={trip.currency} />;
      case 'plan': return <TripPlanView trip={trip} onUpdateTrip={onUpdateTrip} />;
      case 'settle': return <TripSettleView trip={trip} expenses={expenses} />;
      case 'notes': return <TripNotesView trip={trip} onNavigate={onNavigate} />;
      case 'chat': return <TripChat />;
      case 'history': return <TripHistory trip={trip} expenses={expenses} />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ModalHeader title={trip.name} onBack={onBack} onClose={onBack} icon="✈️" onSettingsClick={() => openModal('editTrip', { trip })} />
      <div className="flex-shrink-0 border-b border-divider overflow-x-auto">
        <div className="flex">
          <TabButton tab="dashboard" label="Dashboard" />
          <TabButton tab="expenses" label="Expenses" />
          <TabButton tab="plan" label="Plan" />
          <TabButton tab="settle" label="Settle" />
          <TabButton tab="notes" label="Notes" />
          <TabButton tab="chat" label="Chat" />
          <TabButton tab="history" label="History" />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        {renderContent()}
      </div>
      <div className="p-4 border-t border-divider flex-shrink-0">
          <button onClick={onAddExpense} className="button-primary w-full py-2">+ Add Expense</button>
      </div>
    </div>
  );
};


const TripDashboard: React.FC<{ trip: Trip; expenses: TripExpense[]; categories: Category[]; openModal: (name: ActiveModal, props?: any) => void; onUpdateTrip: (trip: Trip) => void; }> = ({ trip, expenses, categories, openModal, onUpdateTrip }) => {
    const formatCurrency = useCurrencyFormatter(undefined, trip.currency);
    const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
    const budgetRemaining = trip.budget ? trip.budget - totalSpent : null;
    const budgetProgress = trip.budget ? (totalSpent / trip.budget) * 100 : 0;
    
    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-subtle rounded-lg text-center"><p className="text-xs text-secondary">Total Spent</p><p className="text-lg font-bold text-primary">{formatCurrency(totalSpent)}</p></div>
                <div className="p-3 bg-subtle rounded-lg text-center"><p className="text-xs text-secondary">Trip Budget</p><p className="text-lg font-bold text-primary">{trip.budget ? formatCurrency(trip.budget) : 'Not Set'}</p></div>
                <div className="p-3 bg-subtle rounded-lg text-center"><p className={`text-lg font-bold ${budgetRemaining !== null && budgetRemaining < 0 ? 'text-rose-400' : 'text-primary'}`}>{budgetRemaining !== null ? formatCurrency(budgetRemaining) : 'N/A'}</p></div>
            </div>
            {trip.budget && (
                <div>
                    <div className="w-full bg-subtle rounded-full h-2.5 border border-divider"><div className="h-full rounded-full bg-emerald-500" style={{width: `${Math.min(budgetProgress, 100)}%`}}></div></div>
                </div>
            )}
             <CategoryPieChart title="Spending by Category" transactions={expenses.map(e => ({...e, type: TransactionType.EXPENSE})) as any} categories={categories} type={TransactionType.EXPENSE} isVisible={true} currency={trip.currency} />

            <div className="p-3 bg-subtle rounded-lg">
                <div className="flex justify-between items-center mb-2">
                     <h4 className="font-semibold text-primary">Participants ({trip.participants.length})</h4>
                     <button onClick={() => openModal('manageTripMembers', { trip, onUpdateTrip })} className="button-secondary text-xs px-3 py-1">Manage</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {trip.participants.map(p => <span key={p.contactId} className="px-2 py-1 bg-subtle border border-divider rounded-full text-sm text-secondary">{p.name}</span>)}
                </div>
            </div>
        </div>
    );
};


const TripExpensesList: React.FC<{ expenses: TripExpense[]; categories: Category[]; onEditExpense: (e: TripExpense) => void; currency: string; }> = ({ expenses, categories, onEditExpense, currency }) => {
    const formatCurrency = useCurrencyFormatter(undefined, currency);
    return (
        <div className="p-4 space-y-2">
            {expenses.map(expense => {
                const category = categories.find(c => c.id === expense.categoryId);
                return (
                    <div key={expense.id} onClick={() => onEditExpense(expense)} className="p-3 bg-subtle rounded-lg group cursor-pointer hover-bg-stronger">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-primary">{expense.description}</p>
                                <p className="text-xs text-secondary">{category?.name || 'Uncategorized'}</p>
                            </div>
                            <p className="font-mono text-primary">{formatCurrency(expense.amount)}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const TripPlanView: React.FC<{ trip: Trip; onUpdateTrip: (trip: Trip) => void }> = ({ trip, onUpdateTrip }) => {
    const [planState, setPlanState] = useState<TripDayPlan[]>(trip.plan || []);
    const [isDirty, setIsDirty] = useState(false);
    const [editingField, setEditingField] = useState<{ dayId: string; itemId: string; field: 'time' | 'activity' | 'icon' } | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const dragItem = useRef<{ dayId: string; itemIndex: number } | null>(null);
    const dragOverItem = useRef<{ dayId: string; itemIndex: number } | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ dayId: string; index: number } | null>(null);

    const updatePlan = (newPlan: TripDayPlan[]) => {
        setPlanState(newPlan);
        setIsDirty(true);
    };

    const handleGeneratePlan = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const newPlan = await generateAITripPlan(aiPrompt, planState);
            updatePlan(newPlan);
        } catch (e) {
            console.error(e);
            alert("Failed to generate plan. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleAddDay = () => {
        const lastDate = planState.length > 0 ? new Date(planState[planState.length - 1].date) : new Date(trip.date);
        lastDate.setDate(lastDate.getDate() + 1);

        const newDay: TripDayPlan = {
            id: self.crypto.randomUUID(),
            date: lastDate.toISOString(),
            title: `Day ${planState.length + 1}`,
            items: [],
        };
        updatePlan([...planState, newDay]);
    };
    
    const handleAddItem = (dayId: string) => {
        const newItem: TripDayPlanItem = {
            id: self.crypto.randomUUID(),
            time: '09:00',
            activity: 'New Activity',
            type: 'other',
            completed: false,
        };
        const newPlan = planState.map(day => 
            day.id === dayId ? { ...day, items: [...day.items, newItem] } : day
        );
        updatePlan(newPlan);
    };
    
    const handleFieldChange = (dayId: string, itemId: string, field: keyof TripDayPlanItem, value: any) => {
        const newPlan = planState.map(day => 
            day.id === dayId ? { ...day, items: day.items.map(item => item.id === itemId ? { ...item, [field]: value } : item) } : day
        );
        updatePlan(newPlan);
    };

    const handleSaveChanges = () => {
        onUpdateTrip({ ...trip, plan: planState });
        setIsDirty(false);
    };

    const handleDragStart = (e: React.DragEvent, dayId: string, itemIndex: number) => {
        dragItem.current = { dayId, itemIndex };
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnter = (dayId: string, itemIndex: number) => {
        if (dragItem.current && dragItem.current.dayId === dayId) {
            dragOverItem.current = { dayId, itemIndex };
            setDropIndicator({ dayId, index: itemIndex });
        }
    };
    
    const handleDrop = () => {
        if (dragItem.current && dragOverItem.current && dragItem.current.dayId === dragOverItem.current.dayId) {
            const { dayId, itemIndex: fromIndex } = dragItem.current;
            const { itemIndex: toIndex } = dragOverItem.current;
            
            const newPlan = [...planState];
            const dayToUpdate = newPlan.find(d => d.id === dayId);
            if (dayToUpdate) {
                const movedItem = dayToUpdate.items.splice(fromIndex, 1)[0];
                dayToUpdate.items.splice(toIndex, 0, movedItem);
                updatePlan(newPlan);
            }
        }
        dragItem.current = null;
        dragOverItem.current = null;
        setDropIndicator(null);
    };
    
    const handleDragEnd = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('dragging');
        dragItem.current = null;
        dragOverItem.current = null;
        setDropIndicator(null);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent, dayId: string, itemId: string, field: 'time'|'activity'|'icon') => {
        if (e.key === 'Enter') {
            handleFieldChange(dayId, itemId, field, (e.target as HTMLInputElement).value);
            setEditingField(null);
        } else if (e.key === 'Escape') {
            setEditingField(null);
        }
    };

    if (planState.length === 0) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full">
                { isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <LoadingSpinner />
                        <p className="mt-4 text-secondary">Generating your itinerary...</p>
                    </div>
                ) : (
                    <>
                        <EmptyState
                            icon="🗺️"
                            title="No Itinerary Yet"
                            message="Generate a plan with AI or add your first day manually."
                        />
                        <div className="w-full max-w-md mt-6 space-y-4">
                            <textarea 
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                placeholder="e.g., A relaxed 3-day beach vacation in Goa with a focus on good food."
                                className="themed-textarea w-full h-24 p-2"
                                disabled={isGenerating}
                            />
                            <button onClick={handleGeneratePlan} className="button-primary w-full py-2 flex items-center justify-center gap-2" disabled={isGenerating}>
                                ✨ Generate Plan with AI
                            </button>
                            <button onClick={handleAddDay} className="button-secondary w-full py-2">
                                + Add First Day Manually
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {isDirty && (
                <div className="sticky top-2 z-20 p-2 flex justify-center">
                    <button onClick={handleSaveChanges} className="button-primary px-4 py-2 shadow-lg">Save Plan Changes</button>
                </div>
            )}
            {planState.map(day => (
                <div key={day.id} className="timeline-container">
                    <h4 className="timeline-day-header">{day.title} <span className="font-normal text-sm text-secondary">- {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span></h4>
                    <div onDrop={() => handleDrop()} onDragOver={(e) => e.preventDefault()}>
                        {day.items.map((item, index) => (
                            <React.Fragment key={item.id}>
                                {dropIndicator?.dayId === day.id && dropIndicator.index === index && <div className="drop-indicator" style={{marginLeft: '1.25rem'}} />}
                                <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, day.id, index)}
                                    onDragEnter={() => handleDragEnter(day.id, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`timeline-item ${item.completed ? 'completed' : ''}`}
                                >
                                    <div className="timeline-item-icon">
                                        {editingField?.itemId === item.id && editingField.field === 'icon' ? (
                                             <input type="text" defaultValue={item.icon} onKeyDown={e => handleKeyDown(e, day.id, item.id, 'icon')} onBlur={() => setEditingField(null)} autoFocus className="timeline-icon-input" />
                                        ) : ( <span onClick={() => setEditingField({dayId: day.id, itemId: item.id, field: 'icon'})}>{item.icon || '📌'}</span> )}
                                    </div>
                                    <div className="timeline-item-content flex items-start gap-3">
                                        <div className="pt-2"><CustomCheckbox id={`item-${item.id}`} checked={!!item.completed} onChange={c => handleFieldChange(day.id, item.id, 'completed', c)} label="" /></div>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2">
                                                {editingField?.itemId === item.id && editingField.field === 'time' ? (
                                                    <input type="text" defaultValue={item.time} onKeyDown={e => handleKeyDown(e, day.id, item.id, 'time')} onBlur={() => setEditingField(null)} autoFocus className="timeline-editable-input font-semibold w-16" />
                                                ) : ( <span onClick={() => setEditingField({dayId: day.id, itemId: item.id, field: 'time'})} className="font-semibold text-primary">{item.time}</span> )}
                                                - 
                                                {editingField?.itemId === item.id && editingField.field === 'activity' ? (
                                                    <input type="text" defaultValue={item.activity} onKeyDown={e => handleKeyDown(e, day.id, item.id, 'activity')} onBlur={() => setEditingField(null)} autoFocus className="timeline-editable-input timeline-activity flex-grow" />
                                                ) : ( <span onClick={() => setEditingField({dayId: day.id, itemId: item.id, field: 'activity'})} className="timeline-activity text-primary">{item.activity}</span> )}
                                            </div>
                                            {item.notes && <p className="text-xs text-secondary pl-1 mt-1">{item.notes}</p>}
                                        </div>
                                        <div className="timeline-drag-handle" title="Drag to reorder"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg></div>
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}
                        <button onClick={() => handleAddItem(day.id)} className="w-full text-center p-2 text-sm text-sky-400 hover:text-sky-300 ml-5 mt-2">+ Add Activity</button>
                    </div>
                </div>
            ))}
            <button onClick={handleAddDay} className="button-secondary w-full py-2 mt-4">
                + Add Another Day
            </button>
        </div>
    );
};


const TripSettleView: React.FC<{ trip: Trip, expenses: TripExpense[] }> = ({ trip, expenses }) => {
    const { settlements } = useContext(AppDataContext);
    const tripSettlements = useMemo(() => (settlements || []).filter(s => s.tripId === trip.id), [settlements, trip.id]);
    const formatCurrency = useCurrencyFormatter(undefined, trip.currency);

    const settlementSuggestions = useMemo(() => {
        const result = calculateTripSummary(expenses, [trip], tripSettlements);
        return result[trip.currency] || [];
    }, [expenses, trip, tripSettlements]);

    return (
        <div className="p-4 space-y-3">
            <h3 className="font-semibold text-lg text-primary">Who Owes Whom</h3>
            <div className="p-3 bg-subtle rounded-lg space-y-3">
                {settlementSuggestions.length > 0 ? settlementSuggestions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-center">
                            <span className="font-semibold text-primary">{s.fromName}</span>
                            <span className="mx-2 text-secondary">&rarr;</span>
                            <span className="font-semibold text-primary">{s.toName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-emerald-400">{formatCurrency(s.amount)}</span>
                        </div>
                    </div>
                )) : <p className="text-center text-sm text-secondary">Everyone is settled up!</p>}
            </div>
        </div>
    );
};

const TripNotesView: React.FC<{ trip: Trip, onNavigate: (screen: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => void }> = ({ trip, onNavigate }) => {
    const { notes } = useContext(AppDataContext);
    const tripNotes = useMemo(() => (notes || []).filter(n => n.tripId === trip.id), [notes, trip.id]);
    
    return (
        <div className="p-4 space-y-2">
             {tripNotes.map(note => (
                <div key={note.id} onClick={() => onNavigate('notes', undefined, { noteId: note.id })} className="p-3 bg-subtle rounded-lg group cursor-pointer hover-bg-stronger">
                     <div className="flex items-center gap-3">
                        <span className="text-2xl">{note.type === 'checklist' ? '✅' : '📝'}</span>
                        <div>
                            <p className="font-semibold text-primary">{note.title}</p>
                            <p className="text-xs text-secondary">Updated: {new Date(note.updatedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
             ))}
        </div>
    );
}

export default TripDetailsScreen;
