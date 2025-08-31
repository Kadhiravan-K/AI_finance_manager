import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

const UndoToast: React.FC<UndoToastProps> = ({ message, onUndo, onDismiss }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
    }, 4500); // Start exit animation before dismissing

    const exitTimer = setTimeout(() => {
        onDismiss();
    }, 5000); // Dismiss after animation

    return () => {
        clearTimeout(timer);
        clearTimeout(exitTimer);
    };
  }, [onDismiss]);
  
  const handleUndoClick = () => {
      onUndo();
      setExiting(true);
      setTimeout(onDismiss, 500);
  };

  return ReactDOM.createPortal(
    <div className={`fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${exiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
      <div className="glass-card flex items-center justify-between gap-4 p-3 rounded-xl shadow-lg border border-divider w-full max-w-xs sm:max-w-sm">
        <p className="text-sm text-secondary">{message}</p>
        <button onClick={handleUndoClick} className="font-bold text-sm text-sky-400 hover:text-sky-300 transition-colors flex-shrink-0">
          Undo
        </button>
      </div>
    </div>,
    document.body
  );
};

export default UndoToast;