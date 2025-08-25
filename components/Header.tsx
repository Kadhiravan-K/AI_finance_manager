import React, { useRef, useEffect } from 'react';
import { ToggleableTool } from '../types';

interface HeaderProps {
  onOpenTransfer: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  isOnline: boolean;
  isSearchActive: boolean;
  setIsSearchActive: (isActive: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAIAssistant: () => void;
  enabledTools: Record<ToggleableTool, boolean>;
}

const Header: React.FC<HeaderProps> = ({ 
  onOpenTransfer, 
  onOpenMenu, 
  onOpenNotifications,
  isOnline, 
  isSearchActive, 
  setIsSearchActive, 
  searchQuery, 
  setSearchQuery,
  onOpenAIAssistant,
  enabledTools,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchActive) {
      searchInputRef.current?.focus();
    }
  }, [isSearchActive]);

  return (
    <header className="relative p-4 flex-shrink-0 themed-header shadow-lg h-[69px]">
      <div className="flex items-center justify-between h-full">
        {/* Normal View */}
        <div className={`flex items-center space-x-2 transition-opacity duration-200 ${isSearchActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <button onClick={onOpenMenu} className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-secondary hover:text-primary" aria-label="Open navigation menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg shadow-emerald-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white">
                <path d="M21 7.25C21 6.00736 20.0126 5 18.8 5H5.2C3.98741 5 3 6.00736 3 7.25V16.75C3 17.9926 3.98741 19 5.2 19H18.8C20.0126 19 21 17.9926 21 16.75V7.25Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M16 12C16 12.5523 15.5523 13 15 13C14.4477 13 14 12.5523 14 12C14 11.4477 14.4477 11 15 11C15.5523 11 16 11.4477 16 12Z" fill="currentColor"/>
                <path d="M3 10.5H21" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight truncate text-primary">Finance Hub</h1>
          </div>
        </div>
        <div className={`flex items-center space-x-1 transition-opacity duration-200 ${isSearchActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
           {enabledTools.aiCommandCenter && (
            <button onClick={onOpenAIAssistant} className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-secondary hover:text-primary text-xl" aria-label="Open AI Assistant">
              ✨
            </button>
           )}
          <button onClick={() => setIsSearchActive(true)} className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-secondary hover:text-primary" aria-label="Search">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
          <button onClick={onOpenNotifications} className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-secondary hover:text-primary" aria-label="Open notifications">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          {enabledTools.accountTransfer && (
            <button onClick={onOpenTransfer} className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-secondary hover:text-primary" aria-label="Open account transfer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Search View */}
        <div className={`absolute inset-0 px-4 flex items-center gap-2 transition-opacity duration-200 ${isSearchActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for any tool or screen..."
            className="w-full input-base rounded-full py-2 px-4"
          />
          <button onClick={() => setIsSearchActive(false)} className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-secondary hover:text-rose-400" aria-label="Close search">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      {!isOnline && (
        <div className="absolute top-full left-0 right-0 bg-rose-600 text-white text-xs text-center py-1 offline-indicator z-20">
            Offline Mode
        </div>
      )}
    </header>
  );
};

export default Header;