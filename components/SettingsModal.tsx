import React from 'react';
import { ActiveModal } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  setActiveModal: (modal: ActiveModal) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, setActiveModal }) => {

  const handleNav = (modal: ActiveModal) => {
    setActiveModal(modal);
  }
  
  const ToolButton = ({ modal, icon, label }: { modal: ActiveModal, icon: string, label: string }) => (
    <button onClick={() => handleNav(modal)} className="settings-tool-button">
      <span className="icon">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-6 border border-divider animate-scaleIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-2xl font-bold text-primary">More Options</h2>
                <button onClick={onClose} className="p-2 text-secondary hover:text-primary rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="space-y-6 overflow-y-auto pr-2 pb-20">
                <div>
                    <h3 className="text-sm font-semibold text-tertiary mb-3 px-1">Financial Tools</h3>
                    <div className="settings-tools-grid">
                        <ToolButton modal="budgets" icon="🎯" label="Budgets" />
                        <ToolButton modal="goals" icon="🏆" label="Goals" />
                        <ToolButton modal="scheduled" icon="📅" label="Scheduled" />
                        <ToolButton modal="calculator" icon="🧮" label="Calculator" />
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
                        <button onClick={() => handleNav('export')} className="w-full text-left p-4 bg-subtle rounded-lg flex items-center justify-between hover-bg-stronger transition-colors text-primary"><span>Export Data</span><span>📄</span></button>
                        <button onClick={() => handleNav('feedback')} className="w-full text-left p-4 bg-subtle rounded-lg flex items-center justify-between hover-bg-stronger transition-colors text-primary"><span>Send Feedback</span><span>📨</span></button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SettingsModal;