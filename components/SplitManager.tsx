import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SplitDetail, TripParticipant, USER_SELF_ID } from '../types';
import CustomSelect from './CustomSelect';
import CustomCheckbox from './CustomCheckbox';

type SplitMode = 'equally' | 'percentage' | 'shares' | 'manual';

const DebouncedNumericInput: React.FC<{
  value: string | number;
  onCommit: (value: string) => void;
  className?: string;
  [key: string]: any; 
}> = ({ value, onCommit, ...props }) => {
    const [localValue, setLocalValue] = useState(String(value));
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            setLocalValue(String(value));
        }
    }, [value]);

    const handleCommit = () => {
        const valueToCommit = localValue.trim() === '' ? '0' : localValue;
        if (valueToCommit !== String(value)) {
            onCommit(valueToCommit);
        }
    };

    return (
        <input
            ref={inputRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCommit(); (e.target as HTMLInputElement).blur(); } }}
            onWheel={(e) => (e.target as HTMLElement).blur()}
            {...props}
        />
    );
};


interface SplitManagerProps {
    title: string;
    mode: SplitMode;
    onModeChange: (mode: SplitMode) => void;
    participants: SplitDetail[];
    onParticipantsChange: (participants: SplitDetail[]) => void;
    totalAmount: number;
    allParticipants: {contactId: string, name: string}[];
    formatCurrency: (amount: number) => string;
    isPayerManager?: boolean;
}

export const SplitManager: React.FC<SplitManagerProps> = ({ title, mode, onModeChange, participants, onParticipantsChange, totalAmount, allParticipants, formatCurrency, isPayerManager }) => {
    
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [tempSelected, setTempSelected] = useState(new Set<string>(participants.map(p=>p.id)));
    
    useEffect(() => {
        setTempSelected(new Set(participants.map(p=>p.id)))
    }, [participants]);

    const handleDetailChange = (id: string, field: 'amount' | 'percentage' | 'shares', value: string) => {
      const newParticipants = participants.map(p => {
          if (p.id === id) {
              if (field === 'amount') return { ...p, amount: parseFloat(value) || 0 };
              return { ...p, [field]: value };
          }
          return p;
      });
      onParticipantsChange(newParticipants);
    };

    const handleNumericChange = (id: string, field: 'shares' | 'percentage', delta: number) => {
        const p = participants.find(p => p.id === id);
        if (!p) return;
        const currentVal = parseFloat(p[field] || (field === 'shares' ? '1' : '0')) || 0;
        const newVal = Math.max(0, currentVal + delta);
        handleDetailChange(id, field, String(newVal));
    };
    
     const handlePayerChange = (oldId: string, newContactId: string) => {
        const newParticipantDetails = allParticipants.find(p => p.contactId === newContactId);
        if (!newParticipantDetails) return;
        if (participants.some(p => p.id === newContactId)) return;
        onParticipantsChange(participants.map(p => p.id === oldId ? { ...p, id: newParticipantDetails.contactId, personName: newParticipantDetails.name, isSettled: newParticipantDetails.contactId === USER_SELF_ID } : p));
    };

    const handleAddPeople = () => {
        const peopleToAdd = allParticipants
            .filter(p => tempSelected.has(p.contactId) && !participants.some(pp => pp.id === p.contactId));
        
        const newParticipants = peopleToAdd.map(p => ({
            id: p.contactId, personName: p.name, amount: 0, isSettled: p.contactId === USER_SELF_ID, shares: '1', percentage: '0'
        }));
        onParticipantsChange([...participants, ...newParticipants]);
        setIsPickerOpen(false);
    };
    const handleRemovePerson = (id: string) => {
        onParticipantsChange(participants.filter(p => p.id !== id));
        setTempSelected(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };
    
    const totalAssigned = useMemo(() => participants.reduce((sum, p) => sum + p.amount, 0), [participants]);
    const remainder = totalAmount - totalAssigned;
    const TabButton = (props: { active: boolean; children: React.ReactNode; onClick: () => void; }) => <button type="button" {...props} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors flex-grow ${props.active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`} />;
    
    const availableParticipants = allParticipants.filter(tp => !participants.some(p => p.id === tp.contactId));

    const participantOptions = allParticipants.map(p => ({ value: p.contactId, label: p.name }));
    
    return (
        <div className="p-4 rounded-xl border border-divider bg-subtle">
            <h3 className="text-center font-bold text-emerald-400 mb-3">{title}</h3>
            <div className="flex items-center gap-2 p-1 rounded-full bg-subtle border border-divider">
                {!isPayerManager && <TabButton active={mode === 'equally'} onClick={() => onModeChange('equally')}>Equally</TabButton>}
                {!isPayerManager && <TabButton active={mode === 'percentage'} onClick={() => onModeChange('percentage')}>%</TabButton>}
                {!isPayerManager && <TabButton active={mode === 'shares'} onClick={() => onModeChange('shares')}>Shares</TabButton>}
                <TabButton active={mode === 'manual'} onClick={() => onModeChange('manual')}>Manual</TabButton>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mt-3">
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-1.5 bg-subtle rounded-lg">
                {isPayerManager ? (
                    <div className="flex-grow z-10"><CustomSelect value={p.id} onChange={newId => handlePayerChange(p.id, newId)} options={participantOptions} /></div>
                ) : ( <span className="font-semibold flex-grow truncate text-sm pl-1 text-primary">{p.personName}</span> )}
                {mode === 'percentage' && <div className="relative w-24"><DebouncedNumericInput type="text" inputMode="decimal" value={p.percentage || ''} onCommit={(val: string) => handleDetailChange(p.id, 'percentage', val)} className="w-full text-right bg-transparent no-spinner pr-4 text-primary input-base" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary text-sm">%</span></div>}
                {mode === 'shares' && <div className="flex items-center gap-1"><button type="button" onClick={() => handleNumericChange(p.id, 'shares', -0.5)} className="control-button control-button-minus">-</button><DebouncedNumericInput type="text" inputMode="decimal" value={p.shares || ''} onCommit={(val: string) => handleDetailChange(p.id, 'shares', val)} className="w-12 text-center bg-transparent no-spinner text-primary" /><button type="button" onClick={() => handleNumericChange(p.id, 'shares', 0.5)} className="control-button control-button-plus">+</button></div>}
                <DebouncedNumericInput type="text" inputMode="decimal" value={mode === 'manual' ? p.amount || '' : (Number(p.amount) || 0).toFixed(2)} readOnly={mode !== 'manual'} onCommit={(val: string) => handleDetailChange(p.id, 'amount', val)} className="w-24 p-1 rounded-md text-right no-spinner input-base" />
                <button type="button" onClick={() => handleRemovePerson(p.id)} className="text-rose-400 font-bold text-xl leading-none px-1 flex-shrink-0">&times;</button>
              </div>
            ))}
            </div>
            <div className="relative mt-2">
                <button type="button" onClick={() => setIsPickerOpen(!isPickerOpen)} className="w-full text-left p-1.5 rounded-full border border-divider hover-bg-stronger text-xs text-center text-sky-400">
                    + Add/Remove...
                </button>
                 {isPickerOpen && (
                    <div className="absolute bottom-full mb-1 w-full z-20 glass-card rounded-lg shadow-lg max-h-40 flex flex-col p-2">
                        <div className="overflow-y-auto">
                            {availableParticipants.map(p => <div className="p-1" key={p.contactId}><CustomCheckbox id={`split-sel-${p.contactId}`} label={p.name} checked={tempSelected.has(p.contactId)} onChange={checked => setTempSelected(prev => { const n = new Set(prev); if(checked) n.add(p.contactId); else n.delete(p.contactId); return n; })}/></div>)}
                        </div>
                        <button type="button" onClick={handleAddPeople} className="w-full text-center p-2 text-sm text-white rounded-b-lg sticky bottom-0 bg-emerald-500 mt-1">Add Selected</button>
                    </div>
                )}
            </div>
            <div className="text-right text-xs text-secondary mt-2">Remaining: <span className={`font-mono ${Math.abs(remainder) > 0.01 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(remainder)}</span></div>
        </div>
    );
};