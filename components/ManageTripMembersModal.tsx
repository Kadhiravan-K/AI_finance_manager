import React, { useState, useContext, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Trip, TripParticipant, Contact, ContactGroup, USER_SELF_ID } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';
import CustomCheckbox from './CustomCheckbox';
import CustomSelect from './CustomSelect';

const modalRoot = document.getElementById('modal-root')!;

interface ManageTripMembersModalProps {
    onClose: () => void;
    trip: Trip;
    onUpdateTrip: (trip: Trip) => void;
}

const ManageTripMembersModal: React.FC<ManageTripMembersModalProps> = ({ onClose, trip, onUpdateTrip }) => {
    const { contacts, contactGroups } = useContext(SettingsContext);
    const [participants, setParticipants] = useState<TripParticipant[]>(trip.participants);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    
    const [tempSelected, setTempSelected] = useState(new Set(trip.participants.map(p => p.contactId)));

    const handleSave = () => {
        onUpdateTrip({ ...trip, participants });
        onClose();
    };

    const handleRoleChange = (contactId: string, role: 'admin' | 'member') => {
        setParticipants(prev => prev.map(p => p.contactId === contactId ? { ...p, role } : p));
    };

    const handleRemove = (contactId: string) => {
        const adminCount = participants.filter(p => p.role === 'admin').length;
        const toRemove = participants.find(p => p.contactId === contactId);
        if (toRemove?.role === 'admin' && adminCount <= 1) {
            alert("You cannot remove the last admin.");
            return;
        }
        setParticipants(prev => prev.filter(p => p.contactId !== contactId));
        setTempSelected(prev => {
            const newSet = new Set(prev);
            newSet.delete(contactId);
            return newSet;
        });
    };

    const handleConfirmSelection = () => {
        const newParticipants: TripParticipant[] = [];
        tempSelected.forEach(contactId => {
            const existing = participants.find(p => p.contactId === contactId);
            if (existing) {
                newParticipants.push(existing);
            } else {
                const contact = contacts.find(c => c.id === contactId);
                if(contact) {
                    newParticipants.push({ contactId, name: contact.name, role: 'member' });
                }
            }
        });
        setParticipants(newParticipants);
        setIsPickerOpen(false);
    };

    const contactsByGroup = contactGroups.map(group => ({
      ...group,
      members: contacts.filter(c => c.groupId === group.id)
    }));

    const roleOptions = [{ value: 'admin', label: 'Admin' }, { value: 'member', label: 'Member' }];

    const modalContent = (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title="Manage Trip Members" onClose={onClose} />
                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                    {participants.map(p => (
                        <div key={p.contactId} className="p-2 bg-subtle rounded-lg flex items-center justify-between">
                            <span className="font-semibold text-primary">{p.name}</span>
                            <div className="flex items-center gap-2">
                                <div className="w-28">
                                    <CustomSelect 
                                        options={roleOptions} 
                                        value={p.role} 
                                        onChange={val => handleRoleChange(p.contactId, val as 'admin' | 'member')}
                                        disabled={p.contactId === USER_SELF_ID}
                                    />
                                </div>
                                <button onClick={() => handleRemove(p.contactId)} disabled={p.contactId === USER_SELF_ID} className="text-rose-400 p-2 disabled:opacity-50">&times;</button>
                            </div>
                        </div>
                    ))}
                    <div className="relative mt-2">
                        <button type="button" onClick={() => setIsPickerOpen(!isPickerOpen)} className="w-full text-left p-1.5 rounded-full border border-divider hover-bg-stronger text-xs text-center text-sky-400">
                            {isPickerOpen ? 'Close Picker' : '+ Add/Remove Members...'}
                        </button>
                        {isPickerOpen && (
                            <div className="absolute bottom-full mb-1 w-full z-20 glass-card rounded-lg shadow-lg max-h-48 flex flex-col p-2">
                                <div className="overflow-y-auto">
                                    {contactsByGroup.map(group => (
                                        <div key={group.id} className="mb-2">
                                            <p className="font-semibold text-xs text-secondary px-1">{group.name}</p>
                                            <div className="pl-2 space-y-1">
                                                {group.members.map(contact => (
                                                    <CustomCheckbox key={contact.id} id={`member-${contact.id}`} label={contact.name} checked={tempSelected.has(contact.id)} onChange={checked => setTempSelected(prev => { const n = new Set(prev); if(checked) n.add(contact.id); else n.delete(contact.id); return n; })}/>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={handleConfirmSelection} className="w-full text-center p-2 text-sm text-white rounded-b-lg sticky bottom-0 bg-emerald-500 mt-1">Confirm Selection</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end p-4 border-t border-divider">
                    <button onClick={handleSave} className="button-primary px-4 py-2">Save Changes</button>
                </div>
            </div>
        </div>
    );
    
    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ManageTripMembersModal;