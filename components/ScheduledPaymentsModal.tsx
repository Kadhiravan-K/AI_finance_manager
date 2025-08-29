import React, { useState } from 'react';
import { RecurringTransaction, Category, Account, TransactionType, FrequencyUnit, ReminderUnit } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import ToggleSwitch from './ToggleSwitch';

interface ScheduledPaymentsScreenProps {
  recurringTransactions: RecurringTransaction[];
  setRecurringTransactions: React.Dispatch<React.SetStateAction<RecurringTransaction[]>>;
  categories: Category[];
  accounts: Account[];
  onDelete: (id: string) => void;
}

type FormState = Omit<RecurringTransaction, 'id' | 'nextDueDate'>;

const defaultFormState: FormState = {
  description: '', amount: 0, type: TransactionType.EXPENSE, categoryId: '', accountId: '', startDate: new Date().toISOString().split('T')[0], interval: 1, frequencyUnit: 'months', startTime: '09:00',
};

const ScheduledPaymentsScreen: React.FC<ScheduledPaymentsScreenProps> = ({ recurringTransactions, setRecurringTransactions, categories, accounts, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [formState, setFormState] = useState<FormState>({ ...defaultFormState, accountId: accounts[0]?.id || '' });
  const [isReminderOn, setIsReminderOn] = useState(false);
  const formatCurrency = useCurrencyFormatter();
  
  const handleOpenForm = () => {
      setEditingItem(null);
      setFormState({ ...defaultFormState, accountId: accounts[0]?.id || '' });
      setIsReminderOn(false);
      setIsFormOpen(true);
  }

  const handleEdit = (item: RecurringTransaction) => {
    setEditingItem(item);
    setFormState({
        ...item,
        startDate: new Date(item.startDate).toISOString().split('T')[0],
    });
    setIsReminderOn(!!item.reminder);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setEditingItem(null);
    setIsFormOpen(false);
    setFormState({ ...defaultFormState, accountId: accounts[0]?.id || '' });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = new Date(formState.startDate);
    const [hours, minutes] = (formState.startTime || '00:00').split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);

    let finalFormState = { ...formState };
    if (!isReminderOn) {
        delete finalFormState.reminder;
    }
    
    if (editingItem) {
      setRecurringTransactions(prev => prev.map(r => r.id === editingItem.id ? { ...editingItem, ...finalFormState, startDate: startDate.toISOString() } : r));
    } else {
      const newItem: RecurringTransaction = {
        ...(finalFormState as Omit<RecurringTransaction, 'id' | 'nextDueDate'>),
        id: self.crypto.randomUUID(),
        startDate: startDate.toISOString(),
        nextDueDate: startDate.toISOString(),
      };
      setRecurringTransactions(prev => [...prev, newItem]);
    }
    handleCancel();
  };

  const categoryOptions = categories.filter(c => c.type === formState.type).map(c => ({ value: c.id, label: `${getCategoryPath(c.id)}` }));
  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));
  const frequencyUnitOptions: {value: FrequencyUnit, label: string}[] = [
      {value: 'days', label: 'Day(s)'},
      {value: 'weeks', label: 'Week(s)'},
      {value: 'months', label: 'Month(s)'},
      {value: 'years', label: 'Year(s)'},
  ];
  const reminderUnitOptions: {value: ReminderUnit, label: string}[] = [
      {value: 'minutes', label: 'Minute(s)'},
      {value: 'hours', label: 'Hour(s)'},
      {value: 'days', label: 'Day(s)'},
  ];
  const typeOptions = [ {value: TransactionType.EXPENSE, label: 'Expense'}, {value: TransactionType.INCOME, label: 'Income'}, ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0">
         <h2 className="text-2xl font-bold text-primary text-center">Scheduled Payments 📅</h2>
       </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-2">
        {recurringTransactions.map(item => (
          <div key={item.id} className="p-3 bg-subtle rounded-lg flex items-center justify-between group">
            <div>
              <p className="font-semibold text-primary">{item.description} - <span className={item.type === 'income' ? 'text-[var(--color-accent-emerald)]' : 'text-[var(--color-accent-rose)]'}>{formatCurrency(item.amount)}</span></p>
              <p className="text-xs text-secondary">Next due: {new Date(item.nextDueDate).toLocaleString()}</p>
            </div>
            <div className="space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(item)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
              <button onClick={() => onDelete(item.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full">Delete</button>
            </div>
          </div>
        ))}
        {recurringTransactions.length === 0 && <p className="text-center text-secondary py-8">No scheduled payments yet.</p>}
      </div>

      <div className="flex-shrink-0 p-6 border-t border-divider bg-subtle">
        {isFormOpen ? (
          <form onSubmit={handleSubmit} className="space-y-3 animate-fadeInUp">
            <h3 className="font-semibold text-primary">{editingItem ? 'Edit Payment' : 'Add New Scheduled Payment'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-secondary mb-1 block">Start Date</label>
                <CustomDatePicker value={new Date(formState.startDate)} onChange={date => setFormState(p => ({...p, startDate: date.toISOString().split('T')[0]}))} />
              </div>
               <div>
                <label className="text-xs text-secondary mb-1 block">Start Time</label>
                <input type="time" value={formState.startTime} onChange={e => setFormState(p => ({...p, startTime: e.target.value}))} className="w-full input-base p-2 rounded-lg" />
              </div>
            </div>
             <div>
                <label className="text-xs text-secondary mb-1 block">Frequency</label>
                <div className="flex gap-2 items-center">
                    <span className="text-secondary text-sm">Every</span>
                    <input type="number" value={formState.interval} onWheel={(e) => (e.target as HTMLElement).blur()} onChange={e => setFormState(p => ({...p, interval: parseInt(e.target.value) || 1}))} className="input-base w-16 p-2 rounded-lg no-spinner" />
                    <div className="flex-grow"><CustomSelect options={frequencyUnitOptions} value={formState.frequencyUnit} onChange={v => setFormState(p => ({...p, frequencyUnit: v as FrequencyUnit}))} /></div>
                </div>
              </div>
    
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-secondary mb-1 block">Account</label>
                <CustomSelect options={accountOptions} value={formState.accountId} onChange={v => setFormState(p => ({...p, accountId: v}))} placeholder="Select Account" />
              </div>
              <div>
                <label className="text-xs text-secondary mb-1 block">Amount</label>
                <input type="number" min="0.01" step="0.01" placeholder="Amount" value={formState.amount || ''} onWheel={(e) => (e.target as HTMLElement).blur()} onChange={e => setFormState(p => ({...p, amount: parseFloat(e.target.value) || 0}))} className="w-full input-base p-2 rounded-full no-spinner" required />
              </div>
            </div>
             <div>
                <label className="text-xs text-secondary mb-1 block">Description</label>
                <input type="text" placeholder="Description (e.g., Rent)" value={formState.description} onChange={e => setFormState(p => ({...p, description: e.target.value}))} className="w-full input-base p-2 rounded-full" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-secondary mb-1 block">Type</label>
                    <CustomSelect options={typeOptions} value={formState.type} onChange={v => setFormState(p => ({...p, type: v as TransactionType, categoryId: ''}))} />
                </div>
                 <div>
                    <label className="text-xs text-secondary mb-1 block">Category</label>
                    <CustomSelect options={categoryOptions} value={formState.categoryId} onChange={v => setFormState(p => ({...p, categoryId: v}))} placeholder="Select Category" />
                </div>
            </div>
            
            <div className="pt-2 border-t border-divider">
                <ToggleSwitch checked={isReminderOn} onChange={setIsReminderOn} label="Set a Reminder" />
                {isReminderOn && (
                    <div className="flex gap-2 items-center mt-2 animate-fadeInUp">
                        <span className="text-secondary text-sm">Remind me</span>
                        <input type="number" value={formState.reminder?.value || 1} onWheel={(e) => (e.target as HTMLElement).blur()} onChange={e => setFormState(p => ({...p, reminder: { value: parseInt(e.target.value) || 1, unit: p.reminder?.unit || 'days' }}))} className="input-base w-16 p-2 rounded-lg no-spinner" />
                        <div className="flex-grow"><CustomSelect options={reminderUnitOptions} value={formState.reminder?.unit || 'days'} onChange={v => setFormState(p => ({...p, reminder: { value: p.reminder?.value || 1, unit: v as ReminderUnit }}))} /></div>
                        <span className="text-secondary text-sm">before</span>
                    </div>
                )}
            </div>
    
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={handleCancel} className="button-secondary px-4 py-2">Cancel</button>
              <button type="submit" className="button-primary px-4 py-2">{editingItem ? 'Save' : 'Add'}</button>
            </div>
          </form>
        ) : (
          <button onClick={handleOpenForm} className="button-primary w-full py-2 font-semibold">
            + Add New Scheduled Payment
          </button>
        )}
      </div>
    </div>
  );
};

export default ScheduledPaymentsScreen;