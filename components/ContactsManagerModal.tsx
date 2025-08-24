import React, { useState, useContext } from 'react';
import { Contact, ContactGroup } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';

interface ContactsManagerModalProps {
  onClose: () => void;
  onDeleteGroup: (groupId: string) => void;
  onDeleteContact: (contactId: string) => void;
}

const inputStyle = "w-full input-base rounded-lg py-2 px-3";

const ContactsManagerModal: React.FC<ContactsManagerModalProps> = ({ onClose, onDeleteGroup, onDeleteContact }) => {
  const { contacts, setContacts, contactGroups, setContactGroups } = useContext(SettingsContext);
  
  const [view, setView] = useState<'groups' | 'contacts'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const handleGroupClick = (group: ContactGroup) => {
    setSelectedGroup(group);
    setView('contacts');
  };

  const handleBack = () => {
    setSelectedGroup(null);
    setView('groups');
    setNewContactName('');
    setEditingContact(null);
  };
  
  // Group CRUD
  const handleAddOrUpdateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (editingGroup ? editingGroup.name : newGroupName).trim();
    if (name) {
        if (editingGroup) {
            setContactGroups(prev => prev.map(g => g.id === editingGroup.id ? {...g, name} : g));
            setEditingGroup(null);
        } else {
            setContactGroups(prev => [...prev, { id: self.crypto.randomUUID(), name }]);
            setNewGroupName('');
        }
    }
  };
  
  // Contact CRUD
  const handleAddOrUpdateContact = (e: React.FormEvent) => {
      e.preventDefault();
      const name = (editingContact ? editingContact.name : newContactName).trim();
      if (name && selectedGroup) {
          if (editingContact) {
              setContacts(prev => prev.map(c => c.id === editingContact.id ? {...c, name} : c));
              setEditingContact(null);
          } else {
              setContacts(prev => [...prev, { id: self.crypto.randomUUID(), name, groupId: selectedGroup.id }]);
              setNewContactName('');
          }
      }
  };


  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider opacity-0 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader 
            title={view === 'groups' ? "Manage Contact Groups" : `Contacts in "${selectedGroup?.name}"`}
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
                            <span className="font-medium text-primary">{group.name}</span>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                             <button onClick={() => setEditingGroup(group)} className="text-xs text-secondary hover:text-primary px-2 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100">Edit</button>
                             <button onClick={() => onDeleteGroup(group.id)} className="text-xs text-[var(--color-accent-rose)] hover:brightness-125 px-2 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100">Delete</button>
                             <div onClick={() => handleGroupClick(group)} className="p-1 cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></div>
                        </div>
                    </div>
                ))
            )}
             {view === 'contacts' && selectedGroup && (
                 contacts.filter(c => c.groupId === selectedGroup.id).map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-2 bg-subtle rounded-lg group">
                        <span className="font-medium text-primary">{contact.name}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                            <button onClick={() => setEditingContact(contact)} className="text-xs text-secondary hover:text-primary px-2">Edit</button>
                            <button onClick={() => onDeleteContact(contact.id)} className="text-xs text-[var(--color-accent-rose)] hover:brightness-125 px-2">Delete</button>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Form Section */}
        <div className="flex-shrink-0 p-6 border-t border-divider bg-subtle rounded-b-xl">
           {view === 'groups' && (
               <form onSubmit={handleAddOrUpdateGroup} className="space-y-3">
                   <h3 className="font-semibold text-primary">{editingGroup ? "Edit Group" : "Add New Group"}</h3>
                   <div className="flex gap-2">
                       <input type="text" placeholder="Group Name" value={editingGroup ? editingGroup.name : newGroupName} onChange={e => editingGroup ? setEditingGroup({...editingGroup, name: e.target.value}) : setNewGroupName(e.target.value)} className={inputStyle} required />
                       <button type="submit" className="button-primary px-4 py-2">{editingGroup ? "Save" : "Add"}</button>
                       {editingGroup && <button type="button" onClick={() => setEditingGroup(null)} className="button-secondary px-4 py-2">Cancel</button>}
                   </div>
               </form>
           )}
            {view === 'contacts' && (
               <form onSubmit={handleAddOrUpdateContact} className="space-y-3">
                   <h3 className="font-semibold text-primary">{editingContact ? "Edit Contact" : "Add New Contact"}</h3>
                   <div className="flex gap-2">
                       <input type="text" placeholder="Contact Name" value={editingContact ? editingContact.name : newContactName} onChange={e => editingContact ? setEditingContact({...editingContact, name: e.target.value}) : setNewContactName(e.target.value)} className={inputStyle} required />
                       <button type="submit" className="button-primary px-4 py-2">{editingContact ? "Save" : "Add"}</button>
                       {editingContact && <button type="button" onClick={() => setEditingContact(null)} className="button-secondary px-4 py-2">Cancel</button>}
                   </div>
               </form>
           )}
        </div>
      </div>
    </div>
  );
};

export default ContactsManagerModal;