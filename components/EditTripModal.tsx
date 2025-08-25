import React, { useState, useContext, useMemo } from 'react';
import { Trip, Contact, TripParticipant, ContactGroup } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';
import { USER_SELF_ID } from '../constants';
import CustomSelect from './CustomSelect';
import { currencies } from '../utils/currency';
import CustomCheckbox from './CustomCheckbox';

interface EditTripModalProps {
  trip?: Trip;
  onSave: (trip: Omit<Trip, 'id' | 'date'>, id?: string) => void;
  onClose: () => void;
  onSaveContact: (contact: Omit<Contact, 'id'>, id?: string) => Contact;
  onDeleteContact: (id: string) => void;
  onOpenEditContact: (contact: Contact) => void;
  onSaveContactGroup: (group: Omit<ContactGroup, 'id'>) => ContactGroup;
}

const EditTripModal: React.FC<EditTripModalProps> = ({
  trip,
  onSave,
  onClose,
  onSaveContact,
  onDeleteContact,
  onOpenEditContact,
  onSaveContactGroup
}) => {
  const { settings, contacts, contactGroups } = useContext(SettingsContext);
  const isCreating = !trip;

  const [name, setName] = useState(trip?.name || '');
  const [currency, setCurrency] = useState(trip?.currency || settings.currency);
  const [showParticipantPicker, setShowParticipantPicker] = useState(false);

  const initialParticipants = useMemo(() => {
    const userParticipant = { contactId: USER_SELF_ID, name: 'You' };
    if (trip) {
      const validParticipants = (trip.participants || []).filter(Boolean);
      return validParticipants.some(p => p.contactId === USER_SELF_ID)
        ? validParticipants
        : [userParticipant, ...validParticipants];
    }
    return [userParticipant];
  }, [trip]);

  const [participants, setParticipants] = useState<TripParticipant[]>(initialParticipants);
  const [tempSelectedContacts, setTempSelectedContacts] = useState<Set<string>>(new Set(initialParticipants.map(p => p.contactId)));
  
  const [newGroupName, setNewGroupName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactGroupId, setNewContactGroupId] = useState(contactGroups[0]?.id || '');


  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && participants.length > 0) {
      onSave({ name: name.trim(), participants, currency }, trip?.id);
    }
  };
  
  const handleAddParticipants = () => {
      const newParticipants: TripParticipant[] = [];
      // Ensure 'You' is always first if selected
      if (tempSelectedContacts.has(USER_SELF_ID)) {
          newParticipants.push({ contactId: USER_SELF_ID, name: 'You' });
      }
      contacts.forEach(contact => {
          if (tempSelectedContacts.has(contact.id)) {
              newParticipants.push({ contactId: contact.id, name: contact.name });
          }
      });

      setParticipants(newParticipants);
      setShowParticipantPicker(false);
  }
  
  const handleContactToggle = (contactId: string, isChecked: boolean) => {
      setTempSelectedContacts(prev => {
          const newSet = new Set(prev);
          if (isChecked) newSet.add(contactId);
          else newSet.delete(contactId);
          return newSet;
      });
  }

  const handleGroupToggle = (group: ContactGroup, isChecked: boolean) => {
      const memberIds = contacts.filter(c => c.groupId === group.id).map(c => c.id);
      setTempSelectedContacts(prev => {
          const newSet = new Set(prev);
          if (isChecked) {
              memberIds.forEach(id => newSet.add(id));
          } else {
              memberIds.forEach(id => newSet.delete(id));
          }
          return newSet;
      });
  }
  
  const handleAddNewGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      onSaveContactGroup({ name: newGroupName.trim() });
      setNewGroupName('');
    }
  };
  
  const handleSaveNewContact = (e: React.FormEvent) => {
      e.preventDefault();
      if (newContactName.trim() && newContactGroupId) {
          const newContact = onSaveContact({ name: newContactName.trim(), groupId: newContactGroupId });
          setTempSelectedContacts(prev => new Set(prev).add(newContact.id));
          setNewContactName('');
      }
  };

  const handleRemoveParticipant = (contactIdToRemove: string) => {
    setParticipants(prev => prev.filter(p => p.contactId !== contactIdToRemove));
    setTempSelectedContacts(prev => {
        const newSet = new Set(prev);
        newSet.delete(contactIdToRemove);
        return newSet;
    });
  };


  const currencyOptions = currencies.map(c => ({ value: c.code, label: `${c.code} - ${c.name}`}));
  const contactsByGroup = contactGroups.map(group => ({
      ...group,
      members: contacts.filter(c => c.groupId === group.id)
  }));
  const isGroupSelected = (group: ContactGroup) => contacts.filter(c => c.groupId === group.id).every(m => tempSelectedContacts.has(m.id));

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <ModalHeader title={isCreating ? 'Create New Trip' : 'Edit Trip'} onClose={onClose} />
        <form onSubmit={handleSave} className="p-6 space-y-4 flex-grow overflow-y-auto">
          <div>
            <label className="text-sm text-secondary mb-1 block">Trip Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full input-base p-2 rounded-md" required autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-secondary mb-1 block">Currency</label>
            <CustomSelect options={currencyOptions} value={currency} onChange={setCurrency} />
          </div>

          <div>
            <p className="text-sm text-secondary mb-1">
              Participants ({participants.length})
            </p>
            <div className="p-2 bg-subtle rounded-md border border-divider min-h-[4rem]">
                <div className="flex flex-wrap gap-2">
                    {participants.map(p => (
                        <span key={p.contactId} className="flex items-center gap-1 pl-2 pr-1 py-1 bg-violet-500/30 text-violet-200 text-sm rounded-full">
                            {p.name}
                            {p.contactId !== USER_SELF_ID && (
                                <button type="button" onClick={() => handleRemoveParticipant(p.contactId)} className="text-violet-200 hover:text-white bg-black/10 rounded-full w-4 h-4 flex items-center justify-center text-xs">&times;</button>
                            )}
                        </span>
                    ))}
                </div>
            </div>
             <button type="button" onClick={() => setShowParticipantPicker(!showParticipantPicker)} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400">
                {showParticipantPicker ? 'Close' : 'Edit'} Participants
            </button>
          </div>

          {showParticipantPicker && (
            <div className="p-3 bg-subtle rounded-lg border border-divider animate-fadeInUp">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    <div className="p-1"><CustomCheckbox id="user_self_check" label="You" checked={tempSelectedContacts.has(USER_SELF_ID)} onChange={(c) => handleContactToggle(USER_SELF_ID, c)} /></div>
                    {contactsByGroup.map(group => (
                        <div key={group.id}>
                            <div className="p-1"><CustomCheckbox id={`group-${group.id}`} label={group.name} checked={isGroupSelected(group)} onChange={(c) => handleGroupToggle(group, c)} /></div>
                            <div className="pl-6 space-y-1">{group.members.map(contact => (<CustomCheckbox key={contact.id} id={`contact-${contact.id}`} label={contact.name} checked={tempSelectedContacts.has(contact.id)} onChange={(c) => handleContactToggle(contact.id, c)} />))}</div>
                        </div>
                    ))}
                </div>
                 <div className="mt-3 pt-3 border-t border-divider space-y-3">
                    {/* Always visible forms for a faster workflow */}
                    <form onSubmit={handleSaveNewContact} className="space-y-2">
                        <input type="text" value={newContactName} onChange={e => setNewContactName(e.target.value)} placeholder="New Contact Name..." className="input-base w-full p-1.5 rounded-md text-sm" required />
                        <div className="flex gap-2">
                            <div className="flex-grow"><CustomSelect options={contactGroups.map(g=>({value: g.id, label: g.name}))} value={newContactGroupId} onChange={setNewContactGroupId} /></div>
                            <button type="submit" className="button-primary text-xs px-3 py-1">Add Contact</button>
                        </div>
                    </form>
                    <form onSubmit={handleAddNewGroup} className="flex gap-2 items-center">
                        <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="New Group Name..." className="input-base w-full p-1.5 rounded-md text-sm" required/>
                        <button type="submit" className="button-primary text-xs px-3 py-1">Add Group</button>
                    </form>
                 </div>
                 <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setShowParticipantPicker(false)} className="button-secondary text-xs px-3 py-1">Cancel</button>
                    <button type="button" onClick={handleAddParticipants} className="button-primary text-xs px-3 py-1">Confirm Participants</button>
                 </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="button-secondary px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="button-primary px-4 py-2">
              Save Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTripModal;
