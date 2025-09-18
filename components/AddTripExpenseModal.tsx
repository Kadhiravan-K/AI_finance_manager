import React, { useState, useMemo, useContext } from 'react';
import { Trip, TripExpense, Category, Contact, ParsedTripExpense, SplitDetail, TransactionType, TripParticipant } from '../types';
import { parseTripExpenseText } from '../services/geminiService';
import { AppDataContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';
import SplitManager from './SplitManager';
import CustomSelect from './CustomSelect';
import { USER_SELF_ID } from '../constants';

interface AddTripExpenseModalProps {
    trip: Trip;
    expenseToEdit?: TripExpense;
    onClose: () => void;
    onSave: (items: Partial<TripExpense>[]) => void;
    onUpdate: (expense: TripExpense) => void;
    categories: Category[];
    findOrCreateCategory: (name: string, type: TransactionType) => string;
    onOpenCalculator: () => void;
    onSaveContact: (contact: Omit<Contact, 'id'>) => Contact;
}

const AddTripExpenseModal: React.FC<AddTripExpenseModalProps> = ({
    trip, expenseToEdit, onClose, onSave, onUpdate, categories, findOrCreateCategory, onOpenCalculator, onSaveContact
}) => {
    const isEditing = !!expenseToEdit;
    const allParticipants = useMemo(() => [{ contactId: USER_SELF_ID, name: 'You' }, ...(trip.participants || [])], [trip.participants]);
    
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [parsedExpense, setParsedExpense] = useState<ParsedTripExpense | null>(null);

    const [description, setDescription] = useState(expenseToEdit?.description || '');
    const [amount, setAmount] = useState(expenseToEdit?.amount.toString() || '');
    const [categoryId, setCategoryId] = useState(expenseToEdit?.categoryId || '');
    
    const [payers, setPayers] = useState<SplitDetail[]>(expenseToEdit?.payers.map(p => ({ id: p.contactId, personName: allParticipants.find(ap => ap.contactId === p.contactId)?.name || '', amount: p.amount, isSettled: false })) || [{ id: USER_SELF_ID, personName: 'You', amount: parseFloat(amount) || 0, isSettled: true }]);
    const [splitDetails, setSplitDetails] = useState<SplitDetail[]>(expenseToEdit?.splitDetails || allParticipants.map(p => ({ id: p.contactId, personName: p.name, amount: 0, isSettled: p.contactId === USER_SELF_ID })));
    
    const [payerMode, setPayerMode] = useState<"manual" | "equally" | "percentage" | "shares">('manual');
    const [splitMode, setSplitMode] = useState<"manual" | "equally" | "percentage" | "shares">('equally');

    const expenseCategories = useMemo(() => categories.filter(c => c.type === TransactionType.EXPENSE), [categories]);

    const handleParse = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        try {
            const result = await parseTripExpenseText(text, allParticipants.map(p => p.name));
            if (result) {
                setParsedExpense(result);
                setDescription(result.description);
                setAmount(result.amount.toString());
                const foundCategoryId = findOrCreateCategory(result.categoryName, TransactionType.EXPENSE);
                setCategoryId(foundCategoryId);
                if (result.payerName) {
                    const payer = allParticipants.find(p => p.name.toLowerCase() === result.payerName!.toLowerCase());
                    if (payer) {
                        setPayers([{ id: payer.contactId, personName: payer.name, amount: result.amount, isSettled: false }]);
                    }
                }
            } else {
                alert("Could not parse expense from text.");
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "An error occurred during parsing.");
        }
        setIsLoading(false);
    };

    const handleSubmit = () => {
        const expenseAmount = parseFloat(amount);
        if (isNaN(expenseAmount) || expenseAmount <= 0 || !description || !categoryId) {
            alert("Please fill in description, amount, and category.");
            return;
        }

        const finalPayers = payers.map(p => ({ contactId: p.id, amount: p.amount }));
        
        const expenseData = {
            description,
            amount: expenseAmount,
            categoryId,
            payers: finalPayers,
            splitDetails,
        };
        
        if (isEditing) {
            onUpdate({ ...expenseToEdit, ...expenseData });
        } else {
            onSave([expenseData]);
        }
        onClose();
    };
    
    const categoryOptions = expenseCategories.map(c => ({ value: c.id, label: c.name }));

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title={isEditing ? 'Edit Trip Expense' : 'Add Trip Expense'} onClose={onClose} />
                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                    {!isEditing && (
                        <div className="relative">
                            <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder="Quick Add: e.g., 'Dinner 1500 paid by Alex'" className="w-full themed-textarea pr-24" />
                            <button onClick={handleParse} disabled={isLoading} className="absolute right-2 bottom-2 button-primary px-3 py-1.5 text-sm flex items-center justify-center min-w-[80px]">
                                {isLoading ? <LoadingSpinner /> : 'Parse'}
                            </button>
                        </div>
                    )}
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="input-base w-full p-2 rounded-lg" required />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="input-base w-full p-2 rounded-lg no-spinner" required />
                        <CustomSelect options={categoryOptions} value={categoryId} onChange={setCategoryId} placeholder="Select Category" />
                    </div>
                    
                    <SplitManager
                        title="Paid By"
                        mode={payerMode}
                        onModeChange={(m) => setPayerMode(m as any)}
                        participants={payers}
                        onParticipantsChange={setPayers}
                        totalAmount={parseFloat(amount) || 0}
                        allParticipants={allParticipants}
                        formatCurrency={(a) => `${a}`}
                        isPayerManager
                    />
                     <SplitManager
                        title="Split Between"
                        mode={splitMode}
                        onModeChange={(m) => setSplitMode(m as any)}
                        participants={splitDetails}
                        onParticipantsChange={setSplitDetails}
                        totalAmount={parseFloat(amount) || 0}
                        allParticipants={allParticipants}
                        formatCurrency={(a) => `${a}`}
                    />
                </div>
                <div className="flex-shrink-0 p-4 border-t border-divider flex justify-end gap-3">
                    <button onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                    <button onClick={handleSubmit} className="button-primary px-4 py-2">{isEditing ? 'Save Changes' : 'Add Expense'}</button>
                </div>
            </div>
        </div>
    );
};

export default AddTripExpenseModal;
