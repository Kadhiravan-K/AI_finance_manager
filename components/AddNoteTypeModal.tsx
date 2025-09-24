
import React from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface AddNoteTypeModalProps {
  onClose: () => void;
  onSelect: (type: 'note' | 'checklist', tripId?: string) => void;
  tripId?: string; // Optional tripId to associate the new note with
}

const AddNoteTypeModal: React.FC<AddNoteTypeModalProps> = ({ onClose, onSelect, tripId }) => {
  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[55] p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-sm p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Create New" onClose={onClose} />
        <div className="p-6 space-y-3">
          <p className="text-center text-sm text-secondary">What would you like to create?</p>
          <button onClick={() => onSelect('note', tripId)} className="w-full text-left p-4 bg-subtle rounded-lg flex items-center gap-4 hover-bg-stronger transition-colors">
            <span className="text-3xl">📝</span>
            <div>
              <h3 className="font-bold text-primary">Text Note</h3>
              <p className="text-sm text-secondary">Jot down thoughts and ideas.</p>
            </div>
          </button>
          <button onClick={() => onSelect('checklist', tripId)} className="w-full text-left p-4 bg-subtle rounded-lg flex items-center gap-4 hover-bg-stronger transition-colors">
            <span className="text-3xl">✅</span>
            <div>
              <h3 className="font-bold text-primary">Checklist</h3>
              <p className="text-sm text-secondary">Track items for shopping or tasks.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AddNoteTypeModal;
