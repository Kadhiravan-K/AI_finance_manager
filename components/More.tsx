
import React, { useContext } from 'react';
import { ActiveModal, ActiveScreen, ToggleableTool } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';

interface MoreScreenProps {
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => void;
}

const TOOL_SECTIONS: { title: string; tools: { key?: ToggleableTool; screen?: ActiveScreen; modal?: ActiveModal; icon: string; label: string; }[] }[] = [
    {
        title: 'Financial Tools',
        tools: [
            { key: 'budgets', screen: 'budgets', icon: '🎯', label: 'Budgets' },
            { key: 'goals', screen: 'goals', icon: '🏆', label: 'Goals' },
            { key: 'investments', screen: 'investments', icon: '💹', label: 'Investments' },
            { key: 'tripManagement', screen: 'tripManagement', icon: '✈️', label: 'Trips' },
            { key: 'shop', screen: 'shop', icon: '🏪', label: 'Shop Hub' },
            { key: 'refunds', screen: 'refunds', icon: '↩️', label: 'Refunds' },
            { key: 'debtManager', screen: 'debtManager', icon: '💳', label: 'Debt Payoff' },
            { key: 'subscriptions', screen: 'subscriptions', icon: '🔁', label: 'Subscriptions' },
            { key: 'scheduledPayments', screen: 'scheduled', icon: '📅', label: 'Scheduled' },
            { key: 'accountTransfer', modal: 'transfer', icon: '↔️', label: 'Transfer' },
        ]
    },
    {
        title: 'Productivity & Insights',
        tools: [
            { key: 'aiHub', modal: 'aiHub', icon: '🧠', label: 'AI Hub' },
            { key: 'calendar', screen: 'calendar', icon: '🗓️', label: 'Calendar' },
            { key: 'notes', screen: 'notes', icon: '📝', label: 'Notes & Lists' },
            { key: 'calculator', screen: 'calculator', icon: '🧮', label: 'Calculator' },
            { key: 'achievements', screen: 'achievements', icon: '🏅', label: 'Achievements' },
            { key: 'challenges', screen: 'challenges', icon: '🔥', label: 'Challenges' },
            { key: 'learn', screen: 'learn', icon: '📚', label: 'Learn' },
            { key: 'faq', screen: 'faq', icon: '❓', label: 'FAQ' },
        ]
    },
    {
        title: 'Management & Data',
        tools: [
            { modal: 'accounts', icon: '🏦', label: 'Accounts' },
            { modal: 'categories', icon: '🏷️', label: 'Categories' },
            { modal: 'contacts', icon: '👥', label: 'Contacts' },
            { key: 'payees', modal: 'payees', icon: '🏢', label: 'Payees' },
            { key: 'senders', modal: 'senderManager', icon: '🛡️', label: 'Senders' },
            { key: 'dataHub', screen: 'dataHub', icon: '🗄️', label: 'Data Hub' },
            { modal: 'trustBin', icon: '🗑️', label: 'Trust Bin' },
        ]
    },
    {
        title: 'Customization & Settings',
        tools: [
            { modal: 'dashboardSettings', icon: '🎨', label: 'Dashboard' },
            { modal: 'footerCustomization', icon: '🐾', label: 'Footer' },
            { modal: 'notificationSettings', icon: '🔔', label: 'Notifications' },
            { modal: 'manageTools', icon: '🛠️', label: 'Tools' },
            { modal: 'appSettings', icon: '⚙️', label: 'App Settings' },
            { modal: 'integrations', icon: '🔗', label: 'Integrations' },
        ]
    }
];

const MoreScreen: React.FC<MoreScreenProps> = ({ onNavigate }) => {
  const { settings } = useContext(SettingsContext);

  const handleNav = (screen?: ActiveScreen, modal?: ActiveModal) => {
    if (modal) {
      onNavigate('more', modal);
    } else if (screen) {
      onNavigate(screen);
    }
  };

  const ToolButton: React.FC<{ tool: typeof TOOL_SECTIONS[0]['tools'][0] }> = ({ tool }) => (
    <button
      onClick={() => handleNav(tool.screen, tool.modal)}
      className="p-3 bg-subtle rounded-xl flex flex-col items-center justify-center text-center gap-2 hover-bg-stronger transition-colors"
    >
      <span className="text-3xl flex-shrink-0">{tool.icon}</span>
      <span className="text-xs font-semibold text-primary">{tool.label}</span>
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0">
        <h2 className="text-2xl font-bold text-primary text-center">The Hub ⚙️</h2>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {TOOL_SECTIONS.map(section => {
          const enabledTools = section.tools.filter(tool => !tool.key || settings.enabledTools[tool.key]);
          if (enabledTools.length === 0) return null;
          
          return (
            <div key={section.title} className="animate-fadeInUp">
              <h3 className="text-sm font-semibold text-tertiary uppercase tracking-wider mb-3 px-1">{section.title}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {enabledTools.map(tool => (
                  <ToolButton key={tool.label} tool={tool} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MoreScreen;
