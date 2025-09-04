import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppDataContext } from '../contexts/SettingsContext';
import { ShoppingList, ShoppingListItem, ItemType, Priority } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomCheckbox from './CustomCheckbox';
import EmptyState from './EmptyState';

interface ShoppingListScreenProps {
  onCreateExpense: (list: ShoppingList) => void;
}

export const ShoppingListScreen: React.FC<ShoppingListScreenProps> = ({ onCreateExpense }) => {
  const dataContext = useContext(AppDataContext);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  if (!dataContext) return <div>Loading...</div>;

  const { shoppingLists, setShoppingLists, deleteItem } = dataContext;

  const handleSelectList = (id: string) => {
    setSelectedListId(id);
  };

  const handleBackToLists = () => {
    setSelectedListId(null);
  };

  const handleAddList = () => {
    const now = new Date().toISOString();
    const newList: ShoppingList = {
      id: self.crypto.randomUUID(),
      title: 'Untitled Shopping List',
      items: [],
      createdAt: now,
      updatedAt: now,
    };
    setShoppingLists(prev => [...(prev || []), newList]);
    setSelectedListId(newList.id);
  };

  const handleSaveList = (updatedList: ShoppingList) => {
    setShoppingLists(prev => (prev || []).map(list => list.id === updatedList.id ? { ...updatedList, updatedAt: new Date().toISOString() } : list));
  };
  
  const handleDeleteList = (id: string) => {
      deleteItem(id, 'shoppingList');
      if (selectedListId === id) {
          setSelectedListId(null);
      }
  }

  const selectedList = useMemo(() => shoppingLists?.find(list => list.id === selectedListId), [shoppingLists, selectedListId]);

  if (selectedList) {
    return <ShoppingListDetailView list={selectedList} onSave={handleSaveList} onBack={handleBackToLists} onCreateExpense={onCreateExpense} />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0">
        <h2 className="text-2xl font-bold text-primary text-center">Shopping Lists 🛒</h2>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-3">
        {shoppingLists && shoppingLists.length > 0 ? (
          shoppingLists.map(list => (
            <div key={list.id} className="p-3 bg-subtle rounded-lg group flex justify-between items-center transition-colors hover-bg-stronger">
              <div onClick={() => handleSelectList(list.id)} className="flex-grow cursor-pointer">
                <p className="font-semibold text-primary">{list.title}</p>
                <p className="text-xs text-secondary">{list.items.length} items</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleSelectList(list.id)} className="text-sm font-semibold text-sky-400 hover:text-sky-300 px-3 py-1 rounded-full hover:bg-sky-500/10">Edit</button>
                <button onClick={() => handleDeleteList(list.id)} className="text-sm font-semibold text-rose-400 hover:text-rose-300 px-3 py-1 rounded-full hover:bg-rose-500/10">Delete</button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState 
            icon="🛒"
            title="No Shopping Lists"
            message="Create a list to keep track of your shopping items and expenses."
            actionText="Create First List"
            onAction={handleAddList}
          />
        )}
      </div>
      <div className="p-4 border-t border-divider flex-shrink-0">
        <button onClick={handleAddList} className="button-primary w-full py-2">+ Add New List</button>
      </div>
    </div>
  );
};

interface ShoppingListDetailViewProps {
  list: ShoppingList;
  onSave: (list: ShoppingList) => void;
  onBack: () => void;
  onCreateExpense: (list: ShoppingList) => void;
}

const ShoppingListDetailView: React.FC<ShoppingListDetailViewProps> = ({ list, onSave, onBack, onCreateExpense }) => {
  const [currentList, setCurrentList] = useState<ShoppingList>(list);
  const formatCurrency = useCurrencyFormatter();
  const [editingRateId, setEditingRateId] = useState<string | null>(null);

  const formatCompactNumber = (num: number): string => {
    if (num === 0) return '0.00';
    if (num < 1000) return num.toFixed(2);
    const formatter = new Intl.NumberFormat('en', {
        notation: 'compact',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
    return formatter.format(num);
  };
  
  const priorities: Priority[] = ['None', 'Low', 'Medium', 'High'];
  const priorityStyles: Record<Priority, { icon: string; colorClass: string; borderColorClass: string }> = {
    'High': { icon: '🔴', colorClass: 'text-rose-400', borderColorClass: 'border-rose-500/50' },
    'Medium': { icon: '🟡', colorClass: 'text-yellow-400', borderColorClass: 'border-yellow-500/50' },
    'Low': { icon: '🟢', colorClass: 'text-green-400', borderColorClass: 'border-green-500/50' },
    'None': { icon: '⚪', colorClass: 'text-slate-500', borderColorClass: 'border-transparent' },
  };

  useEffect(() => {
    setCurrentList(list);
  }, [list]);

  const total = useMemo(() => currentList.items.reduce((sum, item) => sum + (item.rate || 0), 0), [currentList.items]);
  const purchasedTotal = useMemo(() => currentList.items.filter(i => i.isPurchased).reduce((sum, item) => sum + (item.rate || 0), 0), [currentList.items]);

  const sortedItems = useMemo(() => {
    const priorityOrder: Record<Priority, number> = { 'High': 0, 'Medium': 1, 'Low': 2, 'None': 3 };
    return [...currentList.items].sort((a, b) => {
        if (a.isPurchased !== b.isPurchased) {
            return a.isPurchased ? 1 : -1;
        }
        const priorityA = a.priority || 'None';
        const priorityB = b.priority || 'None';
        if (priorityOrder[priorityA] !== priorityOrder[priorityB]) {
            return priorityOrder[priorityA] - priorityOrder[priorityB];
        }
        return 0; 
    });
  }, [currentList.items]);

  const handleItemChange = (itemId: string, field: keyof ShoppingListItem, value: string | number | boolean) => {
    const updatedItems = currentList.items.map(item => item.id === itemId ? { ...item, [field]: value } : item);
    setCurrentList(prev => ({ ...prev, items: updatedItems }));
  };
  
  const handlePriorityChange = (itemId: string) => {
    const item = currentList.items.find(i => i.id === itemId);
    if (!item) return;
    const currentPriority = item.priority || 'None';
    const currentIndex = priorities.indexOf(currentPriority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    const nextPriority = priorities[nextIndex];
    handleItemChange(itemId, 'priority', nextPriority);
  };

  const handleAddItem = () => {
    const newItem: ShoppingListItem = { id: self.crypto.randomUUID(), name: '', rate: 0, isPurchased: false, priority: 'None', quantity: '1' };
    setCurrentList(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = currentList.items.filter(item => item.id !== itemId);
    setCurrentList(prev => ({ ...prev, items: updatedItems }));
  };
  
  const handleCreateExpenseClick = () => {
    onSave(currentList); // Save any pending changes first
    const purchasedItems = currentList.items.filter(item => item.isPurchased && item.name.trim() && item.rate > 0);
    if (purchasedItems.length === 0) {
      alert("Please check one or more purchased items with a valid name and rate to create an expense.");
      return;
    }
    const listForExpense: ShoppingList = {
      ...currentList,
      items: purchasedItems,
    };
    onCreateExpense(listForExpense);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-grow min-w-0">
            <button onClick={() => { onSave(currentList); onBack(); }} className="p-2 -ml-2 text-secondary hover:text-primary rounded-full flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <input 
              type="text" 
              value={currentList.title}
              onChange={(e) => setCurrentList(p => ({ ...p, title: e.target.value }))}
              className="bg-transparent text-xl font-bold text-primary focus:outline-none w-full"
            />
        </div>
        <button onClick={() => { onSave(currentList); onBack(); }} className="button-primary px-4 py-2 flex-shrink-0">
            Save
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
         <div className="shopping-list-item-grid px-2 pb-2 border-b border-divider">
            <div className="text-sm font-semibold text-secondary text-center px-1">Done</div>
            <div className="text-sm font-semibold text-secondary">Item Name</div>
            <div className="text-sm font-semibold text-secondary text-center px-1">Qty</div>
            <div className="text-sm font-semibold text-secondary text-center" title="Priority">P</div>
            <div className="text-sm font-semibold text-secondary text-right px-1">Rate</div>
          </div>
        {sortedItems.map(item => {
          const itemPriority = item.priority || 'None';
          return (
            <div key={item.id} className={`shopping-list-item-grid group p-2 rounded-lg hover-bg-stronger border-l-4 transition-colors ${priorityStyles[itemPriority].borderColorClass}`}>
              <CustomCheckbox id={item.id} label="" checked={item.isPurchased} onChange={checked => {
                  handleItemChange(item.id, 'isPurchased', checked);
              }} />
              <input 
                type="text" 
                value={item.name} 
                onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                className={`shopping-list-item-input ${item.isPurchased ? 'line-through text-secondary' : ''}`}
              />
               <input 
                type="text"
                value={item.quantity}
                onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                className={`shopping-list-item-input text-center no-spinner ${item.isPurchased ? 'line-through text-secondary' : ''}`}
                placeholder="1"
              />
              <div className="flex justify-center">
                <button
                    type="button"
                    onClick={() => handlePriorityChange(item.id)}
                    className={`text-xl p-1 rounded-full hover:bg-slate-700/50 transition-colors ${priorityStyles[itemPriority].colorClass}`}
                    title={`Priority: ${itemPriority}`}
                >
                    {priorityStyles[itemPriority].icon}
                </button>
              </div>
              <div className="flex items-center justify-end">
                {editingRateId === item.id ? (
                  <input
                    type="number"
                    value={item.rate || ''}
                    onChange={e => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    onBlur={() => setEditingRateId(null)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setEditingRateId(null); } }}
                    className="shopping-list-item-input rate no-spinner"
                    autoFocus
                    onFocus={e => e.target.select()}
                  />
                ) : (
                  <span 
                    onClick={() => setEditingRateId(item.id)} 
                    className={`p-1 cursor-pointer w-full text-right ${item.isPurchased ? 'line-through text-secondary' : 'text-primary'}`}
                  >
                    {formatCompactNumber(item.rate)}
                  </span>
                )}
                <button onClick={() => handleRemoveItem(item.id)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2">&times;</button>
              </div>
            </div>
          )
        })}
         <button onClick={handleAddItem} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400">
            + Add a new item
        </button>
      </div>
      <div className="p-4 border-t border-divider flex-shrink-0 space-y-3">
        <div className="flex justify-between items-center text-lg font-bold">
          <span className="text-secondary">Purchased Total:</span>
          <span className="text-emerald-400">{formatCurrency(purchasedTotal)}</span>
        </div>
         <div className="flex justify-between items-center text-sm font-bold">
          <span className="text-secondary">List Total:</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
         <button onClick={handleCreateExpenseClick} className="w-full button-secondary py-2" disabled={purchasedTotal === 0}>Create Expense from List</button>
      </div>
    </div>
  );
};
