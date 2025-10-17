

import React, { useContext, useState, useRef, useEffect } from 'react';
import { ActiveModal, ActiveScreen } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import ConfirmationDialog from './ConfirmationDialog';

interface MoreScreenProps {
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => void;
  onResetApp: () => void;
}

const MoreScreen: React.FC<MoreScreenProps> = ({ onNavigate, onResetApp }) => {
  const { settings } = useContext(SettingsContext);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  
  const handleResetApp = () => {
      setIsResetDialogOpen(true);
  };
  
  const handleConfirmReset = () => {
      console.log("Resetting app data...");
      localStorage.clear();
      window.location.reload();
  };

  const handleNav = (screen?: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => {
    if (modal) {
        onNavigate('more', modal, props);
    } else if (screen) {
        onNavigate(screen);
    }
  }

  const ToolButton: React.FC<{ screen?: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>, icon: string, label: string }> = ({ screen, modal, modalProps, icon, label }) => {
    const cardRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card || !settings.hubCursorGlowEffect) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            
            const glow = card.querySelector('.glow-effect') as HTMLElement;
            if(glow) {
                glow.style.transform = `translate(${x - 75}px, ${y - 75}px)`;
            }
        };
        
        const handleMouseLeave = () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        };
        
        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);
        
        return () => {
            card.removeEventListener('mousemove', handleMouseMove);
            card.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [settings.hubCursorGlowEffect]);
      
      return (
        <button ref={cardRef} onClick={() => handleNav(screen, modal, modalProps)} className={`${layout === 'grid' ? "management-tool-button" : "management-list-item"} interactive-card`}>
          <div className="glow-effect"></div>
          <span className={`${layout === 'grid' ? "text-3xl" : "text-2xl"} transition-transform duration-300 tool-icon text-secondary`}>{icon}</span>
          <span className={`${layout === 'grid' ? "text-xs font-semibold" : "font-semibold"} transition-transform duration-300 tool-label text-primary`}>{label}</span>
        </button>
      )
  };
  
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
      title: 'Management & Customization',
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
      ].filter(tool => !tool.key || settings.enabledTools[tool.key as keyof typeof settings.enabledTools])
       .sort((a, b) => a.label.localeCompare(b.label)),
    },
    {
      title: 'App & Data',
      tools: [
        // Help & Support
        { modal: 'integrations', icon: '🔗', label: 'Integrations' },
        { screen: 'manual', icon: '📖', label: 'Manual' },
        { modal: 'shareGuide', icon: '📲', label: 'Share Guide'},
        { modal: 'importExport', icon: '📄', label: 'Import/Export' },
        // Data Management
        { modal: 'appSettings', icon: '⚙️', label: 'Settings' },
        { modal: 'trustBin', icon: '🗑️', label: 'Trust Bin' },
        { key: 'faq', screen: 'faq', icon: '❓', label: 'FAQ' },
        { key: 'feedback', modal: 'feedback', icon: '📨', label: 'Send Feedback' },
        { key: 'dataHub', screen: 'dataHub', icon: '🗄️', label: 'Data Hub' },
      ].filter(tool => !tool.key || settings.enabledTools[tool.key as keyof typeof settings.enabledTools])
    }
  ];

  return (
    <div className="h-full flex flex-col">
       <ConfirmationDialog
            isOpen={isResetDialogOpen}
            title="Confirm App Reset"
            message="Are you sure you want to reset the app? All of your data will be permanently deleted. This action cannot be undone."
            onConfirm={handleConfirmReset}
            onCancel={() => setIsResetDialogOpen(false)}
            confirmLabel="Delete All Data"
        />
       <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between h-[69px]">
         <div className="w-9"></div> {/* Spacer to balance the title */}
         <h2 className="text-xl font-bold text-primary">Hub</h2>
         <button onClick={() => setLayout(l => l === 'grid' ? 'list' : 'grid')} className="button-secondary p-2 rounded-full h-9 w-9 flex items-center justify-center">
            {layout === 'grid' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            )}
          </button>
       </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-6">
            {toolSections.map(section => (
                section.tools.length > 0 && (
                    <div key={section.title}>
                        <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">{section.title}</h3>
                        <div className={layout === 'grid' ? "management-grid" : "management-list"}>
                            {section.tools.map(tool => (
                                <ToolButton key={tool.label} screen={tool.screen as ActiveScreen} modal={tool.modal as ActiveModal} icon={tool.icon} label={tool.label} />
                            ))}
                        </div>
                    </div>
                )
            ))}
            
            <div key="Danger Zone">
                <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">Danger Zone</h3>
                <div className={layout === 'grid' ? "management-grid" : "management-list"}>
                    <button onClick={handleResetApp} className={`${layout === 'grid' ? "management-tool-button" : "management-list-item"} text-rose-400 interactive-card`}>
                        <div className="glow-effect"></div>
                        <span className={layout === 'grid' ? "text-3xl" : "text-2xl"}>⚠️</span>
                        <span className={layout === 'grid' ? "text-xs font-semibold" : "font-semibold"}>Reset App</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MoreScreen;