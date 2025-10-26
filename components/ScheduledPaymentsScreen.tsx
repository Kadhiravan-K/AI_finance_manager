

import React, { useMemo, useState } from 'react';
import { RecurringTransaction, Category, Account, Priority, ActiveModal, AppliedViewOptions, ViewOptions, TransactionType } from '../types';
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

const ScheduledPaymentsScreen: React.FC<ScheduledPaymentsScreenProps> = ({ recurringTransactions, onAdd, onEdit, onDelete, onUpdate, openModal }) => {
  const formatCurrency = useCurrencyFormatter();
  
  const [viewOptions, setViewOptions] = useState<AppliedViewOptions>({
    sort: { key: 'nextDueDate', direction: 'asc' },
    filters: { income: true, expense: true }
  });

  const priorityOrder: Record<Priority, number> = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2, [Priority.NONE]: 3 };

  const sortedAndFiltered = useMemo(() => {
    let result = [...(recurringTransactions || [])];

    if (!viewOptions.filters.income) result = result.filter(t => t.type !== TransactionType.INCOME);
    if (!viewOptions.filters.expense) result = result.filter(t => t.type !== TransactionType.EXPENSE);

    const { key, direction } = viewOptions.sort;
    result.sort((a, b) => {
      let comparison = 0;
      switch (key) {
        case 'nextDueDate':
          comparison = new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'priority':
          comparison = priorityOrder[a.priority || Priority.NONE] - priorityOrder[b.priority || Priority.NONE];
          break;
      }
      return direction === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [recurringTransactions, viewOptions, priorityOrder]);
  
  const viewOptionsConfig: ViewOptions = {
    sortOptions: [
      { key: 'nextDueDate', label: 'Due Date' },
      { key: 'amount', label: 'Amount' },
      { key: 'priority', label: 'Priority' }
    ],
    filterOptions: [
      { key: 'income', label: 'Income', type: 'toggle' },
      { key: 'expense', label: 'Expense', type: 'toggle' },
    ]
  };

  const isViewOptionsApplied = useMemo(() => {
    return viewOptions.sort.key !== 'nextDueDate' || viewOptions.sort.direction !== 'asc' || !viewOptions.filters.income || !viewOptions.filters.expense;
  }, [viewOptions]);


  const priorities: Priority[] = [Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH];
  const priorityStyles: Record<Priority, { buttonClass: string; }> = {
    [Priority.HIGH]: { buttonClass: 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30' },
    [Priority.MEDIUM]: { buttonClass: 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' },
    [Priority.LOW]: { buttonClass: 'bg-green-500/20 text-green-300 hover:bg-green-500/30' },
    [Priority.NONE]: { buttonClass: 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/30' },
  };

  const handlePriorityChange = (item: RecurringTransaction) => {
    const currentPriority = item.priority || Priority.NONE;
    const currentIndex = priorities.indexOf(currentPriority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    const nextPriority = priorities[nextIndex];
    onUpdate({ ...item, priority: nextPriority });
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between">
         <h2 className="text-2xl font-bold text-primary text-center flex-grow">Scheduled Payments 📅</h2>
         <button onClick={() => openModal('viewOptions', { options: viewOptionsConfig, currentValues: viewOptions, onApply: setViewOptions })} className="button-secondary text-sm px-3 py-1.5 flex items-center gap-2 relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 10h12M3 16h6" /></svg>
            <span>Filter & Sort</span>
            {isViewOptionsApplied && <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[var(--color-bg-app)]"></div>}
        </button>
       </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-2">
        {sortedAndFiltered.map(item => (
          <div key={item.id} className="p-3 bg-subtle rounded-lg flex items-center justify-between group">
            <div className="flex-grow">
              <p className="font-semibold text-primary">{item.description} - <span className={item.type === 'income' ? 'text-[var(--color-accent-emerald)]' : 'text-[var(--color-accent-rose)]'}>{formatCurrency(item.amount)}</span></p>
              <p className="text-xs text-secondary">Next due: {new Date(item.nextDueDate).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePriorityChange(item)}
                className={`text-xs font-semibold px-2 py-1 rounded-full transition-colors w-20 text-center ${priorityStyles[item.priority || Priority.NONE].buttonClass}`}
              >
                {item.priority || Priority.NONE}
              </button>
              <div className="space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(item)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                <button onClick={() => onDelete(item.id)} className="text-xs px-2 py-1 text-rose-400 hover:bg-rose-500/20 rounded-full transition-colors">Delete</button>
              </div>
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