import React, { useState, useMemo, useContext } from 'react';
import { Trip, TripExpense, Category, Contact, ParsedTripExpense, SplitDetail, TransactionType, ItemizedDetail } from '../types';
import { parseTripExpenseText } from '../services/geminiService';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';
import SplitManager from './SplitManager';
import CustomSelect from './CustomSelect';
import { USER_SELF_ID } from '../constants';
import SplitItemModal from './SplitItemModal';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface Item {
    id: string;
    description: string;
    amount: string;
    categoryId: string;
    splitDetails: SplitDetail[];
}

interface AddTripExpenseModalProps {
    trip: Trip;
    expenseToEdit?: TripExpense;
    onClose: () => void;
    // Fix: Strengthened the 'onSave' prop type to ensure all required fields are passed.
    onSave: (expense: Omit<TripExpense, 'id' | 'tripId' | 'date'>) => void;
    onUpdate: (expense: TripExpense) => void;
    categories: Category[];
    findOrCreateCategory: (name: string, type: TransactionType) => string;
}

const AddTripExpenseModal: React.FC<AddTripExpenseModalProps> = ({
    trip, expenseToEdit, onClose, onSave, onUpdate, categories, findOrCreateCategory
}) => {
    const isEditing = !!expenseToEdit;
    const allParticipants = useMemo(() => [{ contactId: USER_SELF_ID, name: 'You' }, ...(trip.participants || [])], [trip.participants]);
    const formatCurrency = useCurrencyFormatter(undefined, trip.currency);
    
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [description, setDescription] = useState(expenseToEdit?.description || '');
    const [payers, setPayers] = useState<SplitDetail[]>(expenseToEdit?.payers.map(p => ({ id: p.contactId, personName: allParticipants.find(ap => ap.contactId === p.contactId)?.name || '', amount: p.amount, isSettled: false })) || [{ id: USER_SELF_ID, personName: 'You', amount: expenseToEdit?.amount || 0, isSettled: true }]);
    const [payerMode, setPayerMode] = useState<"manual" | "equally">('manual');
    const [itemToSplit, setItemToSplit] = useState<Item | null>(null);

    const initialItems = useMemo(() => {
        if (expenseToEdit?.itemizedDetails && expenseToEdit.itemizedDetails.length > 0) {
            return expenseToEdit.itemizedDetails.map(d => ({
                id: self.crypto.randomUUID(),
                description: d.description,
                amount: String(d.amount),
                categoryId: d.categoryId,
                splitDetails: d.splitDetails || [],
            }));
        }
        return [{ id: self.crypto.randomUUID(), description: expenseToEdit?.description || '', amount: expenseToEdit?.amount.toString() || '', categoryId: expenseToEdit?.categoryId || '', splitDetails: expenseToEdit?.splitDetails || [] }];
    }, [expenseToEdit]);

    const [items, setItems] = useState<Item[]>(initialItems);

    const itemizedTotal = useMemo(() => items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0), [items]);
    
    const expenseCategories = useMemo(() => categories.filter(c => c.type === TransactionType.EXPENSE && !c.parentId), [categories]);

    const handleItemChange = (id: string, field: keyof Item, value: any) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const handleAddItem = () => setItems(prev => [...prev, { id: self.crypto.randomUUID(), description: '', amount: '', categoryId: '', splitDetails: [] }]);
    const handleRemoveItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

    const handleSubmit = () => {
        const expenseAmount = itemizedTotal;
        if (isNaN(expenseAmount) || expenseAmount <= 0 || !description) {
            alert("Please fill in description and item amounts.");
            return;
        }

        const finalPayers = payers.map(p => ({ contactId: p.id, amount: p.amount }));
        const finalItemizedDetails: ItemizedDetail[] = items
            .filter(i => i.description.trim() && parseFloat(i.amount) > 0 && i.categoryId)
            .map(i => ({ description: i.description, amount: parseFloat(i.amount), categoryId: i.categoryId, splitDetails: i.splitDetails }));

        if (finalItemizedDetails.length === 0) {
            alert("Please add at least one valid item with a category.");
            return;
        }
        
        // Calculate top-level split from itemized splits
        const finalSplitDetailsMap = new Map<string, {name: string, amount: number}>();
        finalItemizedDetails.forEach(item => {
            (item.splitDetails || []).forEach(split => {
                const current = finalSplitDetailsMap.get(split.id) || { name: split.personName, amount: 0 };
                current.amount += split.amount;
                finalSplitDetailsMap.set(split.id, current);
            });
        });

        const finalSplitDetails: SplitDetail[] = Array.from(finalSplitDetailsMap.entries()).map(([id, data]) => ({
            id, personName: data.name, amount: data.amount, isSettled: id === USER_SELF_ID
        }));

        // Fix: Use a more specific type for expenseData to match the onSave prop.
        const expenseData: Omit<TripExpense, 'id' | 'tripId' | 'date'> = {
            description,
            amount: expenseAmount,
            categoryId: finalItemizedDetails[0].categoryId,
            payers: finalPayers,
            splitDetails: finalSplitDetails,
            itemizedDetails: finalItemizedDetails,
        };
        
        if (isEditing) {
            onUpdate({ ...expenseToEdit!, ...expenseData });
        } else {
            onSave(expenseData);
        }
        onClose();
    };

    const handleSaveItemSplit = (splits: SplitDetail[]) => {
        if (!itemToSplit) return;
        handleItemChange(itemToSplit.id, 'splitDetails', splits);
        setItemToSplit(null);
    };

    const getSplitSummary = (item: Item) => {
        if (!item.splitDetails || item.splitDetails.length === 0) return 'Not split';
        if (item.splitDetails.length === 1) return `For ${item.splitDetails[0].personName}`;
        return `Split between ${item.splitDetails.length} people`;
    };
    
    return (
        <>
            {itemToSplit && (
                <SplitItemModal
                    item={{ description: itemToSplit.description, amount: parseFloat(itemToSplit.amount) || 0 }}
                    initialSplitDetails={itemToSplit.splitDetails || []}
                    onSave={handleSaveItemSplit}
                    onClose={() => setItemToSplit(null)}
                    participants={allParticipants}
                    currency={trip.currency}
                />
            )}
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                    <ModalHeader title={isEditing ? 'Edit Trip Expense' : 'Add Trip Expense'} onClose={onClose} />
                    <div className="flex-grow overflow-y-auto p-6 space-y-4">
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Overall Description (e.g., Dinner at Beach Shack)" className="input-base w-full p-2 rounded-lg" required />
                        
                        {items.map((item) => (
                           <div key={item.id} className="itemized-item-card">
                               <div className="flex items-start gap-2">
                                   <div className="flex-grow space-y-2">
                                       <input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} placeholder="Item Description" className="input-base p-2 rounded-md w-full" required />
                                       <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
                                           <input type="number" step="0.01" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} placeholder="0.00" className="input-base p-2 rounded-md w-full no-spinner" required />
                                           <span className="p-2 text-center text-secondary">in</span>
                                           <CustomSelect value={item.categoryId} onChange={val => handleItemChange(item.id, 'categoryId', val)} options={[{value: '', label: 'Category'}, ...expenseCategories.map(c => ({value: c.id, label: c.name}))]} />
                                       </div>
                                   </div>
                                   {items.length > 1 && <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1 text-rose-400 hover:text-rose-300 rounded-full flex-shrink-0" aria-label="Remove item"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                               </div>
                               <div className="mt-2 pt-2 border-t border-divider flex justify-between items-center">
                                    <span className="text-xs text-secondary">{getSplitSummary(item)}</span>
                                    <button type="button" onClick={() => setItemToSplit(item)} className="button-secondary text-xs px-3 py-1">Split Item</button>
                               </div>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddItem} className="w-full text-center p-2 text-sm text-sky-400 hover:text-sky-300">+ Add Item</button>

                        <SplitManager
                            title="Paid By"
                            mode={payerMode}
                            onModeChange={(m) => setPayerMode(m as any)}
                            participants={payers}
                            onParticipantsChange={setPayers}
                            totalAmount={itemizedTotal}
                            allParticipants={allParticipants}
                            formatCurrency={formatCurrency}
                            isPayerManager
                        />
                    </div>
                    <div className="flex-shrink-0 p-4 border-t border-divider flex justify-between items-center">
                        <span className="font-semibold text-lg">Total: <span className="text-primary">{formatCurrency(itemizedTotal)}</span></span>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                            <button onClick={handleSubmit} className="button-primary px-4 py-2">{isEditing ? 'Save Changes' : 'Add Expense'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddTripExpenseModal;
