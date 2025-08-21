import React, { useState, useContext } from 'react';
import { Sender, SenderType } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';

interface SenderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SenderManagerModal: React.FC<SenderManagerModalProps> = ({ isOpen, onClose }) => {
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

  const handleDelete = (id: string) => {
    setSenders(prev => prev.filter(s => s.id !== id));
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

  if (!isOpen) return null;

  return (
    <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-slate-700/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
      <ModalHeader title="Manage Senders" onClose={onClose} icon="🛡️" />
      
      <div className="flex-grow overflow-y-auto px-6 pb-6 space-y-2">
        {senders.map(sender => (
          <div key={sender.id} className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">{sender.name}</p>
              <p className="text-xs text-slate-400">ID: {sender.identifier} - 
                <span className={sender.type === 'trusted' ? 'text-emerald-400' : 'text-rose-400'}> {sender.type.toUpperCase()}</span>
              </p>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(sender)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-md">Edit</button>
              <button onClick={() => handleDelete(sender.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-md">Delete</button>
            </div>
          </div>
        ))}
         {senders.length === 0 && <p className="text-center text-slate-400 py-4">No senders saved yet.</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex-shrink-0 p-6 border-t border-slate-700 space-y-3 bg-slate-800/50 rounded-b-xl">
        <h3 className="font-semibold">{editingSender ? 'Edit Sender' : 'Add New Sender'}</h3>
        <input type="text" placeholder="Name (e.g., HDFC Bank)" value={formState.name} onChange={e => setFormState(p => ({...p, name: e.target.value}))} className="w-full bg-slate-700/80 p-2 rounded-md" required />
        <input type="text" placeholder="Identifier (e.g., HDFCBK)" value={formState.identifier} onChange={e => setFormState(p => ({...p, identifier: e.target.value}))} className="w-full bg-slate-700/80 p-2 rounded-md" required />
        <select value={formState.type} onChange={e => setFormState(p => ({...p, type: e.target.value as SenderType}))} className="w-full bg-slate-700/80 p-2 rounded-md" required>
            <option value="trusted">Trusted</option>
            <option value="blocked">Blocked</option>
        </select>
        <div className="flex justify-end space-x-2">
          {editingSender && <button type="button" onClick={handleCancel} className="px-4 py-2 rounded-lg bg-slate-600">Cancel</button>}
          <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600">{editingSender ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
};

export default SenderManagerModal;