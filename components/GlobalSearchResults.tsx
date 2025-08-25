import React, { useMemo } from 'react';
import { ActiveModal, ActiveScreen } from '../types';

interface GlobalSearchResultsProps {
  query: string;
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal) => void;
  onClose: () => void;
}

const ALL_NAVIGABLE_ITEMS: { name: string; screen: ActiveScreen; modal?: ActiveModal, icon: string }[] = [
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
  { name: 'Data Hub', screen: 'dataHub', icon: '🗄️'},
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

const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({ query, onNavigate, onClose }) => {
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    const lowerCaseQuery = query.toLowerCase();
    return ALL_NAVIGABLE_ITEMS.filter(item =>
      item.name.toLowerCase().includes(lowerCaseQuery)
    );
  }, [query]);

  return (
    <>
        <div className="fixed inset-0 z-50" onClick={onClose}></div>
        <div className="search-overlay glass-card rounded-xl shadow-2xl border border-divider animate-fadeInUp flex flex-col">
            <div className="p-2 space-y-1">
                {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <button
                            key={item.name}
                            onClick={() => onNavigate(item.screen, item.modal)}
                            className="w-full flex items-center gap-4 p-3 text-left rounded-lg hover-bg-stronger transition-colors"
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium text-primary">{item.name}</span>
                        </button>
                    ))
                ) : (
                    query.trim() && <p className="text-center text-secondary p-4 text-sm">No results found.</p>
                )}
            </div>
        </div>
    </>
  );
};

export default GlobalSearchResults;