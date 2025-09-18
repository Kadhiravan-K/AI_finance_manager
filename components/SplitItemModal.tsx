import React, { useState, useEffect, useMemo, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Contact, SplitDetail } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';
import { SettingsContext } from '../contexts/SettingsContext';
import { USER_SELF_ID } from '../constants';
import CustomCheckbox from './CustomCheckbox';

const modalRoot = document.getElementById('modal-root')!;

type SplitMode = 'equally' | 'percentage' | 'shares' | 'manual';

interface SplitItemModalProps {
  item: { description: string; amount: number };
  initialSplitDetails: SplitDetail[];
  onSave: (splits: SplitDetail[]) => void;
  onClose: () => void;
  participants: { contactId: string; name: string }[];
  currency: string;
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

const SplitItemModal: React.FC<SplitItemModalProps> = ({ item, initialSplitDetails, onSave, onClose, participants, currency }) => {
  const { contacts } = useContext(SettingsContext);
  const formatCurrency = useCurrencyFormatter(undefined, currency);

  const [mode, setMode] = useState<SplitMode>('equally');
  const [splitDetails, setSplitDetails] = useState<SplitDetail[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  const allAvailableParticipants = useMemo(() => [
    { contactId: USER_SELF_ID, name: 'You', groupId: '' },
    ...participants.filter(p => p.contactId !== USER_SELF_ID).map(p => ({...p, groupId: contacts.find(c => c.id === p.contactId)?.groupId || ''}))
  ], [participants, contacts]);

  const [tempSelected, setTempSelected] = useState(new Set<string>(initialSplitDetails.length > 0 ? initialSplitDetails.map(p => p.id) : allAvailableParticipants.map(p => p.contactId)));


  useEffect(() => {
    const initialParticipants = initialSplitDetails.length > 0
      ? initialSplitDetails
      : allAvailableParticipants.map(p => ({
          id: p.contactId,
          personName: p.name,
          amount: 0,
          isSettled: p.contactId === USER_SELF_ID,
          shares: '1',
          percentage: (100 / allAvailableParticipants.length).toFixed(2),
        }));
    
    setSplitDetails(initialParticipants);
    setTempSelected(new Set(initialParticipants.map(p => p.id)));
  }, [initialSplitDetails, allAvailableParticipants]);

  useEffect(() => {
    const numParticipants = splitDetails.length;
    if (numParticipants === 0 || item.amount === 0) {
        setSplitDetails(sd => sd.map(p => ({ ...p, amount: 0 })));
        return;
    }
    
    let updatedSplits = [...splitDetails];

    switch (mode) {
      case 'equally':
        const splitAmount = item.amount / numParticipants;
        updatedSplits = splitDetails.map(p => ({ ...p, amount: splitAmount }));
        break;
      case 'percentage':
        let totalPercentage = splitDetails.reduce((sum, p) => sum + (parseFloat(p.percentage || '0') || 0), 0);
        if (totalPercentage === 0) totalPercentage = 100;
        updatedSplits = splitDetails.map(p => ({ ...p, amount: ((parseFloat(p.percentage || '0') || 0) / totalPercentage) * item.amount }));
        break;
      case 'shares':
        let totalShares = splitDetails.reduce((sum, p) => sum + (parseFloat(p.shares || '0') || 0), 0);
        if (totalShares === 0) totalShares = numParticipants;
        updatedSplits = splitDetails.map(p => ({ ...p, amount: ((parseFloat(p.shares || '0') || 0) / totalShares) * item.amount }));
        break;
      default:
        break;
    }
    if (mode !== 'manual') {
      setSplitDetails(updatedSplits);
    }
  }, [mode, item.amount, splitDetails.length, splitDetails.map(p => p.id).join(',')]);


  const handleDetailChange = (id: string, field: 'amount' | 'percentage' | 'shares', value: string) => {
    const newParticipants = splitDetails.map(p => {
        if (p.id === id) {
            if (field === 'amount') return { ...p, amount: parseFloat(value) || 0 };
            return { ...p, [field]: value };
        }
        return p;
    });
    setSplitDetails(newParticipants);
  };
  
  const handleNumericChange = (id: string, field: 'shares' | 'percentage', delta: number) => {
    const p = splitDetails.find(p => p.id === id);
    if (!p) return;
    const currentVal = parseFloat(p[field] || (field === 'shares' ? '1' : '0')) || 0;
    const newVal = Math.max(0, currentVal + delta);
    handleDetailChange(id, field, String(newVal));
  };

  const handleConfirmSelection = () => {
    const newSelection = new Set(tempSelected);
    const currentIds = new Set(splitDetails.map(p => p.id));
    
    const toAdd = allAvailableParticipants
        .filter(p => newSelection.has(p.contactId) && !currentIds.has(p.contactId))
        .map(p => ({ id: p.contactId, personName: p.name, amount: 0, isSettled: p.contactId === USER_SELF_ID, shares: '1', percentage: '0' }));

    const toKeep = splitDetails.filter(p => newSelection.has(p.id));

    setSplitDetails([...toKeep, ...toAdd]);
    setIsPickerOpen(false);
  };
  
  const totalAssigned = useMemo(() => splitDetails.reduce((sum, p) => sum + p.amount, 0), [splitDetails]);
  const remainder = item.amount - totalAssigned;
  const isSaveDisabled = Math.abs(remainder) > 0.01;

  const handleSubmit = () => {
    if (isSaveDisabled) return;
    onSave(splitDetails);
    onClose();
  };

  const TabButton = (props: { active: boolean; children: React.ReactNode; onClick: () => void; }) => <button type="button" {...props} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors flex-grow ${props.active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`} />;

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[55] p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Split Item" onClose={onClose} icon="➗" />
        <div className="p-6 text-center border-b border-divider">
            <p className="text-secondary text-sm">Total for <strong className="text-primary">{item.description}</strong></p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(item.amount)}</p>
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
            {splitDetails.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-1.5 bg-subtle rounded-lg">
                <span className="font-semibold flex-grow truncate text-sm pl-1 text-primary">{p.personName}</span>
                {mode === 'percentage' && <div className="relative w-24"><DebouncedNumericInput type="text" inputMode="decimal" value={p.percentage || ''} onCommit={(val: string) => handleDetailChange(p.id, 'percentage', val)} className="w-full text-right bg-transparent no-spinner pr-4 text-primary input-base" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary text-sm">%</span></div>}
                {mode === 'shares' && <div className="flex items-center gap-1"><button type="button" onClick={() => handleNumericChange(p.id, 'shares', -0.5)} className="control-button control-button-minus">-</button><DebouncedNumericInput type="text" inputMode="decimal" value={p.shares || ''} onCommit={(val: string) => handleDetailChange(p.id, 'shares', val)} className="w-12 text-center bg-transparent no-spinner text-primary" /><button type="button" onClick={() => handleNumericChange(p.id, 'shares', 0.5)} className="control-button control-button-plus">+</button></div>}
                <DebouncedNumericInput type="text" inputMode="decimal" value={mode === 'manual' ? p.amount || '' : (Number(p.amount) || 0).toFixed(2)} readOnly={mode !== 'manual'} onCommit={(val: string) => handleDetailChange(p.id, 'amount', val)} className="w-24 p-1 rounded-md text-right no-spinner input-base" />
              </div>
            ))}
            </div>
            <div className="relative mt-2">
                <button type="button" onClick={() => setIsPickerOpen(!isPickerOpen)} className="w-full text-left p-1.5 rounded-full border border-divider hover-bg-stronger text-xs text-center text-sky-400">
                    + Add/Remove People...
                </button>
                 {isPickerOpen && (
                    <div className="absolute bottom-full mb-1 w-full z-20 glass-card rounded-lg shadow-lg max-h-40 flex flex-col p-2">
                        <div className="overflow-y-auto">
                            {allAvailableParticipants.map(p => <div className="p-1" key={p.contactId}><CustomCheckbox id={`split-sel-${p.contactId}`} label={p.name} checked={tempSelected.has(p.contactId)} onChange={checked => setTempSelected(prev => { const n = new Set(prev); if(checked) n.add(p.contactId); else n.delete(p.contactId); return n; })}/></div>)}
                        </div>
                        <button type="button" onClick={handleConfirmSelection} className="w-full text-center p-2 text-sm text-white rounded-b-lg sticky bottom-0 bg-emerald-500 mt-1">Confirm Selection</button>
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
                <button onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                <button onClick={handleSubmit} disabled={isSaveDisabled} className="button-primary px-4 py-2">Save Split</button>
            </div>
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default SplitItemModal;