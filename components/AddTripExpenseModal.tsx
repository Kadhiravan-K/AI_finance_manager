import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Trip, Category, TransactionType, SplitDetail, TripPayer } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import NumberStepper from './NumberStepper';
import CustomCheckbox from './CustomCheckbox';

const modalRoot = document.getElementById('modal-root')!;

interface Item {
    id: string; // client-side UUID
    description: string;
    amount: string;
    categoryId: string;
    payers: TripPayer[];
    splitMode: SplitMode;
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
  const [showContactPicker, setShowContactPicker] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  const formatCurrency = useCurrencyFormatter();

  const calculateSplits = useCallback((participants: SplitDetail[], totalAmount: number, mode: SplitMode): SplitDetail[] => {
    let newParticipants = [...participants];
    const numParticipants = newParticipants.length;
    if (numParticipants === 0 || totalAmount <= 0) return newParticipants.map(p => ({ ...p, amount: 0 }));

    switch (mode) {
      case 'equally':
        const splitAmount = totalAmount / numParticipants;
        return newParticipants.map(p => ({ ...p, amount: splitAmount }));
      // Full logic for other modes would be needed here
      default:
        return newParticipants;
    }
  }, []);

  const handleAddItem = useCallback(() => {
    const travelCat = categories.find(c => c.name === 'Travel & Transport' && c.type === TransactionType.EXPENSE);
    const initialSplitDetails = trip.participants.map(p => ({
        id: p.contactId, personName: p.name, amount: 0, isSettled: false, shares: '1', percentage: '0'
    }));

    setItems(prev => [...prev, {
      id: self.crypto.randomUUID(),
      description: '',
      amount: '',
      categoryId: travelCat?.id || '',
      payers: [{ contactId: trip.participants[0]?.contactId || '', amount: 0 }],
      splitMode: 'equally',
      splitDetails: initialSplitDetails
    }]);
  }, [categories, trip.participants]);

  useEffect(() => {
      if (items.length === 0) {
          handleAddItem();
      }
  }, [items.length, handleAddItem]);

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
  
  // Handlers for item changes, payer changes, etc. would go here, similar to EditTransactionModal
  const handleItemChange = (itemId: string, field: keyof Omit<Item, 'id'>, value: any) => {
    setItems(prevItems => prevItems.map(item => {
        if (item.id !== itemId) return item;
        let updatedItem = { ...item, [field]: value };
        const totalAmount = parseFloat(updatedItem.amount) || 0;
        if (field === 'amount' && updatedItem.payers.length === 1) {
            updatedItem.payers = [{...updatedItem.payers[0], amount: totalAmount}];
        }
        if (field === 'amount' || field === 'splitMode') {
            updatedItem.splitDetails = calculateSplits(updatedItem.splitDetails, totalAmount, updatedItem.splitMode as SplitMode);
        }
        return updatedItem;
    }));
  };

  const categoryOptions = useMemo(() => 
    categories
      .filter(c => c.type === TransactionType.EXPENSE && !c.parentId)
      .map(c => ({ value: c.id, label: `${c.icon} ${c.name}` })), 
    [categories]
  );
  
  const renderItem = (item: Item) => {
      // This is a simplified version. For full functionality, this would be much more complex,
      // mirroring the logic from EditTransactionModal.
      return (
        <div key={item.id} className="p-3 bg-subtle rounded-lg space-y-3 border border-divider">
            <input type="text" placeholder="Item Description" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="w-full input-base p-2 rounded-md" />
            <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" min="0.01" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} placeholder="Amount" className="w-full input-base p-2 rounded-md no-spinner" />
                <CustomSelect options={categoryOptions} value={item.categoryId} onChange={val => handleItemChange(item.id, 'categoryId', val)} placeholder="Category" />
            </div>
            {/* Simplified Payer and Split Management for brevity */}
            <p className="text-xs text-secondary">Advanced splitting options would appear here.</p>
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