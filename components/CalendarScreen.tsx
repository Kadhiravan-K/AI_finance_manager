import React, { useState, useMemo, useContext } from 'react';
// Fix: Import ActiveScreen and ActiveModal to define component props
import { CalendarEvent, ActiveScreen, ActiveModal } from '../types';
import { AppDataContext, SettingsContext } from '../contexts/SettingsContext';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import EmptyState from './EmptyState';

// Fix: Add props interface for the component
interface CalendarScreenProps {
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>) => void;
  setActiveScreen: (screen: ActiveScreen) => void;
  setTripDetailsId: (id: string) => void;
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ onNavigate, setActiveScreen, setTripDetailsId }) => {
    const dataContext = useContext(AppDataContext);
    const { settings } = useContext(SettingsContext);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const formatCurrency = useCurrencyFormatter();

    const calendarEvents = useMemo((): CalendarEvent[] => {
        if (!dataContext) return [];
        const { recurringTransactions, goals, refunds, trips } = dataContext;
        const events: CalendarEvent[] = [];

        recurringTransactions.forEach(rt => {
            events.push({
                id: `bill-${rt.id}`,
                date: new Date(rt.nextDueDate),
                title: rt.description,
                type: 'bill',
                color: 'rose',
                data: rt
            });
        });

        (refunds || []).forEach(r => {
            if (r.expectedDate && !r.isClaimed) {
                events.push({
                    id: `refund-${r.id}`,
                    date: new Date(r.expectedDate),
                    title: `Expected: ${r.description}`,
                    type: 'refund',
                    color: 'sky',
                    data: r
                });
            }
        });

        (trips || []).forEach(t => {
            events.push({
                id: `trip-${t.id}`,
                date: new Date(t.date),
                title: `Trip: ${t.name}`,
                type: 'trip',
                color: 'amber',
                data: t
            });
        });

        return events;
    }, [dataContext]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
        setSelectedDate(null);
    };
    
    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    }

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();
    const today = new Date();

    const selectedDayEvents = useMemo(() => {
        if (!selectedDate) return [];
        return calendarEvents.filter(e => e.date.toDateString() === selectedDate.toDateString())
          .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [selectedDate, calendarEvents]);

    const EventItem: React.FC<{event: CalendarEvent}> = ({ event }) => {
        let details = '';
        if (event.type === 'bill') details = formatCurrency(event.data.amount);
        if (event.type === 'refund') details = `~${formatCurrency(event.data.amount)}`;
        
        const colorClasses = {
            rose: 'border-rose-500',
            sky: 'border-sky-500',
            amber: 'border-amber-400',
            violet: 'border-violet-500',
        };

        const handleClick = () => {
            switch (event.type) {
                case 'bill':
                    onNavigate('scheduled', 'editRecurring', { recurringTransaction: event.data });
                    break;
                case 'refund':
                    onNavigate('refunds', 'refund', { refund: event.data });
                    break;
                case 'trip':
                    setTripDetailsId(event.data.id);
                    setActiveScreen('tripDetails');
                    break;
                // 'goal' type exists but is not implemented for calendar events.
            }
        };

        return (
            <div onClick={handleClick} className={`p-3 bg-subtle rounded-lg border-l-4 ${colorClasses[event.color]} cursor-pointer hover-bg-stronger transition-colors`}>
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-primary">{event.title}</p>
                    <p className="text-sm font-mono text-secondary">{details}</p>
                </div>
            </div>
        );
    }
    
    const colorMap = { rose: 'bg-rose-500', sky: 'bg-sky-500', amber: 'bg-amber-400', violet: 'bg-violet-500' };

    if (!settings.googleCalendar?.connected) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4">
                <EmptyState
                    icon="🗓️"
                    title="Connect Your Calendar"
                    message="Enable the Google Calendar integration to see your financial events here."
                    actionText="Go to Integrations"
                    onAction={() => onNavigate('more', 'integrations')}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between">
                 <button onClick={goToToday} className="button-secondary text-sm px-3 py-1">Today</button>
                 <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover-bg-stronger text-primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <h2 className="text-lg font-bold text-primary text-center w-36">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover-bg-stronger text-primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
                <div className="w-20"></div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-secondary p-2 flex-shrink-0">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1 p-2 flex-grow overflow-y-auto">
                {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const isToday = date.toDateString() === today.toDateString();
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const eventsOnDay = calendarEvents.filter(e => e.date.toDateString() === date.toDateString());
                    
                    return (
                        <div key={day} onClick={() => setSelectedDate(date)} className={`p-1 text-center rounded-lg cursor-pointer aspect-square flex flex-col items-center justify-start transition-colors ${isSelected ? 'bg-emerald-500/30' : 'hover:bg-subtle'}`}>
                            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${isToday ? 'bg-emerald-500 text-white' : 'text-primary'}`}>{day}</span>
                            <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                                {eventsOnDay.slice(0, 3).map(e => <div key={e.id} className={`w-1.5 h-1.5 rounded-full ${colorMap[e.color]}`}></div>)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedDate && (
                <div className="flex-shrink-0 border-t border-divider p-4 animate-fadeInUp">
                    <h3 className="font-semibold text-primary mb-2">Events on {selectedDate.toLocaleDateString()}</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {selectedDayEvents.length > 0 ? (
                            selectedDayEvents.map(e => <EventItem key={e.id} event={e} />)
                        ) : (
                            <p className="text-sm text-secondary text-center py-4">No events on this day.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarScreen;