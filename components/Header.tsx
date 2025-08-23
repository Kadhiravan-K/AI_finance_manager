import React from 'react';

interface HeaderProps {
  onOpenTransfer: () => void;
  onOpenMenu: () => void;
  isOnline: boolean;
}

const Header: React.FC<HeaderProps> = ({ onOpenTransfer, onOpenMenu, isOnline }) => {
  return (
    <header className="relative p-4 flex-shrink-0 themed-header shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
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
        <div className="flex items-center space-x-1">
          <button onClick={onOpenTransfer} className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-secondary hover:text-primary" aria-label="Open account transfer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
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