import React from 'react';

interface HeaderProps {
  onOpenTransfer: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenTransfer }) => {
  return (
    <header className="bg-slate-900/70 backdrop-blur-lg shadow-lg p-4 flex-shrink-0 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg shadow-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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
    </header>
  );
};

export default Header;