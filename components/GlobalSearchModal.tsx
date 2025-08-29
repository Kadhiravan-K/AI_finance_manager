import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ActiveModal, ActiveScreen } from '../types';

const modalRoot = document.getElementById('modal-root')!;

interface GlobalSearchModalProps {
  onClose: () => void;
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>) => void;
}

const ALL_NAVIGABLE_ITEMS: { name: string; screen: ActiveScreen; modal?: ActiveModal; icon: string }[] = [
    { name: 'Dashboard', screen: 'dashboard', icon: '📊' },
    { name: 'Reports', screen: 'reports', icon: '📈' },
    { name: 'Investments', screen: 'investments', icon: '💹' },
    { name: 'Budgets', screen: 'budgets', icon: '🎯' },
    { name: 'Goals', screen: 'goals', icon: '🏆' },
    { name: 'Scheduled Payments', screen: 'scheduled', icon: '📅' },
    { name: 'Calculator', screen: 'calculator', icon: '🧮' },
    { name: 'Achievements', screen: 'achievements', icon: '🏅' },
    { name: 'Trip Management', screen: 'tripManagement', icon: '✈️' },
    { name: 'Refunds', screen: 'refunds', icon: '↩️' },
    { name: 'Data Hub', screen: 'dataHub', icon: '🗄️' },
    { name: 'Shop Hub', screen: 'shop', icon: '🏪' },
    { name: 'Streaks & Challenges', screen: 'challenges', icon: '🔥' },
    { name: 'Learn Finance', screen: 'learn', icon: '📚' },
    { name: 'Customize Dashboard', screen: 'more', modal: 'dashboardSettings', icon: '🎨' },
    { name: 'Notification Settings', screen: 'more', modal: 'notificationSettings', icon: '🔔' },
    { name: 'Manage Categories', screen: 'more', modal: 'categories', icon: '🏷️' },
    { name: 'Manage Payees', screen: 'more', modal: 'payees', icon: '🏢' },
    { name: 'Manage Contacts', screen: 'more', modal: 'contacts', icon: '👥' },
    { name: 'Manage Senders', screen: 'more', modal: 'senderManager', icon: '🛡️' },
    { name: 'App Settings & Backup', screen: 'more', modal: 'appSettings', icon: '⚙️' },
    { name: 'Trust Bin', screen: 'more', modal: 'trustBin', icon: '🗑️' },
    { name: 'Export Data', screen: 'more', modal: 'importExport', icon: '📄' },
    { name: 'Send Feedback', screen: 'more', modal: 'feedback', icon: '📨' },
];


const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Timeout to allow modal animation to finish before focusing
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleNavigate = (screen: ActiveScreen, modal?: ActiveModal) => {
    onNavigate(screen, modal);
    onClose();
  };

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return ALL_NAVIGABLE_ITEMS.sort((a,b) => a.name.localeCompare(b.name));
    }
    const lowerCaseQuery = query.toLowerCase();
    return ALL_NAVIGABLE_ITEMS.filter(item =>
      item.name.toLowerCase().includes(lowerCaseQuery)
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [query]);

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
                            placeholder="Search tools & screens..."
                            className="input-base w-full rounded-full py-2 px-3 pl-10"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
                <div className="p-2 space-y-1 overflow-y-auto">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <button
                                key={item.name}
                                onClick={() => handleNavigate(item.screen, item.modal)}
                                className="w-full flex items-center gap-4 p-3 text-left rounded-lg hover-bg-stronger transition-colors"
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="font-medium text-primary">{item.name}</span>
                            </button>
                        ))
                    ) : (
                        <p className="text-center text-secondary p-4 text-sm">No results found for "{query}".</p>
                    )}
                </div>
            </div>
        </div>
    </>,
    modalRoot
  );
};

export default GlobalSearchModal;