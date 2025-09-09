import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Transaction, Account, Contact, TransactionType, Category, ActiveModal, ItemizedDetail } from '../types';
import { SettingsContext, AppDataContext } from '../contexts/SettingsContext';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import ToggleSwitch from './ToggleSwitch';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';

interface Item {
    id: string;
    description: string;
    amount: string;
    categoryId: string;
    parentId: string | null;
}

interface EditTransactionModalProps {
    transaction: Transaction;
    onSave: (data: Transaction) => void;
    onCancel: () => void;
    accounts: Account[];
    contacts: Contact[];
    openModal: (name: ActiveModal, props?: Record<string, any>) => void;
    onOpenCalculator: (onResult: (result: number) => void) => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    transaction, onSave, onCancel, accounts, contacts, openModal, onOpenCalculator
}) => {
    const { categories, settings } = useContext(SettingsContext);
    const formatCurrency = useCurrencyFormatter();
    
    // High-level state
    const [isItemized, setIsItemized] = useState(!!transaction.itemizedDetails && transaction.itemizedDetails.length > 0);
    
    // Non-itemized state
    const [amount, setAmount] = useState(String(transaction.amount));
    const [type, setType] = useState<TransactionType>(transaction.type);
    const [description, setDescription] = useState(transaction.description);
    const [notes, setNotes] = useState(transaction.notes || '');

    const initialCategory = useMemo(() => categories.find(c => c.id === transaction.categoryId), [transaction.categoryId, categories]);
    const [categoryId, setCategoryId] = useState(initialCategory?.parentId || (initialCategory ? initialCategory.id : ''));
    const [subCategoryId, setSubCategoryId] = useState(initialCategory?.parentId ? initialCategory.id : '');
    
    // Itemized state
    const initialItems = useMemo(() => {
        if (transaction.itemizedDetails && transaction.itemizedDetails.length > 0) {
            return transaction.itemizedDetails.map(detail => {
                const category = categories.find(c => c.id === detail.categoryId);
                return {
                    id: self.crypto.randomUUID(), description: detail.description, amount: String(detail.amount), categoryId: detail.categoryId, parentId: category?.parentId || null,
                };
            });
        }
        const category = categories.find(c => c.id === transaction.categoryId);
        return [{
            id: self.crypto.randomUUID(), description: transaction.description, amount: String(transaction.amount), categoryId: category?.parentId ? transaction.categoryId : '', parentId: category?.parentId ? category.parentId : transaction.categoryId,
        }];
    }, [transaction, categories]);
    const [items, setItems] = useState<Item[]>(initialItems);

    const itemizedTotal = useMemo(() => items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0), [items]);
    const topLevelCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
    const topLevelCategoriesByType = useMemo(() => categories.filter(c => !c.parentId && c.type === type), [categories, type]);
    const subCategories = useMemo(() => categories.filter(c => c.parentId === categoryId), [categories, categoryId]);
    
    const handleItemChange = (id: string, field: keyof Item, value: string | null) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const handleAddItem = () => setItems(prev => [...prev, {id: self.crypto.randomUUID(), description: '', amount: '', categoryId: '', parentId: null}]);
    const handleRemoveItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let transactionData: Transaction;

        if (isItemized) {
            const finalAmount = itemizedTotal;
            if (isNaN(finalAmount) || finalAmount <= 0) { alert("Please enter valid amounts."); return; }
            
            const itemizedDetails: ItemizedDetail[] | undefined = items
                .filter(i => i.description.trim() && parseFloat(i.amount) > 0 && (i.categoryId || i.parentId))
                .map(i => ({ description: i.description, amount: parseFloat(i.amount), categoryId: i.categoryId || i.parentId! }));

            if (!itemizedDetails || itemizedDetails.length === 0) { alert("Please fill out at least one valid item."); return; }
            
            const primaryCategory = categories.find(c => c.id === itemizedDetails[0].categoryId);
            if (!primaryCategory) { alert("Please select a valid category."); return; }

            transactionData = { ...transaction, description: description || `${items[0].description} & more`, amount: finalAmount, type: primaryCategory.type, categoryId: primaryCategory.id, notes, itemizedDetails };
        } else {
            const finalAmount = parseFloat(amount);
            if (isNaN(finalAmount) || finalAmount <= 0) { alert("Please enter a valid amount."); return; }
            if (!categoryId) { alert("Please select a category."); return; }

             transactionData = { ...transaction, description, amount: finalAmount, type, categoryId: subCategoryId || categoryId, notes, itemizedDetails: undefined };
        }
        onSave(transactionData);
    };

    return (
       <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg border border-divider opacity-0 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <ModalHeader title="Edit Transaction" onClose={onCancel} />
                 <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {!isItemized ? (
                            <div className="space-y-4 animate-fadeInUp">
                                 <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-secondary mb-1">Amount ({settings.currency})</label>
                                        <div className="relative"><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="input-base w-full p-2 rounded-lg" required /><button type="button" onClick={() => onOpenCalculator(res => setAmount(String(res)))} className="absolute right-2 top-1/2 -translate-y-1/2 text-xl">🧮</button></div>
                                    </div>
                                    <div><label className="text-sm font-medium text-secondary mb-1">Type</label><CustomSelect options={[{value: 'expense', label: 'Expense'}, {value: 'income', label: 'Income'}]} value={type} onChange={val => { setType(val as TransactionType); setCategoryId(''); setSubCategoryId(''); }} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-sm font-medium text-secondary mb-1">Category</label><CustomSelect options={topLevelCategoriesByType.map(c=>({value: c.id, label: c.name}))} value={categoryId} onChange={setCategoryId} placeholder="Select Category" /></div>
                                    <div><label className="text-sm font-medium text-secondary mb-1">Subcategory</label><CustomSelect options={subCategories.map(c=>({value: c.id, label: c.name}))} value={subCategoryId} onChange={setSubCategoryId} placeholder="-" disabled={!categoryId} /></div>
                                </div>
                                <div><label className="text-sm font-medium text-secondary mb-1">Description</label><input type="text" value={description} onChange={e=>setDescription(e.target.value)} className="input-base w-full p-2 rounded-lg" required /></div>
                                <div><label className="text-sm font-medium text-secondary mb-1">Notes (Optional)</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className="input-base w-full p-2 rounded-lg resize-none" /></div>
                            </div>
                        ) : (
                             <div className="space-y-3 animate-fadeInUp">
                                {isItemized && <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Overall Description (e.g., Groceries)" className="input-base w-full p-2 rounded-lg" />}
                                {items.map((item, index) => (
                                    <div key={item.id} className="itemized-item-card flex items-start gap-2">
                                        <div className="flex-grow space-y-2">
                                            <div className="flex items-center gap-2"><input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} placeholder={`Item Description`} className="input-base p-2 rounded-md w-full" required /><button type="button" onClick={() => openModal('splitTransaction', { transaction: {...transaction, amount: itemizedTotal}, items })} className="button-secondary px-3 py-2 text-xs">Split</button></div>
                                            <div className="grid grid-cols-[1fr_auto_1fr] gap-2"><div className="relative"><input type="number" step="0.01" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} placeholder="0" className="input-base p-2 rounded-md w-full no-spinner" required /><button type="button" onClick={() => onOpenCalculator(res => handleItemChange(item.id, 'amount', String(res)))} className="absolute right-2 top-1/2 -translate-y-1/2 text-xl">🧮</button></div><span className="p-2 text-center text-secondary">in</span><CustomSelect value={item.parentId || ''} onChange={val => { handleItemChange(item.id, 'parentId', val); handleItemChange(item.id, 'categoryId', val); }} options={[{value: '', label: 'Category'}, ...topLevelCategories.map(c => ({value: c.id, label: c.name}))]} /></div>
                                        </div>
                                    {items.length > 1 && <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1 text-rose-400 hover:text-rose-300 rounded-full flex-shrink-0" aria-label="Remove item"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddItem} className="w-full text-center p-2 text-sm text-sky-400 hover:text-sky-300">+ Add Item</button>
                                <div className="pt-3 border-t border-divider"><div className="flex justify-between items-center font-semibold text-lg"><span>Total:</span><span>{formatCurrency(itemizedTotal)}</span></div></div>
                            </div>
                        )}
                         <div className="pt-4 border-t border-divider"><ToggleSwitch label="Itemize & Split Transaction" checked={isItemized} onChange={setIsItemized} /></div>
                    </div>
                    <div className="flex-shrink-0 p-4 border-t border-divider flex items-center gap-3 bg-subtle rounded-b-xl">
                        <button type="button" onClick={() => openModal('refund', { originalTransaction: transaction })} className="button-secondary px-4 py-2">Process Refund</button>
                        <div className="flex-grow"></div>
                        <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
                        <button type="submit" className="button-primary px-4 py-2">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTransactionModal;