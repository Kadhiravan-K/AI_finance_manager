import React, { useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Trip, Contact, TripParticipant, ContactGroup } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';
import CustomCheckbox from './CustomCheckbox';
import CustomSelect from './CustomSelect';

const modalRoot = document.getElementById('modal-root')!;

interface EditTripModalProps {
  trip?: Trip;
  onSave: (trip: Omit<Trip, 'id' | 'date'>, id?: string) => void;
  onClose: () => void;
  onSaveContact: (contact: Omit<Contact, 'id'>, id?: string) => void | Contact;
  onDeleteContact: (contactId: string) => void;
  onOpenEditContact: (contact: Contact) => void;
}

const EditTripModal: React.FC<EditTripModalProps> = ({ trip, onSave, onClose, onSaveContact, onDeleteContact, onOpenEditContact }) => {
  const { contacts, contactGroups } = useContext(SettingsContext);
  const isCreating = !trip;
  
  const [name, setName] = useState(trip?.name || '');
  const [participants, setParticipants] = useState<TripParticipant[]>(trip?.participants || []);
  const [showContactPicker, setShowContactPicker] = useState(isCreating);
  
  const [newContactName, setNewContactName] = useState('');
  const [newContactGroup, setNewContactGroup] = useState(contactGroups[0]?.id || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && participants.length > 0) {
      onSave({ name: name.trim(), participants }, trip?.id);
    }
  };

  const handleParticipantToggle = (contact: Contact, isChecked: boolean) => {
    if (isChecked) {
      if (!participants.some(p => p.contactId === contact.id)) {
        setParticipants(prev => [...prev, { contactId: contact.id, name: contact.name }]);
      }
    } else {
      setParticipants(prev => prev.filter(p => p.contactId !== contact.id));
    }
  };
  
  const handleAddNewContact = (e: React.FormEvent) => {
      e.preventDefault();
      if(newContactName.trim() && newContactGroup) {
          const newContact = onSaveContact({name: newContactName.trim(), groupId: newContactGroup}) as Contact;
          if (newContact) {
            handleParticipantToggle(newContact, true);
          }
          setNewContactName('');
      }
  }

  const groupOptions = contactGroups.map(g => ({ value: g.id, label: g.name }));

  return (
    <>
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={isCreating ? "Create New Trip" : "Edit Trip"} onClose={onClose} />
        <form onSubmit={handleSave} className="p-6 space-y-4 flex-grow overflow-y-auto">
          <div>
            <label className="text-sm text-secondary mb-1 block">Trip Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full input-base p-2 rounded-md" required autoFocus />
          </div>
          <div>
            <p className="text-sm text-secondary mb-1">Participants ({participants.length})</p>
            <div className="space-y-2 p-2 bg-subtle rounded-md border border-divider max-h-48 overflow-y-auto">
              {participants.map(p => (
                <div key={p.contactId} className="flex justify-between items-center text-sm p-1">
                  <span className="text-primary">{p.name}</span>
                  <button type="button" onClick={() => handleParticipantToggle(contacts.find(c => c.id === p.contactId)!, false)} className="text-rose-400 text-xl leading-none">&times;</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <button type="button" onClick={() => setShowContactPicker(!showContactPicker)} className="w-full text-sky-400 text-sm p-2 bg-subtle rounded-md border border-divider hover-bg-stronger">
              {showContactPicker ? 'Hide' : 'Add/Remove Participants'}
            </button>
            {showContactPicker && (
              <div className="mt-2 p-2 bg-subtle rounded-md border border-divider max-h-60 flex flex-col animate-fadeInUp">
                <div className="overflow-y-auto">
                    {contactGroups.map(group => (
                    <div key={group.id}>
                        <h4 className="text-xs font-bold text-secondary p-2 bg-subtle sticky top-0">{group.name}</h4>
                        {contacts.filter(c => c.groupId === group.id).map(contact => (
                        <div key={contact.id} className="px-2 py-1 flex justify-between items-center group">
                            <CustomCheckbox id={`edit-trip-contact-${contact.id}`} label={contact.name} checked={participants.some(p => p.contactId === contact.id)} onChange={isChecked => handleParticipantToggle(contact, isChecked)} />
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                                <button type="button" onClick={() => onOpenEditContact(contact)} className="text-xs text-secondary hover:text-primary">Edit</button>
                                <button type="button" onClick={() => onDeleteContact(contact.id)} className="text-xs text-rose-400 hover:text-rose-300">Delete</button>
                            </div>
                        </div>
                        ))}
                    </div>
                    ))}
                </div>
                <form onSubmit={handleAddNewContact} className="mt-2 pt-2 border-t border-divider flex items-center gap-2">
                    <input type="text" value={newContactName} onChange={e => setNewContactName(e.target.value)} placeholder="New Contact Name" className="flex-grow input-base p-2 rounded-md" />
                     <div className="w-32"><CustomSelect options={groupOptions} value={newContactGroup} onChange={setNewContactGroup} /></div>
                    <button type="submit" className="button-primary text-sm px-3 py-1.5">+</button>
                </form>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2">Save Trip</button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default EditTripModal;