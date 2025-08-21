import React from 'react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenTransfer: () => void;
  onOpenReports: () => void;
  onOpenBudgets: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenTransfer, onOpenReports, onOpenBudgets }) => {
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
          <button onClick={onOpenBudgets} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95" aria-label="Open budgets">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-2.76-2.4-5-5.5-5-10 0-3.5 2-6 5-6s5 2.5 5 6c0 4.5-2.24 7.6-5 10z" transform="scale(0.5) translate(12, 1)"/>
            </svg>
          </button>
           <button onClick={onOpenReports} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95" aria-label="Open reports">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button onClick={onOpenTransfer} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95" aria-label="Open account transfer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <button onClick={onOpenSettings} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95" aria-label="Open category settings">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;