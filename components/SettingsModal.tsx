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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-700/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <div className="space-y-3">
            <button onClick={() => handleNav('appSettings')} className="w-full text-left p-4 bg-slate-700/50 rounded-lg flex items-center justify-between hover:bg-slate-700 transition-colors"><span>App Settings</span><span>⚙️</span></button>
            <button onClick={() => handleNav('categories')} className="w-full text-left p-4 bg-slate-700/50 rounded-lg flex items-center justify-between hover:bg-slate-700 transition-colors"><span>Manage Categories</span><span>🏷️</span></button>
            <button onClick={() => handleNav('payees')} className="w-full text-left p-4 bg-slate-700/50 rounded-lg flex items-center justify-between hover:bg-slate-700 transition-colors"><span>Manage Payees</span><span>🏢</span></button>
            <button onClick={() => handleNav('senderManager')} className="w-full text-left p-4 bg-slate-700/50 rounded-lg flex items-center justify-between hover:bg-slate-700 transition-colors"><span>Manage Senders</span><span>🛡️</span></button>
            <button onClick={() => handleNav('export')} className="w-full text-left p-4 bg-slate-700/50 rounded-lg flex items-center justify-between hover:bg-slate-700 transition-colors"><span>Export Data</span><span>📄</span></button>
        </div>
        </div>
    </div>
  );
};

export default SettingsModal;