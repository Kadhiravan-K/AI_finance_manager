import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { RecurringTransaction, Category, Account, TransactionType, FrequencyUnit, ReminderUnit } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import ToggleSwitch from './ToggleSwitch';

const modalRoot = document.getElementById('modal-root')!;

interface EditRecurringModalProps {
  onClose: () => void;
  onSave: (item: Omit<RecurringTransaction, 'id' | 'nextDueDate'> & { id?: string }) => void;
  recurringTransaction?: RecurringTransaction;
  categories: Category[];
  accounts: Account[];
}

const defaultFormState: Omit<RecurringTransaction, 'id' | 'nextDueDate'> = {
  description: '', amount: 0, type: TransactionType.EXPENSE, categoryId: '', accountId: '', startDate: new Date().toISOString(), interval: 1, frequencyUnit: 'months', startTime: '09:00',
};

const EditRecurringModal: React.FC<EditRecurringModalProps> = ({ onClose, onSave, recurringTransaction, categories, accounts }) => {
  const isEditing = !!recurringTransaction;

  const getInitialState = () => {
    if (recurringTransaction) {
        return { ...recurringTransaction };
    }
    return { ...defaultFormState, accountId: accounts[0]?.id || '' };
  };
  
  const [formState, setFormState] = useState(getInitialState());
  const [isReminderOn, setIsReminderOn] = useState(!!recurringTransaction?.reminder);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = new Date(formState.startDate);
    const [hours, minutes] = (formState.startTime || '00:00').split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);

    let finalFormState: any = { ...formState, startDate: startDate.toISOString() };
    if (!isReminderOn) {
        delete finalFormState.reminder;
    }
    
    // This is the fix. The bug was that the call was something like `onSave(data, id)`,
    // but the handler function expects a single object argument.
    onSave(finalFormState);
  };
  
  const getCategoryPath = (categoryId: string): string => {
    const path: string[] = [];
    let current = categories.find(c => c.id === categoryId);
    while (current) {
        path.unshift(current.name);
        current = categories.find(c => c.id === current.parentId);
    }
    return path.join(' / ') || 'Uncategorized';
  };

  const categoryOptions = categories.filter(c => c.type === formState.type).map(c => ({ value: c.id, label: getCategoryPath(c.id) }));
  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));
  const frequencyUnitOptions: {value: FrequencyUnit, label: string}[] = [
      {value: 'days', label: 'Day(s)'}, {value: 'weeks', label: 'Week(s)'}, {value: 'months', label: 'Month(s)'}, {value: 'years', label: 'Year(s)'},
  ];
  const reminderUnitOptions: {value: ReminderUnit, label: string}[] = [
      {value: 'minutes', label: 'Minute(s)'}, {value: 'hours', label: 'Hour(s)'}, {value: 'days', label: 'Day(s)'},
  ];
  const typeOptions = [ {value: TransactionType.EXPENSE, label: 'Expense'}, {value: TransactionType.INCOME, label: 'Income'}, ];

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={isEditing ? 'Edit Scheduled Payment' : 'Add Scheduled Payment'} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-3 flex-grow overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="text-xs text-secondary mb-1 block">Start Date</label><CustomDatePicker value={new Date(formState.startDate)} onChange={date => setFormState(p => ({...p, startDate: date.toISOString()}))} /></div>
              <div><label className="text-xs text-secondary mb-1 block">Start Time</label><input type="time" value={formState.startTime} onChange={e => setFormState(p => ({...p, startTime: e.target.value}))} className="w-full input-base p-2 rounded-lg" /></div>
            </div>
             <div>
                <label className="text-xs text-secondary mb-1 block">Frequency</label>
                <div className="flex gap-2 items-center"><span className="text-secondary text-sm">Every</span><input type="number" value={formState.interval} onWheel={e => (e.target as HTMLElement).blur()} onChange={e => setFormState(p => ({...p, interval: parseInt(e.target.value) || 1}))} className="input-base w-16 p-2 rounded-lg no-spinner" /><div className="flex-grow"><CustomSelect options={frequencyUnitOptions} value={formState.frequencyUnit} onChange={v => setFormState(p => ({...p, frequencyUnit: v as FrequencyUnit}))} /></div></div>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="text-xs text-secondary mb-1 block">Account</label><CustomSelect options={accountOptions} value={formState.accountId} onChange={v => setFormState(p => ({...p, accountId: v}))} placeholder="Select Account" /></div>
              <div><label className="text-xs text-secondary mb-1 block">Amount</label><input type="number" min="0.01" step="0.01" placeholder="Amount" value={formState.amount || ''} onWheel={e => (e.target as HTMLElement).blur()} onChange={e => setFormState(p => ({...p, amount: parseFloat(e.target.value) || 0}))} className="w-full input-base p-2 rounded-full no-spinner" required /></div>
            </div>
             <div><label className="text-xs text-secondary mb-1 block">Description</label><input type="text" placeholder="Description (e.g., Rent)" value={formState.description} onChange={e => setFormState(p => ({...p, description: e.target.value}))} className="w-full input-base p-2 rounded-full" required /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs text-secondary mb-1 block">Type</label><CustomSelect options={typeOptions} value={formState.type} onChange={v => setFormState(p => ({...p, type: v as TransactionType, categoryId: ''}))} /></div>
                <div><label className="text-xs text-secondary mb-1 block">Category</label><CustomSelect options={categoryOptions} value={formState.categoryId} onChange={v => setFormState(p => ({...p, categoryId: v}))} placeholder="Select Category" /></div>
            </div>
            <div className="pt-2 border-t border-divider">
                <ToggleSwitch checked={isReminderOn} onChange={setIsReminderOn} label="Set a Reminder" />
                {isReminderOn && (<div className="flex gap-2 items-center mt-2 animate-fadeInUp"><span className="text-secondary text-sm">Remind me</span><input type="number" value={formState.reminder?.value || 1} onWheel={e => (e.target as HTMLElement).blur()} onChange={e => setFormState(p => ({...p, reminder: { value: parseInt(e.target.value) || 1, unit: p.reminder?.unit || 'days' }}))} className="input-base w-16 p-2 rounded-lg no-spinner" /><div className="flex-grow"><CustomSelect options={reminderUnitOptions} value={formState.reminder?.unit || 'days'} onChange={v => setFormState(p => ({...p, reminder: { value: p.reminder?.value || 1, unit: v as ReminderUnit }}))} /></div><span className="text-secondary text-sm">before</span></div>)}
            </div>
            <div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button><button type="submit" className="button-primary px-4 py-2">{isEditing ? 'Save' : 'Add'}</button></div>
        </form>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default EditRecurringModal;