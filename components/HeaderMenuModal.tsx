import React from 'react';
import ReactDOM from 'react-dom';
import { ActiveScreen } from '../types';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface HeaderMenuModalProps {
  onClose: () => void;
  setActiveScreen: (screen: ActiveScreen) => void;
}

const HeaderMenuModal: React.FC<HeaderMenuModalProps> = ({ onClose, setActiveScreen }) => {
  const menuItems: { screen: ActiveScreen, label: string, icon: string }[] = [
    { screen: 'investments', label: 'Investments', icon: '📈' },
    { screen: 'goals', label: 'Goals', icon: '🏆' },
    { screen: 'scheduled', label: 'Scheduled', icon: '📅' },
    { screen: 'tripManagement', label: 'Trip Management', icon: '✈️'},
    { screen: 'refunds', label: 'Refunds', icon: '↩️'},
    { screen: 'calculator', label: 'Calculator', icon: '🧮' },
    { screen: 'achievements', label: 'Achievements', icon: '🏅' },
  ];

  const modalContent = (
     <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <ModalHeader title="Tools & More" onClose={onClose} />
            <div className="p-4 space-y-2">
                {menuItems.map(item => (
                     <button 
                        key={item.screen} 
                        onClick={() => setActiveScreen(item.screen)} 
                        className="settings-management-button"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">{item.icon}</span>
                            <span className="font-semibold">{item.label}</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                ))}
            </div>
        </div>
     </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default HeaderMenuModal;