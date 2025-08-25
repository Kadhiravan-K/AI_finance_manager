import React, { useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Trip, Category, TransactionType, SplitDetail, TripPayer, TripExpense, Contact } from '../types';
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

  /** NEW: allow inline contact creation */
  onSaveContact: (contact: Omit<Contact, 'id'>) => Contact;
}

type SplitMode = 'equally' | 'percentage' | 'shares' | 'manual';

interface Item {
  id: string;
  description: string;
  amount: string;
  categoryId: string;
  parentId: string | null;
  notes: string;
  payers: TripPayer[];
  splitMode: SplitMode;
  splitDetails: SplitDetail[];
}

const AddTripExpenseModal: React.FC<AddTripExpenseModalProps> = ({
  trip,
  expenseToEdit,
  onClose,
  onSave,
  onUpdate,
  categories,
  onOpenCalculator,
  onSaveContact
}) => {
  const formatCurrency = useCurrencyFormatter(undefined, trip.currency);
  const isEditing = !!expenseToEdit;

  /** keep participants in local state so we can add inline */
  const [participants, setParticipants] = useState(trip.participants);

  const initialItemFromExpense = (exp: TripExpense): Item => {
    const category = categories.find(c => c.id === exp.categoryId);
    return {
      id: exp.id,
      description: exp.description,
      amount: String(exp.amount),
      categoryId: exp.categoryId,
      parentId: category?.parentId || null,
      notes: exp.notes || '',
      payers: exp.payers,
      splitMode: 'equally',
      splitDetails: exp.splitDetails,
    };
  };

  const defaultNewItem = (): Item => {
    const youPayer: TripPayer = { contactId: USER_SELF_ID, amount: 0 };
    const youSplit: SplitDetail = {
      id: USER_SELF_ID, personName: 'You', amount: 0, isSettled: true,
      shares: '1', percentage: '100',
    };

    return {
      id: self.crypto.randomUUID(),
      description: '',
      amount: '',
      categoryId: '',
      parentId: null,
      notes: '',
      payers: [youPayer],
      splitMode: 'equally',
      splitDetails: [youSplit],
    };
  };

  const [items, setItems] = useState<Item[]>(isEditing ? [initialItemFromExpense(expenseToEdit!)] : [defaultNewItem()]);
  const [activeSubMenu, setActiveSubMenu] = useState<{ itemId: string, type: 'payers' | 'split' | null }>({ itemId: '', type: null });

  const topLevelExpenseCategories = useMemo(() => categories.filter(c => c.type === TransactionType.EXPENSE && !c.parentId), [categories]);

  const calculateSplits = useCallback((participants: SplitDetail[], totalAmount: number, mode: SplitMode): SplitDetail[] => {
    let newParticipants = [...participants];
    const numParticipants = newParticipants.length;
    if (numParticipants === 0 || totalAmount === 0) return newParticipants.map(p => ({ ...p, amount: 0 }));

    switch (mode) {
      case 'equally':
        const splitAmount = totalAmount / numParticipants;
        return newParticipants.map(p => ({ ...p, amount: splitAmount }));
      case 'percentage':
        let totalPercentage = newParticipants.reduce((sum, p) => sum + (parseFloat(p.percentage || '0') || 0), 0);
        if (totalPercentage === 0 && numParticipants > 0) totalPercentage = 100;
        return newParticipants.map(p => ({ ...p, amount: ((parseFloat(p.percentage || '0') || 0) / totalPercentage) * totalAmount }));
      case 'shares':
        let totalShares = newParticipants.reduce((sum, p) => sum + (parseFloat(p.shares || '0') || 0), 0);
        if (totalShares === 0 && numParticipants > 0) totalShares = numParticipants;
        return newParticipants.map(p => ({ ...p, amount: ((parseFloat(p.shares || '0') || 0) / totalShares) * totalAmount }));
      case 'manual':
      default:
        return newParticipants;
    }
  }, []);

  /** 🔑 FIX: inline payer creation */
  const handlePayerChange = (itemId: string, index: number, input: string, amount: string) => {
    let participant = participants.find(
      p => p.contactId === input || p.name.toLowerCase() === input.toLowerCase()
    );

    // Create new if not found
    if (!participant && input.trim() !== '') {
      const newContact = onSaveContact({ name: input.trim(), groupId: 'group-friends' });
      participant = { contactId: newContact.id, name: newContact.name };
      setParticipants(prev => [...prev, participant!]);
    }

    setItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        const newPayers = [...item.payers];
        newPayers[index] = { contactId: participant?.contactId || input, amount: parseFloat(amount) || 0 };
        return { ...item, payers: newPayers };
      }
      return item;
    }));
  };

  const handleAddPayer = (itemId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, payers: [...item.payers, { contactId: '', amount: 0 }] };
      }
      return item;
    }));
  };

  const handleRemovePayer = (itemId: string, index: number) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, payers: item.payers.filter((_, i) => i !== index) } : item));
  };

  const handleItemChange = (itemId: string, field: keyof Omit<Item, 'payers' | 'splitDetails'>, value: any) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        let updatedItem = { ...item, [field]: value };
        if (field === 'amount') {
          const totalAmount = parseFloat(value) || 0;
          updatedItem.splitDetails = calculateSplits(updatedItem.splitDetails, totalAmount, updatedItem.splitMode);
          updatedItem.payers = [{ contactId: USER_SELF_ID, amount: totalAmount }];
        }
        if (field === 'parentId') {
          updatedItem.categoryId = '';
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.map(item => {
      const amount = parseFloat(item.amount) || 0;
      const payersTotal = item.payers.reduce((sum, p) => sum + p.amount, 0);
      const isValid = amount > 0 && Math.abs(amount - payersTotal) < 0.01 && (item.categoryId || item.parentId);
      if (!isValid) return null;
      return {
        id: item.id,
        description: item.description,
        amount,
        categoryId: item.categoryId || item.parentId!,
        payers: item.payers,
        splitDetails: item.splitDetails,
        notes: item.notes,
      };
    }).filter(Boolean) as (Omit<TripExpense, 'tripId' | 'date'>)[];

    if (validItems.length > 0) {
      if (isEditing) onUpdate(validItems[0]);
      else onSave(validItems);
    } else {
      alert("Please ensure each item has a description, amount, category, and that 'Who Paid' total matches the item amount.");
    }
  };

  const renderItemCard = (item: Item) => {
    const itemSubCategories = item.parentId ? categories.filter(c => c.parentId === item.parentId && c.type === 'expense') : [];
    const payersTotal = item.payers.reduce((sum, p) => sum + p.amount, 0);
    const itemAmount = parseFloat(item.amount) || 0;
    const payerDifference = itemAmount - payersTotal;

    return (
      <div key={item.id} className="p-3 bg-subtle rounded-lg space-y-3 border border-divider relative">
        {!isEditing && items.length > 1 && (
          <button type="button" onClick={() => setItems(prev => prev.filter(it => it.id !== item.id))} className="absolute top-2 right-2 p-1 text-secondary hover:text-rose-400 bg-subtle rounded-full z-10">&times;</button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="Item Description" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="input-base w-full p-2 rounded-md col-span-2" required />
          <div className="relative">
            <input type="number" step="0.01" min="0.01" placeholder="Amount" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} className="input-base w-full p-2 rounded-md no-spinner pr-8" required />
            <button type="button" onClick={() => onOpenCalculator(result => handleItemChange(item.id, 'amount', String(result)))} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zM6 7a1 1 0 011-1h2a1 1 0 110 2H7a1 1 0 01-1-1zm0 4a1 1 0 011-1h5a1 1 0 110 2H7a1 1 0 01-1-1zm-2 4a1 1 0 000 2h8a1 1 0 100-2H4z" clipRule="evenodd" /></svg>
            </button>
          </div>
          <CustomSelect value={item.parentId || ''} onChange={val => handleItemChange(item.id, 'parentId', val)} options={topLevelExpenseCategories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}`}))} placeholder="Category" />
        </div>
        {item.parentId && itemSubCategories.length > 0 && <CustomSelect value={item.categoryId} onChange={val => handleItemChange(item.id, 'categoryId', val)} options={itemSubCategories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}`}))} placeholder="Subcategory" />}
        <div className="flex gap-2">
          <button type="button" onClick={() => setActiveSubMenu(prev => ({itemId: item.id, type: prev.type === 'payers' ? null : 'payers'}))} className={`button-secondary text-xs px-3 py-1 flex-1 ${activeSubMenu.itemId === item.id && activeSubMenu.type === 'payers' ? 'bg-emerald-500 text-white' : ''}`}>Who Paid?</button>
          <button type="button" onClick={() => setActiveSubMenu(prev => ({itemId: item.id, type: prev.type === 'split' ? null : 'split'}))} className={`button-secondary text-xs px-3 py-1 flex-1 ${activeSubMenu.itemId === item.id && activeSubMenu.type === 'split' ? 'bg-emerald-500 text-white' : ''}`}>Split Between</button>
        </div>

        {/* PAYERS SUBMENU */}
        {activeSubMenu.itemId === item.id && activeSubMenu.type === 'payers' && (
          <div className="p-3 bg-subtle rounded-lg border border-divider animate-fadeInUp">
            {item.payers.map((payer, index) => {
              const existingParticipant = participants.find(p => p.contactId === payer.contactId);
              const payerName = existingParticipant ? existingParticipant.name : payer.contactId;

              return (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={payerName}
                    onChange={e => handlePayerChange(item.id, index, e.target.value, String(payer.amount))}
                    className="input-base flex-1 p-2 rounded-md"
                    placeholder="Enter name"
                  />
                  <input type="number" step="0.01" value={payer.amount || ''} onChange={e => handlePayerChange(item.id, index, payerName, e.target.value)} className="input-base w-24 p-2 rounded-md no-spinner" />
                  {item.payers.length > 1 && <button type="button" onClick={() => handleRemovePayer(item.id, index)} className="text-rose-400">&times;</button>}
                </div>
              );
            })}
            <button type="button" onClick={() => handleAddPayer(item.id)} className="text-xs text-sky-400">+ Add another payer</button>
            <p className={`text-xs text-right mt-2 ${Math.abs(payerDifference) > 0.01 ? 'text-rose-400' : 'text-emerald-400'}`}>
              Remaining: {formatCurrency(payerDifference)}
            </p>
          </div>
        )}
      </div>
    );
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={isEditing ? `Edit Expense` : `Add Expense to ${trip.name}`} onClose={onClose} />
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
          {items.map(renderItemCard)}
          {!isEditing && <button type="button" onClick={() => setItems(prev => [...prev, defaultNewItem()])} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400"> + Add Another Item </button>}
          <div className="flex justify-end gap-3 pt-4 border-t border-divider">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2">{isEditing ? 'Save Changes' : 'Save Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AddTripExpenseModal;
