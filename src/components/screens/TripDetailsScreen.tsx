
import React, { useState, useMemo, useContext, useRef, useEffect } from 'react';
import { Trip, TripExpense, Category, ActiveModal, ActiveScreen, TripDayPlan, Note, TripDayPlanItem, TransactionType, TRIP_FUND_ID, TripMessage } from '@/types';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import ModalHeader from '@/components/common/ModalHeader';
import { calculateTripSummary } from '@/utils/calculations';
import { AppDataContext } from '@/contexts/SettingsContext';
import TripChat from '@/components/trip/TripChat';
import TripHistory from '@/components/trip/TripHistory';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import CustomCheckbox from '@/components/common/CustomCheckbox';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { generateAITripPlan, findNearbyPlaces } from '@/services/geminiService';
import CustomSelect from '@/components/common/CustomSelect';
import TripSOSModal from '@/components/trip/TripSOSModal';

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

// ... (PowerSaverView remains unchanged, omitting for brevity but included in output if not modified) ...
const PowerSaverView: React.FC<{
    trip: Trip;
    onExit: () => void;
    messages: TripMessage[];
    onSendMessage: (msg: TripMessage) => void;
    onNavigate: (screen: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => void;
}> = ({ trip, onExit, messages, onSendMessage, onNavigate }) => {
    // ... same implementation ...
    const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
    const [activeView, setActiveView] = useState<'home' | 'chat' | 'notes'>('home');
    const { notes } = useContext(AppDataContext);
    const tripNotes = useMemo(() => (notes || []).filter(n => n.tripId === trip.id), [notes, trip.id]);

    useEffect(() => {
        const nav = navigator as any;
        if (nav.getBattery) {
            nav.getBattery().then((bat: any) => {
                const updateBattery = () => {
                    setBattery({ level: bat.level * 100, charging: bat.charging });
                };
                updateBattery();
                bat.addEventListener('levelchange', updateBattery);
                bat.addEventListener('chargingchange', updateBattery);
                return () => {
                    bat.removeEventListener('levelchange', updateBattery);
                    bat.removeEventListener('chargingchange', updateBattery);
                };
            });
        }
    }, []);

    const renderHome = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2 border-b border-gray-800 pb-6">
                <p className="text-gray-400 text-sm">POWER SAVER ACTIVE</p>
                <div className="text-6xl font-mono font-bold text-emerald-500">
                    {battery ? `${Math.round(battery.level)}%` : '--%'}
                </div>
                {battery?.charging && <p className="text-yellow-500 text-xs">⚡ CHARGING</p>}
                <p className="text-xl font-bold text-white mt-2">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setActiveView('chat')} className="p-6 border border-gray-800 rounded-none bg-black hover:bg-gray-900 transition-colors flex flex-col items-center gap-2">
                    <span className="text-3xl">💬</span>
                    <span className="font-mono text-emerald-500">CHAT</span>
                </button>
                <button onClick={() => setActiveView('notes')} className="p-6 border border-gray-800 rounded-none bg-black hover:bg-gray-900 transition-colors flex flex-col items-center gap-2">
                    <span className="text-3xl">📝</span>
                    <span className="font-mono text-emerald-500">NOTES</span>
                </button>
            </div>

            <div className="p-4 border border-gray-800 bg-black text-gray-300 font-mono text-sm">
                <p className="text-xs text-gray-500 mb-2">TRIP INFO</p>
                <p>DEST: {trip.location || 'Unknown'}</p>
                <p>MEMBERS: {trip.participants.length}</p>
            </div>
        </div>
    );

    const renderNotes = () => (
        <div className="h-full flex flex-col">
            <button onClick={() => setActiveView('home')} className="p-3 text-left text-emerald-500 font-mono border-b border-gray-800">
                &lt; BACK
            </button>
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {tripNotes.length === 0 && <p className="text-gray-500 text-center mt-10 font-mono">NO NOTES FOUND</p>}
                {tripNotes.map(note => (
                    <div key={note.id} className="p-3 border border-gray-800 bg-black">
                        <p className="font-bold text-white font-mono">{note.icon} {note.title}</p>
                        <div className="text-gray-400 text-sm mt-1 font-mono whitespace-pre-wrap">
                            {typeof note.content === 'string' ? note.content : `${(note.content as any[]).length} items`}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderChat = () => (
        <div className="h-full flex flex-col relative bg-black">
            <button onClick={() => setActiveView('home')} className="p-3 text-left text-emerald-500 font-mono border-b border-gray-800 flex-shrink-0">
                &lt; BACK
            </button>
            <div className="flex-grow relative isolate">
                <div className="absolute inset-0 [&_.bg-subtle]:bg-black [&_.bg-subtle]:border [&_.bg-subtle]:border-gray-800 [&_.text-primary]:text-white [&_.text-secondary]:text-gray-400 [&_input]:bg-gray-900 [&_input]:text-white [&_input]:border-gray-700">
                    <TripChat trip={trip} messages={messages} onSendMessage={onSendMessage} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
            {activeView === 'home' ? (
                <>
                    <div className="flex-grow p-6 flex flex-col justify-center max-w-md mx-auto w-full">
                        {renderHome()}
                    </div>
                    <button 
                        onClick={onExit}
                        className="p-6 bg-gray-900 text-white font-bold tracking-widest border-t border-gray-800 hover:bg-gray-800 transition-colors"
                    >
                        EXIT POWER SAVER
                    </button>
                </>
            ) : (
                activeView === 'chat' ? renderChat() : renderNotes()
            )}
        </div>
    );
};

const TripDetailsScreen: React.FC<TripDetailsScreenProps> = ({ trip, expenses, categories, onAddExpense, onEditExpense, onDeleteExpense, onBack, onUpdateTrip, openModal, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<TripTab>('dashboard');
  const { tripMessages, setTripMessages } = useContext(AppDataContext);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isPowerSaver, setIsPowerSaver] = useState(false);

  const TabButton = ({ tab, label }: { tab: TripTab; label: string }) => (
    <button onClick={() => setActiveTab(tab)} className={`trip-details-tab px-4 font-semibold text-sm ${activeTab === tab ? 'active' : ''}`}>
      {label}
    </button>
  );

  const sosAction = {
      icon: <span className="text-xl">🆘</span>,
      onClick: () => setIsSOSOpen(true),
      label: "SOS Mode"
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <TripDashboard trip={trip} expenses={expenses} categories={categories} openModal={openModal} onUpdateTrip={onUpdateTrip} onEnablePowerSaver={() => setIsPowerSaver(true)} />;
      case 'expenses': return <TripExpensesList expenses={expenses} categories={categories} onEditExpense={onEditExpense} currency={trip.currency} />;
      case 'plan': return <TripPlanView trip={trip} onUpdateTrip={onUpdateTrip} categories={categories} openModal={openModal} />;
      case 'settle': return <TripSettleView trip={trip} expenses={expenses} />;
      case 'notes': return <TripNotesView trip={trip} onNavigate={onNavigate} />;
      case 'chat': return <TripChat trip={trip} messages={tripMessages.filter(m => m.tripId === trip.id)} onSendMessage={(msg) => setTripMessages(prev => [...prev, msg])} />;
      case 'history': return <TripHistory trip={trip} expenses={expenses} />;
      default: return null;
    }
  };

  if (isPowerSaver) {
      return <PowerSaverView 
        trip={trip} 
        onExit={() => setIsPowerSaver(false)} 
        messages={tripMessages.filter(m => m.tripId === trip.id)} 
        onSendMessage={(msg) => setTripMessages(prev => [...prev, msg])}
        onNavigate={onNavigate}
      />;
  }

  return (
    <div className="h-full flex flex-col">
      <ModalHeader title={trip.name} onBack={onBack} onClose={onBack} icon="✈️" onSettingsClick={() => openModal('editTrip', { trip })} secondaryAction={sosAction} />
      {isSOSOpen && <TripSOSModal onClose={() => setIsSOSOpen(false)} />}
      <div className="trip-details-tabs-container">
        <div className="flex">
          <TabButton tab="dashboard" label="Dashboard" />
          <TabButton tab="chat" label="Comms" />
          <TabButton tab="expenses" label="Expenses" />
          <TabButton tab="plan" label="Plan" />
          <TabButton tab="settle" label="Settle" />
          <TabButton tab="notes" label="Notes" />
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


const TripDashboard: React.FC<{ trip: Trip; expenses: TripExpense[]; categories: Category[]; openModal: (name: ActiveModal, props?: any) => void; onUpdateTrip: (trip: Trip) => void; onEnablePowerSaver: () => void; }> = ({ trip, expenses, categories, openModal, onUpdateTrip, onEnablePowerSaver }) => {
    const formatCurrency = useCurrencyFormatter(undefined, trip.currency);
    const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
    const budgetRemaining = trip.budget ? trip.budget - totalSpent : null;
    const budgetProgress = trip.budget ? (totalSpent / trip.budget) * 100 : 0;
    
    // Nearby Search State
    const [nearbyQuery, setNearbyQuery] = useState('ATM');
    const [places, setPlaces] = useState<any[]>([]);
    const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

    const handleNearbySearch = async () => {
        setIsSearchingPlaces(true);
        try {
            const result = await findNearbyPlaces(nearbyQuery, trip.location || 'current location');
            setPlaces(result.places || []);
        } catch(e) {
            console.error(e);
        } finally {
            setIsSearchingPlaces(false);
        }
    };
    
    const { totalCollected, spentFromFund, remainingInFund } = useMemo(() => {
        const collected = trip.advances?.reduce((sum, adv) => sum + adv.amount, 0) || 0;
        const spent = expenses.reduce((sum, exp) => {
            const fromFund = exp.payers.find(p => p.contactId === TRIP_FUND_ID);
            return sum + (fromFund?.amount || 0);
        }, 0);
        return { totalCollected: collected, spentFromFund: spent, remainingInFund: collected - spent };
    }, [trip.advances, expenses]);
    
    return (
        <div className="p-4 space-y-4">
            <button 
                onClick={onEnablePowerSaver} 
                className="w-full py-2 px-4 bg-emerald-900/30 border border-emerald-800 text-emerald-400 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-900/50 transition-colors"
            >
                ⚡ Enable Power Saver Mode
            </button>

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
            
            {/* Map Grounding Section */}
            <div className="p-3 bg-subtle rounded-lg border border-divider">
                <h4 className="font-semibold text-primary mb-2">📍 Find Nearby</h4>
                <div className="flex gap-2">
                    <CustomSelect options={[{value: 'ATM', label: 'ATM'}, {value: 'Restaurant', label: 'Restaurant'}, {value: 'Hospital', label: 'Hospital'}, {value: 'Hotel', label: 'Hotel'}]} value={nearbyQuery} onChange={setNearbyQuery} />
                    <button onClick={handleNearbySearch} disabled={isSearchingPlaces} className="button-primary px-3">{isSearchingPlaces ? <LoadingSpinner/> : 'Go'}</button>
                </div>
                {places.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {places.slice(0, 3).map((place, i) => (
                            <div key={i} className="text-sm p-2 bg-bg-app rounded">
                                <a href={place.maps?.uri} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline font-semibold">{place.maps?.title || "Place"}</a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="p-3 bg-subtle rounded-lg">
                <div className="flex justify-between items-center mb-2">
                     <h4 className="font-semibold text-primary">💰 Trip Fund</h4>
                     <button onClick={() => openModal('manageAdvances', { trip, onUpdateTrip })} className="button-secondary text-xs px-3 py-1">Manage Advances</button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div><span className="text-xs text-secondary">Collected</span><p className="font-mono text-primary">{formatCurrency(totalCollected)}</p></div>
                    <div><span className="text-xs text-secondary">Spent</span><p className="font-mono text-primary">{formatCurrency(spentFromFund)}</p></div>
                    <div><span className="text-xs text-secondary">Remaining</span><p className="font-mono text-primary">{formatCurrency(remainingInFund)}</p></div>
                </div>
            </div>
            
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

const TripPlanView: React.FC<{ trip: Trip; onUpdateTrip: (trip: Trip) => void; categories: Category[]; openModal: (name: ActiveModal, props?: any) => void; }> = ({ trip, onUpdateTrip, categories, openModal }) => {
    const [planState, setPlanState] = useState<TripDayPlan[]>(trip.plan || []);
    const [isDirty, setIsDirty] = useState(false);
    const [editingField, setEditingField] = useState<{ dayId: string; itemId: string; field: 'time' | 'activity' } | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState('');

    const dragItem = useRef<{ dayId: string; itemIndex: number } | null>(null);
    const dragOverItem = useRef<{ dayId: string; itemIndex: number } | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ dayId: string; index: number } | null>(null);

    useEffect(() => {
        setPlanState(trip.plan || []);
        setIsDirty(false); // When prop changes, we assume it's clean
    }, [trip.plan]);

    const updatePlan = (newPlan: TripDayPlan[]) => {
        setPlanState(newPlan);
        setIsDirty(true);
    };

    const handleGeneratePlan = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        setAiError('');
        try {
            const newPlan = await generateAITripPlan(aiPrompt, planState);
            updatePlan(newPlan);
        } catch (e) {
            console.error(e);
            setAiError(e instanceof Error ? e.message : "Failed to generate plan. Please try again.");
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
            completed: false,
        };
        const newPlan = planState.map(day => 
            day.id === dayId ? { ...day, items: [...day.items, newItem] } : day
        );
        updatePlan(newPlan);
    };
    
    const handleFieldChange = (dayId: string, itemId: string, field: keyof Omit<TripDayPlanItem, 'categoryId'>, value: any) => {
        const newPlan = planState.map(day => 
            day.id === dayId ? { ...day, items: day.items.map(item => item.id === itemId ? { ...item, [field]: value } : item) } : day
        );
        
        setPlanState(newPlan);
        if (field === 'completed') {
            onUpdateTrip({ ...trip, plan: newPlan });
        } else {
            setIsDirty(true);
        }
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
    
    const handleKeyDown = (e: React.KeyboardEvent, dayId: string, itemId: string, field: 'time'|'activity') => {
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
                        {aiError && <p className="text-rose-400 text-center mb-4">{aiError}</p>}
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
                        {day.items.map((item, index) => {
                            return (
                            <React.Fragment key={item.id}>
                                {dropIndicator?.dayId === day.id && dropIndicator.index === index && <div className="drop-indicator" style={{marginLeft: '1.25rem'}} />}
                                <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, day.id, index)}
                                    onDragEnter={() => handleDragEnter(day.id, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`timeline-item ${item.completed ? 'completed' : ''}`}
                                >
                                    <div className="timeline-item-icon" onClick={() => openModal('timePicker', { initialTime: item.time, onSave: (time: string) => handleFieldChange(day.id, item.id, 'time', time) })}>
                                        {item.time}
                                    </div>
                                    <div className="timeline-item-content flex items-start gap-3">
                                        <div className="pt-2"><CustomCheckbox id={`item-${item.id}`} checked={!!item.completed} onChange={c => handleFieldChange(day.id, item.id, 'completed', c)} label="" /></div>
                                        <div className="flex-grow space-y-2">
                                            <div className="flex items-center gap-2">
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
                        )})}
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
