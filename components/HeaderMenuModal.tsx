

import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import { ActiveScreen, ActiveModal, ToggleableTool } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';

const modalRoot = document.getElementById('modal-root')!;

interface SideDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveScreen: (screen: ActiveScreen) => void;
  setActiveModal: (modal: ActiveModal) => void;
}

const ALL_NAVIGABLE_ITEMS: { name: string; screen?: ActiveScreen; modal?: ActiveModal; icon: string; toolKey?: ToggleableTool }[] = [
    { name: 'Dashboard', screen: 'dashboard', icon: '📊' },
    { name: 'Reports', screen: 'reports', icon: '📈' },
    { name: 'Budgets', screen: 'budgets', icon: '🎯'},
    { name: 'Goals', screen: 'goals', icon: '🏆' },
    { name: 'Investments', screen: 'investments', icon: '💹', toolKey: 'investments' },
    { name: 'Scheduled Payments', screen: 'scheduled', icon: '📅', toolKey: 'scheduledPayments' },
    { name: 'Trip Management', screen: 'tripManagement', icon: '✈️', toolKey: 'tripManagement' },
    { name: 'Shop Hub', screen: 'shop', icon: '🏪', toolKey: 'shop' },
    { name: 'Refunds', screen: 'refunds', icon: '↩️', toolKey: 'refunds' },
    { name: 'Calendar', screen: 'calendar', icon: '🗓️', toolKey: 'calendar' },
    { name: 'Notes', screen: 'notes', icon: '📝', toolKey: 'notes' },
    { name: 'Calculator', screen: 'calculator', icon: '🧮', toolKey: 'calculator' },
    { name: 'Achievements', screen: 'achievements', icon: '🏅', toolKey: 'achievements' },
    { name: 'Streaks & Challenges', screen: 'challenges', icon: '🔥' },
    { name: 'Learn Finance', screen: 'learn', icon: '📚' },
    { name: 'AI Hub', modal: 'aiCommandCenter', icon: '🧠', toolKey: 'aiCommandCenter' },
    { name: 'Transfer Funds', modal: 'transfer', icon: '↔️', toolKey: 'accountTransfer' },
    { name: 'Data Hub', screen: 'dataHub', icon: '🗄️', toolKey: 'dataHub' },
    { name: 'Manage Accounts', modal: 'accountsManager', icon: '🏦' },
    { name: 'Manage Categories', modal: 'categories', icon: '🏷️' },
    { name: 'Manage Contacts', modal: 'contacts', icon: '👥' },
    { name: 'Trust Bin', modal: 'trustBin', icon: '🗑️' },
    { name: 'App Settings & Backup', modal: 'appSettings', icon: '⚙️' },
];


const SideDrawerMenu: React.FC<SideDrawerMenuProps> = ({ isOpen, onClose, setActiveScreen, setActiveModal }) => {
  const { settings } = useContext(SettingsContext);

  const handleNavigate = (item: typeof ALL_NAVIGABLE_ITEMS[0]) => {
    if (item.screen) {
      setActiveScreen(item.screen);
    } else if (item.modal) {
      setActiveModal(item.modal);
    }
    onClose();
  };
  
  const sortedNavItems = [...ALL_NAVIGABLE_ITEMS].sort((a, b) => a.name.localeCompare(b.name));

  const filteredMenuItems = sortedNavItems.filter(item => {
      if (item.toolKey) {
          return settings.enabledTools[item.toolKey] !== false;
      }
      return true;
  });

  const drawerContent = (
    <>
      <div className={`drawer-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`side-drawer ${isOpen ? 'open' : ''}`}>
        <div className="p-4 border-b border-divider flex-shrink-0 flex justify-between items-center">
          <h2 className="text-xl font-bold text-primary">All Tools 🧭</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-secondary hover:text-primary rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-2">
          <div className="space-y-1">
            {filteredMenuItems.map(item => (
              <button key={item.name} onClick={() => handleNavigate(item)} className="w-full flex items-center gap-4 p-3 text-left rounded-lg hover-bg-stronger transition-colors">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-primary">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-2 border-t border-divider flex-shrink-0">
          <button onClick={() => { setActiveModal('manageTools'); onClose(); }} className="w-full flex items-center gap-4 p-3 text-left rounded-lg hover-bg-stronger transition-colors">
              <span className="text-2xl">🛠️</span>
              <span className="font-medium text-primary">Manage Tools</span>
          </button>
        </div>
      </div>
    </>
  );
  
  return ReactDOM.createPortal(drawerContent, modalRoot);
};

export default SideDrawerMenu;
