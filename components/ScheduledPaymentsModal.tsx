import React from 'react';
import { RecurringTransaction, Category, Account, ActiveModal } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface ScheduledPaymentsScreenProps {
  recurringTransactions: RecurringTransaction[];
  categories: Category[];
  accounts: Account[];
  onAdd: () => void;
  onEdit: (item: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onUpdate: (item: RecurringTransaction) => void;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

const ScheduledPaymentsScreen: React.FC<ScheduledPaymentsScreenProps> = ({ recurringTransactions, onAdd, onEdit, onDelete }) => {
  const formatCurrency = useCurrencyFormatter();
  
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
              <button onClick={() => onEdit(item)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
              <button onClick={() => onDelete(item.id)} className="text-xs px-2 py-1 text-rose-400 hover:bg-rose-500/20 rounded-full transition-colors">Delete</button>
            </div>
          </div>
        ))}
        {recurringTransactions.length === 0 && (
            <div className="text-center py-12">
                <p className="text-lg font-medium text-secondary">Automate your finances.</p>
                <p className="text-sm text-tertiary">Add recurring bills or income to never miss a payment.</p>
            </div>
        )}
      </div>

      <div className="flex-shrink-0 p-6 border-t border-divider bg-subtle">
          <button onClick={onAdd} className="button-primary w-full py-2 font-semibold">
            + Add New Scheduled Payment
          </button>
      </div>
    </div>
  );
};

export default ScheduledPaymentsScreen;