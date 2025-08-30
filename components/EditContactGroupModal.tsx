import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { ContactGroup } from '../types';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface EditContactGroupModalProps {
  group?: ContactGroup;
  onSave: (group: Omit<ContactGroup, 'id'>, id?: string) => void;
  onClose: () => void;
}

const EditContactGroupModal: React.FC<EditContactGroupModalProps> = ({ group, onSave, onClose }) => {
  const isCreating = !group;
  const [name, setName] = useState(group?.name || '');
  const [icon, setIcon] = useState(group?.icon || '📁');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name: name.trim(), icon: icon.trim() || '📁' }, group?.id);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[600] p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-sm p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={isCreating ? "Add New Group" : "Edit Group"} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              placeholder="📁" 
              value={icon} 
              onChange={e => setIcon(e.target.value)} 
              className="w-16 input-base p-2 rounded-md text-center" 
              maxLength={2} 
            />
            <input 
              type="text" 
              placeholder="Group Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="flex-grow input-base p-2 rounded-md" 
              required 
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2">Save</button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default EditContactGroupModal;
