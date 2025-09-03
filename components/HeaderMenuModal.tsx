

import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import { ActiveScreen, ActiveModal, Settings } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';

const modalRoot = document.getElementById('modal-root')!;

interface SideDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveScreen: (screen: ActiveScreen) => void;
  setActiveModal: (modal: ActiveModal, props?: Record<string, any>) => void;
}

const ALL_TOOLS: { name: string; screen: ActiveScreen; icon: string; key: keyof Settings['enabledTools'] }[] = [
    { name: 'Budgets', screen: 'budgets', icon: '🎯', key: 'budgets' },
    { name: 'Goals', screen: 'goals', icon: '🏆', key: 'goals' },
    { name: 'Investments', screen: 'investments', icon: '💹', key: 'investments' },
    { name: 'Trips', screen: 'tripManagement', icon: '✈️', key: 'tripManagement' },
    { name: 'Shop Hub', screen: 'shop', icon: '🏪', key: 'shop' },
    { name: 'Refunds', screen: 'refunds', icon: '↩️', key: 'refunds' },
    { name: 'Scheduled', screen: 'scheduled', icon: '📅', key: 'scheduledPayments' },
    { name: 'Shopping Lists', screen: 'shoppingLists', icon: '🛒', key: 'shoppingLists' },
    { name: 'Calculator', screen: 'calculator', icon: '🧮', key: 'calculator' },
    { name: 'Calendar', screen: 'calendar', icon: '🗓️', key: 'calendar' },
    { name: 'Data Hub', screen: 'dataHub', icon: '🗄️', key: 'dataHub' },
    { name: 'Achievements', screen: 'achievements', icon: '🏅', key: 'achievements' },
    { name: 'Challenges', screen: 'challenges', icon: '🔥', key: 'challenges' },
    { name: 'Learn', screen: 'learn', icon: '📚', key: 'learn' },
];


const SideDrawerMenu: React.FC<SideDrawerMenuProps> = ({ isOpen, onClose, setActiveScreen, setActiveModal }) => {
  const { settings } = useContext(SettingsContext);

  const handleNavigate = (screen?: ActiveScreen, modal?: ActiveModal) => {
    onClose();
    setTimeout(() => {
      if (screen) {
        setActiveScreen(screen);
      } else if (modal) {
        setActiveModal(modal);
      }
    }, 150);
  };

  const drawerContent = (
    <>
      <div className={`drawer-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`side-drawer ${isOpen ? 'open' : ''}`}>
        <div className="p-4 border-b border-divider flex-shrink-0 flex justify-between items-center">
          <h2 className="text-xl font-bold text-primary">All Tools</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-secondary hover:text-primary rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-2">
            <div className="space-y-1">
                {ALL_TOOLS.filter(tool => settings.enabledTools[tool.key]).map(item => (
                    <button key={item.name} onClick={() => handleNavigate(item.screen)} className="w-full flex items-center gap-4 p-3 text-left rounded-lg hover-bg-stronger transition-colors">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="font-medium text-primary">{item.name}</span>
                    </button>
                ))}
            </div>
            <div className="border-t border-divider my-2"></div>
            <button onClick={() => handleNavigate(undefined, 'manageTools')} className="w-full flex items-center gap-4 p-3 text-left rounded-lg hover-bg-stronger transition-colors">
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