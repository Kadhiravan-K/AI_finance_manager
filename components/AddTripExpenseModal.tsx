import React, { useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Trip, Category, TransactionType, SplitDetail, TripPayer, Contact } from '../types';
import ModalHeader from './ModalHeader';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomSelect from './CustomSelect';
import CustomCheckbox from './CustomCheckbox';

const modalRoot = document.getElementById('modal-root')!;

interface AddTripExpenseModalProps {
  trip: Trip;
  onClose: () => void;
  onSave: (items: {
    description: string;
    amount: number;
    categoryId: string;
    payers: TripPayer[];
    splitDetails: SplitDetail[];
  }[]) => void;
  categories: Category[];
}

type SplitMode = 'equally' | 'percentage' | 'shares' | 'manual';

interface Item {
    id: string;
    description: string;
    amount: string;
    categoryId: string;
    parentId: string | null;
    payers: TripPayer[];
    splitMode: SplitMode;
    splitDetails: SplitDetail[];
}

const AddTripExpenseModal: React.FC<AddTripExpenseModalProps> = ({ trip, onClose, onSave, categories }) => {
    const formatCurrency = useCurrencyFormatter();
    const initialSplitDetails = useMemo(() => trip.participants.map(p => ({
        id: p.contactId, personName: p.name, amount: 0, isSettled: false, shares: '1', percentage: '100'
    })), [trip.participants]);

    const [items, setItems] = useState<Item[]>([{
        id: self.crypto.randomUUID(),
        description: '',
        amount: '0',
        categoryId: '',
        parentId: null,
        payers: [],
        splitMode: 'equally',
        splitDetails: initialSplitDetails
    }]);

    const [activeSubMenu, setActiveSubMenu] = useState<{ itemId: string, type: 'payers' | 'split' | null }>({ itemId: '', type: null });

    const topLevelExpenseCategories = useMemo(() => categories.filter(c => c.type === TransactionType.EXPENSE && !c.parentId), [categories]);

    const calculateSplits = useCallback((participants: SplitDetail[], totalAmount: number, mode: SplitMode): SplitDetail[] => {
        let newParticipants = [...participants];
        const numParticipants = newParticipants.length;
        if (numParticipants === 0) return [];
        switch (mode) {
            case 'equally':
                const splitAmount = totalAmount / numParticipants;
                return newParticipants.map(p => ({ ...p, amount: splitAmount }));
            case 'percentage':
                let totalPercentage = newParticipants.reduce((sum, p) => sum + (parseFloat(p.percentage || '0') || 0), 0);
                if(totalPercentage === 0 && numParticipants > 0) totalPercentage = 100;
                return newParticipants.map(p => ({ ...p, amount: ( (parseFloat(p.percentage || '0') / totalPercentage) * totalAmount) || 0 }));
            case 'shares':
                let totalShares = newParticipants.reduce((sum, p) => sum + (parseFloat(p.shares || '0') || 0), 0);
                 if(totalShares === 0 && numParticipants > 0) totalShares = numParticipants;
                return newParticipants.map(p => ({ ...p, amount: ( (parseFloat(p.shares || '1') / totalShares) * totalAmount) || 0 }));
            default: return newParticipants;
        }
    }, []);

    const handleItemChange = (itemId: string, field: keyof Omit<Item, 'payers' | 'splitDetails'>, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'amount') {
                    const newAmount = parseFloat(value) || 0;
                    updatedItem.splitDetails = calculateSplits(item.splitDetails, newAmount, item.splitMode);
                    if (updatedItem.payers.length === 1) {
                        updatedItem.payers = [{ ...updatedItem.payers[0], amount: newAmount }];
                    }
                }
                return updatedItem;
            }
            return item;
        }));
    };
    
    const handlePayerChange = (itemId: string, contactId: string, amount: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const newPayers = [...item.payers];
                const payerIndex = newPayers.findIndex(p => p.contactId === contactId);
                const parsedAmount = parseFloat(amount) || 0;
                if (payerIndex > -1) {
                    if (parsedAmount > 0) newPayers[payerIndex] = { ...newPayers[payerIndex], amount: parsedAmount };
                    else newPayers.splice(payerIndex, 1);
                } else if (parsedAmount > 0) {
                    newPayers.push({ contactId, amount: parsedAmount });
                }
                return { ...item, payers: newPayers };
            }
            return item;
        }));
    };
    
    const handleSplitDetailChange = (itemId: string, personId: string, field: 'percentage' | 'shares' | 'amount', value: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                let newDetails = item.splitDetails.map(p => p.id === personId ? {...p, [field]: value} : p);
                if (item.splitMode === 'manual') newDetails = newDetails.map(p => p.id === personId ? {...p, amount: parseFloat(value) || 0} : p);
                const newSplits = calculateSplits(newDetails, parseFloat(item.amount) || 0, item.splitMode);
                return { ...item, splitDetails: newSplits };
            }
            return item;
        }));
    };
    
    const handleRemoveParticipantFromSplit = (itemId: string, personId: string) => {
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          const newDetails = item.splitDetails.filter(p => p.id !== personId);
          return {...item, splitDetails: calculateSplits(newDetails, parseFloat(item.amount) || 0, item.splitMode)};
        }
        return item;
      }));
    };


    const handleAddItem = () => {
        setItems(prev => [...prev, { id: self.crypto.randomUUID(), description: '', amount: '0', categoryId: '', parentId: null, payers: [], splitMode: 'equally', splitDetails: initialSplitDetails }]);
    };
    const handleRemoveItem = (itemId: string) => setItems(prev => prev.filter(item => item.id !== itemId));
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validItems = items.filter(item => {
            const amount = parseFloat(item.amount) || 0;
            const payersTotal = item.payers.reduce((sum, p) => sum + p.amount, 0);
            return amount > 0 && Math.abs(amount - payersTotal) < 0.01 && item.categoryId;
        }).map(item => ({
            description: item.description,
            amount: parseFloat(item.amount),
            categoryId: item.categoryId,
            payers: item.payers,
            splitDetails: item.splitDetails
        }));

        if (validItems.length > 0) {
            onSave(validItems);
        } else {
            alert("Please ensure all items have a description, amount, category, and that 'Who Paid' total matches the item amount.");
        }
    };

    const renderPayersManager = (item: Item) => {
        const payersTotal = item.payers.reduce((sum, p) => sum + p.amount, 0);
        const itemAmount = parseFloat(item.amount) || 0;
        const remainder = itemAmount - payersTotal;

        return (
            <div className="p-3 bg-subtle rounded-lg space-y-3 border border-divider shadow-inner">
                <h4 className="text-sm font-semibold text-secondary">Who Paid?</h4>
                {trip.participants.map(p => (
                     <div key={p.contactId} className="flex items-center gap-2">
                        <label className="flex-grow text-primary text-sm">{p.name}</label>
                        <input type="number" placeholder="0.00" onChange={(e) => handlePayerChange(item.id, p.contactId, e.target.value)} value={item.payers.find(payer => payer.contactId === p.contactId)?.amount || ''} className="w-24 p-1 rounded-md text-right no-spinner input-base" />
                    </div>
                ))}
                <div className="text-xs text-right pt-2 border-t border-divider">
                    Remaining: <span className={`font-mono ${Math.abs(remainder) > 0.01 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(remainder)}</span>
                </div>
            </div>
        )
    };

    const renderSplitManager = (item: Item) => {
      const itemAmount = parseFloat(item.amount) || 0;
      const totalAssigned = item.splitDetails.reduce((sum, p) => sum + p.amount, 0);
      const remainder = itemAmount - totalAssigned;

       return (
        <div className="p-3 bg-subtle rounded-lg space-y-3 border border-divider shadow-inner">
            <h4 className="text-sm font-semibold text-secondary">Split Between</h4>
            {item.splitDetails.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                    <span className="font-semibold flex-grow truncate text-sm pl-1 text-primary">{p.personName}</span>
                    <span className="w-24 text-right font-mono text-sm text-primary">{formatCurrency(p.amount)}</span>
                    <button type="button" onClick={() => handleRemoveParticipantFromSplit(item.id, p.id)} className="text-rose-400 text-xl leading-none px-1 flex-shrink-0">&times;</button>
                </div>
            ))}
             <div className="text-xs text-right pt-2 border-t border-divider">
                Remaining: <span className={`font-mono ${Math.abs(remainder) > 0.01 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(remainder)}</span>
            </div>
        </div>
      )
    };
    
    const modalContent = (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
          <ModalHeader title={`Add Expense to ${trip.name}`} onClose={onClose} />
          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
            {items.map(item => (
                <div key={item.id} className="p-3 bg-subtle rounded-lg space-y-3 border border-divider">
                    <div className="flex items-start gap-2">
                        <div className="flex-grow space-y-2">
                            <input type="text" placeholder="Item Description" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="w-full input-base p-2 rounded-md" />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" min="0" step="0.01" placeholder="Amount" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} className="w-full input-base p-2 rounded-md no-spinner" />
                                <CustomSelect value={item.parentId || ''} onChange={val => {
                                    const subCats = categories.filter(c => c.parentId === val);
                                    handleItemChange(item.id, 'parentId', val);
                                    handleItemChange(item.id, 'categoryId', subCats.length > 0 ? '' : val);
                                }} options={topLevelExpenseCategories.map(cat => ({ value: cat.id, label: `${cat.icon} ${cat.name}` }))} placeholder="Category" />
                            </div>
                        </div>
                         <div className="flex flex-col space-y-1">
                             <button type="button" onClick={() => setActiveSubMenu(prev => ({itemId: item.id, type: prev.type === 'payers' && prev.itemId === item.id ? null : 'payers'}))} className={`px-2 py-1 text-xs rounded-full font-semibold transition-colors ${activeSubMenu.itemId === item.id && activeSubMenu.type === 'payers' ? 'bg-sky-500 text-white' : 'button-secondary'}`}>Who Paid?</button>
                             <button type="button" onClick={() => setActiveSubMenu(prev => ({itemId: item.id, type: prev.type === 'split' && prev.itemId === item.id ? null : 'split'}))} className={`px-2 py-1 text-xs rounded-full font-semibold transition-colors ${activeSubMenu.itemId === item.id && activeSubMenu.type === 'split' ? 'bg-sky-500 text-white' : 'button-secondary'}`}>Split</button>
                             {items.length > 1 && <button type="button" onClick={() => handleRemoveItem(item.id)} className="px-2 py-1 text-xs rounded-full font-semibold text-white bg-rose-500">Remove</button>}
                        </div>
                    </div>
                    {activeSubMenu.itemId === item.id && activeSubMenu.type === 'payers' && renderPayersManager(item)}
                    {activeSubMenu.itemId === item.id && activeSubMenu.type === 'split' && renderSplitManager(item)}
                </div>
            ))}
             <button type="button" onClick={handleAddItem} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400">
                + Add Item
            </button>
             <div className="flex justify-end gap-3 pt-4 border-t border-divider">
                <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                <button type="submit" className="button-primary px-4 py-2">Save Expense</button>
            </div>
          </form>
        </div>
      </div>
    );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AddTripExpenseModal;