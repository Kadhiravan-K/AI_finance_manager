import React, { useState, useMemo } from 'react';
import { Transaction, Account, Category, Goal, Shop, Trip, Contact } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
// FIX: Import getCurrencyFormatter to correctly format amounts for accounts with potentially different currencies.
import { getCurrencyFormatter } from '../utils/currency';

interface DataHubProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  goals: Goal[];
  shops: Shop[];
  trips: Trip[];
  contacts: Contact[];

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
  const formatCurrency = useCurrencyFormatter();

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
    return {
      ...props,
      transactions: props.transactions.filter(t => t.description.toLowerCase().includes(q)),
      accounts: props.accounts.filter(a => a.name.toLowerCase().includes(q)),
      categories: props.categories.filter(c => c.name.toLowerCase().includes(q)),
      shops: props.shops.filter(s => s.name.toLowerCase().includes(q)),
      trips: props.trips.filter(t => t.name.toLowerCase().includes(q)),
      contacts: props.contacts.filter(c => c.name.toLowerCase().includes(q)),
      goals: props.goals.filter(g => g.name.toLowerCase().includes(q)),
    };
  }, [searchQuery, props]);
  
  const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (
    <button onClick={() => setActiveTab(tab)} className={`px-3 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${ activeTab === tab ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger' }`}>
        {label}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
        case 'transactions': return <ListItem title="Description" items={filteredData.transactions} onEdit={props.onEditTransaction} onDelete={props.onDeleteTransaction} renderDetails={t => <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(t.amount)}</span>} />;
        // FIX: The useCurrencyFormatter hook returns a function that expects only one argument.
        // To format amounts for accounts with different currencies, we use getCurrencyFormatter directly,
        // which creates a specific formatter for each account's currency.
        case 'accounts': return <ListItem title="Account Name" items={filteredData.accounts} onEdit={props.onEditAccount} onDelete={props.onDeleteAccount} renderDetails={a => <span className="font-semibold">{getCurrencyFormatter(a.currency).format(accountBalances.get(a.id) || 0)}</span>} />;
        case 'categories': return <ListItem title="Category Name" items={filteredData.categories} onEdit={props.onEditCategory} onDelete={props.onDeleteCategory} renderDetails={c => <span className="text-xs text-secondary">{getCategoryPath(c.id, props.categories)}</span>} />;
        case 'shops': return <ListItem title="Shop Name" items={filteredData.shops} onEdit={props.onEditShop} onDelete={props.onDeleteShop} renderDetails={s => <span className="text-xs text-secondary">{s.currency}</span>} />;
        case 'trips': return <ListItem title="Trip Name" items={filteredData.trips} onEdit={props.onEditTrip} onDelete={props.onDeleteTrip} renderDetails={t => <span className="text-xs text-secondary">{new Date(t.date).toLocaleDateString()}</span>} />;
        case 'contacts': return <ListItem title="Contact Name" items={filteredData.contacts} onEdit={props.onEditContact} onDelete={props.onDeleteContact} renderDetails={c => <span className="text-xs text-secondary">{c.groupId}</span>} />;
        case 'goals': return <ListItem title="Goal Name" items={filteredData.goals} onEdit={props.onEditGoal} onDelete={props.onDeleteGoal} renderDetails={g => <span className="font-semibold">{formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}</span>} />;
    }
  };
  
  const handleAdd = () => {
    switch(activeTab) {
      case 'transactions': props.onAddTransaction(); break;
      case 'accounts': props.onAddAccount(); break;
      case 'categories': props.onAddCategory(); break;
      case 'shops': props.onAddShop(); break;
      case 'trips': props.onAddTrip(); break;
      case 'contacts': props.onAddContact(); break;
      case 'goals': props.onAddGoal(); break;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-primary text-center">Data Hub 🗄️</h2>
        <div className="relative">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="input-base w-full rounded-full py-2 px-3 pl-10" />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add New
            </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

const ListItem: React.FC<{
    title: string;
    items: any[];
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
    renderDetails: (item: any) => React.ReactNode;
}> = ({ title, items, onEdit, onDelete, renderDetails }) => {
    return (
        <div className="space-y-2 animate-fadeInUp">
            {items.map(item => (
                <div key={item.id} className="p-3 bg-subtle rounded-lg group flex justify-between items-center">
                    <p className="font-medium text-primary">{item.description || item.name}</p>
                    <div className="flex items-center gap-4">
                        <div className="text-right">{renderDetails(item)}</div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(item)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                            <button onClick={() => onDelete(item.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full ml-1">Delete</button>
                        </div>
                    </div>
                </div>
            ))}
            {items.length === 0 && <p className="text-center text-secondary py-8">No items found.</p>}
        </div>
    );
}

export default DataHubScreen;