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

  const checklistItems = useMemo(() => {
    const items = Array.isArray(currentList.content) ? [...currentList.content] : [];
    
    // Define priority order for sorting: High > Medium > Low > None
    const priorityOrder: Record<Priority, number> = {
      [Priority.HIGH]: 0,
      [Priority.MEDIUM]: 1,
      [Priority.LOW]: 2,
      [Priority.NONE]: 3,
    };

    // Sort items by priority
    items.sort((a, b) => {
      const priorityA = a.priority || Priority.NONE;
      const priorityB = b.priority || Priority.NONE;
      return priorityOrder[priorityA] - priorityOrder[priorityB];
    });

    return items;
  }, [currentList.content]);

  const priorities: Priority[] = [Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH];
  const priorityColors: Record<Priority, string> = {
      [Priority.HIGH]: 'bg-rose-500',
      [Priority.MEDIUM]: 'bg-yellow-400',
      [Priority.LOW]: 'bg-emerald-500',
      [Priority.NONE]: 'bg-slate-500',
  };
   const priorityBorderColors: Record<Priority, string> = {
      [Priority.HIGH]: 'border-l-rose-500',
      [Priority.MEDIUM]: 'border-l-yellow-400',
      [Priority.LOW]: 'border-l-emerald-500',
      [Priority.NONE]: 'border-l-slate-500',
  };

  const handleItemChange = (itemId: string, field: keyof ChecklistItem, value: any) => {
    const newItems = (Array.isArray(currentList.content) ? currentList.content : []).map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    setCurrentList(prev => ({ ...prev, content: newItems, updatedAt: new Date().toISOString() }));
  };
  
  const handlePriorityChange = (itemId: string) => {
    const item = checklistItems.find(i => i.id === itemId);
    if (!item) return;

    const currentPriority = item.priority || Priority.NONE;
    const currentIndex = priorities.indexOf(currentPriority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    const nextPriority = priorities[nextIndex];
    handleItemChange(itemId, 'priority', nextPriority);
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
  
  const handleLinkToTrip = () => {
    openModal('linkToTrip', { note: currentList, onSave });
  };

  const { purchasedTotal, remainingTotal, grandTotal, progress } = useMemo(() => {
    const totalItems = checklistItems.length;
    if (totalItems === 0) return { purchasedTotal: 0, progress: 0, remainingTotal: 0, grandTotal: 0 };
    
    let pTotal = 0;
    let rTotal = 0;
    
    checklistItems.forEach(item => {
        const itemTotal = (item.rate || 0) * (parseFloat(item.quantity) || 1);
        if (item.isPurchased) {
            pTotal += itemTotal;
        } else {
            rTotal += itemTotal;
        }
    });

    const purchasedCount = checklistItems.filter(i => i.isPurchased).length;
    const progress = totalItems > 0 ? (purchasedCount / totalItems) * 100 : 0;

    return { purchasedTotal: pTotal, remainingTotal: rTotal, grandTotal: pTotal + rTotal, progress };
  }, [checklistItems]);
  
  const togglePin = () => {
    const updatedNote = { ...currentList, isPinned: !currentList.isPinned };
    setCurrentList(updatedNote);
    onSave(updatedNote);
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
            <button onClick={togglePin} className={`pin-button ${currentList.isPinned ? 'pinned' : ''}`} title={currentList.isPinned ? 'Unpin' : 'Pin'}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24" fill="currentColor">
                <path d="M14 4v5c0 1.12.37 2.16 1 3H9c.63-.84 1-1.88 1-3V4h4m3 0H7c-1.1 0-2 .9-2 2v5c0 1.66 1.34 3 3 3h1v5l-2 2v1h8v-1l-2-2v-5h1c1.66 0 3-1.34 3-3V6c0-1.1-.9-2-2-2Z"/>
              </svg>
            </button>
            <button onClick={handleLinkToTrip} className="button-secondary p-2 rounded-full aspect-square" title="Link to Trip">
                ✈️
            </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        {checklistItems.map(item => {
            const itemTotal = (item.rate || 0) * (parseFloat(item.quantity) || 1);
            const priority = item.priority || Priority.NONE;
            return (
                <div key={item.id} className={`p-3 rounded-lg flex gap-3 items-center transition-all ${item.isPurchased ? 'bg-emerald-900/20' : 'bg-subtle'} ${item.isPurchased ? (priorityBorderColors[priority] || 'border-l-emerald-500') : 'border-l-transparent'} border-l-4`}>
                    
                    <button onClick={() => handlePriorityChange(item.id)} className={`w-3 h-3 rounded-full flex-shrink-0 ${priorityColors[priority]}`} title={`Priority: ${priority}`}/>
                    
                    <CustomCheckbox id={item.id} checked={item.isPurchased} onChange={checked => handleItemChange(item.id, 'isPurchased', checked)} label="" />
                    
                    <div className="flex-grow">
                        <input type="text" value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} placeholder="Item name" className={`shopping-list-item-input w-full font-medium ${item.isPurchased ? 'line-through text-secondary' : 'text-primary'}`} />
                        <div className="flex items-center gap-1 text-sm text-secondary mt-1">
                            <input type="text" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="shopping-list-item-input text-center w-10 bg-transparent" placeholder="1" />
                            <span>x</span>
                            <input type="text" inputMode="decimal" value={item.rate || ''} onChange={e => handleItemChange(item.id, 'rate', parseFloat(e.target.value))} className="shopping-list-item-input w-16 bg-transparent" placeholder="0.00" />
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="font-semibold text-primary">{formatCurrency(itemTotal)}</p>
                    </div>

                    <button onClick={() => handleRemoveItem(item.id)} className="text-rose-400/60 hover:text-rose-400 p-1 self-start text-xl font-bold" title="Delete item">
                        &times;
                    </button>
                </div>
            )
        })}
        <button onClick={handleAddItem} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400">+ Add Item</button>
      </div>
      <div className="checklist-summary p-4 border-t border-divider flex-shrink-0 space-y-3">
        <div className="w-full bg-subtle rounded-full h-2.5 border border-divider">
            <div className="h-full rounded-full bg-emerald-500" style={{width: `${progress}%`}}></div>
        </div>
        <div className="space-y-1 text-sm">
            <div className="checklist-summary-row"><span className="text-secondary">Purchased Total:</span><span className="font-mono text-primary">{formatCurrency(purchasedTotal)}</span></div>
            <div className="checklist-summary-row"><span className="text-secondary">Remaining Total:</span><span className="font-mono text-primary">{formatCurrency(remainingTotal)}</span></div>
            <div className="checklist-summary-row font-bold border-t border-divider mt-1 pt-1"><span className="text-primary">Grand Total:</span><span className="font-mono text-primary">{formatCurrency(grandTotal)}</span></div>
        </div>
        <button onClick={() => onCreateExpense(currentList)} disabled={purchasedTotal <= 0} className="button-primary w-full py-2">
            Create Expense from Purchased Items
        </button>
      </div>
    </div>
  );
};

export default ChecklistDetailView;