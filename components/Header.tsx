

import React from 'react';
// Fix: Import User as a type from types.ts to avoid resolution errors.
import { Profile, ActiveModal, User } from '../types';
import { useAppContext } from '../hooks/useAppContext';

interface HeaderProps {
  profile: Profile | null;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ profile, openModal, onMenuClick }) => {
  const { user, isCloudSynced } = useAppContext();

  return (
    <header className="themed-header flex items-center justify-between p-4 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-full hover-bg-stronger lg:hidden text-secondary hover:text-primary transition-colors"
          aria-label="Open menu"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
           </svg>
        </button>
        <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold">Finance Hub</h1>
            {user && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${isCloudSynced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'}`}>
                    {isCloudSynced ? 'Cloud Synced' : 'Syncing...'}
                </span>
            )}
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => openModal(user ? 'appSettings' : 'auth')}
          className="flex items-center gap-2 p-1 pr-3 rounded-full hover-bg-stronger text-secondary transition-colors border border-divider"
          aria-label="User profile"
        >
          <div className="w-8 h-8 rounded-full bg-subtle flex items-center justify-center text-sm border border-divider overflow-hidden">
             {user ? (user.email?.[0].toUpperCase()) : '👤'}
          </div>
          <span className="text-xs font-semibold hidden sm:inline">{user ? "My Account" : "Sign In"}</span>
        </button>
        
        <div className="h-6 w-px bg-divider mx-1 hidden sm:block"></div>

        <button
          onClick={() => openModal('aiHub')}
          className="p-2 rounded-full hover-bg-stronger text-secondary transition-colors"
          aria-label="Open AI Hub"
          title="AI Hub"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
