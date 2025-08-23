import React, { useState, useContext } from 'react';
import { Trip, Contact } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import CustomSelect from './CustomSelect';

interface TripManagementScreenProps {
  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  contacts: Contact[];
  onTripSelect: (tripId: string) => void;
}

const TripManagementScreen: React.FC<TripManagementScreenProps> = ({ trips, setTrips, contacts, onTripSelect }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  const { contactGroups } = useContext(SettingsContext);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTripName.trim() && selectedContactIds.length > 0) {
      const participants = selectedContactIds.map(id => {
        const contact = contacts.find(c => c.id === id);
        return { contactId: id, name: contact?.name || 'Unknown' };
      });

      const newTrip: Trip = {
        id: self.crypto.randomUUID(),
        name: newTripName.trim(),
        participants,
        date: new Date().toISOString(),
      };
      setTrips(prev => [newTrip, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setNewTripName('');
      setSelectedContactIds([]);
      setShowAddForm(false);
    }
  };
  
  const contactOptions = contacts.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0">
        <h2 className="text-2xl font-bold text-primary text-center">Trip Management ✈️</h2>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {trips.map(trip => (
          <div key={trip.id} onClick={() => onTripSelect(trip.id)} className="p-4 bg-subtle rounded-lg cursor-pointer transition-all duration-200 hover-bg-stronger hover:scale-[1.02]">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-primary">{trip.name}</h3>
                    <p className="text-xs text-secondary">{new Date(trip.date).toLocaleDateString()}</p>
                </div>
                 <div className="flex -space-x-2 overflow-hidden">
                    {trip.participants.slice(0, 4).map(p => (
                        <div key={p.contactId} className="inline-block h-8 w-8 rounded-full ring-2 ring-[var(--color-bg-subtle)] bg-violet-500 flex items-center justify-center text-xs font-bold text-white">
                            {p.name.charAt(0)}
                        </div>
                    ))}
                    {trip.participants.length > 4 && 
                         <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[var(--color-bg-subtle)] bg-slate-500 flex items-center justify-center text-xs font-bold text-white">
                           +{trip.participants.length - 4}
                        </div>
                    }
                </div>
            </div>
          </div>
        ))}
        {trips.length === 0 && <p className="text-center text-secondary py-8">No trips yet. Create one to start managing shared expenses!</p>}
      </div>

      <div className="flex-shrink-0 p-6 border-t border-divider bg-subtle">
        {showAddForm ? (
          <form onSubmit={handleAddTrip} className="space-y-3 animate-fadeInUp">
            <h3 className="font-semibold text-primary">Create New Trip</h3>
            <input type="text" placeholder="Trip Name (e.g., Goa 2024)" value={newTripName} onChange={e => setNewTripName(e.target.value)} className="w-full input-base p-2 rounded-md" required />
            <div>
              <p className="text-sm text-secondary mb-1">Select Participants</p>
              <div className="max-h-32 overflow-y-auto bg-subtle border border-divider rounded-md p-2 space-y-1">
                 {contacts.map(contact => (
                    <label key={contact.id} className="flex items-center w-full text-left px-2 py-1.5 text-primary hover-bg-stronger text-sm cursor-pointer rounded-md">
                        <input 
                            type="checkbox" 
                            checked={selectedContactIds.includes(contact.id)}
                            onChange={() => {
                                setSelectedContactIds(prev => prev.includes(contact.id) ? prev.filter(id => id !== contact.id) : [...prev, contact.id])
                            }}
                            className="mr-2 h-4 w-4 rounded focus:ring-emerald-500"
                            style={{ backgroundColor: 'var(--color-bg-input)', borderColor: 'var(--color-border-input)', color: 'var(--color-accent-emerald)'}}
                        />
                        {contact.name}
                    </label>
                 ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="button-secondary px-4 py-2">Cancel</button>
              <button type="submit" className="button-primary px-4 py-2">Create Trip</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowAddForm(true)} className="button-primary w-full py-2 font-semibold">
            + Create New Trip
          </button>
        )}
      </div>
    </div>
  );
};

export default TripManagementScreen;