import React from 'react';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  icon?: string;
  onSettingsClick?: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose, onBack, icon, onSettingsClick }) => {
  return (
    <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between relative themed-header sticky top-0 z-10">
      <div className="modal-glow-bar"></div>
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 text-secondary hover:text-primary hover:bg-subtle rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2">
            {icon && <span className="text-2xl">{icon}</span>}
            <h2 className="text-xl font-bold text-primary">{title}</h2>
        </div>
      </div>
       <div className="flex items-center">
        {onSettingsClick && (
            <button onClick={onSettingsClick} className="p-2 text-secondary hover:text-primary hover:bg-subtle rounded-full transition-colors" aria-label="Open settings">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        )}
        <button onClick={onClose} className="p-2 -mr-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors close-button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>
    </div>
  );
};

export default ModalHeader;
