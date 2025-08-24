import React, { useState, useMemo } from 'react';
import { Transaction, Account, Category } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface AllDataScreenProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
}

type ActiveTab = 'transactions' | 'accounts';

const AllDataScreen: React.FC<AllDataScreenProps> = ({
  transactions,
  accounts,
  categories,
  onEditTransaction,
  onDeleteTransaction,
  onEditAccount,
  onDeleteAccount
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const formatCurrency = useCurrencyFormatter();

  const getCategoryPath = (categoryId: string): string => {
    let path: string[] = [], current = categories.find(c => c.id === categoryId);
    while (current) { path.unshift(current.name); current = categories.find(c => c.id === current.parentId); }
    return path.join(' / ') || 'Uncategorized';
  };
  
  const filteredTransactions = useMemo(() => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      if(!lowerCaseQuery) return transactions;
      return transactions.filter(t =>
          t.description.toLowerCase().includes(lowerCaseQuery) ||
          (t.notes || '').toLowerCase().includes(lowerCaseQuery) ||
          getCategoryPath(t.categoryId).toLowerCase().includes(lowerCaseQuery)
      );
  }, [transactions, searchQuery, categories]);
  
  const filteredAccounts = useMemo(() => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      if(!lowerCaseQuery) return accounts;
      return accounts.filter(a => a.name.toLowerCase().includes(lowerCaseQuery));
  }, [accounts, searchQuery]);

  const TabButton = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors w-full ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`}>
      {children}
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-primary text-center">All Data</h2>
        <div className="flex items-center gap-2 bg-subtle p-1 rounded-full border border-divider">
          <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>Transactions</TabButton>
          <TabButton active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')}>Accounts</TabButton>
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
        {activeTab === 'transactions' && filteredTransactions.map(t => (
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
         {activeTab === 'accounts' && filteredAccounts.map(a => (
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
      </div>
    </div>
  );
};

export default AllDataScreen;