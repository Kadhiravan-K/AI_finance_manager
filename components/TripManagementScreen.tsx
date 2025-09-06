
import React from 'react';
import { Trip, TripExpense } from '../types';
import { getCurrencyFormatter } from '../utils/currency';

interface TripManagementScreenProps {
  trips: Trip[];
  tripExpenses: TripExpense[];
  onTripSelect: (tripId: string) => void;
  onAddTrip: () => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
  onShowSummary: () => void;
}

const TripManagementScreen: React.FC<TripManagementScreenProps> = ({ trips, tripExpenses, onTripSelect, onAddTrip, onEditTrip, onDeleteTrip, onShowSummary }) => {

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0">
        <h2 className="text-2xl font-bold text-primary text-center">Trip Management ✈️</h2>
      </div>
       <div className="p-4 flex-shrink-0">
        <button onClick={onShowSummary} className="button-secondary w-full py-2 font-semibold">
          View Overall Summary
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-6 pt-0 space-y-4">
        {trips.map(trip => {
          const tripTotal = tripExpenses
            .filter(e => e.tripId === trip.id)
            .reduce((sum, e) => sum + e.amount, 0);
          
          const formatCurrency = getCurrencyFormatter(trip.currency).format;
          const validParticipants = (trip.participants || []).filter(Boolean);
          const participantCount = validParticipants.length;

          const tripStartDate = new Date(trip.date);
          let tripEndDate = tripStartDate;
          let duration = 1;

          if (trip.plan && trip.plan.length > 0) {
              const dates = trip.plan.map(d => new Date(d.date));
              const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
              // Add a day to the end date to account for timezone issues making it appear a day earlier
              const adjustedEndDate = new Date(maxDate.setDate(maxDate.getDate() + 1));
              
              if (adjustedEndDate > tripStartDate) {
                  tripEndDate = adjustedEndDate;
                  // Ensure duration is at least 1 day
                  duration = Math.ceil((tripEndDate.getTime() - tripStartDate.getTime()) / (1000 * 3600 * 24)) || 1;
              }
          }

          const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const formattedDate = duration > 1 ? `${formatDate(tripStartDate)} - ${formatDate(tripEndDate)}` : formatDate(tripStartDate);
          const durationText = `${duration} ${duration === 1 ? 'Day' : 'Days'}`;
          
          const participantsToShow = validParticipants.slice(0, 4);
          const hiddenParticipantsCount = participantCount - participantsToShow.length;

          return (
             <div key={trip.id} onClick={() => onTripSelect(trip.id)} className="glass-card p-4 rounded-xl flex flex-col justify-between h-48 cursor-pointer relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/10 to-slate-900/20 rounded-xl"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                    {/* Top Section: Title & Actions */}
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-primary pr-16">{trip.name}</h3>
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button onClick={() => onEditTrip(trip)} className="text-xs text-sky-400 hover:brightness-125 px-2 py-1 rounded-full transition-colors bg-subtle hover-bg-stronger">Edit</button>
                            <button onClick={() => onDeleteTrip(trip.id)} className="text-xs text-rose-400 hover:brightness-125 px-2 py-1 rounded-full transition-colors bg-subtle hover-bg-stronger">Delete</button>
                        </div>
                    </div>
                    
                    <div className="flex-grow"></div>
                    
                    {/* Middle Section: Participants */}
                    <div className="flex items-center justify-between">
                        <div className="flex -space-x-3 overflow-hidden">
                          {participantsToShow.map(p => (
                              <div key={p.contactId} className="inline-block h-8 w-8 rounded-full ring-2 ring-[var(--color-bg-card)] bg-violet-500 flex items-center justify-center text-sm font-bold text-white" title={p.name}>
                                  {p.name.charAt(0).toUpperCase()}
                              </div>
                          ))}
                          {hiddenParticipantsCount > 0 && 
                              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[var(--color-bg-card)] bg-slate-500 flex items-center justify-center text-xs font-bold text-white">
                              +{hiddenParticipantsCount}
                              </div>
                          }
                        </div>
                        <div className="text-xs font-semibold bg-subtle text-secondary px-2 py-1 rounded-full">
                            {participantCount} {participantCount === 1 ? 'Person' : 'People'}
                        </div>
                    </div>
                    
                    {/* Bottom Section: Date, Duration, and Total */}
                    <div className="mt-3 pt-3 border-t border-divider flex justify-between items-end">
                        <div>
                            <p className="text-sm font-semibold text-primary">{formattedDate}</p>
                            <p className="text-xs text-secondary">{durationText}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-secondary">Total Spent</p>
                            <p className="text-lg font-bold text-rose-400">{formatCurrency(tripTotal)}</p>
                        </div>
                    </div>
                </div>
            </div>
          );
        })}
        {trips.length === 0 && (
            <div className="text-center py-12">
                <p className="text-lg font-medium text-secondary">Ready for an adventure?</p>
                <p className="text-sm text-tertiary">Create your first trip to manage shared expenses with friends.</p>
            </div>
        )}
      </div>

      <div className="flex-shrink-0 p-6 border-t border-divider bg-subtle">
        <button onClick={onAddTrip} className="button-primary w-full py-2 font-semibold">
          + Create New Trip
        </button>
      </div>
    </div>
  );
};

export default TripManagementScreen;