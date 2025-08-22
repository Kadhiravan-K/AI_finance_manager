import React from 'react';

interface HeaderProps {
  onOpenTransfer: () => void;
  isOnline: boolean;
}

const Header: React.FC<HeaderProps> = ({ onOpenTransfer, isOnline }) => {
  return (
    <header className="relative bg-slate-900/70 backdrop-blur-lg shadow-lg p-4 flex-shrink-0 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg shadow-emerald-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white">
                <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 7H21V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight truncate">Personal Finance Hub</h1>
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={onOpenTransfer} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95" aria-label="Open account transfer">
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