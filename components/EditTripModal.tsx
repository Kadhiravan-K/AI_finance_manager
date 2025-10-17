

import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { Trip, Contact, TripParticipant, ContactGroup, TripDayPlan, USER_SELF_ID } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { currencies } from '../utils/currency';
import CustomCheckbox from './CustomCheckbox';
import { parseTripCreationText } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface EditTripModalProps {
  trip?: Trip;
  onSave: (trip: Omit<Trip, 'id' | 'date'>, id?: string) => void;
  onClose: () => void;
  onSaveContact: (contact: Omit<Contact, 'id'>, id?: string) => Contact;
  onOpenContactsManager: () => void;
}

type AddMode = 'auto' | 'manual';

export const EditTripModal: React.FC<EditTripModalProps> = ({
  trip,
  onSave,
  onClose,
  onSaveContact,
  onOpenContactsManager
}) => {
  const { settings, contacts, contactGroups } = useContext(SettingsContext);
  const isCreating = !trip;
  
  const [addMode, setAddMode] = useState<AddMode>(isCreating ? 'auto' : 'manual');
  const [aiText, setAiText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [planResult, setPlanResult] = useState<TripDayPlan[] | undefined>(trip?.plan || undefined);
  
  const [name, setName] = useState(trip?.name || '');
  const [currency, setCurrency] = useState(trip?.currency || settings.currency);
  const [budget, setBudget] = useState(trip?.budget?.toString() || '');
  const [showParticipantPicker, setShowParticipantPicker] = useState(false);

  const initialParticipants = useMemo(() => {
    const userParticipant: TripParticipant = { contactId: USER_SELF_ID, name: 'You', role: 'admin' };
    if (trip) {
      const validParticipants = (trip.participants || [])
        .filter(Boolean)
        .map(p => ({ ...p, role: p.role || (p.contactId === USER_SELF_ID ? 'admin' : 'member') }));
      
      return validParticipants.some(p => p.contactId === USER_SELF_ID)
        ? validParticipants
        : [userParticipant, ...validParticipants];
    }
    return [userParticipant];
  }, [trip]);

  const [participants, setParticipants] = useState<TripParticipant[]>(initialParticipants);
  const [tempSelectedContacts, setTempSelectedContacts] = useState<Set<string>>(new Set(initialParticipants.map(p => p.contactId)));
  
  // State for inline editing of unmatched names
  const [editingUnmatchedName, setEditingUnmatchedName] = useState<string | null>(null);
  const [inlineContactName, setInlineContactName] = useState('');
  const [inlineContactGroupId, setInlineContactGroupId] = useState(contactGroups[0]?.id || '');

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiText(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    recognitionRef.current = recognition;
  }, []);

  const handleListen = async () => {
    if (!recognitionRef.current) {
        alert("Speech recognition is not supported by your browser.");
        return;
    }
    try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'denied') {
            alert("Microphone access is denied. Please enable it in your browser settings to use voice input.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    } catch (error) {
        console.error("Could not check microphone permission:", error);
    }
  };

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setIsParsing(true);
    setUnmatchedNames([]);
    try {
        const result = await parseTripCreationText(aiText);
        if (result) {
            setName(result.tripName);
            setPlanResult(result.plan || undefined);
            
            const lowerCaseContacts = contacts.map(c => ({...c, lowerName: c.name.toLowerCase()}));
            const newUnmatched: string[] = [];
            const newSelected = new Set(tempSelectedContacts);

            for (const participantName of result.participants) {
                const found = lowerCaseContacts.find(c => c.lowerName === participantName.toLowerCase());
                if (found) {
                    newSelected.add(found.id);
                } else {
                    newUnmatched.push(participantName);
                }
            }
            setTempSelectedContacts(newSelected);
            setUnmatchedNames(newUnmatched);
            handleAddParticipants(); // Auto-confirm matched participants
            setAddMode('manual');
            if (newUnmatched.length > 0 || result.plan) {
                setShowParticipantPicker(true);
            }
        }
    } catch (e) {
        alert("Sorry, I couldn't understand that. Please try rephrasing.");
    }
    setIsParsing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && participants.length > 0) {
      onSave({ name: name.trim(), participants, currency, plan: planResult, budget: parseFloat(budget) || undefined }, trip?.id);
      onClose();
    }
  };
  
  const handleAddParticipants = () => {
      const newParticipants: TripParticipant[] = [];
      // Ensure 'You' is always first if selected
      if (tempSelectedContacts.has(USER_SELF_ID)) {
          newParticipants.push({ contactId: USER_SELF_ID, name: 'You', role: 'admin' });
      }
      contacts.forEach(contact => {
          if (tempSelectedContacts.has(contact.id) && contact.id !== USER_SELF_ID) {
              newParticipants.push({ contactId: contact.id, name: contact.name, role: 'member' });
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

  const handleGroupToggle = (group: { members: Contact[] } & ContactGroup, isChecked: boolean) => {
      const memberIds = group.members.map(c => c.id);
      if (memberIds.length === 0) return; // Do not toggle empty groups
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
  
  const handleRemoveParticipant = (contactIdToRemove: string) => {
    setParticipants(prev => prev.filter(p => p.contactId !== contactIdToRemove));
    setTempSelectedContacts(prev => {
        const newSet = new Set(prev);
        newSet.delete(contactIdToRemove);
        return newSet;
    });
  };

  const handleStartInlineAdd = (name: string) => {
    setEditingUnmatchedName(name);
    setInlineContactName(name);
    if (contactGroups.length > 0) {
      setInlineContactGroupId(contactGroups[0].id);
    }
  };

  const handleCancelInlineAdd = () => {
    setEditingUnmatchedName(null);
    setInlineContactName('');
  };

  const handleSaveInlineContact = () => {
    if (inlineContactName.trim() && inlineContactGroupId) {
        const newContact = onSaveContact({ name: inlineContactName.trim(), groupId: inlineContactGroupId });
        setTempSelectedContacts(prev => new Set(prev).add(newContact.id));
        setUnmatchedNames(prev => prev.filter(name => name !== editingUnmatchedName));
        setEditingUnmatchedName(null);
        setInlineContactName('');
    }
  };

  const currencyOptions = currencies.map(c => ({ value: c.code, label: `${c.code} - ${c.name}`}));
  const contactsByGroup = contactGroups.map(group => ({
      ...group,
      members: contacts.filter(c => c.groupId === group.id)
  }));
  const isGroupSelected = (group: { members: Contact[] } & ContactGroup) => group.members.length > 0 && group.members.every(m => tempSelectedContacts.has(m.id));

  const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button type="button" onClick={onClick} className={`w-full py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${ active ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary' }`}>
        {children}
    </button>
  );

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
        {isCreating && (
             <div className="flex border-b border-divider flex-shrink-0">
                <TabButton active={addMode === 'auto'} onClick={() => setAddMode('auto')}>AI Planner</TabButton>
                <TabButton active={addMode === 'manual'} onClick={() => setAddMode('manual')}>Manual</TabButton>
             </div>
        )}

        {addMode === 'auto' && isCreating ? (
            <div className="p-6 space-y-4">
              <div className="relative">
                <textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder='e.g., "Plan a 5 day trip to Manali with friends"'
                    className="w-full h-24 p-3 pr-12 transition-all duration-200 resize-none shadow-inner themed-textarea"
                    disabled={isParsing}
                    autoFocus
                />
                <button type="button" onClick={handleListen} title="Voice Input" className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${isListening ? 'bg-rose-500/50 text-rose-300 animate-pulse' : 'bg-subtle hover:bg-card-hover'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                </button>
              </div>
              <button
                onClick={handleAiParse}
                disabled={!aiText.trim() || isParsing}
                className="button-primary w-full flex items-center justify-center font-bold py-3 px-4"
              >
                {isParsing ? <LoadingSpinner /> : 'Plan with AI'}
              </button>
            </div>
        ) : (
            <form onSubmit={handleSave} className="p-6 space-y-4 flex-grow overflow-y-auto">
            {planResult && planResult.length > 0 && (
                <div className="p-3 bg-subtle rounded-lg border border-divider space-y-3 animate-fadeInUp">
                    <h4 className="font-semibold text-primary mb-2">✨ AI Generated Plan</h4>
                    <div>
                        <h5 className="font-medium text-secondary text-sm">Itinerary Overview</h5>
                        <ul className="list-disc pl-5 text-sm text-secondary">
                            {planResult.map((day) => <li key={day.id}>{day.title}</li>)}
                        </ul>
                    </div>
                </div>
            )}
            <div>
                <label className="text-sm text-secondary mb-1 block">Trip Name</label>
                <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full input-base p-2 rounded-md" required autoFocus={!isCreating}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-secondary mb-1 block">Currency</label>
                    <CustomSelect options={currencyOptions} value={currency} onChange={setCurrency} />
                </div>
                <div>
                    <label className="text-sm text-secondary mb-1 block">Trip Budget (Optional)</label>
                    <input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="w-full input-base p-2 rounded-md no-spinner" placeholder="e.g. 50000" />
                </div>
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
                                <button type="button" onClick={() => handleRemoveParticipant(p.contactId)} className="text-rose-200 bg-rose-500/50 hover:bg-rose-500/70 rounded-full w-4 h-4 flex items-center justify-center text-xs transition-colors">&times;</button>
                            </span>
                        ))}
                    </div>
                </div>
                <button type="button" onClick={() => setShowParticipantPicker(!showParticipantPicker)} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400">
                    {showParticipantPicker ? 'Hide Participants' : 'Edit Participants'}
                </button>
            </div>
            {showParticipantPicker && (
                <div className="p-3 bg-subtle rounded-lg border border-divider space-y-3 animate-fadeInUp">
                  {unmatchedNames.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-secondary">Unmatched Participants</h4>
                        {unmatchedNames.map(uname => (
                            editingUnmatchedName === uname ? (
                                <div key={uname} className="p-2 bg-subtle border border-divider rounded-lg space-y-2">
                                    <input type="text" value={inlineContactName} onChange={e => setInlineContactName(e.target.value)} className="input-base w-full p-2 rounded-lg" />
                                    <CustomSelect options={contactGroups.map(g => ({value: g.id, label: g.name}))} value={inlineContactGroupId} onChange={setInlineContactGroupId} />
                                    <div className="flex justify-end gap-2"><button type="button" onClick={handleCancelInlineAdd} className="button-secondary text-xs px-2 py-1">Cancel</button><button type="button" onClick={handleSaveInlineContact} className="button-primary text-xs px-2 py-1">Save Contact</button></div>
                                </div>
                            ) : (
                                <div key={uname} className="flex justify-between items-center p-2 bg-subtle rounded-lg">
                                    <span className="text-sm text-secondary">{uname}</span>
                                    <button type="button" onClick={() => handleStartInlineAdd(uname)} className="button-secondary text-xs px-2 py-1">Add as New Contact</button>
                                </div>
                            )
                        ))}
                    </div>
                  )}
                  {contactsByGroup.map(group => (
                    <div key={group.id}>
                      <div className="p-1"><CustomCheckbox id={`group-${group.id}`} label={group.name} checked={isGroupSelected(group)} onChange={c => handleGroupToggle(group, c)} /></div>
                      <div className="pl-6 space-y-1">
                          {group.members.map(contact => <div key={contact.id}><CustomCheckbox id={contact.id} label={contact.name} checked={tempSelectedContacts.has(contact.id)} onChange={c => handleContactToggle(contact.id, c)}/></div>)}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2 pt-2 border-t border-divider">
                      <button type="button" onClick={onOpenContactsManager} className="button-secondary text-xs px-3 py-1.5">Manage Contacts</button>
                      <button type="button" onClick={handleAddParticipants} className="button-primary px-4 py-2">Confirm Selection</button>
                  </div>
                </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t border-divider">
              <button type="button" onClick={onClose} className="button-secondary px-4 py-2">
                Cancel
              </button>
              <button type="submit" className="button-primary px-4 py-2">
                {isCreating ? 'Create Trip' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
