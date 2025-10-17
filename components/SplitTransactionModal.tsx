

import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { Transaction, Contact, SplitDetail, USER_SELF_ID } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';
import { SettingsContext } from '../contexts/SettingsContext';
import CustomCheckbox from './CustomCheckbox';

type SplitMode = 'equally' | 'percentage' | 'shares' | 'manual';

interface SplitTransactionModalProps {
  transaction?: Transaction;
  onSave: (transactionId: string, splits: { personName: string; amount: number }[]) => void;
  onCancel: () => void;
  items?: { id: string, description: string, amount: string }[];
}


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

export const SplitTransactionModal: React.FC<SplitTransactionModalProps> = ({ transaction, onSave, onCancel, items }) => {
  const { contacts } = useContext(SettingsContext);
  const formatCurrency = useCurrencyFormatter(undefined, transaction?.accountId ? transaction.accountId : undefined);

  const [mode, setMode] = useState<SplitMode>('equally');
  const [participants, setParticipants] = useState<SplitDetail[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState(new Set<string>());
  
  const allAvailableParticipants = useMemo(() => [
    { id: USER_SELF_ID, name: 'You', groupId: '' },
    ...contacts
  ], [contacts]);

  const totalAmount = transaction?.amount || 0;

  const calculateSplits = useCallback((participants: SplitDetail[], total: number, mode: SplitMode): SplitDetail[] => {
    const numParticipants = participants.length;
    if (numParticipants === 0 || total === 0) return participants.map(p => ({ ...p, amount: 0 }));

    switch (mode) {
      case 'equally':
        const splitAmount = total / numParticipants;
        return participants.map(p => ({ ...p, amount: splitAmount }));
      case 'percentage':
        let totalPercentage = participants.reduce((sum, p) => sum + (parseFloat(p.percentage || '0') || 0), 0);
        if (totalPercentage === 0) return participants.map(p => ({ ...p, amount: 0 }));
        return participants.map(p => ({ ...p, amount: ((parseFloat(p.percentage || '0') || 0) / totalPercentage) * total }));
      case 'shares':
        let totalShares = participants.reduce((sum, p) => sum + (parseFloat(p.shares || '0') || 0), 0);
        if (totalShares === 0) return participants.map(p => ({ ...p, amount: 0 }));
        return participants.map(p => ({ ...p, amount: ((parseFloat(p.shares || '0') || 0) / totalShares) * total }));
      default: return participants;
    }
  }, []);

  useEffect(() => {
    const initialParticipants = transaction?.splitDetails && transaction.splitDetails.length > 0
      ? transaction.splitDetails
      : allAvailableParticipants.map(p => ({
          id: p.id,
          personName: p.name,
          amount: 0,
          isSettled: p.id === USER_SELF_ID,
          shares: '1',
          percentage: (100 / allAvailableParticipants.length).toFixed(2),
        }));
    
    setParticipants(calculateSplits(initialParticipants, totalAmount, mode));
    setTempSelected(new Set(initialParticipants.map(p => p.id)));
  }, [transaction, contacts, allAvailableParticipants, totalAmount, mode, calculateSplits]);


  const handleDetailChange = (id: string, field: 'amount' | 'percentage' | 'shares', value: string) => {
    const newParticipants = participants.map(p => {
        if (p.id === id) {
            if (field === 'amount') return { ...p, amount: parseFloat(value) || 0 };
            return { ...p, [field]: value };
        }
        return p;
    });
    setParticipants(calculateSplits(newParticipants, totalAmount, mode));
  };
  
  const handleNumericChange = (id: string, field: 'shares' | 'percentage', delta: number) => {
    const p = participants.find(p => p.id === id);
    if (!p) return;
    const currentVal = parseFloat(p[field] || (field === 'shares' ? '1' : '0')) || 0;
    const newVal = Math.max(0, currentVal + delta);
    handleDetailChange(id, field, String(newVal));
  };
  
  const handleAddPeople = () => {
    const peopleToAdd = allAvailableParticipants
        .filter(p => tempSelected.has(p.id) && !participants.some(pp => pp.id === p.id));
    
    const newParticipants = peopleToAdd.map(p => ({
        id: p.id,
        personName: p.name,
        amount: 0,
        isSettled: p.id === USER_SELF_ID,
        shares: '1',
        percentage: '0'
    }));
    setParticipants(prev => calculateSplits([...prev, ...newParticipants], totalAmount, mode));
    setIsPickerOpen(false);
  };
  
  const handleRemovePerson = (id: string) => {
      setParticipants(prev => calculateSplits(prev.filter(p => p.id !== id), totalAmount, mode));
      setTempSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };
  
  const totalAssigned = useMemo(() => participants.reduce((sum, p) => sum + p.amount, 0), [participants]);
  const remainder = totalAmount - totalAssigned;
  const isSaveDisabled = Math.abs(remainder) > 0.01;

  const handleSubmit = () => {
    if (isSaveDisabled || !transaction) return;
    const finalSplits = participants.map(p => ({ personName: p.personName, amount: p.amount }));
    onSave(transaction.id, finalSplits);
    onCancel();
  };

  if (!transaction) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel}>
        <div className="glass-card rounded-xl p-6 text-center" onClick={e => e.stopPropagation()}>
          <h3 className="font-bold text-rose-400 text-lg">Error</h3>
          <p className="text-secondary mt-2">Could not load split details because transaction data was missing.</p>
          <button onClick={onCancel} className="button-secondary mt-4 px-4 py-2">Close</button>
        </div>
      </div>
    );
  }

  const availableToSelect = allAvailableParticipants.filter(p => !participants.some(pp => pp.id === p.contactId));
  // Fix: The TabButton component was defined in a way that caused TypeScript errors.
  // Replaced with a standard functional component definition that explicitly handles children.
  const TabButton: React.FC<{ active: boolean; children: React.ReactNode; onClick: () => void; }> = ({ active, children, onClick }) => (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors flex-grow ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`}>
        {children}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Split Expense" onClose={onCancel} icon="➗" />
        <div className="p-6 text-center border-b border-divider">
            <p className="text-secondary text-sm">Total Amount</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
            <p className="text-secondary text-sm truncate">{transaction.description}</p>
        </div>
        <div className="p-4 flex-grow overflow-y-auto">
          <div className="p-4 rounded-xl border border-divider bg-subtle">
            <h3 className="text-center font-bold text-emerald-400 mb-3">Split Between</h3>
            <div className="flex items-center gap-2 p-1 rounded-full bg-subtle border border-divider">
                <TabButton active={mode === 'equally'} onClick={() => setMode('equally')}>Equally</TabButton>
                <TabButton active={mode === 'percentage'} onClick={() => setMode('percentage')}>%</TabButton>
                <TabButton active={mode === 'shares'} onClick={() => setMode('shares')}>Shares</TabButton>
                <TabButton active={mode === 'manual'} onClick={() => setMode('manual')}>Manual</TabButton>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mt-3">
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-1.5 bg-subtle rounded-lg">
                <span className="font-semibold flex-grow truncate text-sm pl-1 text-primary">{p.personName}</span>
                {mode === 'percentage' && <div className="relative w-24"><DebouncedNumericInput type="text" inputMode="decimal" value={p.percentage || ''} onCommit={(val: string) => handleDetailChange(p.id, 'percentage', val)} className="w-full text-right bg-transparent no-spinner pr-4 text-primary input-base" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary text-sm">%</span></div>}
                {mode === 'shares' && <div className="flex items-center gap-1"><button type="button" onClick={() => handleNumericChange(p.id, 'shares', -0.5)} className="control-button control-button-minus">-</button><DebouncedNumericInput type="text" inputMode="decimal" value={p.shares || ''} onCommit={(val: string) => handleDetailChange(p.id, 'shares', val)} className="w-12 text-center bg-transparent no-spinner text-primary" /><button type="button" onClick={() => handleNumericChange(p.id, 'shares', 0.5)} className="control-button control-button-plus">+</button></div>}
                <DebouncedNumericInput type="text" inputMode="decimal" value={mode === 'manual' ? p.amount || '' : (Number(p.amount) || 0).toFixed(2)} readOnly={mode !== 'manual'} onCommit={(val: string) => handleDetailChange(p.id, 'amount', val)} className="w-24 p-1 rounded-md text-right no-spinner input-base" />
                <button type="button" onClick={() => handleRemovePerson(p.id)} className="text-rose-400 font-bold text-xl leading-none px-1 flex-shrink-0">&times;</button>
              </div>
            ))}
            </div>
            <div className="relative mt-2">
                <button type="button" onClick={() => setIsPickerOpen(!isPickerOpen)} className="w-full text-left p-1.5 rounded-full border border-divider hover-bg-stronger text-xs text-center text-sky-400">
                    + Add Person...
                </button>
                 {isPickerOpen && (
                    <div className="absolute bottom-full mb-1 w-full z-20 glass-card rounded-lg shadow-lg max-h-40 flex flex-col p-2">
                        <div className="overflow-y-auto">
                            {availableToSelect.map(p => <div className="p-1" key={p.id}><CustomCheckbox id={p.id} label={p.name} checked={tempSelected.has(p.id)} onChange={checked => setTempSelected(prev => { const n = new Set(prev); if(checked) n.add(p.id); else n.delete(p.id); return n; })}/></div>)}
                        </div>
                        <button type="button" onClick={handleAddPeople} className="w-full text-center p-2 text-sm text-white rounded-b-lg sticky bottom-0 bg-emerald-500 mt-1">Add Selected</button>
                    </div>
                )}
            </div>
            <div className="text-right text-xs text-secondary mt-2">Remaining: <span className={`font-mono ${isSaveDisabled ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(remainder)}</span></div>
        </div>
        </div>
        <div className="p-4 border-t border-divider flex-shrink-0 space-y-3">
            <div className="flex justify-between text-sm font-semibold pt-2">
                <span>Total Assigned:</span>
                <span className={`font-mono ${isSaveDisabled ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(totalAssigned)}</span>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <button onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
                <button onClick={handleSubmit} disabled={isSaveDisabled} className="button-primary px-4 py-2">Save Split</button>
            </div>
        </div>
      </div>
    </div>
  );
};