
import React, { useContext, useState } from 'react';
import { ActiveModal, ActiveScreen } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';

interface MoreScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
  setActiveModal: (modal: ActiveModal) => void;
  onResetApp: () => void;
}

const MoreScreen: React.FC<MoreScreenProps> = ({ setActiveModal, setActiveScreen, onResetApp }) => {
  const { settings } = useContext(SettingsContext);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const handleNav = (screen: ActiveScreen, modal?: ActiveModal) => {
    if (modal) {
        setActiveModal(modal);
    } else {
        setActiveScreen(screen);
    }
  }

  const ToolButton: React.FC<{ screen: ActiveScreen, modal?: ActiveModal, icon: string, label: string }> = ({ screen, modal, icon, label }) => (
    <button onClick={() => handleNav(screen, modal)} className={layout === 'grid' ? "management-tool-button" : "management-list-item"}>
      <span className={layout === 'grid' ? "text-3xl" : "text-2xl"}>{icon}</span>
      <span className={layout === 'grid' ? "text-xs font-semibold" : "font-semibold"}>{label}</span>
    </button>
  );
  
  const financialTools = [
    { key: 'achievements', screen: 'achievements', icon: '🏅', label: 'Achievements' },
    { key: 'aiHub', screen: 'more', modal: 'aiHub', icon: '🧠', label: 'AI Hub' },
    { key: 'budgets', screen: 'budgets', icon: '🎯', label: 'Budgets' },
    { key: 'calculator', screen: 'calculator', icon: '🧮', label: 'Calculator' },
    { key: 'calendar', screen: 'calendar', icon: '🗓️', label: 'Calendar' },
    { key: 'challenges', screen: 'challenges', icon: '🔥', label: 'Challenges' },
    { key: 'goals', screen: 'goals', icon: '🏆', label: 'Goals' },
    { key: 'investments', screen: 'investments', icon: '💹', label: 'Investments' },
    { key: 'learn', screen: 'learn', icon: '📚', label: 'Learn' },
    { key: 'refunds', screen: 'refunds', icon: '↩️', label: 'Refunds' },
    { key: 'scheduledPayments', screen: 'scheduled', icon: '📅', label: 'Scheduled' },
    { key: 'shop', screen: 'shop', icon: '🏪', label: 'Shop Hub' },
    { key: 'shoppingLists', screen: 'shoppingLists', icon: '🛒', label: 'Shopping Lists' },
    { key: 'subscriptions', screen: 'subscriptions', icon: '🔁', label: 'Subscriptions' },
    { key: 'tripManagement', screen: 'tripManagement', icon: '✈️', label: 'Trips' },
    { key: 'accountTransfer', screen: 'more', modal: 'transfer', icon: '↔️', label: 'Transfer' },
  ].filter(tool => settings.enabledTools[tool.key as keyof typeof settings.enabledTools])
   .sort((a, b) => a.label.localeCompare(b.label));

  const managementTools = [
     { key: 'accountsManager', screen: 'more', modal: 'accountsManager', icon: '🏦', label: 'Accounts' },
     { key: 'categories', screen: 'more', modal: 'categories', icon: '🏷️', label: 'Categories' },
     { key: 'contacts', screen: 'more', modal: 'contacts', icon: '👥', label: 'Contacts' },
     { key: 'dashboardSettings', screen: 'more', modal: 'dashboardSettings', icon: '🎨', label: 'Dashboard' },
     { key: 'footerCustomization', screen: 'more', modal: 'footerCustomization', icon: '🐾', label: 'Footer' },
     { key: 'notificationSettings', screen: 'more', modal: 'notificationSettings', icon: '🔔', label: 'Notifications' },
     { key: 'payees', screen: 'more', modal: 'payees', icon: '🏢', label: 'Payees' },
     { key: 'senders', screen: 'more', modal: 'senderManager', icon: '🛡️', label: 'Senders' },
     { key: 'manageTools', screen: 'more', modal: 'manageTools', icon: '🛠️', label: 'Tools' },
  ].sort((a, b) => a.label.localeCompare(b.label));


  return (
    <div className="h-full flex flex-col">
       <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between">
         <h2 className="text-xl font-bold text-primary flex-grow text-center">Hub</h2>
         <button onClick={() => setLayout(l => l === 'grid' ? 'list' : 'grid')} className="button-secondary p-2 rounded-full h-9 w-9 flex items-center justify-center -mr-2">
            {layout === 'grid' ? 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12" />
                <circle cx="4.5" cy="6.75" r="0.75" fill="currentColor" stroke="none" />
                <circle cx="4.5" cy="12" r="0.75" fill="currentColor" stroke="none" />
                <circle cx="4.5" cy="17.25" r="0.75" fill="currentColor" stroke="none" />
              </svg> :
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            }
          </button>
       </div>
        <div className="flex-grow overflow-y-auto p-6 pr-4 pb-20 space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">Financial Tools</h3>
                <div className={layout === 'grid' ? "management-grid" : "management-list"}>
                    {financialTools.map(tool => (
                        <ToolButton key={tool.key} screen={tool.screen as ActiveScreen} modal={tool.modal as ActiveModal} icon={tool.icon} label={tool.label} />
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">Management & Customization</h3>
                <div className={layout === 'grid' ? "management-grid" : "management-list"}>
                     {managementTools.map(tool => {
                         const isEnabled = !('key' in tool) || !tool.key.endsWith('payees') && !tool.key.endsWith('senders') || settings.enabledTools[tool.key as 'payees' | 'senders'];
                         if (!isEnabled) return null;
                         return <ToolButton key={tool.key} screen={tool.screen as ActiveScreen} modal={tool.modal as ActiveModal} icon={tool.icon} label={tool.label} />
                     })}
                </div>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">App & Data</h3>
                <div className={layout === 'grid' ? "management-grid" : "management-list"}>
                     {settings.enabledTools.dataHub && <ToolButton screen="dataHub" icon="🗄️" label="Data Hub" />}
                     <ToolButton screen="manual" icon="📖" label="Manual" />
                     <ToolButton screen="more" modal="integrations" icon="🔗" label="Integrations" />
                     <ToolButton screen="more" modal="appSettings" icon="⚙️" label="Settings" />
                     <ToolButton screen="more" modal="trustBin" icon="🗑️" label="Trust Bin" />
                     <ToolButton screen="more" modal="importExport" icon="📄" label="Import/Export" />
                     <ToolButton screen="more" modal="feedback" icon="📨" label="Feedback" />
                     <button onClick={onResetApp} className={`${layout === 'grid' ? "management-tool-button" : "management-list-item"} text-rose-400`}>
                        <span className={layout === 'grid' ? "text-3xl" : "text-2xl"}>⚠️</span>
                        <span className={layout === 'grid' ? "text-xs font-semibold" : "font-semibold"}>Reset App</span>
                    </button>
                </div>
            </div>
            <div className="mt-12 space-y-4">
              <div className="border-t border-divider" />
              <p className="text-center text-xs" style={{ color: 'var(--color-accent-sky)' }}>Developed by kadhiravan</p>
              <div className="border-t border-divider" />
            </div>
        </div>
    </div>
  );
};

export default MoreScreen;