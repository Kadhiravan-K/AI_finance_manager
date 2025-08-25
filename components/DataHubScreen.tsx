import React, { useState, useMemo } from 'react';
import { Transaction, Account, Category, Goal } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { AllDataScreenProps } from '../types';

type ExpandedSection = 'transactions' | 'accounts' | 'categories' | 'goals';

const DataHubScreen: React.FC<AllDataScreenProps> = ({
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
  const [expandedSection, setExpandedSection] = useState<ExpandedSection | null>('transactions');
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

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(prev => prev === section ? null : section);
  };
  
  const SectionHeader: React.FC<{title: string, count: number, section: ExpandedSection}> = ({title, count, section}) => (
    <button onClick={() => toggleSection(section)} className="w-full flex justify-between items-center p-4 bg-subtle rounded-lg">
      <h3 className="font-semibold text-lg text-primary">{title} ({count})</h3>
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform ${expandedSection === section ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-primary text-center">Data Hub 🗄️</h2>
        <div className="relative">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all data..."
                className="input-base w-full rounded-full py-2 px-3 pl-10"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-tertiary" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        <SectionHeader title="Transactions" count={filteredData.transactions.length} section="transactions" />
        {expandedSection === 'transactions' && filteredData.transactions.map(t => (
          <div key={t.id} className="p-3 bg-subtle rounded-lg group animate-fadeInUp">
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-medium text-primary">{t.description}</p>
                    <p className="text-xs text-secondary">{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(t.amount)}</span>
            </div>
             <div className="flex justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEditTransaction(t)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                <button onClick={() => onDeleteTransaction(t.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full">Delete</button>
            </div>
          </div>
        ))}
        <SectionHeader title="Accounts" count={filteredData.accounts.length} section="accounts" />
        {expandedSection === 'accounts' && filteredData.accounts.map(a => (
          <div key={a.id} className="p-3 bg-subtle rounded-lg group flex justify-between items-center animate-fadeInUp">
            <p className="font-medium text-primary">{a.name}</p>
            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEditAccount(a)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                <button onClick={() => onDeleteAccount(a.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full">Delete</button>
            </div>
          </div>
        ))}
        {/* Similar collapsible sections for Categories and Goals */}
      </div>
    </div>
  );
};

export default DataHubScreen;