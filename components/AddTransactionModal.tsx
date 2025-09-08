import React, { useState, useMemo, useContext, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, Account, Contact, TransactionType, ActiveModal, Category, ParsedReceiptData } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';
import ToggleSwitch from './ToggleSwitch';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { parseReceiptImage } from '../services/geminiService';
import SlidingToggle from './SlidingToggle';

const modalRoot = document.getElementById('modal-root')!;

type Tab = 'auto' | 'manual';

interface ItemizedItem {
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
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [autoText, setAutoText] = useState(initialText || '');
    const [isParsing, setIsParsing] = useState(false);
    const [selectedParseAccountId, setSelectedParseAccountId] = useState(selectedAccountId || accounts[0]?.id || '');

    const { categories } = useContext(SettingsContext);
    const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [accountId, setAccountId] = useState<string>(selectedAccountId || accounts[0]?.id || '');
    const [notes, setNotes] = useState<string>('');
    const [date, setDate] = useState<Date>(new Date());
    const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
    
    const [isItemized, setIsItemized] = useState(false);
    const [items, setItems] = useState<ItemizedItem[]>([
        { id: self.crypto.randomUUID(), description: '', amount: '', categoryId: '', parentId: null }
    ]);
    const formatCurrency = useCurrencyFormatter(undefined, accounts.find(a => a.id === accountId)?.currency);

    const itemizedTotal = useMemo(() => {
        if (!isItemized) return 0;
        return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    }, [isItemized, items]);

    
    useEffect(() => {
        if (initialText) {
            setAutoText(initialText);
            setActiveTab('auto');
            if (onInitialTextConsumed) {
                onInitialTextConsumed();
            }
        }
    }, [initialText, onInitialTextConsumed]);

    const handleAutoParse = async () => {
        if (!autoText.trim() || !selectedParseAccountId) return;
        setIsParsing(true);
        try {
            await onSaveAuto(autoText, selectedParseAccountId);
            onCancel();
        } catch (e) {
            console.error("Parsing failed", e);
        } finally {
            setIsParsing(false);
        }
    };

    const handleReceiptScan = async (imageData: { base64: string, mimeType: string }) => {
        setIsParsing(true);
        try {
            const parsedData = await parseReceiptImage(imageData.base64, imageData.mimeType);
            if (parsedData) {
                setDescription(parsedData.merchantName);
                setDate(new Date(parsedData.transactionDate));
                setAmount(String(parsedData.totalAmount));
                if (parsedData.lineItems && parsedData.lineItems.length > 0) {
                    setIsItemized(true);
                    setItems(parsedData.lineItems.map(item => ({
                        id: self.crypto.randomUUID(),
                        description: item.description,
                        amount: String(item.amount),
                        categoryId: '',
                        parentId: null
                    })));
                }
                setActiveTab('manual');
            } else {
                alert("Could not read the receipt. Please try again or enter manually.");
            }
        } catch (error) {
            console.error("Error scanning receipt:", error);
            alert(error instanceof Error ? error.message : "An unknown error occurred while scanning.");
        } finally {
            setIsParsing(false);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalAmount = isItemized ? itemizedTotal : parseFloat(amount);
        if (isNaN(finalAmount) || finalAmount <= 0) return;

        let finalDescription = description;
        let finalNotes = notes;
        let finalCategoryId = items[0]?.categoryId || items[0]?.parentId || '';
        
        if (isItemized) {
            if (!description) finalDescription = items[0]?.description || 'Itemized Expense';
            finalNotes = `${notes ? notes + '\n\n' : ''}Itemized Details:\n${items.map(i => `- ${i.description}: ${formatCurrency(parseFloat(i.amount) || 0)}`).join('\n')}`;
            const categoryIds = new Set(items.map(i => i.categoryId || i.parentId).filter(Boolean));
            if (categoryIds.size === 1) {
                finalCategoryId = categoryIds.values().next().value;
            } else {
                 finalCategoryId = categories.find(c => c.name === 'Miscellaneous')?.id || categories[0].id;
            }
        } else {
            const topLevelCat = categories.find(c => c.id === items[0].parentId);
            if (!items[0].categoryId && topLevelCat) {
                finalCategoryId = topLevelCat.id;
            }
        }
        
        if (!finalCategoryId) { alert("Please select a category."); return; }
        
        const finalDate = new Date(date);
        const [hours, minutes] = time.split(':').map(Number);
        finalDate.setHours(hours, minutes, 0, 0);

        const transactionData: Transaction = {
            id: self.crypto.randomUUID(),
            description: finalDescription,
            amount: finalAmount,
            type, accountId,
            categoryId: finalCategoryId,
            date: finalDate.toISOString(),
            notes: finalNotes.trim() || undefined,
        };
        onSaveManual(transactionData);
        onCancel();
    };

    const topLevelCategories = useMemo(() => categories.filter(c => c.type === type && !c.parentId), [categories, type]);

    const handleItemChange = (id: string, field: keyof ItemizedItem, value: string | null) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const handleAddItem = () => setItems(prev => [...prev, {id: self.crypto.randomUUID(), description: '', amount: '', categoryId: '', parentId: null}]);
    const handleRemoveItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

    const TabButton = ({ tab, label, icon }: { tab: Tab, label: string, icon: string }) => (
        <button type="button" onClick={() => setActiveTab(tab)} className={`w-full py-3 px-4 text-sm font-semibold transition-colors focus:outline-none flex items-center justify-center gap-2 ${ activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary' }`}>
            <span>{icon}</span>
            {label}
        </button>
    );

    const modalContent = (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg border border-divider opacity-0 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <ModalHeader title="Add Transaction" onClose={onCancel} />
            <div className="flex border-b border-divider flex-shrink-0">
                <TabButton tab="auto" label="AI Parse" icon="🤖" />
                <TabButton tab="manual" label="Manual" icon="✍️" />
            </div>
            
            {activeTab === 'auto' && (
                <div className="p-6 space-y-4 animate-fadeInUp">
                    <p className="text-sm text-secondary">Paste a transaction message or type a phrase. The AI will do the rest.</p>
                    <CustomSelect value={selectedParseAccountId} onChange={setSelectedParseAccountId} options={accounts.map(acc => ({ value: acc.id, label: acc.name }))} />
                    <textarea value={autoText} onChange={(e) => setAutoText(e.target.value)} placeholder='e.g., "INR 500 spent on Zomato"' className="w-full h-24 themed-textarea" disabled={isParsing} autoFocus />
                     <button type="button" onClick={() => openModal('camera', { onCapture: handleReceiptScan })} className="w-full text-center p-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400 flex items-center justify-center gap-2">
                        📷 Scan a Receipt
                    </button>
                    <button type="button" onClick={handleAutoParse} disabled={!autoText.trim() || isParsing || !selectedParseAccountId} className="button-primary w-full flex items-center justify-center font-bold py-3">
                        {isParsing ? <LoadingSpinner /> : 'Parse with AI'}
                    </button>
                </div>
            )}

            {activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="flex-grow flex flex-col overflow-hidden animate-fadeInUp">
                    <div className="flex-grow overflow-y-auto p-6 space-y-4">
                        <SlidingToggle
                            options={[{ value: TransactionType.INCOME, label: 'Income' }, { value: TransactionType.EXPENSE, label: 'Expense' }]}
                            value={type}
                            onChange={(v) => setType(v as TransactionType)}
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <CustomSelect value={accountId} onChange={setAccountId} options={accounts.map(a => ({value: a.id, label: a.name}))} />
                             <div className="grid grid-cols-2 gap-2">
                                <CustomDatePicker value={date} onChange={setDate} />
                                <button type="button" onClick={() => openModal('timePicker', { initialTime: time, onSave: setTime })} className="w-full input-base p-2 rounded-lg flex items-center justify-center gap-2 font-mono text-lg tracking-wider">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>{time}</span>
                                </button>
                            </div>
                        </div>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="input-base w-full p-2 rounded-lg" required />
                        {!isItemized && (
                            <>
                                <div className="relative">
                                    <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="input-base w-full p-2 rounded-lg" required />
                                    <button type="button" onClick={() => onOpenCalculator(res => setAmount(String(res)))} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary p-1">🧮</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <CustomSelect value={items[0].parentId || ''} onChange={val => { handleItemChange(items[0].id, 'parentId', val || null); handleItemChange(items[0].id, 'categoryId', ''); }} options={[{value: '', label: 'Select Category'}, ...topLevelCategories.map(c => ({value: c.id, label: c.name}))]} />
                                    <CustomSelect value={items[0].categoryId} onChange={val => handleItemChange(items[0].id, 'categoryId', val)} options={items[0].parentId ? categories.filter(c => c.parentId === items[0].parentId).map(c => ({value: c.id, label: c.name})) : []} disabled={!items[0].parentId} placeholder="Subcategory" />
                                </div>
                            </>
                        )}
                        <ToggleSwitch label="Itemize Transaction" checked={isItemized} onChange={setIsItemized} />
                        {isItemized && (
                            <div className="p-3 bg-subtle rounded-lg space-y-2 border border-divider">
                                {items.map((item, index) => {
                                    const subCategories = item.parentId ? categories.filter(c => c.parentId === item.parentId) : [];
                                    return (
                                        <div key={item.id} className="p-2 bg-subtle rounded-lg space-y-2 border border-divider">
                                            <div className="flex items-center gap-2">
                                                <input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} placeholder={`Item ${index + 1}`} className="input-base p-1.5 rounded-md flex-grow" />
                                                <input type="number" step="0.01" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} placeholder="Amount" className="input-base p-1.5 rounded-md w-24 text-right" />
                                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-rose-400 font-bold text-xl leading-none">&times;</button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <CustomSelect value={item.parentId || ''} onChange={val => { handleItemChange(item.id, 'parentId', val); handleItemChange(item.id, 'categoryId', ''); }} options={[{value: '', label: 'Select Category'}, ...topLevelCategories.map(c => ({value: c.id, label: c.name}))]} placeholder="Category" />
                                                <CustomSelect value={item.categoryId} onChange={val => handleItemChange(item.id, 'categoryId', val)} options={subCategories.map(c => ({value: c.id, label: c.name}))} placeholder="Subcategory" disabled={!item.parentId || subCategories.length === 0} />
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="text-center">
                                    <button type="button" onClick={handleAddItem} className="text-xs text-sky-400 hover:text-sky-300">+ Add Item</button>
                                </div>
                                <p className="text-right font-semibold pt-2 border-t border-divider mt-2">Total of Items: {formatCurrency(itemizedTotal)}</p>
                                <button type="button" onClick={() => openModal('splitTransaction', { transaction: { amount: itemizedTotal > 0 ? itemizedTotal : parseFloat(amount) || 0 } })} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400">
                                    ➗ Split with Contacts
                                </button>
                            </div>
                        )}
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (Optional)" rows={2} className="input-base w-full p-2 rounded-lg resize-none" />
                    </div>
                    <div className="flex-shrink-0 p-4 border-t border-divider flex items-center gap-3 bg-subtle rounded-b-xl">
                        <button type="button" onClick={() => { onCancel(); openModal('refund'); }} className="button-secondary px-4 py-2">Process Refund</button>
                        <div className="flex-grow"></div>
                        <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
                        <button type="submit" className="button-primary px-4 py-2">Save Transaction</button>
                    </div>
                </form>
            )}
        </div>
      </div>
    );
    
    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AddTransactionModal;