import React, { useContext } from 'react';
import { ActiveModal, ActiveScreen } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';

interface SidebarProps {
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => void;
  activeScreen: ActiveScreen;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, activeScreen, isOpen, onClose }) => {
  const { settings } = useContext(SettingsContext);

  const handleNav = (screen?: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => {
    if (modal) {
        onNavigate(activeScreen, modal, props); // Open modal on current screen
    } else if (screen) {
        onNavigate(screen);
    }
    onClose();
  }

  const toolSections = [
    {
      title: 'Financial Tools',
      tools: [
        { key: 'achievements', screen: 'achievements', icon: '🏅', label: 'Achievements' },
        { key: 'aiHub', modal: 'aiHub', icon: '🧠', label: 'AI Hub' },
        { key: 'budgets', screen: 'budgets', icon: '🎯', label: 'Budgets' },
        { key: 'calculator', screen: 'calculator', icon: '🧮', label: 'Calculator' },
        { key: 'calendar', screen: 'calendar', icon: '🗓️', label: 'Calendar' },
        { key: 'challenges', screen: 'challenges', icon: '🔥', label: 'Challenges' },
        { key: 'debtManager', screen: 'debtManager', icon: '💳', label: 'Debt Payoff' },
        { key: 'goals', screen: 'goals', icon: '🏆', label: 'Goals' },
        { key: 'investments', screen: 'investments', icon: '💹', label: 'Investments' },
        { key: 'learn', screen: 'learn', icon: '📚', label: 'Learn' },
        { key: 'refunds', screen: 'refunds', icon: '↩️', label: 'Refunds' },
        { key: 'scheduledPayments', screen: 'scheduled', icon: '📅', label: 'Scheduled' },
        { key: 'shop', screen: 'shop', icon: '🏪', label: 'Shop Hub' },
        { key: 'notes', screen: 'notes', icon: '📝', label: 'Notes & Lists' },
        { key: 'subscriptions', screen: 'subscriptions', icon: '🔁', label: 'Subscriptions' },
        { key: 'tripManagement', screen: 'tripManagement', icon: '✈️', label: 'Trips' },
        { key: 'accountTransfer', modal: 'transfer', icon: '↔️', label: 'Transfer' },
      ].filter(tool => settings.enabledTools[tool.key as keyof typeof settings.enabledTools])
       .sort((a, b) => a.label.localeCompare(b.label)),
    },
    {
      title: 'Management & Data',
      tools: [
        { modal: 'accounts', icon: '🏦', label: 'Accounts' },
        { modal: 'categories', icon: '🏷️', label: 'Categories' },
        { modal: 'contacts', icon: '👥', label: 'Contacts' },
        { modal: 'dashboardSettings', icon: '🎨', label: 'Dashboard' },
        { modal: 'footerCustomization', icon: '🐾', label: 'Footer' },
        { modal: 'notificationSettings', icon: '🔔', label: 'Notifications' },
        { key: 'payees', modal: 'payees', icon: '🏢', label: 'Payees' },
        { key: 'senders', modal: 'senderManager', icon: '🛡️', label: 'Senders' },
        { modal: 'manageTools', icon: '🛠️', label: 'Tools' },
        { modal: 'importExport', icon: '📄', label: 'Import/Export' },
        { modal: 'trustBin', icon: '🗑️', label: 'Trust Bin' },
        { modal: 'appSettings', icon: '⚙️', label: 'Settings' },
      ].filter(tool => !tool.key || settings.enabledTools[tool.key as keyof typeof settings.enabledTools])
       .sort((a, b) => a.label.localeCompare(b.label)),
    },
  ];

  return (
    <>
        <div className="sidebar-backdrop lg:hidden" onClick={onClose}></div>
        <aside className="sidebar">
            <div className="p-4 flex justify-between items-center flex-shrink-0">
                <h1 className="text-xl font-bold">Finance Hub</h1>
                <button onClick={onClose} className="p-2 -mr-2 rounded-full hover-bg-stronger lg:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <nav className="flex-grow overflow-y-auto space-y-4 py-2">
                {toolSections.map(section => (
                    <div key={section.title}>
                        <h3 className="text-xs font-semibold text-tertiary uppercase tracking-wider px-5 mb-2">{section.title}</h3>
                        <div className="space-y-1">
                            {section.tools.map(tool => (
                                <button 
                                    key={tool.label} 
                                    onClick={() => handleNav(tool.screen as ActiveScreen, tool.modal as ActiveModal)}
                                    className={`sidebar-item ${activeScreen === tool.screen ? 'active' : ''}`}
                                >
                                    <span className="icon">{tool.icon}</span>
                                    <span>{tool.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    </>
  );
};

export default Sidebar;
