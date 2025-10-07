import React, { useState, useRef, useEffect } from 'react';
import { Profile } from '../types';
import { supabase } from '../utils/supabase';

interface HeaderProps {
  profile: Profile | null;
}

const Header: React.FC<HeaderProps> = ({ profile }) => {
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
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(prev => !prev)}
          className="flex items-center gap-2"
        >
          <span className="font-semibold">{profile?.full_name || 'User'}</span>
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
    </header>
  );
};

export default Header;
