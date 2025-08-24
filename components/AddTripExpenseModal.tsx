import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Trip, Category, TransactionType, SplitDetail, TripPayer, Contact } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomCheckbox from './CustomCheckbox';
import EditTransactionModal from './EditTransactionModal'; // To borrow the split manager logic/UI

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

const inputBaseClasses = "w-full rounded-lg py-2 px-3 shadow-inner transition-all duration-200 input-base";

const AddTripExpenseModal: React.FC<AddTripExpenseModalProps> = ({ trip, onClose, onSave, categories }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [splittingItemId, setSplittingItemId] = useState<string | null>(null);
  const [payerItemId, setPayerItemId] = useState<string | null>(null);
  
  const formatCurrency = useCurrencyFormatter();

  // This logic is adapted from EditTransactionModal
  const calculateSplits = useCallback((participants: SplitDetail[], totalAmount: number, mode: SplitMode): SplitDetail[] => {
    let newParticipants = [...participants];
    const numParticipants = newParticipants.length;
    if (numParticipants === 0 || totalAmount <= 0) return newParticipants.map(p => ({ ...p, amount: 0 }));

    switch (mode) {
      case 'equally':
        const splitAmount = totalAmount / numParticipants;
        return newParticipants.map(p => ({ ...p, amount: splitAmount }));
      case 'percentage':
        let totalPercentage = newParticipants.reduce((sum, p) => sum + (parseFloat(p.percentage || '0') || 0), 0);
        if (totalPercentage === 0) totalPercentage = 100;
        return newParticipants.map(p => {
            const percentage = parseFloat(p.percentage || '0') || 0;
            return { ...p, amount: (percentage / totalPercentage) * totalAmount };
        });
      case 'shares':
        let totalShares = newParticipants.reduce((sum, p) => sum + (parseFloat(p.shares || '0') || 0), 0);
        if (totalShares === 0) totalShares = numParticipants;
        return newParticipants.map(p => {
            const shares = parseFloat(p.shares || '0') || 0;
            return { ...p, amount: (shares / totalShares) * totalAmount };
        });
      case 'manual':
        return newParticipants.map(p => ({...p, amount: p.amount || 0}));
    }
    return newParticipants;
  }, []);
  
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
  
  const handlePayerChange = (itemId: string, contactId: string, amountStr: string) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id !== itemId) return item;
      const amount = parseFloat(amountStr) || 0;
      const existingPayerIndex = item.payers.findIndex(p => p.contactId === contactId);
      let newPayers = [...item.payers];
      if (existingPayerIndex > -1) {
        if (amount > 0) newPayers[existingPayerIndex] = { contactId, amount };
        else newPayers.splice(existingPayerIndex, 1);
      } else if (amount > 0) {
        newPayers.push({ contactId, amount });
      }
      return { ...item, payers: newPayers };
    }));
  };
  
  const handleAddItem = useCallback(() => {
    const travelCat = categories.find(c => c.name === 'Travel & Transport' && c.type === TransactionType.EXPENSE);
    const initialSplitDetails = trip.participants.map(p => ({
        id: p.contactId, personName: p.name, amount: 0, isSettled: false, shares: '1', percentage: '0'
    }));
    const newId = self.crypto.randomUUID();
    setItems(prev => [...prev, {
      id: newId,
      description: '',
      amount: '',
      categoryId: travelCat?.id || '',
      payers: [{ contactId: trip.participants[0]?.contactId || '', amount: 0 }],
      splitMode: 'equally',
      splitDetails: initialSplitDetails
    }]);
    setPayerItemId(newId);
    setSplittingItemId(newId);
  }, [categories, trip.participants]);

  useEffect(() => { if (items.length === 0) handleAddItem(); }, [items.length, handleAddItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(item => {
        const itemAmount = parseFloat(item.amount);
        const totalPaid = item.payers.reduce((sum, p) => sum + p.amount, 0);
        return item.description.trim() && itemAmount > 0 && item.categoryId && Math.abs(totalPaid - itemAmount) < 0.01;
    }).map(item => ({
        description: item.description,
        amount: parseFloat(item.amount),
        categoryId: item.categoryId,
        payers: item.payers,
        splitDetails: item.splitDetails,
    }));

    if (validItems.length > 0) {
      onSave(validItems);
      onClose();
    } else {
        alert("Please ensure at least one item is filled out correctly. The 'Paid By' amount must equal the item's total amount.");
    }
  };
  
  const categoryOptions = useMemo(() => 
    categories
      .filter(c => c.type === TransactionType.EXPENSE && !c.parentId)
      .map(c => ({ value: c.id, label: `${c.icon} ${c.name}` })), 
    [categories]
  );
  
  const renderItem = (item: Item) => {
    const totalPaid = item.payers.reduce((sum, p) => sum + p.amount, 0);
    const itemAmount = parseFloat(item.amount) || 0;
    const remainder = itemAmount - totalPaid;

    return (
        <div key={item.id} className="p-3 bg-subtle rounded-lg space-y-3 border border-divider">
            <input type="text" placeholder="Item Description" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className={`${inputBaseClasses} font-semibold`} />
            <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" min="0.01" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} placeholder="Amount" className={`${inputBaseClasses} no-spinner`} />
                <CustomSelect options={categoryOptions} value={item.categoryId} onChange={val => handleItemChange(item.id, 'categoryId', val)} placeholder="Category" />
            </div>
            <div className="space-y-2">
                 <button type="button" onClick={() => setPayerItemId(payerItemId === item.id ? null : item.id)} className={`w-full text-left p-1.5 rounded-full border border-divider hover-bg-stronger text-xs text-center ${Math.abs(remainder) > 0.01 ? 'text-rose-400 border-rose-400' : 'text-emerald-400'}`}>
                    Paid By ({formatCurrency(totalPaid)}) - Remainder: {formatCurrency(remainder)}
                </button>
                 {payerItemId === item.id && (
                    <div className="p-3 bg-subtle rounded-md border border-divider space-y-2">
                        {trip.participants.map(p => (
                            <div key={p.contactId} className="flex items-center gap-2">
                                <span className="flex-1 text-sm text-primary">{p.name}</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="0.00"
                                    value={item.payers.find(payer => payer.contactId === p.contactId)?.amount || ''}
                                    onChange={e => handlePayerChange(item.id, p.contactId, e.target.value)}
                                    className={`${inputBaseClasses} no-spinner w-24 text-right`}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
             <button type="button" onClick={() => setSplittingItemId(splittingItemId === item.id ? null : item.id)} className={`w-full text-left p-1.5 rounded-full border border-divider hover-bg-stronger text-xs text-center text-sky-400`}>
                Manage Split
            </button>
            {splittingItemId === item.id && <EditTransactionModal transaction={{...item, splitDetails: item.splitDetails} as any} onSave={() => {}} onCancel={() => {}} accounts={[]} openModal={() => {}} onOpenCalculator={()=>{}} />}

        </div>
    );
  }

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={`Add Expense to ${trip.name}`} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-grow overflow-y-auto">
          {items.map(item => <EditTransactionModal transaction={{id: item.id, accountId: '', description: item.description, amount: parseFloat(item.amount) || 0, type: TransactionType.EXPENSE, categoryId: item.categoryId, date: new Date().toISOString(), splitDetails: item.splitDetails}} onSave={()=>{}} onCancel={()=>{}} accounts={[]} openModal={()=>{}} onOpenCalculator={()=>{}} /> )}
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