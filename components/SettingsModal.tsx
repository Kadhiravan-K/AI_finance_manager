import React from 'react';
import { ActiveModal, ActiveScreen } from '../types';
import ModalHeader from './ModalHeader';

interface SettingsModalProps {
  onClose: () => void;
  setActiveScreen: (screen: ActiveScreen) => void;
  setActiveModal: (modal: ActiveModal) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, setActiveModal, setActiveScreen }) => {

  const handleNav = (modal: ActiveModal) => {
    setActiveModal(modal);
  }
  
  const ToolButton = ({ screen, icon, label }: { screen: ActiveScreen, icon: string, label: string }) => (
    <button onClick={() => setActiveScreen(screen)} className="settings-tool-button">
      <span className="icon">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <ModalHeader title="More Options" onClose={onClose} />
            <div className="space-y-6 overflow-y-auto p-6 pr-4 pb-20">
                <div>
                    <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">Financial Tools</h3>
                    <div className="settings-tools-grid">
                        <ToolButton screen="budgets" icon="🎯" label="Budgets" />
                        <ToolButton screen="goals" icon="🏆" label="Goals" />
                        <ToolButton screen="scheduled" icon="📅" label="Scheduled" />
                        <ToolButton screen="calculator" icon="🧮" label="Calculator" />
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">Management</h3>
                    <div className="space-y-3">
                         <button onClick={() => handleNav('categories')} className="w-full text-left p-4 bg-subtle rounded-lg flex items-center justify-between hover-bg-stronger transition-colors text-primary"><span>Manage Categories</span><span>🏷️</span></button>
                         <button onClick={() => handleNav('payees')} className="w-full text-left p-4 bg-subtle rounded-lg flex items-center justify-between hover-bg-stronger transition-colors text-primary"><span>Manage Payees</span><span>🏢</span></button>
                         <button onClick={() => handleNav('contacts')} className="w-full text-left p-4 bg-subtle rounded-lg flex items-center justify-between hover-bg-stronger transition-colors text-primary"><span>Manage Contacts</span><span>👥</span></button>
                         <button onClick={() => handleNav('senderManager')} className="w-full text-left p-4 bg-subtle rounded-lg flex items-center justify-between hover-bg-stronger transition-colors text-primary"><span>Manage Senders</span><span>🛡️</span></button>
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">App & Data</h3>
                    <div className="space-y-3">
                        <button onClick={() => handleNav('appSettings')} className="w-full text-left p-4 bg-subtle rounded-lg flex items-center justify-between hover-bg-stronger transition-colors text-primary"><span>App Settings & Backup</span><span>⚙️</span></button>
                        <button onClick={() => handleNav('importExport')} className="w-full text-left p-4 bg-subtle rounded-lg flex items-center justify-between hover-bg-stronger transition-colors text-primary"><span>Export Data</span><span>📄</span></button>
                        <button onClick={() => handleNav('feedback')} className="w-full text-left p-4 bg-subtle rounded-lg flex items-center justify-between hover-bg-stronger transition-colors text-primary"><span>Send Feedback</span><span>📨</span></button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SettingsModal;