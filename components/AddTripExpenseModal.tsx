import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Trip, TripExpense, Category, TransactionType, SplitDetail, TripPayer } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomCheckbox from './CustomCheckbox';

const modalRoot = document.getElementById('modal-root')!;

interface Item {
    id: string; // client-side UUID
    description: string;
    amount: string;
    categoryId: string;
    payers: TripPayer[];
    splitDetails: SplitDetail[];
}

interface AddTripExpenseModalProps {
  trip: Trip;
  onClose: () => void;
  onSave: (items: { description: string; amount: number; categoryId: string; payers: TripPayer[]; splitDetails: SplitDetail[]; }[]) => void;
  categories: Category[];
}

type SplitMode = 'equally' | 'percentage' | 'shares' | 'manual';

const AddTripExpenseModal: React.FC<AddTripExpenseModalProps> = ({ trip, onClose, onSave, categories }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [splittingItemId, setSplittingItemId] = useState<string | null>(null);

  const formatCurrency = useCurrencyFormatter();

  const calculateSplits = useCallback((participants: SplitDetail[], totalAmount: number, mode: SplitMode): SplitDetail[] => {
    let newParticipants = [...participants];
    const numParticipants = newParticipants.length;
    if (numParticipants === 0 || totalAmount <= 0) return newParticipants.map(p => ({ ...p, amount: 0 }));

    switch (mode) {
      case 'equally':
        const splitAmount = totalAmount / numParticipants;
        return newParticipants.map(p => ({ ...p, amount: splitAmount }));
      case 'manual':
        // No auto-calculation for manual
        return newParticipants;
      default: // percentage, shares
        return newParticipants.map(p => ({ ...p, amount: 0 })); // Simplified, full logic needed
    }
  }, []);

  const handleAddItem = () => {
    const travelCat = categories.find(c => c.name === 'Travel & Transport' && c.type === TransactionType.EXPENSE);
    setItems(prev => [...prev, {
      id: self.crypto.randomUUID(),
      description: '',
      amount: '',
      categoryId: travelCat?.id || '',
      payers: [{ contactId: trip.participants[0]?.contactId || '', amount: 0 }],
      splitDetails: trip.participants.map(p => ({ id: p.contactId, personName: p.name, amount: 0, isSettled: false, shares: '1', percentage: '0' }))
    }]);
  };
  
  useEffect(() => {
      if (items.length === 0) {
          handleAddItem();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(item => {
        const itemAmount = parseFloat(item.amount);
        const totalPaid = item.payers.reduce((sum, p) => sum + p.amount, 0);
        return item.description.trim() && itemAmount > 0 && item.categoryId && Math.abs(totalPaid - itemAmount) < 0.01;
    }).map(item => {
        const { id, ...rest } = item;
        return { ...rest, amount: parseFloat(item.amount) };
    });

    if (validItems.length > 0) {
      onSave(validItems);
      onClose();
    } else {
        alert("Please ensure at least one item is filled out correctly. The 'Paid By' amount must equal the item's total amount.");
    }
  };
  
  const handleItemChange = (itemId: string, field: keyof Item, value: any) => {
      setItems(prev => prev.map(item => {
          if (item.id !== itemId) return item;
          
          let updatedItem = { ...item, [field]: value };
          const totalAmount = parseFloat(updatedItem.amount) || 0;
          
          if (field === 'amount') {
              if (updatedItem.payers.length === 1) {
                  updatedItem.payers = [{...updatedItem.payers[0], amount: totalAmount}];
              }
              // Recalculate splits on amount change
              // For simplicity, this example just resets to equal split. A real app would preserve mode.
              updatedItem.splitDetails = calculateSplits(updatedItem.splitDetails, totalAmount, 'equally');
          }
          
          return updatedItem;
      }));
  }

  const handlePayerChange = (itemId: string, index: number, field: keyof TripPayer, value: any) => {
      setItems(prev => prev.map(item => {
          if (item.id !== itemId) return item;
          const newPayers = [...item.payers];
          (newPayers[index] as any)[field] = value;
          return {...item, payers: newPayers };
      }));
  }

  const categoryOptions = useMemo(() => 
    categories
      .filter(c => c.type === TransactionType.EXPENSE && !c.parentId)
      .map(c => ({ value: c.id, label: `${c.icon} ${c.name}` })), 
    [categories]
  );
  
  const renderItem = (item: Item) => {
      const totalPaid = item.payers.reduce((sum, p) => sum + p.amount, 0);
      return (
        <div key={item.id} className="p-3 bg-subtle rounded-lg space-y-3 border border-divider">
            <input type="text" placeholder="Item Description" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="w-full input-base p-2 rounded-md" />
            <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" min="0.01" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} placeholder="Amount" className="w-full input-base p-2 rounded-md no-spinner" />
                <CustomSelect options={categoryOptions} value={item.categoryId} onChange={val => handleItemChange(item.id, 'categoryId', val)} placeholder="Category" />
            </div>
            
            {/* Payers Section */}
            <div className="p-2 bg-subtle rounded-lg border border-divider">
                <h4 className="text-xs font-semibold text-secondary mb-2">Who Paid?</h4>
                {item.payers.map((payer, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                        <div className="flex-grow"><CustomSelect options={trip.participants.map(p => ({value: p.contactId, label: p.name}))} value={payer.contactId} onChange={val => handlePayerChange(item.id, index, 'contactId', val)} /></div>
                        <input type="number" step="0.01" value={payer.amount || ''} onChange={e => handlePayerChange(item.id, index, 'amount', parseFloat(e.target.value))} className="w-28 input-base p-2 rounded-md" />
                        {item.payers.length > 1 && <button type="button" onClick={() => handleItemChange(item.id, 'payers', item.payers.filter((_, i) => i !== index))} className="text-rose-400">&times;</button>}
                    </div>
                ))}
                <button type="button" onClick={() => handleItemChange(item.id, 'payers', [...item.payers, {contactId: '', amount: 0}])} className="text-xs text-sky-400 mt-1">+ Add another payer</button>
                <div className="text-xs text-right mt-1">
                    Remaining: <span className={Math.abs(parseFloat(item.amount) - totalPaid) > 0.01 ? 'text-rose-400' : 'text-emerald-400'}>{formatCurrency(parseFloat(item.amount) - totalPaid)}</span>
                </div>
            </div>

            <button type="button" onClick={() => setSplittingItemId(splittingItemId === item.id ? null : item.id)} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400 transition-all duration-200">
                Manage Split (Equal)
            </button>
        </div>
      );
  }

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={`Add Expense to ${trip.name}`} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-grow overflow-y-auto">
          {items.map(item => renderItem(item))}
          <button type="button" onClick={handleAddItem} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400 transition-all duration-200">
            + Add Another Item
          </button>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2">Add Expense(s)</button>
          </div>
        </form>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AddTripExpenseModal;
