import React, { useState, useMemo } from 'react';
import { Note, ChecklistItem, Priority, ActiveModal } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomCheckbox from './CustomCheckbox';

interface ChecklistDetailViewProps {
  list: Note;
  onSave: (note: Note) => void;
  onBack: () => void;
  onCreateExpense: (list: Note) => void;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

const ChecklistDetailView: React.FC<ChecklistDetailViewProps> = ({ list, onSave, onBack, onCreateExpense, openModal }) => {
  const [currentList, setCurrentList] = useState<Note>(list);
  const formatCurrency = useCurrencyFormatter();
  
  const priorityOrder: Record<Priority, number> = {
    [Priority.HIGH]: 0,
    [Priority.MEDIUM]: 1,
    [Priority.LOW]: 2,
    [Priority.NONE]: 3,
  };

  const checklistItems = useMemo(() => {
    const items = Array.isArray(currentList.content) ? [...currentList.content] : [];
    items.sort((a, b) => (priorityOrder[a.priority || Priority.NONE] ?? 3) - (priorityOrder[b.priority || Priority.NONE] ?? 3));
    return items;
  }, [currentList.content, priorityOrder]);

  const handleItemChange = (itemId: string, field: keyof ChecklistItem, value: any) => {
    const newItems = (Array.isArray(currentList.content) ? currentList.content : []).map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    setCurrentList(prev => ({ ...prev, content: newItems, updatedAt: new Date().toISOString() }));
  };

  const handleAddItem = () => {
    const newItem: ChecklistItem = {
      id: self.crypto.randomUUID(),
      name: '',
      rate: 0,
      isPurchased: false,
      priority: Priority.NONE,
      quantity: '1',
    };
    setCurrentList(prev => ({ ...prev, content: [...checklistItems, newItem], updatedAt: new Date().toISOString() }));
  };
  
  const handleRemoveItem = (itemId: string) => {
      setCurrentList(prev => ({ ...prev, content: checklistItems.filter(item => item.id !== itemId), updatedAt: new Date().toISOString() }));
  }

  const handleSaveAndBack = () => {
    onSave(currentList);
    onBack();
  };

  const { purchasedTotal, progress } = useMemo(() => {
    const totalItems = checklistItems.length;
    if (totalItems === 0) return { purchasedTotal: 0, progress: 0 };
    const purchasedItems = checklistItems.filter(item => item.isPurchased);
    const purchasedTotal = purchasedItems.reduce((sum, item) => sum + (item.rate || 0) * (parseFloat(item.quantity) || 1), 0);
    const progress = (purchasedItems.length / totalItems) * 100;
    return { purchasedTotal, progress };
  }, [checklistItems]);
  
  const priorities: Priority[] = [Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH];
  const priorityStyles: Record<Priority, { border: string; bg: string; colorName: string }> = {
    [Priority.HIGH]: { border: 'border-rose-500', bg: 'bg-rose-500/10', colorName: 'rose' },
    [Priority.MEDIUM]: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', colorName: 'yellow' },
    [Priority.LOW]: { border: 'border-emerald-500', bg: 'bg-emerald-500/10', colorName: 'emerald' },
    [Priority.NONE]: { border: 'border-transparent', bg: '', colorName: '' },
  };

  const handlePriorityChange = (itemId: string) => {
    const item = checklistItems.find(i => i.id === itemId);
    if (!item) return;
    const currentPriority = item.priority || Priority.NONE;
    const currentIndex = priorities.indexOf(currentPriority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    handleItemChange(itemId, 'priority', priorities[nextIndex]);
  };
  
  const togglePin = () => {
    setCurrentList(p => ({ ...p, isPinned: !p.isPinned }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <button onClick={handleSaveAndBack} className="p-2 -ml-2 text-secondary hover:text-primary rounded-full flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <input 
            type="text" 
            value={currentList.title}
            onChange={(e) => setCurrentList(p => ({ ...p, title: e.target.value }))}
            className="bg-transparent text-xl font-bold text-primary focus:outline-none w-full"
          />
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
            <button onClick={togglePin} className={`pin-button text-xl ${currentList.isPinned ? 'pinned' : ''}`} title={currentList.isPinned ? 'Unpin' : 'Pin'}>
              📌
            </button>
            <button onClick={() => openModal('linkToTrip', { note: currentList, onSave })} className="button-secondary p-2 rounded-full aspect-square" title="Link to Trip">
                ✈️
            </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-2">
        {checklistItems.map(item => (
            <div key={item.id} className={`checklist-item ${priorityStyles[item.priority || Priority.NONE].bg} border-l-4 ${priorityStyles[item.priority || Priority.NONE].border}`}>
              <button onClick={() => handlePriorityChange(item.id)} className="w-4 h-4 rounded-full flex-shrink-0" style={{backgroundColor: priorityStyles[item.priority || Priority.NONE].colorName ? `var(--color-accent-${priorityStyles[item.priority || Priority.NONE].colorName})` : 'var(--color-border-divider)'}}></button>
              <CustomCheckbox id={item.id} checked={item.isPurchased} onChange={checked => handleItemChange(item.id, 'isPurchased', checked)} label="" />
              <input type="text" value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} placeholder="Item name" className={`shopping-list-item-input flex-grow ${item.isPurchased ? 'line-through text-secondary' : ''}`} />
              <div className="flex items-center gap-2 flex-shrink-0">
                <input type="text" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="shopping-list-item-input text-center w-12" placeholder="Qty" />
                <span>x</span>
                <input type="text" inputMode="decimal" value={item.rate || ''} onChange={e => handleItemChange(item.id, 'rate', parseFloat(e.target.value))} className="shopping-list-item-input rate w-20" placeholder="Rate" />
              </div>
              <button onClick={() => handleRemoveItem(item.id)} className="text-rose-400 p-1 text-xl leading-none flex-shrink-0">&times;</button>
            </div>
        ))}
        <button onClick={handleAddItem} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400">+ Add Item</button>
      </div>
      <div className="p-4 border-t border-divider flex-shrink-0 space-y-3">
        <div className="w-full bg-subtle rounded-full h-2.5 border border-divider">
            <div className="h-full rounded-full bg-emerald-500" style={{width: `${progress}%`}}></div>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-primary">Purchased Total: {formatCurrency(purchasedTotal)}</span>
            <button onClick={() => onCreateExpense(currentList)} className="button-primary px-4 py-2">Create Expense</button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistDetailView;