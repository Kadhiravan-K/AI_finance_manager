

import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import ReactDOM from 'react-dom';
import { ActiveModal, ActiveScreen, AppState } from '../types';
import { AppDataContext, SettingsContext } from '../contexts/SettingsContext';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import LoadingSpinner from './LoadingSpinner';

const modalRoot = document.getElementById('modal-root')!;

interface GlobalSearchModalProps {
  onClose: () => void;
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>) => void;
}

const ALL_NAVIGABLE_ITEMS: { name: string; screen: ActiveScreen; modal?: ActiveModal; icon: string; keywords?: string }[] = [
    { name: 'Dashboard', screen: 'dashboard', icon: '📊', keywords: 'home main overview' },
    { name: 'Reports', screen: 'reports', icon: '📈', keywords: 'charts graphs analysis' },
    { name: 'Investments', screen: 'investments', icon: '💹', keywords: 'stocks portfolio' },
    { name: 'Budgets', screen: 'budgets', icon: '🎯', keywords: 'spending limits' },
    { name: 'Goals', screen: 'goals', icon: '🏆', keywords: 'savings targets' },
    { name: 'Scheduled Payments', screen: 'scheduled', icon: '📅', keywords: 'bills recurring' },
    { name: 'Calculator', screen: 'calculator', icon: '🧮' },
    { name: 'Achievements', screen: 'achievements', icon: '🏅', keywords: 'badges awards' },
    { name: 'Trip Management', screen: 'tripManagement', icon: '✈️', keywords: 'travel vacation' },
    { name: 'Refunds', screen: 'refunds', icon: '↩️', keywords: 'returns money back' },
    { name: 'Data Hub', screen: 'dataHub', icon: '🗄️', keywords: 'manage all data' },
    { name: 'Shop Hub', screen: 'shop', icon: '🏪', keywords: 'business sales products' },
    { name: 'Streaks & Challenges', screen: 'challenges', icon: '🔥' },
    { name: 'Learn Finance', screen: 'learn', icon: '📚', keywords: 'education tips' },
    { name: 'Calendar', screen: 'calendar', icon: '🗓️', keywords: 'schedule events bills' },
    { name: 'Shopping Lists', screen: 'shoppingLists', icon: '🛒', keywords: 'writing documents groceries' },
    { name: 'Customize Dashboard', screen: 'more', modal: 'dashboardSettings', icon: '🎨', keywords: 'widgets layout' },
    { name: 'Notification Settings', screen: 'more', modal: 'notificationSettings', icon: '🔔', keywords: 'alerts reminders' },
    { name: 'Manage Categories', screen: 'more', modal: 'categories', icon: '🏷️' },
    { name: 'Manage Accounts', screen: 'more', modal: 'accountsManager', icon: '🏦' },
    { name: 'Manage Payees', screen: 'more', modal: 'payees', icon: '🏢' },
    { name: 'Manage Contacts', screen: 'more', modal: 'contacts', icon: '👥' },
    { name: 'Manage Senders', screen: 'more', modal: 'senderManager', icon: '🛡️' },
    { name: 'App Settings & Backup', screen: 'more', modal: 'appSettings', icon: '⚙️' },
    { name: 'Trust Bin', screen: 'more', modal: 'trustBin', icon: '🗑️', keywords: 'deleted trash restore' },
    { name: 'Export Data', screen: 'more', modal: 'importExport', icon: '📄', keywords: 'csv json' },
    { name: 'Send Feedback', screen: 'more', modal: 'feedback', icon: '📨' },
    { name: 'AI Hub', screen: 'more', modal: 'aiHub', icon: '🧠', keywords: 'chat command assistant' },
    { name: 'Customize Footer', screen: 'more', modal: 'footerCustomization', icon: '🐾', keywords: 'navigation shortcuts tabs' },
    { name: 'Transfer Funds', screen: 'more', modal: 'transfer', icon: '↔️', keywords: 'send move money' },
];


const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dataContext = useContext(AppDataContext);
  const settingsContext = useContext(SettingsContext);
  const formatCurrency = useCurrencyFormatter();
  
  const appState = useMemo((): AppState | undefined => {
    if (!dataContext || !settingsContext) return undefined;

    return {
      transactions: dataContext.transactions,
      accounts: dataContext.accounts,
      categories: settingsContext.categories,
      budgets: dataContext.budgets,
      recurringTransactions: dataContext.recurringTransactions,
      goals: dataContext.goals,
      investmentHoldings: dataContext.investmentHoldings,
      payees: settingsContext.payees,
      senders: settingsContext.senders,
      contactGroups: settingsContext.contactGroups,
      contacts: settingsContext.contacts,
      settings: settingsContext.settings,
      achievements: dataContext.unlockedAchievements,
      streaks: dataContext.streaks,
      trips: dataContext.trips,
      tripExpenses: dataContext.tripExpenses,
      financialProfile: settingsContext.financialProfile,
      refunds: dataContext.refunds,
      settlements: dataContext.settlements,
      shops: dataContext.shops,
      shopProducts: dataContext.shopProducts,
      shopSales: dataContext.shopSales,
      shopEmployees: dataContext.shopEmployees,
      shopShifts: dataContext.shopShifts,
      shoppingLists: dataContext.shoppingLists,
      // Fix: Add missing 'glossaryEntries' property to satisfy AppState type.
      glossaryEntries: dataContext.glossaryEntries,
    };
  }, [dataContext, settingsContext]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleNavigate = (screen: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => {
    onNavigate(screen, modal, props);
    onClose();
  };

  const searchResults = useMemo(() => {
    if (!query.trim() || !appState) {
      return { screens: [], transactions: [], trips: [], goals: [], shoppingLists: [] };
    }
    const q = query.toLowerCase();
    
    const screens = ALL_NAVIGABLE_ITEMS.filter(item =>
      item.name.toLowerCase().includes(q) || item.keywords?.toLowerCase().includes(q)
    );
    
    const transactions = (appState.transactions || [])
      .filter(t => t.description.toLowerCase().includes(q))
      .slice(0, 5);

    const trips = (appState.trips || [])
      .filter(t => t.name.toLowerCase().includes(q))
      .slice(0, 5);
      
    const goals = (appState.goals || [])
      .filter(g => g.name.toLowerCase().includes(q))
      .slice(0, 5);

    const shoppingLists = (appState.shoppingLists || [])
      .filter(p => p.title?.toLowerCase().includes(q) || p.items.some(i => i.name.toLowerCase().includes(q)))
      .slice(0, 5);

    return { screens, transactions, trips, goals, shoppingLists };
  }, [query, appState]);

  const SearchResultSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div>
      <h3 className="text-xs font-semibold text-secondary uppercase px-3 pt-2 pb-1">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );

  const hasResults = searchResults.screens.length > 0 || searchResults.transactions.length > 0 || searchResults.trips.length > 0 || searchResults.goals.length > 0;

  return ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={onClose}></div>
      <div className="search-overlay" onClick={e => e.stopPropagation()}>
        <div className="glass-card rounded-xl shadow-2xl border border-divider flex flex-col max-h-full animate-fadeInUp">
          <div className="p-4 border-b border-divider flex-shrink-0">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search transactions, goals, trips..."
                className="input-base w-full rounded-full py-2 px-3 pl-10"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-tertiary" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <div className="p-2 space-y-2 overflow-y-auto">
            {searchResults.screens.length > 0 && (
              <SearchResultSection title="Screens & Tools">
                {searchResults.screens.map(item => (
                  <button key={item.name} onClick={() => handleNavigate(item.screen, item.modal)} className="w-full flex items-center gap-4 p-3 text-left rounded-lg hover-bg-stronger transition-colors">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium text-primary">{item.name}</span>
                  </button>
                ))}
              </SearchResultSection>
            )}
            {searchResults.transactions.length > 0 && (
              <SearchResultSection title="Transactions">
                {searchResults.transactions.map(t => (
                  <button key={t.id} onClick={() => handleNavigate('dashboard', 'editTransaction', { transaction: t })} className="w-full flex items-center justify-between gap-4 p-3 text-left rounded-lg hover-bg-stronger transition-colors">
                    <div>
                      <p className="font-medium text-primary">{t.description}</p>
                      <p className="text-xs text-secondary">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(t.amount)}</span>
                  </button>
                ))}
              </SearchResultSection>
            )}
             {searchResults.trips.length > 0 && (
              <SearchResultSection title="Trips">
                {searchResults.trips.map(t => (
                  <button key={t.id} onClick={() => handleNavigate('tripDetails', undefined, { tripId: t.id })} className="w-full flex items-center gap-4 p-3 text-left rounded-lg hover-bg-stronger transition-colors">
                    <span className="text-xl">✈️</span>
                    <div>
                      <p className="font-medium text-primary">{t.name}</p>
                       <p className="text-xs text-secondary">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))}
              </SearchResultSection>
            )}
            {searchResults.goals.length > 0 && (
                <SearchResultSection title="Goals">
                    {searchResults.goals.map(g => (
                        <button key={g.id} onClick={() => handleNavigate('goals', 'editGoal', { goal: g })} className="w-full flex items-center gap-4 p-3 text-left rounded-lg hover-bg-stronger transition-colors">
                            <span className="text-xl">{g.icon}</span>
                            <div>
                                <p className="font-medium text-primary">{g.name}</p>
                                <p className="text-xs text-secondary">{formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}</p>
                            </div>
                        </button>
                    ))}
                </SearchResultSection>
            )}
             {searchResults.shoppingLists.length > 0 && (
                <SearchResultSection title="Shopping Lists">
                    {searchResults.shoppingLists.map(p => (
                        <button key={p.id} onClick={() => handleNavigate('shoppingLists', undefined, { shoppingListId: p.id })} className="w-full flex items-center gap-4 p-3 text-left rounded-lg hover-bg-stronger transition-colors">
                           <span className="text-xl">🛒</span>
                           <p className="font-medium text-primary truncate">{p.title || 'Untitled List'}</p>
                        </button>
                    ))}
                </SearchResultSection>
            )}
            {query.trim() && !hasResults && (
              <p className="text-center text-secondary p-4 text-sm">No results found for "{query}".</p>
            )}
             {!query.trim() && (
              <p className="text-center text-secondary p-4 text-sm">Start typing to search your financial data.</p>
            )}
          </div>
        </div>
      </div>
    </>,
    modalRoot
  );
};

export default GlobalSearchModal;