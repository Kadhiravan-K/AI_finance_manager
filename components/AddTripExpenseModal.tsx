import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Trip, Category, TransactionType, SplitDetail, TripExpense, Contact, TripParticipant } from '../types';
import ModalHeader from './ModalHeader';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomSelect from './CustomSelect';
import { USER_SELF_ID } from '../constants';

const modalRoot = document.getElementById('modal-root')!;

interface AddTripExpenseModalProps {
  trip: Trip;
  expenseToEdit?: TripExpense;
  onClose: () => void;
  onSave: (items: Omit<TripExpense, 'id' | 'tripId' | 'date'>[]) => void;
  onUpdate: (expense: Omit<TripExpense, 'tripId' | 'date'>) => void;
  categories: Category[];
  onOpenCalculator: (onResult: (result: number) => void) => void;
  onSaveContact: (contact: Omit<Contact, 'id'>) => Contact;
}

type SplitMode = 'equally' | 'percentage' | 'shares' | 'manual';

interface Item {
  id: string;
  description: string;
  price: string;
  quantity: string;
  categoryId: string;
  parentId: string | null;
  notes: string;
}

const createEmptyItem = (): Item => ({
  id: self.crypto.randomUUID(),
  description: '',
  price: '',
  quantity: '1',
  notes: '',
  categoryId: '',
  parentId: null,
});

const AddTripExpenseModal: React.FC<AddTripExpenseModalProps> = ({
  trip,
  expenseToEdit,
  onClose,
  onSave,
  onUpdate,
  categories,
  onOpenCalculator,
}) => {
  const formatCurrency = useCurrencyFormatter(undefined, trip.currency);
  const isEditing = !!expenseToEdit;

  // Multi-item state
  const [items, setItems] = useState<Item[]>([createEmptyItem()]);
  
  // Payer and Splitter state for the whole expense
  const [payers, setPayers] = useState<SplitDetail[]>([]);
  const [payerMode, setPayerMode] = useState<SplitMode>('equally');
  const [splitters, setSplitters] = useState<SplitDetail[]>([]);
  const [splitterMode, setSplitterMode] = useState<SplitMode>('equally');

  const [isSplitterCollapsed, setIsSplitterCollapsed] = useState(true);
  
  const topLevelExpenseCategories = useMemo(() => categories.filter(c => c.type === TransactionType.EXPENSE && !c.parentId), [categories]);
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 0)), 0), [items]);

  const calculateSplits = useCallback((participants: SplitDetail[], total: number, mode: SplitMode): SplitDetail[] => {
    const numParticipants = participants.length;
    if (numParticipants === 0 || total === 0) return participants.map(p => ({ ...p, amount: 0 }));

    switch (mode) {
      case 'equally':
        const splitAmount = total / numParticipants;
        return participants.map(p => ({ ...p, amount: splitAmount }));
      case 'percentage':
        let totalPercentage = participants.reduce((sum, p) => sum + (parseFloat(p.percentage || '0') || 0), 0);
        if (totalPercentage === 0) totalPercentage = 100;
        return participants.map(p => ({ ...p, amount: ((parseFloat(p.percentage || '0') || 0) / totalPercentage) * total }));
      case 'shares':
        let totalShares = participants.reduce((sum, p) => sum + (parseFloat(p.shares || '0') || 0), 0);
        if (totalShares === 0) totalShares = numParticipants;
        return participants.map(p => ({ ...p, amount: ((parseFloat(p.shares || '0') || 0) / totalShares) * total }));
      default: return participants;
    }
  }, []);

  useEffect(() => {
    if (isEditing && expenseToEdit) {
      const category = categories.find(c => c.id === expenseToEdit.categoryId);
      setItems([{
        id: expenseToEdit.id,
        description: expenseToEdit.description,
        price: String(expenseToEdit.amount),
        quantity: '1',
        notes: expenseToEdit.notes || '',
        categoryId: expenseToEdit.categoryId,
        parentId: category?.parentId || null,
      }]);
      setPayers(expenseToEdit.payers.map(p => ({ ...p, id: p.contactId, personName: (trip.participants||[]).filter(Boolean).find(tp => tp.contactId === p.contactId)?.name || 'Unknown', isSettled: p.contactId === USER_SELF_ID, shares: '1', percentage: '100' })));
      setSplitters(expenseToEdit.splitDetails);
    } else {
        const youParticipant: SplitDetail = { id: USER_SELF_ID, personName: 'You', amount: 0, isSettled: true, shares: '1', percentage: '100'};
        const allParticipants = (trip.participants || []).filter(Boolean).map(p => ({
            id: p.contactId,
            personName: p.name,
            amount: 0,
            isSettled: p.contactId === USER_SELF_ID,
            shares: '1',
            percentage: '0'
        }));
        setPayers([youParticipant]);
        setSplitters(allParticipants);
    }
  }, [isEditing, expenseToEdit, categories, trip.participants]);

  useEffect(() => { setPayers(prev => calculateSplits(prev, totalAmount, payerMode)); }, [totalAmount, payerMode, calculateSplits, payers.length]);
  useEffect(() => { setSplitters(prev => calculateSplits(prev, totalAmount, splitterMode)); }, [totalAmount, splitterMode, calculateSplits, splitters.length]);

  const handleItemChange = (itemId: string, field: keyof Item, value: any) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
  };
  const handleAddItem = () => setItems(prev => [...prev, createEmptyItem()]);
  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };
  const handleQuantityStep = (itemId: string, delta: number) => {
    handleItemChange(itemId, 'quantity', String(Math.max(1, (parseInt(items.find(i => i.id === itemId)?.quantity || '1', 10) || 1) + delta)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPayers = calculateSplits(payers, totalAmount, payerMode);
    const finalSplitters = calculateSplits(splitters, totalAmount, splitterMode);
    
    // Proportional Distribution
    const expenseItemsToSave = items.map(item => {
        const itemAmount = (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1);
        const proportion = totalAmount > 0 ? itemAmount / totalAmount : 0;
        
        return {
            description: item.description,
            amount: itemAmount,
            categoryId: item.categoryId || item.parentId!,
            notes: item.notes,
            payers: finalPayers.map(p => ({ contactId: p.id, amount: p.amount * proportion })),
            splitDetails: finalSplitters.map(s => ({ ...s, amount: s.amount * proportion })),
        };
    }).filter(item => item.description.trim() && item.amount > 0 && item.categoryId);

    if (expenseItemsToSave.length === 0) {
      alert("Please fill out at least one valid item with a description, amount, and category.");
      return;
    }

    if (isEditing) {
      onUpdate({ ...expenseItemsToSave[0], id: expenseToEdit!.id });
    } else {
      onSave(expenseItemsToSave);
    }
  };
  
  const SplitManager: React.FC<{
    title: string;
    mode: SplitMode;
    onModeChange: (mode: SplitMode) => void;
    participants: SplitDetail[];
    onParticipantsChange: (participants: SplitDetail[]) => void;
    isPayerManager?: boolean;
    tripParticipants?: TripParticipant[];
  }> = ({ title, mode, onModeChange, participants, onParticipantsChange, isPayerManager, tripParticipants }) => {
    
    const participantOptions = useMemo(() => {
        if (!isPayerManager || !tripParticipants) return [];
        const all = [{ contactId: USER_SELF_ID, name: 'You' }, ...tripParticipants.filter(p => p.contactId !== USER_SELF_ID)];
        return all.map(p => ({ value: p.contactId, label: p.name }));
    }, [isPayerManager, tripParticipants]);

    const handlePayerChange = (oldId: string, newContactId: string) => {
        const newParticipantDetails = participantOptions.find(p => p.value === newContactId);
        if (!newParticipantDetails) return;

        // Prevent adding a participant who is already a payer
        if (participants.some(p => p.id === newContactId)) return;

        onParticipantsChange(participants.map(p => {
            if (p.id === oldId) {
                return {
                    ...p,
                    id: newParticipantDetails.value,
                    personName: newParticipantDetails.label,
                    isSettled: newParticipantDetails.value === USER_SELF_ID
                };
            }
            return p;
        }));
    };
    
    const handleAddPerson = (person: TripParticipant) => {
        if (!participants.some(p => p.id === person.contactId)) {
            onParticipantsChange([...participants, { id: person.contactId, personName: person.name, amount: 0, isSettled: person.contactId === USER_SELF_ID, shares: '1', percentage: '0' }]);
        }
    };
    const handleRemovePerson = (id: string) => onParticipantsChange(participants.filter(p => p.id !== id));
    
    const handleDetailChange = (id: string, field: 'amount' | 'percentage' | 'shares', value: string) => {
        let newParticipants = participants.map(p => p.id === id ? { ...p, [field]: value } : p);
        if (mode === 'manual') newParticipants = newParticipants.map(p => p.id === id ? { ...p, amount: parseFloat(value) || 0 } : p);
        onParticipantsChange(calculateSplits(newParticipants, totalAmount, mode));
    };

    const handleNumericChange = (id: string, field: 'shares', delta: number) => {
        const p = participants.find(p => p.id === id);
        if (!p) return;
        const currentVal = parseFloat(p[field] || (field === 'shares' ? '1' : '0')) || 0;
        const newVal = Math.max(0, currentVal + delta);
        handleDetailChange(id, field, String(newVal));
    };

    const totalAssigned = useMemo(() => participants.reduce((sum, p) => sum + p.amount, 0), [participants]);
    const remainder = totalAmount - totalAssigned;
    const TabButton = (props: { active: boolean; children: React.ReactNode; onClick: () => void; }) => <button type="button" {...props} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors flex-grow ${props.active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`} />;

    return (
        <div className="p-4 rounded-xl border border-divider bg-subtle">
            <h3 className="text-center font-bold text-emerald-400 mb-3">{title}</h3>
            <div className="flex items-center gap-2 p-1 rounded-full bg-subtle border border-divider">
                <TabButton active={mode === 'equally'} onClick={() => onModeChange('equally')}>Equally</TabButton>
                <TabButton active={mode === 'percentage'} onClick={() => onModeChange('percentage')}>%</TabButton>
                <TabButton active={mode === 'shares'} onClick={() => onModeChange('shares')}>Shares</TabButton>
                <TabButton active={mode === 'manual'} onClick={() => onModeChange('manual')}>Manual</TabButton>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mt-3">
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-1.5 bg-subtle rounded-lg">
                {isPayerManager ? (
                    <div className="flex-grow">
                        <CustomSelect value={p.id} onChange={newId => handlePayerChange(p.id, newId)} options={participantOptions} />
                    </div>
                ) : (
                    <span className="font-semibold flex-grow truncate text-sm pl-1 text-primary">{p.personName}</span>
                )}
                {mode === 'percentage' && <div className="relative w-24"><input type="number" value={p.percentage || ''} onChange={e => handleDetailChange(p.id, 'percentage', e.target.value)} className="w-full text-right bg-transparent no-spinner pr-4 text-primary input-base" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary text-sm">%</span></div>}
                {mode === 'shares' && <div className="flex items-center gap-1"><button type="button" onClick={() => handleNumericChange(p.id, 'shares', -0.5)} className="control-button control-button-minus">-</button><input type="number" step="0.5" value={p.shares || ''} onChange={e => handleDetailChange(p.id, 'shares', e.target.value)} className="w-12 text-center bg-transparent no-spinner text-primary" /><button type="button" onClick={() => handleNumericChange(p.id, 'shares', 0.5)} className="control-button control-button-plus">+</button></div>}
                <input type="number" value={mode === 'manual' ? p.amount || '' : p.amount.toFixed(2)} readOnly={mode !== 'manual'} onChange={e => handleDetailChange(p.id, 'amount', e.target.value)} className="w-24 p-1 rounded-md text-right no-spinner input-base" />
                <button type="button" onClick={() => handleRemovePerson(p.id)} className="text-rose-400 font-bold text-xl leading-none px-1 flex-shrink-0">&times;</button>
              </div>
            ))}
            </div>
            <CustomSelect options={(trip.participants||[]).filter(Boolean).filter(tp => !participants.some(p => p.id === tp.contactId)).map(p => ({ value: p.contactId, label: p.name }))} value="" onChange={contactId => handleAddPerson(trip.participants.find(p=>p.contactId===contactId)!)} placeholder="+ Add Person..." />
            <div className="text-right text-xs text-secondary mt-2">Remaining: <span className={`font-mono ${Math.abs(remainder) > 0.01 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(remainder)}</span></div>
        </div>
    );
  };
  
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={isEditing ? 'Edit Expense' : `Add Expense to ${trip.name}`} onClose={onClose} />
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
            {items.map((item, index) => {
              const itemSubCategories = item.parentId ? categories.filter(c => c.parentId === item.parentId) : [];
              return (
                  <div key={item.id} className="p-3 bg-subtle rounded-lg space-y-3 border border-divider">
                      <div className="flex items-start gap-2">
                        <input type="text" placeholder={`Item ${index+1} Description`} value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="input-base p-2 rounded-md flex-grow" required autoFocus={index > 0} />
                        {items.length > 1 && <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1 text-secondary hover:text-rose-400 z-10 flex-shrink-0 mt-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" step="0.01" min="0" placeholder="Price" value={item.price} onChange={e => handleItemChange(item.id, 'price', e.target.value)} className="input-base w-full p-2 rounded-md no-spinner" required />
                        <div className="flex items-center justify-center gap-1">
                            <button type="button" onClick={() => handleQuantityStep(item.id, -1)} className="control-button control-button-minus">-</button>
                            <input type="number" step="1" min="1" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="input-base w-12 p-2 rounded-md no-spinner text-center" required />
                            <button type="button" onClick={() => handleQuantityStep(item.id, 1)} className="control-button control-button-plus">+</button>
                        </div>
                      </div>
                       <div className={item.parentId && itemSubCategories.length > 0 ? "grid grid-cols-2 gap-2" : ""}>
                        <CustomSelect value={item.parentId || ''} onChange={val => {
                           const subCats = categories.filter(c => c.parentId === val);
                           handleItemChange(item.id, 'parentId', val);
                           handleItemChange(item.id, 'categoryId', subCats.length > 0 ? '' : val);
                        }} options={topLevelExpenseCategories.map(c => ({ value: c.id, label: c.name}))} placeholder="Category" />
                        {item.parentId && itemSubCategories.length > 0 && <CustomSelect value={item.categoryId} onChange={val => handleItemChange(item.id, 'categoryId', val)} options={itemSubCategories.map(c => ({ value: c.id, label: c.name }))} placeholder="Subcategory" />}
                      </div>
                      <textarea placeholder="Notes (optional)" value={item.notes} onChange={e => handleItemChange(item.id, 'notes', e.target.value)} rows={1} className="input-base w-full p-2 rounded-md resize-none" />
                  </div>
              );
            })}

            <button type="button" onClick={handleAddItem} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400">+ Add Another Item</button>
            <div className="text-right font-bold text-primary text-lg border-t border-divider pt-2">Total: {formatCurrency(totalAmount)}</div>

            <SplitManager title="Who Paid?" mode={payerMode} onModeChange={setPayerMode} participants={payers} onParticipantsChange={setPayers} isPayerManager tripParticipants={trip.participants} />
            
            <div className="p-4 rounded-xl border border-divider bg-subtle">
                <button type="button" onClick={() => setIsSplitterCollapsed(p => !p)} className="w-full flex justify-between items-center">
                    <h3 className="text-center font-bold text-emerald-400">Split Between</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform ${!isSplitterCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {!isSplitterCollapsed && <div className="mt-3 pt-3 border-t border-divider"><SplitManager title="" mode={splitterMode} onModeChange={setSplitterMode} participants={splitters} onParticipantsChange={setSplitters} tripParticipants={trip.participants} /></div>}
            </div>
          </div>
          <div className="flex-shrink-0 p-4 border-t border-divider flex justify-end gap-3 bg-subtle rounded-b-xl">
             <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
             <button type="submit" className="button-primary px-4 py-2">{isEditing ? 'Save Changes' : 'Save Expense'}</button>
          </div>
        </form>
      </div>
    </div>,
    modalRoot
  );
};

export default AddTripExpenseModal;
