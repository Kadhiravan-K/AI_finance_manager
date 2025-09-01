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

          return (
            <div key={trip.id} className="p-4 bg-subtle rounded-lg group transition-all duration-200 hover-bg-stronger hover:scale-[1.02]">
              <div className="flex justify-between items-start">
                  <div onClick={() => onTripSelect(trip.id)} className="flex-grow cursor-pointer">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-bold text-lg text-primary">{trip.name}</h3>
                        {tripTotal > 0 && (
                          <p className="text-sm font-semibold text-rose-400">{formatCurrency(tripTotal)}</p>
                        )}
                      </div>
                      <p className="text-xs text-secondary">{new Date(trip.date).toLocaleDateString()}</p>
                       <div className="flex -space-x-2 overflow-hidden mt-2">
                          {validParticipants.slice(0, 4).map(p => (
                              <div key={p.contactId} className="inline-block h-8 w-8 rounded-full ring-2 ring-[var(--color-bg-subtle)] bg-violet-500 flex items-center justify-center text-xs font-bold text-white" title={p.name}>
                                  {p.name.charAt(0)}
                              </div>
                          ))}
                          {validParticipants.length > 4 && 
                              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[var(--color-bg-subtle)] bg-slate-500 flex items-center justify-center text-xs font-bold text-white">
                              +{validParticipants.length - 4}
                              </div>
                          }
                      </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEditTrip(trip)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                      <button onClick={() => onDeleteTrip(trip.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full">Delete</button>
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