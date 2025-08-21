import React from 'react';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  icon?: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose, onBack, icon }) => {
  return (
    <div className="p-4 border-b border-slate-700/50 flex-shrink-0 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2">
            {icon && <span className="text-2xl">{icon}</span>}
            <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
      </div>
      <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ModalHeader;