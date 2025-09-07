
import React, { useState, useMemo } from 'react';
import { Transaction, Account, Category, Goal, Shop, Trip, Contact, ItemType, AppState } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { getCurrencyFormatter } from '../utils/currency';

interface DataHubProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  goals: Goal[];
  shops: Shop[];
  trips: Trip[];
  contacts: Contact[];
  settings: AppState['settings'];

  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  
  onAddAccount: () => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;

  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  
  onAddGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;

  onAddShop: () => void;
  onEditShop: (shop: Shop) => void;
  onDeleteShop: (id: string) => void;
  
  onAddTrip: () => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (id: string) => void;

  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
}

type Tab = 'transactions' | 'accounts' | 'categories' | 'shops' | 'trips' | 'contacts' | 'goals';

const DataHubScreen: React.FC<DataHubProps> = (props) => {
  const [activeTab, setActiveTab] = useState<Tab>('transactions');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryPath = (categoryId: string, allCategories: Category[]): string => {
    let path: string[] = [], current = allCategories.find(c => c.id === categoryId);
    while (current) { path.unshift(current.name); current = allCategories.find(c => c.id === current.parentId); }
    return path.join(' / ') || 'Uncategorized';
  };
  
  const accountBalances = useMemo(() => {
    const balances = new Map<string, number>();
    props.transactions.forEach(t => {
      const current = balances.get(t.accountId) || 0;
      balances.set(t.accountId, current + (t.type === 'income' ? t.amount : -t.amount));
    });
    return balances;
  }, [props.transactions]);

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return props;
    const filter = (items: any[], key: string) => items.filter(item => item[key]?.toLowerCase().includes(q));
    
    return {
      ...props,
      transactions: filter(props.transactions, 'description'),
      accounts: filter(props.accounts, 'name'),
      categories: filter(props.categories, 'name'),
      shops: filter(props.shops, 'name'),
      trips: filter(props.trips, 'name'),
      contacts: filter(props.contacts, 'name'),
      goals: filter(props.goals, 'name'),
    };
  }, [searchQuery, props]);
  
  const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (
    <button onClick={() => setActiveTab(tab)} className={`px-3 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${ activeTab === tab ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger' }`}>
        {label}
    </button>
  );

  const renderContent = () => {
    const listProps = {
        items: filteredData[activeTab],
        onEdit: props[`onEdit${capitalize(activeTab.slice(0, -1))}` as keyof DataHubProps] as (item: any) => void,
        onDelete: props[`onDelete${capitalize(activeTab.slice(0, -1))}` as keyof DataHubProps] as (id: string) => void,
        itemType: activeTab.slice(0, -1) as ItemType
    };

    switch (activeTab) {
        case 'transactions': return <ListItem {...listProps} renderDetails={(t: Transaction) => <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{getCurrencyFormatter(props.accounts.find(a=>a.id===t.accountId)?.currency || '').format(t.amount)}</span>} />;
        case 'accounts': return <ListItem {...listProps} renderDetails={(a: Account) => <span className="font-semibold">{getCurrencyFormatter(a.currency).format(accountBalances.get(a.id) || 0)}</span>} />;
        case 'categories': return <ListItem {...listProps} renderDetails={(c: Category) => <span className="text-xs text-secondary">{getCategoryPath(c.id, props.categories)}</span>} />;
        case 'shops': return <ListItem {...listProps} renderDetails={(s: Shop) => <span className="text-xs text-secondary">{s.currency}</span>} />;
        case 'trips': return <ListItem {...listProps} renderDetails={(t: Trip) => <span className="text-xs text-secondary">{new Date(t.date).toLocaleDateString()}</span>} />;
        case 'contacts': return <ListItem {...listProps} renderDetails={(c: Contact) => <span className="text-xs text-secondary">{c.groupId}</span>} />;
        case 'goals': return <ListItem {...listProps} renderDetails={(g: Goal) => <span className="font-semibold">{getCurrencyFormatter(props.settings.currency).format(g.currentAmount)} / {getCurrencyFormatter(props.settings.currency).format(g.targetAmount)}</span>} />;
    }
  };
  
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const handleAdd = () => {
    const handler = props[`onAdd${capitalize(activeTab.slice(0, -1))}` as keyof DataHubProps] as () => void;
    if (handler) handler();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-primary text-center">Data Hub 🗄️</h2>
        <div className="relative">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search ${activeTab}...`} className="input-base w-full rounded-full py-2 px-3 pl-10" />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-tertiary" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>
      <div className="flex-shrink-0 p-2 overflow-x-auto border-b border-divider">
        <div className="flex items-center gap-2">
            <TabButton tab="transactions" label="Transactions" />
            <TabButton tab="accounts" label="Accounts" />
            <TabButton tab="categories" label="Categories" />
            <TabButton tab="shops" label="Shops" />
            <TabButton tab="trips" label="Trips" />
            <TabButton tab="contacts" label="Contacts" />
            <TabButton tab="goals" label="Goals" />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-lg text-primary capitalize">{activeTab}</h3>
            <button onClick={handleAdd} className="button-primary px-3 py-1.5 text-sm rounded-full flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add New
            </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

const ListItem: React.FC<{
    items: any[];
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
    itemType: ItemType;
    renderDetails: (item: any) => React.ReactNode;
}> = ({ items, onEdit, onDelete, itemType, renderDetails }) => {
    return (
        <div className="space-y-2 animate-fadeInUp">
            {items.map(item => (
                <div key={item.id} className="p-3 bg-subtle rounded-lg group flex justify-between items-center">
                    <p className="font-medium text-primary">{item.description || item.name}</p>
                    <div className="flex items-center gap-4">
                        <div className="text-right">{renderDetails(item)}</div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(item)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                            <button onClick={() => onDelete(item.id)} className="text-xs px-2 py-1 text-rose-400 hover:bg-rose-500/20 rounded-full transition-colors ml-1">Delete</button>
                        </div>
                    </div>
                </div>
            ))}
            {items.length === 0 && <p className="text-center text-secondary py-8">No items found.</p>}
        </div>
    );
}

export default DataHubScreen;
