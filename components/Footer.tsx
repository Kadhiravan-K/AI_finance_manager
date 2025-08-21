import React from 'react';
import { ActiveModal } from '../types';

interface FooterProps {
  activeModal: ActiveModal;
  setActiveModal: (modal: ActiveModal) => void;
}

const FooterNavButton = ({ icon, label, onClick, isActive }: { icon: React.ReactNode, label: string, onClick?: () => void, isActive: boolean }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 w-1/5 ${isActive ? 'text-emerald-400 scale-110' : 'text-slate-400 hover:text-emerald-400'}`}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const Footer: React.FC<FooterProps> = ({ activeModal, setActiveModal }) => {
  const handleNavClick = (modal: ActiveModal) => {
    setActiveModal(modal);
  }
  return (
    <footer className="absolute bottom-0 left-0 right-0 glass-card border-t border-slate-700/50 p-2 z-10 rounded-t-2xl sm:rounded-b-3xl">
      <div className="flex justify-around items-center h-16">
        <FooterNavButton 
          onClick={() => handleNavClick(null)}
          isActive={activeModal === null}
          label="Dashboard"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
        />
        <FooterNavButton 
          onClick={() => handleNavClick('reports')}
          isActive={activeModal === 'reports'}
          label="Reports"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <FooterNavButton 
          onClick={() => handleNavClick('budgets')}
          isActive={activeModal === 'budgets'}
          label="Budgets"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-2.76-2.4-5-5.5-5-10 0-3.5 2-6 5-6s5 2.5 5 6c0 4.5-2.24 7.6-5 10z" transform="scale(0.5) translate(12, 1)"/></svg>}
        />
        <FooterNavButton 
          onClick={() => handleNavClick('scheduled')}
          isActive={activeModal === 'scheduled'}
          label="Scheduled"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <FooterNavButton 
          onClick={() => handleNavClick('settings')}
          isActive={activeModal === 'settings'}
          label="Settings"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
      </div>
    </footer>
  );
};

export default Footer;