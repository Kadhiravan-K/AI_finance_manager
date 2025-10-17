import React, { useState, useRef, useEffect } from 'react';
import { Profile, ActiveModal } from '../types';
import { supabase } from '../utils/supabase';

interface HeaderProps {
  profile: Profile | null;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

const Header: React.FC<HeaderProps> = ({ profile, openModal }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="themed-header flex items-center justify-between p-4 flex-shrink-0">
      <h1 className="text-xl font-bold">Finance Hub</h1>
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => openModal('globalSearch')}
          className="p-2 rounded-full hover-bg-stronger text-secondary transition-colors"
          aria-label="Open global search"
          title="Search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button
          onClick={() => openModal('aiHub')}
          className="p-2 rounded-full hover-bg-stronger text-secondary transition-colors"
          aria-label="Open AI Hub"
          title="AI Hub"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </button>
        <button
          onClick={() => openModal('transfer')}
          className="p-2 rounded-full hover-bg-stronger text-secondary transition-colors"
          aria-label="Transfer funds"
          title="Transfer Funds"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
        
        <div className="w-px h-6 bg-border-divider mx-1 sm:mx-2"></div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="flex items-center gap-2"
          >
            <span className="font-semibold hidden sm:inline">{profile?.full_name || 'User'}</span>
            <img
              src={profile?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile?.full_name || 'U'}`}
              alt="User avatar"
              className="w-8 h-8 rounded-full bg-slate-700"
            />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-card-strong rounded-lg shadow-xl z-50 border border-divider animate-scaleIn">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-card-hover rounded-b-lg"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;