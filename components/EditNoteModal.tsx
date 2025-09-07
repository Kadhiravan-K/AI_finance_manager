import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Transaction } from '../types';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface EditNoteModalProps {
  transaction: Transaction;
  onSave: (transaction: Transaction) => void;
  onClose: () => void;
}

const EditNoteModal: React.FC<EditNoteModalProps> = ({ transaction, onSave, onClose }) => {
    const [notes, setNotes] = useState(transaction.notes || '');

    const handleSave = () => {
        onSave({ ...transaction, notes: notes.trim() });
        onClose();
    };

    const modalContent = (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
            <ModalHeader title="Edit Note" onClose={onClose} icon="📝" />
            <div className="p-6 space-y-4">
                <p className="text-sm text-secondary">Adding a note for: <strong className="text-primary">{transaction.description}</strong></p>
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add your note here..."
                    rows={5}
                    className="w-full themed-textarea"
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                    <button onClick={handleSave} className="button-primary px-4 py-2">Save Note</button>
                </div>
            </div>
        </div>
      </div>
    );

    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default EditNoteModal;