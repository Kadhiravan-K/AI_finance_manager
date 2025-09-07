import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { RecurringTransaction, Account, Category, TransactionType } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

const modalRoot = document.getElementById('modal-root')!;

interface EditRecurringModalProps {
  recurringTransaction?: Partial<RecurringTransaction>;
  onSave: (data: Omit<RecurringTransaction, 'id'>, id?: string) => void;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
}

const EditRecurringModal: React.FC<EditRecurringModalProps> = ({ recurringTransaction, onSave, onClose, accounts, categories }) => {
  const isCreating = !recurringTransaction?.id;

  const [formData, setFormData] = useState({
    description: recurringTransaction?.description || '',
    amount: recurringTransaction?.amount?.toString() || '',
    type: recurringTransaction?.type || TransactionType.EXPENSE,
    categoryId: recurringTransaction?.categoryId || '',
    accountId: recurringTransaction?.accountId || accounts[0]?.id || '',
    frequencyUnit: recurringTransaction?.frequencyUnit || 'months',
    interval: recurringTransaction?.interval?.toString() || '1',
    nextDueDate: new Date(recurringTransaction?.nextDueDate || new Date()),
    endDate: recurringTransaction?.endDate ? new Date(recurringTransaction.endDate) : null,
    notes: recurringTransaction?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (formData.description.trim() && amount > 0 && formData.categoryId && formData.accountId) {
      onSave({
        ...formData,
        amount: amount,
        interval: parseInt(formData.interval, 10) || 1,
        nextDueDate: formData.nextDueDate.toISOString(),
        endDate: formData.endDate?.toISOString()
      }, recurringTransaction?.id);
      onClose();
    }
  };
  
  const typeOptions = [
    { value: TransactionType.EXPENSE, label: 'Expense' },
    { value: TransactionType.INCOME, label: 'Income' },
  ];
  
  const frequencyOptions = [
      { value: 'days', label: 'Days' },
      { value: 'weeks', label: 'Weeks' },
      { value: 'months', label: 'Months' },
      { value: 'years', label: 'Years' },
  ];

  const categoryOptions = useMemo(() => {
    return categories
      .filter(c => c.type === formData.type)
      .map(c => ({ value: c.id, label: c.name }));
  }, [categories, formData.type]);
  
  const accountOptions = useMemo(() => {
    return accounts.map(a => ({ value: a.id, label: a.name }));
  }, [accounts]);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={isCreating ? "Add Scheduled Payment" : "Edit Scheduled Payment"} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <input type="text" value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} placeholder="Description" className="input-base w-full p-2 rounded-lg" required autoFocus/>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" step="0.01" value={formData.amount} onWheel={e => e.currentTarget.blur()} onChange={e => setFormData(p => ({...p, amount: e.target.value}))} placeholder="Amount" className="input-base w-full p-2 rounded-lg no-spinner" required/>
            <CustomSelect options={typeOptions} value={formData.type} onChange={v => setFormData(p => ({...p, type: v as TransactionType, categoryId: ''}))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CustomSelect options={accountOptions} value={formData.accountId} onChange={v => setFormData(p => ({...p, accountId: v}))} />
            <CustomSelect options={categoryOptions} value={formData.categoryId} onChange={v => setFormData(p => ({...p, categoryId: v}))} />
          </div>
           <div className="grid grid-cols-3 gap-4 items-end">
                <span className="text-secondary text-sm self-center">Repeats every:</span>
                <input type="number" value={formData.interval} onWheel={e => e.currentTarget.blur()} onChange={e => setFormData(p => ({...p, interval: e.target.value}))} className="input-base w-full p-2 rounded-lg no-spinner" />
                <CustomSelect options={frequencyOptions} value={formData.frequencyUnit} onChange={v => setFormData(p => ({...p, frequencyUnit: v as any}))} />
           </div>
           <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-secondary mb-1 block">Next Due Date</label><CustomDatePicker value={formData.nextDueDate} onChange={d => setFormData(p => ({...p, nextDueDate: d}))} /></div>
                <div><label className="text-sm text-secondary mb-1 block">End Date (Optional)</label><CustomDatePicker value={formData.endDate} onChange={d => setFormData(p => ({...p, endDate: d}))} /></div>
           </div>
           <textarea value={formData.notes} onChange={e => setFormData(p => ({...p, notes: e.target.value}))} placeholder="Notes (optional)" rows={2} className="input-base w-full p-2 rounded-lg resize-none" />
           <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2">{isCreating ? 'Add Payment' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>,
    modalRoot
  );
};

export default EditRecurringModal;