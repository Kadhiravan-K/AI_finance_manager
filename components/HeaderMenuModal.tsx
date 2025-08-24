import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import { ActiveScreen, ActiveModal, ToggleableTool } from '../types';
import ModalHeader from './ModalHeader';
import { SettingsContext } from '../contexts/SettingsContext';

const modalRoot = document.getElementById('modal-root')!;

interface HeaderMenuModalProps {
  onClose: () => void;
  setActiveScreen: (screen: ActiveScreen) => void;
  setActiveModal: (modal: ActiveModal) => void;
}

type MenuItem = {
  label: string;
  icon: string;
} & ({ screen: ActiveScreen; modal?: never } | { modal: ActiveModal; screen?: never });


const HeaderMenuModal: React.FC<HeaderMenuModalProps> = ({ onClose, setActiveScreen, setActiveModal }) => {
  const { settings } = useContext(SettingsContext);

  const unsortedMenuItems: MenuItem[] = [
    { screen: 'achievements', label: 'Achievements', icon: '🏅' },
    { modal: 'appSettings', label: 'App Settings & Backup', icon: '⚙️' },
    { screen: 'allData', label: 'All Data', icon: '🗄️'},
    { screen: 'budgets', label: 'Budgets', icon: '🎯'},
    { screen: 'calculator', label: 'Calculator', icon: '🧮' },
    { modal: 'contacts', label: 'Contacts', icon: '👥' },
    { modal: 'dashboardSettings', label: 'Customize Dashboard', icon: '🎨' },
    { modal: 'importExport', label: 'Import/Export Data', icon: '📄' },
    { screen: 'investments', label: 'Investments', icon: '💹' },
    { modal: 'categories', label: 'Manage Categories', icon: '🏷️' },
    { modal: 'payees', label: 'Payees', icon: '🏢' },
    { screen: 'refunds', label: 'Refunds', icon: '↩️' },
    { screen: 'reports', label: 'Reports', icon: '📈' },
    { screen: 'scheduled', label: 'Scheduled Payments', icon: '📅' },
    { modal: 'feedback', label: 'Send Feedback', icon: '📨' },
    { modal: 'senderManager', label: 'Senders', icon: '🛡️' },
    { screen: 'tripManagement', label: 'Trip Management', icon: '✈️' },
    { modal: 'trustBin', label: 'Trust Bin', icon: '🗑️' },
  ];
  
  const toolToKeyMap: Partial<Record<ActiveScreen | ActiveModal, ToggleableTool>> = {
      calculator: 'calculator',
      investments: 'investments',
      payees: 'payees',
      senderManager: 'senders',
      tripManagement: 'tripManagement',
  };

  const filteredMenuItems = unsortedMenuItems.filter(item => {
      const keySource = item.screen || item.modal;
      if (!keySource) return true;

      const key = toolToKeyMap[keySource];
      if (key && settings.enabledTools) {
          return settings.enabledTools[key];
      }
      return true;
  });

  const menuItems = filteredMenuItems.sort((a, b) => a.label.localeCompare(b.label));

  const handleNavigate = (item: MenuItem) => {
    if ('screen' in item && item.screen) {
      setActiveScreen(item.screen as ActiveScreen);
    } else if ('modal' in item && item.modal) {
      setActiveModal(item.modal as ActiveModal);
    }
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="All Tools" onClose={onClose} icon="🧭" />
        <div className="p-4 overflow-y-auto">
          <div className="management-grid">
            {menuItems.map(item => (
              <button key={item.label} onClick={() => handleNavigate(item)} className="management-tool-button">
                <span className="icon text-3xl">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default HeaderMenuModal;