
import React from 'react';
import { Trip, TripExpense } from '@/types';
import EmptyState from '@/components/common/EmptyState';
import { getCurrencyFormatter } from '@/utils/currency';

interface TripManagementScreenProps {
  trips: Trip[];
  tripExpenses: TripExpense[];
  onTripSelect: (tripId: string) => void;
  onAddTrip: () => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (id: string) => void;
  onShowSummary: () => void;
}

const TripManagementScreen: React.FC<TripManagementScreenProps> = ({ trips, tripExpenses, onTripSelect, onAddTrip, onEditTrip, onDeleteTrip, onShowSummary }) => {
  
  if (!trips || trips.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <EmptyState
          icon="✈️"
          title="Ready for an Adventure?"
          message="Create your first trip to start planning, tracking expenses, and settling up with friends."
          actionText="Plan First Trip"
          onAction={onAddTrip}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Trips</h2>
        <button onClick={onShowSummary} className="button-secondary text-sm">Overall Summary</button>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {trips.map(trip => {
          const totalExpenses = tripExpenses.filter(e => e.tripId === trip.id).reduce((sum, e) => sum + e.amount, 0);
          const formattedExpenses = getCurrencyFormatter(trip.currency).format(totalExpenses);
          const formattedBudget = trip.budget ? getCurrencyFormatter(trip.currency).format(trip.budget) : null;

          return (
            <div key={trip.id} onClick={() => onTripSelect(trip.id)} className="glass-card p-4 rounded-xl cursor-pointer hover:bg-card-hover transition-colors animate-fadeInUp group relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-3 flex-grow min-w-0">
                         <span className="text-3xl flex-shrink-0">✈️</span>
                         <div className="flex-grow min-w-0">
                            <h3 className="text-lg font-bold text-primary truncate pr-2">{trip.name}</h3>
                            <p className="text-xs text-secondary mt-0.5 flex flex-wrap items-center gap-1">
                                {trip.location && <span className="font-semibold text-accent-sky">{trip.location} •</span>}
                                <span>📅 {new Date(trip.date).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>👥 {trip.participants.length} members</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                         <button onClick={(e) => { e.stopPropagation(); onEditTrip(trip); }} className="p-2 text-sky-400 hover:bg-sky-500/10 rounded-full" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip.id); }} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-full" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
                
                <div className="w-full h-px bg-divider my-3" />
                
                <div className="flex justify-between items-end">
                     <div>
                        <p className="text-xs text-secondary mb-0.5">Total Expenses</p>
                        <p className="font-bold text-lg text-primary">{formattedExpenses}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs text-secondary mb-0.5">Budget</p>
                        <p className="font-semibold text-emerald-400">{formattedBudget || '—'}</p>
                     </div>
                </div>
            </div>
          );
        })}
      </div>
      <div className="p-4 border-t border-divider flex-shrink-0">
        <button onClick={onAddTrip} className="button-primary w-full py-2">+ Add New Trip</button>
      </div>
    </div>
  );
};

export default TripManagementScreen;