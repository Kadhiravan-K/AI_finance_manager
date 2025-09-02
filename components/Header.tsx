import React, { useContext } from 'react';
import { AppDataContext } from '../contexts/SettingsContext';

interface HeaderProps {
  onOpenMenu: () => void;
  onOpenAccounts: () => void;
  onOpenSearch: () => void;
  onOpenAI: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onOpenMenu, 
  onOpenAccounts,
  onOpenSearch,
  onOpenAI
}) => {
  const dataContext = useContext(AppDataContext);
  const currentStreak = dataContext?.streaks.currentStreak || 0;

  return (
    <header className="relative p-4 flex-shrink-0 themed-header shadow-lg h-[69px]">
      <div className="flex items-center justify-between h-full">
        <div className={`flex items-center space-x-2`}>
          <button onClick={onOpenMenu} className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-secondary hover:text-primary" aria-label="Open navigation menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg shadow-emerald-500/20">
              <svg width="24" height="24" viewBox="0 0 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white">
                <path d="M21 7.25C21 6.00736 20.0126 5 18.8 5H5.2C3.98741 5 3 6.00736 3 7.25V16.75C3 17.9926 3.98741 19 5.2 19H18.8C20.0126 19 21 17.9926 21 16.75V7.25Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M16 12C16 12.5523 15.5523 13 15 13C14.4477 13 14 12.5523 14 12C14 11.4477 14.4477 11 15 11C15.5523 11 16 11.4477 16 12Z" fill="currentColor"/>
                <path d="M3 10.5H21" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight truncate text-primary leading-tight">Finance Hub</h1>
              {currentStreak > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                  <span>🔥</span>
                  <span>{currentStreak} Day Streak</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={`flex items-center space-x-1`}>
            <button onClick={onOpenSearch} className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-secondary hover:text-primary" aria-label="Open search">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
             <button onClick={onOpenAI} className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-secondary hover:text-primary" aria-label="Open AI Hub">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={onOpenAccounts} className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-secondary hover:text-primary" aria-label="Open accounts">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;