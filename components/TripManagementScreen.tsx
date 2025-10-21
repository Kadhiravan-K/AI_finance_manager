
import React from 'react';
import { Trip, TripExpense } from '../types';
import EmptyState from './EmptyState';
import { getCurrencyFormatter } from '../utils/currency';

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
          return (
            <div key={trip.id} onClick={() => onTripSelect(trip.id)} className="p-4 bg-subtle rounded-lg group cursor-pointer hover-bg-stronger transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-primary">{trip.name}</p>
                  <p className="text-xs text-secondary">{new Date(trip.date).toLocaleDateString()} &bull; {trip.participants.length} members</p>
                </div>
                {/* FIX: The useCurrencyFormatter hook cannot be called inside a loop, and the returned function expects only one argument. Using getCurrencyFormatter utility instead. */}
                <p className="font-semibold text-primary">{getCurrencyFormatter(trip.currency).format(totalExpenses)}</p>
              </div>
              <div className="flex justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onEditTrip(trip); }} className="text-xs px-2 py-1 text-sky-300">Edit</button>
                {/* Fix: Corrected the call to onDeleteTrip to pass only the trip ID. */}
                <button onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip.id); }} className="text-xs px-2 py-1 text-rose-400">Delete</button>
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
