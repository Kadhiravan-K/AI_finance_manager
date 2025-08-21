import React, { useState } from 'react';
import { RecurringTransaction, Category, Account, TransactionType, Frequency } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

interface ScheduledPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringTransactions: RecurringTransaction[];
  setRecurringTransactions: React.Dispatch<React.SetStateAction<RecurringTransaction[]>>;
  categories: Category[];
  accounts: Account[];
}

const ScheduledPaymentsModal: React.FC<ScheduledPaymentsModalProps> = ({ isOpen, onClose, recurringTransactions, setRecurringTransactions, categories, accounts }) => {
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [formState, setFormState] = useState<Omit<RecurringTransaction, 'id' | 'nextDueDate'>>({
    description: '', amount: 0, type: TransactionType.EXPENSE, categoryId: '', accountId: accounts[0]?.id || '', frequency: 'monthly', startDate: new Date().toISOString().split('T')[0]
  });
  const formatCurrency = useCurrencyFormatter();

  const handleEdit = (item: RecurringTransaction) => {
    setEditingItem(item);
    setFormState({
        description: item.description,
        amount: item.amount,
        type: item.type,
        categoryId: item.categoryId,
        accountId: item.accountId,
        frequency: item.frequency,
        startDate: new Date(item.startDate).toISOString().split('T')[0],
        notes: item.notes,
    });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setFormState({ description: '', amount: 0, type: TransactionType.EXPENSE, categoryId: '', accountId: accounts[0]?.id || '', frequency: 'monthly', startDate: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = (id: string) => {
    setRecurringTransactions(prev => prev.filter(p => p.id !== id));
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
    
    if (editingItem) {
      setRecurringTransactions(prev => prev.map(r => r.id === editingItem.id ? { ...editingItem, ...formState, startDate: startDate.toISOString() } : r));
    } else {
      const newItem: RecurringTransaction = {
        ...formState,
        id: self.crypto.randomUUID(),
        startDate: startDate.toISOString(),
        nextDueDate: startDate.toISOString(),
      };
      setRecurringTransactions(prev => [...prev, newItem]);
    }
    handleCancel();
  };


  if (!isOpen) return null;

  const categoryOptions = categories.map(c => ({ value: c.id, label: `${getCategoryPath(c.id)} (${c.type})` }));
  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));
  const frequencyOptions = [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="glass-card rounded-xl shadow-2xl w-full max-w-2xl p-0 max-h-[90vh] flex flex-col border border-slate-700/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
      <ModalHeader title="Scheduled Payments" onClose={onClose} icon="📅" />
      
      <div className="flex-grow overflow-y-auto p-6 space-y-2">
        {recurringTransactions.map(item => (
          <div key={item.id} className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">{item.description} - <span className={item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(item.amount)}</span></p>
              <p className="text-xs text-slate-400">Next due: {new Date(item.nextDueDate).toLocaleDateString()}</p>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(item)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-md">Edit</button>
              <button onClick={() => handleDelete(item.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-md">Delete</button>
            </div>
          </div>
        ))}
        {recurringTransactions.length === 0 && <p className="text-center text-slate-400 py-8">No scheduled payments yet.</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex-shrink-0 p-6 border-t border-slate-700 space-y-3 bg-slate-800/50 rounded-b-xl">
        <h3 className="font-semibold">{editingItem ? 'Edit Payment' : 'Add New Scheduled Payment'}</h3>
        <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Description (e.g., Rent)" value={formState.description} onChange={e => setFormState(p => ({...p, description: e.target.value}))} className="w-full bg-slate-700/80 p-2 rounded-md border border-slate-600" required />
            <input type="number" placeholder="Amount" value={formState.amount || ''} onChange={e => setFormState(p => ({...p, amount: parseFloat(e.target.value) || 0}))} className="w-full bg-slate-700/80 p-2 rounded-md border border-slate-600" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <CustomSelect options={accountOptions} value={formState.accountId} onChange={v => setFormState(p => ({...p, accountId: v}))} placeholder="Select Account" />
            <CustomSelect options={categoryOptions} value={formState.categoryId} onChange={v => setFormState(p => ({...p, categoryId: v}))} placeholder="Select Category" />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <CustomSelect options={frequencyOptions} value={formState.frequency} onChange={v => setFormState(p => ({...p, frequency: v as Frequency}))} />
            <CustomDatePicker value={new Date(formState.startDate)} onChange={date => setFormState(p => ({...p, startDate: date.toISOString().split('T')[0]}))} />
        </div>
        <div className="flex justify-end space-x-2">
          {editingItem && <button type="button" onClick={handleCancel} className="px-4 py-2 rounded-lg bg-slate-600">Cancel</button>}
          <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600">{editingItem ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
};

export default ScheduledPaymentsModal;