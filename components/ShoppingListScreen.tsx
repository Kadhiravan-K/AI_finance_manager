import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppDataContext } from '../contexts/SettingsContext';
import { ShoppingList, ShoppingListItem, ItemType, Priority, AppliedViewOptions, ViewOptions, ActiveModal, ActiveScreen } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomCheckbox from './CustomCheckbox';
import EmptyState from './EmptyState';

interface ShoppingListScreenProps {
  shoppingListId: string | null;
  onCreateExpense: (list: ShoppingList) => void;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
  onDeleteItem: (id: string, itemType: ItemType) => void;
  onNavigate: (screen: ActiveScreen) => void;
}

export const ShoppingListScreen: React.FC<ShoppingListScreenProps> = ({ shoppingListId, onCreateExpense, openModal, onDeleteItem, onNavigate }) => {
  const dataContext = useContext(AppDataContext);
  const [selectedListId, setSelectedListId] = useState<string | null>(shoppingListId);
  
  useEffect(() => {
    setSelectedListId(shoppingListId);
  }, [shoppingListId]);

  if (!dataContext) return <div>Loading...</div>;

  const { shoppingLists, setShoppingLists } = dataContext;

  const handleSelectList = (id: string) => {
    setSelectedListId(id);
  };

  const handleBackToLists = () => {
    setSelectedListId(null);
    onNavigate('shoppingLists'); // Navigate back to the main list view
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
      onDeleteItem(id, 'shoppingList');
      if (selectedListId === id) {
          setSelectedListId(null);
      }
  }

  const selectedList = useMemo(() => shoppingLists?.find(list => list.id === selectedListId), [shoppingLists, selectedListId]);

  if (selectedList) {
    return <ShoppingListDetailView list={selectedList} onSave={handleSaveList} onBack={handleBackToLists} onCreateExpense={onCreateExpense} />;
  }

  return <ShoppingListView onSelectList={handleSelectList} onAddList={handleAddList} onDeleteList={handleDeleteList} openModal={openModal} />;
};

interface ShoppingListViewProps {
    onSelectList: (id: string) => void;
    onAddList: () => void;
    onDeleteList: (id: string) => void;
    openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}
const ShoppingListView: React.FC<ShoppingListViewProps> = ({ onSelectList, onAddList, onDeleteList, openModal }) => {
    const dataContext = useContext(AppDataContext);
    const formatCurrency = useCurrencyFormatter();
    const [viewOptions, setViewOptions] = useState<AppliedViewOptions>({
        sort: { key: 'updatedAt', direction: 'desc' },
        filters: {}
    });

    if (!dataContext) return null;
    const { shoppingLists = [] } = dataContext;

    const sortedLists = useMemo(() => {
        let result = [...shoppingLists];
        const { key, direction } = viewOptions.sort;
        result.sort((a, b) => {
            let comparison = 0;
            switch(key) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'updatedAt':
                    comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                    break;
            }
            return direction === 'asc' ? comparison : -comparison;
        });
        return result;
    }, [shoppingLists, viewOptions]);

    const viewOptionsConfig: ViewOptions = {
        sortOptions: [
            { key: 'updatedAt', label: 'Last Updated' },
            { key: 'title', label: 'Title (A-Z)' },
        ],
        filterOptions: []
    };

    const isViewOptionsApplied = useMemo(() => {
        return viewOptions.sort.key !== 'updatedAt' || viewOptions.sort.direction !== 'desc';
    }, [viewOptions]);

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-primary text-center">Shopping Lists 🛒</h2>
                <button onClick={() => openModal('viewOptions', { options: viewOptionsConfig, currentValues: viewOptions, onApply: setViewOptions })} className="button-secondary text-sm p-2 flex items-center gap-2 relative rounded-full aspect-square">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 10h12M3 16h6" /></svg>
                    {isViewOptionsApplied && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[var(--color-bg-app)]"></div>}
                </button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-3">
                {sortedLists.length > 0 ? (
                sortedLists.map((list, index) => {
                    const listTotal = list.items.reduce((sum, item) => sum + (item.rate || 0), 0);
                    const purchasedTotal = list.items.filter(i => i.isPurchased).reduce((sum, item) => sum + (item.rate || 0), 0);
                    const progress = listTotal > 0 ? (purchasedTotal / listTotal) * 100 : 0;

                    return (
                    <div key={list.id} onClick={() => onSelectList(list.id)} className="glass-card p-4 rounded-xl group flex flex-col gap-2 animate-fadeInUp cursor-pointer" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex justify-between items-start">
                        <p className="font-bold text-lg text-primary truncate pr-2">{list.title}</p>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }} className="p-1 -mr-2 -mt-1 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" aria-label={`Delete list ${list.title}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-secondary">
                        <span>{list.items.length} items</span>
                        <span className="text-tertiary">•</span>
                        <span>Updated: {new Date(list.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-2 mt-2">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                            <div className="text-left"><p className="text-xs text-secondary">List Total</p><p className="font-semibold text-primary">{formatCurrency(listTotal)}</p></div>
                            <div className="text-right"><p className="text-xs text-secondary">Purchased</p><p className="font-semibold text-emerald-400">{formatCurrency(purchasedTotal)}</p></div>
                        </div>
                    </div>
                    )
                })
                ) : (
                <EmptyState icon="🛒" title="No Shopping Lists" message="Create a list to keep track of your shopping items and expenses." actionText="Create First List" onAction={onAddList} />
                )}
            </div>
            <div className="p-4 border-t border-divider flex-shrink-0">
                <button onClick={onAddList} className="button-primary w-full py-2">+ Add New List</button>
            </div>
        </div>
    )
}

interface ShoppingListDetailViewProps {
  list: ShoppingList;
  onSave: (list: ShoppingList) => void;
  onBack: () => void;
  onCreateExpense: (list: ShoppingList) => void;
}

const ShoppingListDetailView: React.FC<ShoppingListDetailViewProps> = ({ list, onSave, onBack, onCreateExpense }) => {
  const [currentList, setCurrentList] = useState<ShoppingList>(list);
  const formatCurrency = useCurrencyFormatter();
  const formatNumber = useCurrencyFormatter({ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [editingRateId, setEditingRateId] = useState<string | null>(null);

  const priorities: Priority[] = ['None', 'Low', 'Medium', 'High'];
  const priorityStyles: Record<Priority, { dotClass: string }> = {
    'High': { dotClass: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]' },
    'Medium': { dotClass: 'bg-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.7)]' },
    'Low': { dotClass: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]' },
    'None': { dotClass: 'bg-slate-600 border border-slate-500' },
  };
  const priorityBarColors: Record<Priority, string> = {
    'High': 'bg-rose-500',
    'Medium': 'bg-yellow-400',
    'Low': 'bg-emerald-400',
    'None': 'bg-transparent',
  };


  useEffect(() => {
    setCurrentList(list);
  }, [list]);

  const total = useMemo(() => currentList.items.reduce((sum, item) => sum + (item.rate || 0), 0), [currentList.items]);
  const totalItemCount = currentList.items.length;
  const purchasedTotal = useMemo(() => currentList.items.filter(i => i.isPurchased).reduce((sum, item) => sum + (item.rate || 0), 0), [currentList.items]);
  const purchasedItemCount = useMemo(() => currentList.items.filter(i => i.isPurchased).length, [currentList.items]);


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
            <div className="text-sm font-semibold text-secondary text-center" title="Priority">Priority</div>
            <div className="text-sm font-semibold text-secondary text-right px-1">Rate</div>
            <div></div>
          </div>
        {sortedItems.map(item => {
          const itemPriority = item.priority || 'None';
          return (
            <div key={item.id} className={`shopping-list-item-grid group p-2 rounded-lg hover-bg-stronger relative pl-4`}>
              <div className={`absolute left-1.5 top-2 bottom-2 w-1 rounded-full ${priorityBarColors[itemPriority]}`}></div>
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
                    className={`w-4 h-4 rounded-full transition-all duration-200 hover:scale-125 ${priorityStyles[itemPriority].dotClass}`}
                    title={`Set Priority: ${itemPriority}`}
                >
                    <span className="sr-only">Set Priority: {itemPriority}</span>
                </button>
              </div>
              
              <div className="w-full h-full">
                {editingRateId === item.id ? (
                  <input
                    type="number"
                    onWheel={e => e.currentTarget.blur()}
                    defaultValue={item.rate || ''}
                    onBlur={e => {
                      handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0);
                      setEditingRateId(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); } 
                      else if (e.key === 'Escape') { setEditingRateId(null); }
                    }}
                    className={`shopping-list-item-input rate no-spinner text-primary`}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => setEditingRateId(item.id)}
                    className={`w-full h-full flex items-center justify-end text-right px-1 cursor-pointer rounded-md ${item.isPurchased ? 'line-through text-secondary' : 'text-primary'}`}
                  >
                    {formatNumber(item.rate || 0)}
                  </div>
                )}
              </div>

              <button onClick={() => handleRemoveItem(item.id)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity justify-self-center text-xl font-bold">&times;</button>
            </div>
          )
        })}
         <button onClick={handleAddItem} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400">
            + Add a new item
        </button>
      </div>
      <div className="p-4 border-t border-divider flex-shrink-0 space-y-3">
        <div className="space-y-2">
            <div className="grid grid-cols-3 text-xs text-secondary font-semibold">
                <span></span>
                <span className="text-center">Items</span>
                <span className="text-right">Amount</span>
            </div>
            <div className="grid grid-cols-3 items-center">
                <span className="font-bold text-secondary">Purchased</span>
                <span className="text-center font-mono text-primary">{purchasedItemCount}</span>
                <span className="text-right font-bold text-lg text-emerald-400">{formatCurrency(purchasedTotal)}</span>
            </div>
             <div className="grid grid-cols-3 items-center">
                <span className="font-bold text-secondary">List Total</span>
                <span className="text-center font-mono text-primary">{totalItemCount}</span>
                <span className="text-right font-bold text-lg text-primary">{formatCurrency(total)}</span>
            </div>
        </div>
         <button onClick={handleCreateExpenseClick} className="w-full button-secondary py-2 mt-2" disabled={purchasedTotal === 0}>Create Expense from List</button>
      </div>
    </div>
  );
};
