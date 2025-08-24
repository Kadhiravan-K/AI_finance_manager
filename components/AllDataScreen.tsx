import React, { useState, useMemo } from 'react';
import { Transaction, Account, Category, Goal } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { AllDataScreenProps } from '../types';

type ActiveTab = 'transactions' | 'accounts' | 'categories' | 'goals';

const AllDataScreen: React.FC<AllDataScreenProps> = ({
  transactions,
  accounts,
  categories,
  goals,
  onEditTransaction,
  onDeleteTransaction,
  onEditAccount,
  onDeleteAccount,
  onEditCategory,
  onDeleteCategory,
  onEditGoal,
  onDeleteGoal,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const formatCurrency = useCurrencyFormatter();

  const getCategoryPath = (categoryId: string, allCategories: Category[]): string => {
    let path: string[] = [], current = allCategories.find(c => c.id === categoryId);
    while (current) { path.unshift(current.name); current = allCategories.find(c => c.id === current.parentId); }
    return path.join(' / ') || 'Uncategorized';
  };
  
  const filteredData = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    if (!lowerCaseQuery) return { transactions, accounts, categories, goals };
    return {
      transactions: transactions.filter(t => t.description.toLowerCase().includes(lowerCaseQuery) || (t.notes || '').toLowerCase().includes(lowerCaseQuery) || getCategoryPath(t.categoryId, categories).toLowerCase().includes(lowerCaseQuery)),
      accounts: accounts.filter(a => a.name.toLowerCase().includes(lowerCaseQuery)),
      categories: categories.filter(c => c.name.toLowerCase().includes(lowerCaseQuery)),
      goals: goals.filter(g => g.name.toLowerCase().includes(lowerCaseQuery)),
    };
  }, [searchQuery, transactions, accounts, categories, goals]);

  const TabButton = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors w-full ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`}>
      {children}
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-primary text-center">All Data</h2>
        <div className="grid grid-cols-4 items-center gap-1 bg-subtle p-1 rounded-full border border-divider">
          <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>Transactions</TabButton>
          <TabButton active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')}>Accounts</TabButton>
          <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')}>Categories</TabButton>
          <TabButton active={activeTab === 'goals'} onClick={() => setActiveTab('goals')}>Goals</TabButton>
        </div>
         <div className="relative">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="input-base w-full rounded-full py-2 px-3 pl-10"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        {activeTab === 'transactions' && filteredData.transactions.map(t => (
          <div key={t.id} className="p-3 bg-subtle rounded-lg group">
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-medium text-primary">{t.description}</p>
                    <p className="text-xs text-secondary">{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(t.amount)}</span>
            </div>
            <div className="flex justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEditTransaction(t)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                <button onClick={() => onDeleteTransaction(t.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full">Delete</button>
            </div>
          </div>
        ))}
         {activeTab === 'accounts' && filteredData.accounts.map(a => (
          <div key={a.id} className="p-3 bg-subtle rounded-lg group flex justify-between items-center">
            <div>
                <p className="font-medium text-primary">{a.name}</p>
                <p className="text-xs text-secondary capitalize">{a.accountType}</p>
            </div>
            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEditAccount(a)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                <button onClick={() => onDeleteAccount(a.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full">Delete</button>
            </div>
          </div>
        ))}
        {activeTab === 'categories' && filteredData.categories.map(c => (
          <div key={c.id} className="p-3 bg-subtle rounded-lg group flex justify-between items-center">
            <div>
              <p className="font-medium text-primary flex items-center gap-2"><span>{c.icon}</span>{getCategoryPath(c.id, categories)}</p>
              <p className="text-xs text-secondary capitalize ml-8">{c.type}</p>
            </div>
            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEditCategory(c)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
              <button onClick={() => onDeleteCategory(c.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full">Delete</button>
            </div>
          </div>
        ))}
        {activeTab === 'goals' && filteredData.goals.map(g => (
          <div key={g.id} className="p-3 bg-subtle rounded-lg group flex justify-between items-center">
            <div>
              <p className="font-medium text-primary flex items-center gap-2"><span>{g.icon}</span>{g.name}</p>
              <p className="text-xs text-secondary ml-8">{formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}</p>
            </div>
            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEditGoal(g)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
              <button onClick={() => onDeleteGoal(g.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllDataScreen;