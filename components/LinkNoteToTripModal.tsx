
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Note, Trip } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';

const modalRoot = document.getElementById('modal-root')!;

interface LinkNoteToTripModalProps {
  note: Note;
  trips: Trip[];
  onSave: (note: Note) => void;
  onClose: () => void;
}

const LinkNoteToTripModal: React.FC<LinkNoteToTripModalProps> = ({ note, trips, onSave, onClose }) => {
  const [selectedTripId, setSelectedTripId] = useState(note.tripId || '');

  const handleSave = () => {
    onSave({ ...note, tripId: selectedTripId || undefined });
    onClose();
  };

  const tripOptions = [
    { value: '', label: 'None (General Note)' },
    ...trips.map(trip => ({ value: trip.id, label: trip.name }))
  ];

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-sm p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Link to Trip" onClose={onClose} />
        <div className="p-6 space-y-4">
          <p className="text-sm text-secondary">Associate this note with a trip to keep your planning organized.</p>
          <CustomSelect 
            options={tripOptions}
            value={selectedTripId}
            onChange={setSelectedTripId}
          />
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button type="button" onClick={handleSave} className="button-primary px-4 py-2">Save Link</button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default LinkNoteToTripModal;