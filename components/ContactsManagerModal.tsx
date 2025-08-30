import React, { useState, useContext } from 'react';
import { Contact, ContactGroup } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';

interface ContactsManagerModalProps {
  onClose: () => void;
  onAddGroup: () => void;
  onEditGroup: (group: ContactGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddContact: (group: ContactGroup) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
}

const ContactsManagerModal: React.FC<ContactsManagerModalProps> = ({
  onClose,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onAddContact,
  onEditContact,
  onDeleteContact,
}) => {
  const { contacts, contactGroups } = useContext(SettingsContext);
  
  const [view, setView] = useState<'groups' | 'contacts'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);

  const handleGroupClick = (group: ContactGroup) => {
    setSelectedGroup(group);
    setView('contacts');
  };

  const handleBack = () => {
    setSelectedGroup(null);
    setView('groups');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider opacity-0 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader 
            title={view === 'groups' ? "Manage Contacts" : `Contacts in "${selectedGroup?.name}"`}
            onClose={onClose} 
            onBack={view === 'contacts' ? handleBack : undefined}
            icon="👥" 
        />
        
        {/* Main Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-2">
            {view === 'groups' && (
                contactGroups.map(group => (
                    <div key={group.id} className="flex items-center justify-between p-2 bg-subtle rounded-lg group transition-all duration-200 hover-bg-stronger hover:scale-[1.02]">
                        <div onClick={() => handleGroupClick(group)} className="flex-grow flex items-center gap-3 cursor-pointer">
                            <span className="text-xl w-6 text-center">{group.icon || '📁'}</span>
                            <span className="font-medium text-primary">{group.name}</span>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                             <button onClick={() => onEditGroup(group)} className="text-xs text-secondary hover:text-primary px-2 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100">Edit</button>
                             <button onClick={() => onDeleteGroup(group.id)} className="text-xs text-[var(--color-accent-rose)] hover:brightness-125 px-2 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100">Delete</button>
                             <div onClick={() => handleGroupClick(group)} className="p-1 cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></div>
                        </div>
                    </div>
                ))
            )}
             {view === 'contacts' && selectedGroup && (
                 contacts.filter(c => c.groupId === selectedGroup.id).map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-2 bg-subtle rounded-lg group">
                        <span className="font-medium text-primary">{contact.name}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                            <button onClick={() => onEditContact(contact)} className="text-xs text-secondary hover:text-primary px-2">Edit</button>
                            <button onClick={() => onDeleteContact(contact.id)} className="text-xs text-[var(--color-accent-rose)] hover:brightness-125 px-2">Delete</button>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Action Button Section */}
        <div className="flex-shrink-0 p-4 border-t border-divider bg-subtle rounded-b-xl">
           {view === 'groups' && (
               <button onClick={onAddGroup} className="button-primary w-full py-2">
                   + Add New Group
               </button>
           )}
            {view === 'contacts' && selectedGroup && (
               <button onClick={() => onAddContact(selectedGroup)} className="button-primary w-full py-2">
                   + Add New Contact
               </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default ContactsManagerModal;
