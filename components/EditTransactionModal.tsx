import React, { useState, useMemo, useContext } from 'react';
import { Transaction, Account, Contact, TransactionType, Category, SplitDetail, ActiveModal } from '../types';
import { SettingsContext, AppDataContext } from '../contexts/SettingsContext';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import ToggleSwitch from './ToggleSwitch';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface ItemizedItem {
    id: string;
    description: string;
    amount: string;
}

interface EditTransactionModalProps {
    transaction?: Transaction;
    initialData?: Partial<Transaction> & { itemizedItems?: { description: string; amount: string }[] };
    onSave: (data: any) => void;
    onCancel: () => void;
    accounts: Account[];
    contacts: Contact[];
    openModal: (name: ActiveModal, props?: Record<string, any>) => void;
    onOpenCalculator: (onResult: (result: number) => void) => void;
    selectedAccountId?: string;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    transaction, initialData, onSave, onCancel, accounts, contacts, openModal, onOpenCalculator, selectedAccountId
}) => {
    const { categories } = useContext(SettingsContext);
    const dataContext = useContext(AppDataContext);
    const isEditing = !!transaction;

    const [type, setType] = useState<TransactionType>(transaction?.type || initialData?.type || TransactionType.EXPENSE);
    const [amount, setAmount] = useState<string>(transaction?.amount.toString() || initialData?.amount?.toString() || '');
    const [description, setDescription] = useState<string>(transaction?.description || initialData?.description || '');
    const [accountId, setAccountId] = useState<string>(transaction?.accountId || initialData?.accountId || selectedAccountId || accounts[0]?.id || '');
    const [notes, setNotes] = useState<string>(transaction?.notes || initialData?.notes || '');
    const [date, setDate] = useState<Date>(new Date(transaction?.date || initialData?.date || Date.now()));
    
    const initialCategory = categories.find(c => c.id === (transaction?.categoryId || initialData?.categoryId));
    const [parentId, setParentId] = useState<string | null>(initialCategory?.parentId || null);
    const [categoryId, setCategoryId] = useState<string>(transaction?.categoryId || initialData?.categoryId || '');

    const [isItemized, setIsItemized] = useState(!!initialData?.itemizedItems && initialData.itemizedItems.length > 0);
    const [items, setItems] = useState<ItemizedItem[]>(initialData?.itemizedItems?.map(i => ({...i, id: self.crypto.randomUUID()})) || [{id: self.crypto.randomUUID(), description: '', amount: ''}]);

    const formatCurrency = useCurrencyFormatter(undefined, accounts.find(a => a.id === accountId)?.currency);

    const itemizedTotal = useMemo(() => {
        if (!isItemized) return 0;
        return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    }, [isItemized, items]);

    const topLevelCategories = useMemo(() => categories.filter(c => c.type === type && !c.parentId), [categories, type]);
    const subCategories = useMemo(() => parentId ? categories.filter(c => c.parentId === parentId) : [], [categories, parentId]);
    
    const handleItemChange = (id: string, field: 'description' | 'amount', value: string) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const handleAddItem = () => setItems(prev => [...prev, {id: self.crypto.randomUUID(), description: '', amount: ''}]);
    const handleRemoveItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalAmount = isItemized ? itemizedTotal : parseFloat(amount);
        if (isNaN(finalAmount) || finalAmount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        let finalDescription = description;
        let finalNotes = notes;
        if (isItemized) {
            finalNotes = `${notes ? notes + '\n\n' : ''}Itemized Details:\n${items.map(i => `- ${i.description}: ${formatCurrency(parseFloat(i.amount) || 0)}`).join('\n')}`;
            if (!description) finalDescription = items[0]?.description || 'Itemized Expense';
        }

        const transactionData = {
            ...transaction,
            id: transaction?.id || self.crypto.randomUUID(),
            description: finalDescription,
            amount: finalAmount,
            type,
            accountId,
            categoryId: categoryId || parentId,
            date: date.toISOString(),
            notes: finalNotes.trim() || undefined
        };
        onSave(transactionData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-subtle border border-divider">
                    <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`w-full py-2 text-sm font-semibold rounded-full ${type === TransactionType.EXPENSE ? 'bg-rose-500 text-white' : ''}`}>Expense</button>
                    <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`w-full py-2 text-sm font-semibold rounded-full ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white' : ''}`}>Income</button>
                </div>

                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="input-base w-full p-2 rounded-lg" required autoFocus />

                {!isItemized ? (
                    <div className="relative">
                        <input type="number" step="0.01" value={amount} onWheel={e => e.currentTarget.blur()} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="input-base w-full p-2 rounded-lg no-spinner" required />
                        <button type="button" onClick={() => onOpenCalculator(res => setAmount(String(res)))} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary p-1">🧮</button>
                    </div>
                ) : (
                    <div className="p-3 bg-subtle rounded-lg space-y-2 border border-divider">
                        {items.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-2">
                                <input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} placeholder={`Item ${index + 1}`} className="input-base p-1.5 rounded-md flex-grow" />
                                <input type="number" step="0.01" value={item.amount} onWheel={e => e.currentTarget.blur()} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} placeholder="Amount" className="input-base p-1.5 rounded-md w-24 no-spinner text-right" />
                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-rose-400 font-bold text-xl leading-none">&times;</button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddItem} className="text-xs text-sky-400 hover:text-sky-300">+ Add Item</button>
                        <p className="text-right font-semibold">Total: {formatCurrency(itemizedTotal)}</p>
                    </div>
                )}
                
                <ToggleSwitch label="Itemize & Split" checked={isItemized} onChange={setIsItemized} />

                <div className="grid grid-cols-2 gap-4">
                    <CustomSelect value={accountId} onChange={setAccountId} options={accounts.map(a => ({value: a.id, label: a.name}))} />
                    <CustomDatePicker value={date} onChange={setDate} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <CustomSelect value={parentId || ''} onChange={val => { setParentId(val || null); setCategoryId(''); }} options={[{value: '', label: 'Select Category'}, ...topLevelCategories.map(c => ({value: c.id, label: c.name}))]} />
                    <CustomSelect value={categoryId} onChange={setCategoryId} options={subCategories.map(c => ({value: c.id, label: c.name}))} disabled={!parentId || subCategories.length === 0} />
                </div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (Optional)" rows={2} className="input-base w-full p-2 rounded-lg resize-none" />
                
                <button type="button" onClick={() => openModal('splitTransaction', { transaction: { amount: isItemized ? itemizedTotal : parseFloat(amount) } })} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400">
                    ➗ Split with Contacts
                </button>
            </div>
            <div className="flex-shrink-0 p-4 border-t border-divider flex justify-end gap-3 bg-subtle rounded-b-xl">
                <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
                <button type="submit" className="button-primary px-4 py-2">{isEditing ? 'Save Changes' : 'Save Transaction'}</button>
            </div>
        </form>
    );
};

export default EditTransactionModal;