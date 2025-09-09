import React, { useState, useMemo, useContext, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, Account, Contact, TransactionType, ActiveModal, Category, ParsedReceiptData, ItemizedDetail } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import CustomSelect from './CustomSelect';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';
import ToggleSwitch from './ToggleSwitch';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { parseReceiptImage } from '../services/geminiService';

const modalRoot = document.getElementById('modal-root')!;

type Tab = 'auto' | 'manual';

interface Item {
    id: string;
    description: string;
    amount: string;
    categoryId: string;
    parentId: string | null;
}

interface AddTransactionModalProps {
    onCancel: () => void;
    onSaveAuto: (text: string, accountId?: string) => Promise<void>;
    onSaveManual: (data: Transaction) => void;
    initialTab?: Tab;
    initialText?: string | null;
    onInitialTextConsumed?: () => void;
    accounts: Account[];
    contacts: Contact[];
    openModal: (name: ActiveModal, props?: Record<string, any>) => void;
    onOpenCalculator: (onResult: (result: number) => void) => void;
    selectedAccountId?: string;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
    onCancel,
    onSaveAuto,
    onSaveManual,
    initialTab = 'auto',
    initialText,
    onInitialTextConsumed,
    accounts,
    contacts,
    openModal,
    onOpenCalculator,
    selectedAccountId
}) => {
    const { categories } = useContext(SettingsContext);
    const { settings } = useContext(SettingsContext);
    const formatCurrency = useCurrencyFormatter();

    // High-level state
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    
    // Auto Parse State
    const [autoText, setAutoText] = useState(initialText || '');
    const [isParsing, setIsParsing] = useState(false);
    const [selectedParseAccountId, setSelectedParseAccountId] = useState(selectedAccountId || accounts[0]?.id || '');

    // Manual Form State
    const [isItemized, setIsItemized] = useState(false);
    const [items, setItems] = useState<Item[]>([{ id: self.crypto.randomUUID(), description: '', amount: '', categoryId: '', parentId: null }]);
    // Non-itemized state
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [categoryId, setCategoryId] = useState('');
    const [subCategoryId, setSubCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');

    const itemizedTotal = useMemo(() => items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0), [items]);
    const topLevelCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
    const topLevelCategoriesByType = useMemo(() => categories.filter(c => !c.parentId && c.type === type), [categories, type]);
    const subCategories = useMemo(() => categories.filter(c => c.parentId === categoryId), [categories, categoryId]);

    useEffect(() => {
        if (initialText) {
            setAutoText(initialText);
            setActiveTab('auto');
            if (onInitialTextConsumed) onInitialTextConsumed();
        }
    }, [initialText, onInitialTextConsumed]);
    
    useEffect(() => {
        // When toggling itemization, transfer data between modes
        if (isItemized) {
            // Non-itemized -> Itemized
            const firstItem = items[0];
            if (amount || description || categoryId) {
                setItems([{
                    id: firstItem.id,
                    description: description || '',
                    amount: amount || '',
                    categoryId: subCategoryId || '',
                    parentId: categoryId || null
                }]);
            }
        } else {
             // Itemized -> Non-itemized
            const firstItem = items[0];
            if (firstItem && (firstItem.description || firstItem.amount || firstItem.parentId)) {
                setDescription(firstItem.description);
                setAmount(firstItem.amount);
                setCategoryId(firstItem.parentId || '');
                setSubCategoryId(firstItem.categoryId || '');
            }
        }
    }, [isItemized]);


    const handleAutoParse = async () => {
        if (!autoText.trim() || !selectedParseAccountId) return;
        setIsParsing(true);
        try {
            await onSaveAuto(autoText, selectedParseAccountId);
            onCancel();
        } catch (e) { console.error("Parsing failed", e); } finally { setIsParsing(false); }
    };
    
    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isItemized) {
            const finalAmount = itemizedTotal;
            if (isNaN(finalAmount) || finalAmount <= 0) { alert("Please enter valid amounts for your items."); return; }

            const itemizedDetails: ItemizedDetail[] = items
                .filter(i => i.description.trim() && parseFloat(i.amount) > 0 && (i.categoryId || i.parentId))
                .map(i => ({
                    description: i.description, amount: parseFloat(i.amount), categoryId: i.categoryId || i.parentId!,
                }));
            
            if (itemizedDetails.length === 0) { alert("Please fill out at least one valid item."); return; }

            const primaryItem = itemizedDetails[0];
            const primaryCategory = categories.find(c => c.id === primaryItem.categoryId);
            const transactionDescription = description || (itemizedDetails.length > 1 ? `${primaryItem.description} & more` : primaryItem.description);

            onSaveManual({
                id: self.crypto.randomUUID(), description: transactionDescription, amount: finalAmount, type: primaryCategory?.type || TransactionType.EXPENSE, accountId: accounts[0].id, categoryId: primaryItem.categoryId, date: new Date().toISOString(), itemizedDetails: itemizedDetails.length > 0 ? itemizedDetails : undefined, notes,
            });

        } else {
            // Non-itemized save
            const finalAmount = parseFloat(amount);
            if (isNaN(finalAmount) || finalAmount <= 0) { alert("Please enter a valid amount."); return; }
            if (!categoryId) { alert("Please select a category."); return; }
            if (!description) { alert("Please enter a description."); return; }

            onSaveManual({
                id: self.crypto.randomUUID(), description, amount: finalAmount, type, accountId: accounts[0].id, categoryId: subCategoryId || categoryId, date: new Date().toISOString(), notes
            });
        }
        onCancel();
    };

    const handleItemChange = (id: string, field: keyof Item, value: string | null) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleAddItem = () => setItems(prev => [...prev, {id: self.crypto.randomUUID(), description: '', amount: '', categoryId: '', parentId: null}]);
    const handleRemoveItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

    const renderManualForm = () => (
        <form onSubmit={handleManualSubmit} className="flex-grow flex flex-col overflow-hidden">
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                
                {!isItemized ? (
                    <div className="space-y-4 animate-fadeInUp">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-secondary mb-1">Amount ({settings.currency})</label>
                                <div className="relative">
                                    <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="input-base w-full p-2 rounded-lg" required />
                                    <button type="button" onClick={() => onOpenCalculator(res => setAmount(String(res)))} className="absolute right-2 top-1/2 -translate-y-1/2 text-xl">🧮</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-secondary mb-1">Type</label>
                                <CustomSelect options={[{value: 'expense', label: 'Expense'}, {value: 'income', label: 'Income'}]} value={type} onChange={val => { setType(val as TransactionType); setCategoryId(''); setSubCategoryId(''); }} />
                            </div>
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
                        {items.map((item, index) => (
                            <div key={item.id} className="itemized-item-card flex items-start gap-2">
                                <div className="flex-grow space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} placeholder={`Item Description`} className="input-base p-2 rounded-md w-full" required />
                                        <button type="button" onClick={() => openModal('splitTransaction', { items: items.filter(i => i.description && i.amount) })} className="button-secondary px-3 py-2 text-xs">Split</button>
                                    </div>
                                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
                                         <div className="relative">
                                            <input type="number" step="0.01" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} placeholder="0" className="input-base p-2 rounded-md w-full no-spinner" required />
                                             <button type="button" onClick={() => onOpenCalculator(res => handleItemChange(item.id, 'amount', String(res)))} className="absolute right-2 top-1/2 -translate-y-1/2 text-xl">🧮</button>
                                        </div>
                                        <span className="p-2 text-center text-secondary">in</span>
                                        <CustomSelect value={item.parentId || ''} onChange={val => { handleItemChange(item.id, 'parentId', val); handleItemChange(item.id, 'categoryId', val); }} options={[{value: '', label: 'Category'}, ...topLevelCategories.map(c => ({value: c.id, label: c.name}))]} />
                                    </div>
                                </div>
                               {items.length > 1 && <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1 text-rose-400 hover:text-rose-300 rounded-full flex-shrink-0" aria-label="Remove item"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                            </div>
                        ))}
                        <button type="button" onClick={handleAddItem} className="w-full text-center p-2 text-sm text-sky-400 hover:text-sky-300">+ Add Item</button>
                        <div className="pt-3 border-t border-divider"><div className="flex justify-between items-center font-semibold text-lg"><span>Total of Items:</span><span>{formatCurrency(itemizedTotal)}</span></div></div>
                    </div>
                )}
                 <div className="pt-4 border-t border-divider">
                    <ToggleSwitch label="Itemize & Split Transaction" checked={isItemized} onChange={setIsItemized} />
                </div>
            </div>
            <div className="flex-shrink-0 p-4 border-t border-divider flex items-center gap-3 bg-subtle rounded-b-xl">
                <button type="button" onClick={() => openModal('refund')} className="button-secondary px-4 py-2">Process Refund</button>
                <div className="flex-grow"></div>
                <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
                <button type="submit" className="button-primary px-4 py-2">Save Changes</button>
            </div>
        </form>
    );

    const renderAutoForm = () => (
         <div className="p-6 space-y-4 animate-fadeInUp">
            <p className="text-sm text-secondary">Paste a transaction message or type a phrase. The AI will do the rest.</p>
            <CustomSelect value={selectedParseAccountId} onChange={setSelectedParseAccountId} options={accounts.map(acc => ({ value: acc.id, label: acc.name }))} />
            <textarea value={autoText} onChange={(e) => setAutoText(e.target.value)} placeholder='e.g., "INR 500 spent on Zomato"' className="w-full h-24 themed-textarea" disabled={isParsing} autoFocus />
            <button type="button" onClick={() => openModal('camera', { onCapture: () => {} })} className="w-full text-center p-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400 flex items-center justify-center gap-2">
                📷 Scan a Receipt
            </button>
            <button type="button" onClick={handleAutoParse} disabled={!autoText.trim() || isParsing || !selectedParseAccountId} className="button-primary w-full flex items-center justify-center font-bold py-3">
                {isParsing ? <LoadingSpinner /> : 'Parse with AI'}
            </button>
        </div>
    );

    const TabButton: React.FC<{ tab: Tab, label: string, icon: string }> = ({ tab, label, icon }) => (
         <button onClick={() => setActiveTab(tab)} className={`add-tx-tab w-full py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 ${activeTab === tab ? 'active' : ''}`}>
            {icon} {label}
        </button>
    );

    return ReactDOM.createPortal(
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg border border-divider opacity-0 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <ModalHeader title="Add Transaction" onClose={onCancel} />
            <div className="grid grid-cols-2 gap-2 p-3 border-b border-divider">
                <TabButton tab="auto" label="Automatic (AI Parse)" icon="🤖" />
                <TabButton tab="manual" label="Manual Entry" icon="✍️" />
            </div>
            
            {activeTab === 'auto' ? renderAutoForm() : renderManualForm()}
        </div>
      </div>,
    modalRoot
    );
};

export default AddTransactionModal;