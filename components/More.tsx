import React from 'react';
import { ActiveModal, ActiveScreen } from '../types';

interface MoreScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
  setActiveModal: (modal: ActiveModal) => void;
  onResetApp: () => void;
}

const MoreScreen: React.FC<MoreScreenProps> = ({ setActiveModal, setActiveScreen, onResetApp }) => {

  const handleNav = (modal: ActiveModal) => {
    setActiveModal(modal);
  }
  
  const handleScreenNav = (screen: ActiveScreen) => {
    setActiveScreen(screen);
  }

  return (
    <div className="h-full flex flex-col">
       <div className="p-4 border-b border-divider flex-shrink-0">
         <h2 className="text-xl font-bold text-primary text-center">More</h2>
       </div>
        <div className="flex-grow overflow-y-auto p-6 pr-4 pb-20 space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">Views & Tools</h3>
                 <div className="management-grid">
                    <button onClick={() => handleNav('transfer')} className="management-tool-button"><span className="icon text-3xl">↔️</span><span className="text-xs">Transfer Funds</span></button>
                    <button onClick={() => handleScreenNav('investments')} className="management-tool-button"><span className="icon text-3xl">💹</span><span className="text-xs">Investments</span></button>
                    <button onClick={() => handleScreenNav('goals')} className="management-tool-button"><span className="icon text-3xl">🏆</span><span className="text-xs">Goals</span></button>
                    <button onClick={() => handleScreenNav('scheduled')} className="management-tool-button"><span className="icon text-3xl">📅</span><span className="text-xs">Scheduled</span></button>
                    <button onClick={() => handleScreenNav('calculator')} className="management-tool-button"><span className="icon text-3xl">🧮</span><span className="text-xs">Calculator</span></button>
                    <button onClick={() => handleScreenNav('calendar')} className="management-tool-button"><span className="icon text-3xl">🗓️</span><span className="text-xs">Calendar</span></button>
                    <button onClick={() => handleScreenNav('notes')} className="management-tool-button"><span className="icon text-3xl">📝</span><span className="text-xs">Notes</span></button>
                    <button onClick={() => handleScreenNav('tripManagement')} className="management-tool-button"><span className="icon text-3xl">✈️</span><span className="text-xs">Trip Management</span></button>
                    <button onClick={() => handleScreenNav('shop')} className="management-tool-button"><span className="icon text-3xl">🏪</span><span className="text-xs">Shop Hub</span></button>
                    <button onClick={() => handleScreenNav('refunds')} className="management-tool-button"><span className="icon text-3xl">↩️</span><span className="text-xs">Refunds</span></button>
                    <button onClick={() => handleScreenNav('dataHub')} className="management-tool-button"><span className="icon text-3xl">🗄️</span><span className="text-xs">Data Hub</span></button>
                 </div>
            </div>
             <div>
                <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">Growth</h3>
                <div className="space-y-3">
                    <button onClick={() => handleScreenNav('challenges')} className="settings-management-button"><span>Streaks & Challenges</span><span>🔥</span></button>
                    <button onClick={() => handleScreenNav('learn')} className="settings-management-button"><span>Learn Finance</span><span>📚</span></button>
                    <button onClick={() => handleScreenNav('achievements')} className="settings-management-button"><span>Achievements</span><span>🏅</span></button>
                </div>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">Settings & Management</h3>
                <div className="space-y-3">
                     <button onClick={() => handleNav('integrations')} className="settings-management-button"><span>Integrations</span><span>🔗</span></button>
                     <button onClick={() => handleNav('accountsManager')} className="settings-management-button"><span>Manage Accounts</span><span>🏦</span></button>
                     <button onClick={() => handleNav('manageTools')} className="settings-management-button"><span>Manage Tools</span><span>🛠️</span></button>
                     <button onClick={() => handleNav('categories')} className="settings-management-button"><span>Manage Categories</span><span>🏷️</span></button>
                     <button onClick={() => handleNav('contacts')} className="settings-management-button"><span>Manage Contacts</span><span>👥</span></button>
                     <button onClick={() => handleNav('dashboardSettings')} className="settings-management-button"><span>Customize Dashboard</span><span>🎨</span></button>
                     {/* Fix: Removed button for deprecated 'footerSettings' modal. */}
                     <button onClick={() => handleNav('notificationSettings')} className="settings-management-button"><span>Notification Settings</span><span>🔔</span></button>
                </div>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">App & Data</h3>
                <div className="space-y-3">
                    <button onClick={() => handleNav('appSettings')} className="settings-management-button">
                        <span>App Settings & Backup</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <button onClick={() => handleNav('trustBin')} className="settings-management-button"><span>Trust Bin</span><span>🗑️</span></button>
                    <button onClick={() => handleNav('importExport')} className="settings-management-button"><span>Import/Export Data</span><span>📄</span></button>
                    <button onClick={() => handleNav('feedback')} className="settings-management-button"><span>Send Feedback</span><span>📨</span></button>
                    <button onClick={onResetApp} className="settings-management-button text-rose-400">
                      <span>Reset App</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MoreScreen;
