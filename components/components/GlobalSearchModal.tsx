import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import ReactDOM from 'react-dom';
import { ActiveModal, ActiveScreen, AppState } from '../../types';
import { AppDataContext, SettingsContext } from '../../contexts/SettingsContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import LoadingSpinner from '../LoadingSpinner';
import { getCategoryPath } from '../../utils/categories';

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
    { name: 'Shop Hub', screen: 'shop', icon: '🏪', keywords: 'sales products inventory' },
    { name: 'Calendar', screen: 'calendar', icon: '🗓️', keywords: 'events dates' },
    { name: 'Notes & Lists', screen: 'notes', icon: '📝', keywords: 'shopping tasks ideas' },
];

const SearchResultItem: React.FC<{
    icon: string;
    title: string;
    subtitle: string;
    onClick: () => void;
}> = ({ icon, title, subtitle, onClick }) => (
    <button onClick={onClick} className="w-full text-left p-3 flex items-center gap-4 rounded-lg hover-bg-stronger transition-colors">
        <span className="text-2xl">{icon}</span>
        <div>
            <p className="font-semibold text-primary">{title}</p>
            <p className="text-xs text-secondary">{subtitle}</p>
        </div>
    </button>
);


export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onClose, onNavigate }) => {
  const dataContext = useContext(AppDataContext);
  const settingsContext = useContext(SettingsContext);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const formatCurrency = useCurrencyFormatter();

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    if (!dataContext || !settingsContext) return [];

    const q = query.toLowerCase();
    const results = [];

    // Search transactions
    dataContext.transactions.forEach(t => {
      if (t.description.toLowerCase().includes(q)) {
        results.push({
          type: 'Transaction',
          icon: t.type === 'income' ? '🟢' : '🔴',
          title: t.description,
          subtitle: `Transaction on ${new Date(t.date).toLocaleDateString()}`,
          onClick: () => { onClose(); onNavigate('dashboard', 'editTransaction', { transaction: t }); }
        });
      }
    });
    
    // Search navigable items
    ALL_NAVIGABLE_ITEMS.forEach(item => {
        if (item.name.toLowerCase().includes(q) || item.keywords?.toLowerCase().includes(q)) {
            results.push({
                type: 'Navigation',
                icon: item.icon,
                title: `Go to ${item.name}`,
                subtitle: `Navigate to the ${item.name} screen`,
                // FIX: Cast item.screen to ActiveScreen to satisfy onNavigate's type requirement.
                onClick: () => { onClose(); onNavigate(item.screen as ActiveScreen, item.modal); }
            });
        }
    });

    return results.slice(0, 10);
  }, [query, dataContext, settingsContext, onNavigate, onClose]);

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-[10vh]" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg border border-divider animate-scaleIn flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-tertiary" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
                ref={inputRef}
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search transactions, navigate, or ask AI..."
                className="w-full bg-transparent text-primary placeholder-tertiary focus:outline-none"
            />
        </div>
        <div className="border-t border-divider max-h-[60vh] overflow-y-auto">
            {searchResults.length > 0 ? (
                <div className="p-2">
                    {searchResults.map((item, index) => (
                        <SearchResultItem 
                            key={index}
                            icon={item.icon}
                            title={item.title}
                            subtitle={item.subtitle}
                            onClick={item.onClick}
                        />
                    ))}
                </div>
            ) : query.trim() && (
                <p className="text-center text-secondary p-8">No results found.</p>
            )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};