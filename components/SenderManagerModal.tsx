import React, { useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Sender, SenderType } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';

const modalRoot = document.getElementById('modal-root')!;

interface SenderManagerModalProps {
  onClose: () => void;
  onDelete: (id: string) => void;
}

const SenderManagerModal: React.FC<SenderManagerModalProps> = ({ onClose, onDelete }) => {
  const { senders, setSenders } = useContext(SettingsContext);
  const [editingSender, setEditingSender] = useState<Sender | null>(null);
  const [formState, setFormState] = useState<Omit<Sender, 'id'>>({ identifier: '', name: '', type: 'trusted' });

  const handleEdit = (sender: Sender) => {
    setEditingSender(sender);
    setFormState({ identifier: sender.identifier, name: sender.name, type: sender.type });
  };

  const handleCancel = () => {
    setEditingSender(null);
    setFormState({ identifier: '', name: '', type: 'trusted' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSender) {
      setSenders(prev => prev.map(s => s.id === editingSender.id ? { ...formState, id: s.id } : s));
    } else {
      setSenders(prev => [...prev, { ...formState, id: self.crypto.randomUUID() }]);
    }
    handleCancel();
  };
  
  const senderTypeOptions = [
      {value: 'trusted', label: 'Trusted'},
      {value: 'blocked', label: 'Blocked'},
  ];

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Manage Senders" onClose={onClose} icon="🛡️" />
        
        <div className="flex-grow overflow-y-auto p-6 space-y-2">
            {senders.map(sender => (
            <div key={sender.id} className="p-3 bg-subtle rounded-lg flex items-center justify-between">
                <div>
                <p className="font-semibold text-primary">{sender.name}</p>
                <p className="text-xs text-secondary">ID: {sender.identifier} - 
                    <span className={sender.type === 'trusted' ? 'text-[var(--color-accent-emerald)]' : 'text-[var(--color-accent-rose)]'}> {sender.type.toUpperCase()}</span>
                </p>
                </div>
                <div className="space-x-2">
                <button onClick={() => handleEdit(sender)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                <button onClick={() => onDelete(sender.id)} className="text-xs px-2 py-1 text-rose-400 hover:bg-rose-500/20 rounded-full transition-colors">Delete</button>
                </div>
            </div>
            ))}
            {senders.length === 0 && <p className="text-center text-secondary py-4">No senders saved yet.</p>}
        </div>

        <form onSubmit={handleSubmit} className="flex-shrink-0 p-6 border-t border-divider space-y-3 bg-subtle rounded-b-xl">
            <h3 className="font-semibold text-primary">{editingSender ? 'Edit Sender' : 'Add New Sender'}</h3>
            <input type="text" placeholder="Name (e.g., HDFC Bank)" value={formState.name} onChange={e => setFormState(p => ({...p, name: e.target.value}))} className="w-full input-base p-2 rounded-full" required />
            <input type="text" placeholder="Identifier (e.g., HDFCBK)" value={formState.identifier} onChange={e => setFormState(p => ({...p, identifier: e.target.value}))} className="w-full input-base p-2 rounded-full" required />
            <CustomSelect value={formState.type} onChange={v => setFormState(p => ({...p, type: v as SenderType}))} options={senderTypeOptions} />
            <div className="flex justify-end space-x-2">
            {editingSender && <button type="button" onClick={handleCancel} className="button-secondary px-4 py-2">Cancel</button>}
            <button type="submit" className="button-primary px-4 py-2">{editingSender ? 'Save' : 'Add'}</button>
            </div>
        </form>
        </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default SenderManagerModal;