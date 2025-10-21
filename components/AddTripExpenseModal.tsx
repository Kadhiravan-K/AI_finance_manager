import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Trip, TripExpense, Category, Contact, ParsedTripExpense, SplitDetail, TransactionType, ItemizedDetail, USER_SELF_ID, TRIP_FUND_ID, ActiveModal } from '../types';
import { parseTripExpenseText } from '../services/geminiService';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';
import { SplitManager } from './SplitManager';
import CustomSelect from './CustomSelect';
import SplitItemModal from './SplitItemModal';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomDatePicker from './CustomDatePicker';

interface Item {
    id: string;
    description: string;
    amount: string;
    splitDetails: SplitDetail[];
}

type SplitMode = 'equally' | 'percentage' | 'shares' | 'manual';

interface AddTripExpenseModalProps {
    trip: Trip;
    expenseToEdit?: TripExpense;
    initialExpenseData?: Partial<Omit<TripExpense, 'id'>>;
    onClose: () => void;
    onSave: (expense: Omit<TripExpense, 'id' | 'tripId'>) => void;
    onUpdate: (expense: TripExpense) => void;
    categories: Category[];
    findOrCreateCategory: (name: string, type: TransactionType) => string;
    openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

const AddTripExpenseModal: React.FC<AddTripExpenseModalProps> = ({
    trip, expenseToEdit, initialExpenseData, onClose, onSave, onUpdate, categories, findOrCreateCategory, openModal
}) => {
    const isEditing = !!expenseToEdit;
    const initialData = expenseToEdit || initialExpenseData;
    const allParticipants = useMemo(() => [{ contactId: USER_SELF_ID, name: 'You' }, ...(trip.participants || [])], [trip.participants]);
    const formatCurrency = useCurrencyFormatter(undefined, trip.currency);
    
    const [isLoading, setIsLoading] = useState(false);

    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(isEditing && expenseToEdit?.date ? new Date(expenseToEdit.date) : new Date());
    const [time, setTime] = useState(isEditing && expenseToEdit?.date ? new Date(expenseToEdit.date).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5));

    const initialCategory = useMemo(() => isEditing ? categories.find(c => c.id === expenseToEdit.categoryId) : null, [isEditing, expenseToEdit, categories]);
    const [categoryId, setCategoryId] = useState(initialCategory?.parentId || (initialCategory ? initialCategory.id : ''));
    const [subCategoryId, setSubCategoryId] = useState(initialCategory?.parentId ? initialCategory.id : '');

    const [payers, setPayers] = useState<SplitDetail[]>(initialData?.payers?.map(p => ({ id: p.contactId, personName: allParticipants.find(ap => ap.contactId === p.contactId)?.name || '', amount: p.amount, isSettled: false, shares: '1', percentage: '0' })) || [{ id: USER_SELF_ID, personName: 'You', amount: initialData?.amount || 0, isSettled: true, shares: '1', percentage: '100' }]);
    const [payerMode, setPayerMode] = useState<SplitMode>('manual');
    const [itemToSplit, setItemToSplit] = useState<Item | null>(null);

    const initialItems = useMemo(() => {
        if (initialData?.itemizedDetails && initialData.itemizedDetails.length > 0) {
            return initialData.itemizedDetails.map(d => ({
                id: self.crypto.randomUUID(),
                description: d.description,
                amount: String(d.amount),
                splitDetails: d.splitDetails || [],
            }));
        }
        return [{ id: self.crypto.randomUUID(), description: initialData?.description || '', amount: initialData?.amount?.toString() || '', splitDetails: initialData?.splitDetails || [] }];
    }, [initialData]);

    const [items, setItems] = useState<Item[]>(initialItems);

    const itemizedTotal = useMemo(() => items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0), [items]);
    
    useEffect(() => {
        if (payerMode === 'manual') return;
        const numPayers = payers.length;
        if (numPayers === 0 || itemizedTotal === 0) return;

        let updatedPayers: SplitDetail[];
        switch (payerMode) {
            case 'equally':
                const splitAmount = itemizedTotal / numPayers;
                updatedPayers = payers.map(p => ({ ...p, amount: splitAmount }));
                break;
            case 'percentage':
                let totalPercentage = payers.reduce((sum, p) => sum + (parseFloat(p.percentage || '0') || 0), 0) || 100;
                updatedPayers = payers.map(p => ({ ...p, amount: ((parseFloat(p.percentage || '0') || 0) / totalPercentage) * itemizedTotal }));
                break;
            case 'shares':
                let totalShares = payers.reduce((sum, p) => sum + (parseFloat(p.shares || '0') || 0), 0) || numPayers;
                updatedPayers = payers.map(p => ({ ...p, amount: ((parseFloat(p.shares || '0') || 0) / totalShares) * itemizedTotal }));
                break;
            default:
                updatedPayers = [...payers];
        }
        setPayers(updatedPayers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payerMode, itemizedTotal, payers.length]);

    const allPayers = useMemo(() => [
        { contactId: TRIP_FUND_ID, name: '💰 Trip Fund' },
        ...allParticipants
    ], [allParticipants]);

    const expenseCategories = useMemo(() => categories.filter(c => c.type === TransactionType.EXPENSE && !c.parentId), [categories]);
    const subCategories = useMemo(() => categories.filter(c => c.parentId === categoryId), [categories, categoryId]);

    const handleItemChange = (id: string, field: keyof Item, value: any) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const handleAddItem = () => setItems(prev => [...prev, { id: self.crypto.randomUUID(), description: '', amount: '', splitDetails: [] }]);
    const handleRemoveItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

    const handleSubmit = () => {
        const expenseAmount = itemizedTotal;
        const finalCategoryId = subCategoryId || categoryId;
        
        if (isNaN(expenseAmount) || expenseAmount <= 0 || !description || !finalCategoryId) {
            alert("Please fill in description, category, and item amounts.");
            return;
        }

        const finalPayers = payers.map(p => ({ contactId: p.id, amount: p.amount }));
        const finalItemizedDetails: ItemizedDetail[] = items
            .filter(i => i.description.trim() && parseFloat(i.amount) > 0)
            .map(i => ({ description: i.description, amount: parseFloat(i.amount), categoryId: finalCategoryId, splitDetails: i.splitDetails }));

        if (finalItemizedDetails.length === 0) {
            alert("Please add at least one valid item.");
            return;
        }
        
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

        const finalDate = new Date(date);
        const [hours, minutes] = time.split(':').map(Number);
        finalDate.setHours(hours, minutes);

        const expenseData: Omit<TripExpense, 'id' | 'tripId'> = {
            description,
            amount: expenseAmount,
            categoryId: finalCategoryId,
            date: finalDate.toISOString(),
            notes: undefined,
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
        if (!item.splitDetails || item.splitDetails.length === 0) return 'Split equally';
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
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Overall Description (e.g., Dinner)" className="input-base w-full p-2 rounded-lg" required />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-secondary mb-1">Date</label>
                                <CustomDatePicker value={date} onChange={setDate} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-secondary mb-1">Time</label>
                                <button type="button" onClick={() => openModal('timePicker', { initialTime: time, onSave: setTime })} className="input-base p-2 rounded-lg w-full text-left">{time}</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-secondary mb-1">Category</label>
                                <CustomSelect options={expenseCategories.map(c => ({value: c.id, label: `${c.icon || '📁'} ${c.name}`}))} value={categoryId} onChange={setCategoryId} placeholder="Select Category" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-secondary mb-1">Subcategory</label>
                                <CustomSelect options={subCategories.map(c => ({value: c.id, label: `${c.icon || '📁'} ${c.name}`}))} value={subCategoryId} onChange={setSubCategoryId} placeholder="-" disabled={!categoryId || subCategories.length === 0} />
                            </div>
                        </div>

                        {items.map((item) => (
                           <div key={item.id} className="itemized-item-card">
                               <div className="flex items-start gap-2">
                                   <div className="flex-grow grid grid-cols-[1fr_auto] gap-2">
                                       <input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} placeholder="Item Description" className="input-base p-2 rounded-md w-full" required />
                                       <input type="number" step="0.01" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} placeholder="0.00" className="input-base p-2 rounded-md w-full no-spinner" required />
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
                            onModeChange={setPayerMode}
                            participants={payers}
                            onParticipantsChange={setPayers}
                            totalAmount={itemizedTotal}
                            allParticipants={allPayers}
                            formatCurrency={formatCurrency}
                            isPayerManager
                        />
                    </div>
                    <div className="flex-shrink-0 p-4 border-t border-divider flex justify-between items-center">
                        <span className="font-semibold text-lg">Total: <span className="text-primary">{formatCurrency(itemizedTotal)}</span></span>
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                            <button type="button" onClick={handleSubmit} className="button-primary px-4 py-2">{isEditing ? 'Save Changes' : 'Add Expense'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddTripExpenseModal;