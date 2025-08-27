import React, { useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Contact, ContactGroup } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';

const modalRoot = document.getElementById('modal-root')!;

interface EditContactModalProps {
  contact?: Contact;
  onSave: (contact: Omit<Contact, 'id'>, id?: string) => void;
  onClose: () => void;
}

const EditContactModal: React.FC<EditContactModalProps> = ({ contact, onSave, onClose }) => {
  const { contactGroups } = useContext(SettingsContext);
  const isCreating = !contact;
  
  const [name, setName] = useState(contact?.name || '');
  const [groupId, setGroupId] = useState(contact?.groupId || contactGroups[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && groupId) {
      onSave({ name: name.trim(), groupId }, contact?.id);
      onClose();
    }
  };
  
  const groupOptions = contactGroups.map(g => ({ value: g.id, label: g.name }));

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[600] p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-sm p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={isCreating ? "Add New Contact" : "Edit Contact"} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm text-secondary mb-1 block">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full input-base p-2 rounded-md" required autoFocus />
          </div>
          <div>
            <label className="text-sm text-secondary mb-1 block">Group</label>
            <CustomSelect options={groupOptions} value={groupId} onChange={setGroupId} />
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

export default EditContactModal;