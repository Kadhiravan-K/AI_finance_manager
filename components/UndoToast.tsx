import React, { useEffect, useState, useRef } from 'react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

const UndoToast: React.FC<UndoToastProps> = ({ message, onUndo, onConfirm, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [dragState, setDragState] = useState({ startX: 0, currentX: 0, isDragging: false });
  const toastRef = useRef<HTMLDivElement>(null);
  const undoClicked = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = (confirm: boolean) => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    if (confirm && !undoClicked.current) {
        onConfirm();
    }
    setExiting(true);
    setTimeout(onClose, 300);
  };
  
  useEffect(() => {
    setVisible(true);
    timeoutRef.current = setTimeout(() => handleClose(true), 5000);
    return () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUndo = () => {
    undoClicked.current = true;
    onUndo();
    handleClose(false);
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setDragState({ startX: e.touches[0].clientX, currentX: e.touches[0].clientX, isDragging: true });
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragState.isDragging) return;
    setDragState(prev => ({ ...prev, currentX: e.touches[0].clientX }));
  };

  const handleTouchEnd = () => {
    if (!dragState.isDragging) return;
    const deltaX = dragState.currentX - dragState.startX;
    if (Math.abs(deltaX) > 80) { // Swipe threshold
      handleClose(true);
    } else {
      setDragState({ startX: 0, currentX: 0, isDragging: false });
    }
  };
  
  const getTransformStyle = () => {
      if (!dragState.isDragging) return {};
      const deltaX = dragState.currentX - dragState.startX;
      return { transform: `translateX(${deltaX}px)`, transition: 'none' };
  }

  return (
    <div
      ref={toastRef}
      className={`undo-toast ${visible && !exiting ? 'visible' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={getTransformStyle()}
    >
      <div className="glass-card flex items-center justify-between gap-4 p-3 rounded-xl shadow-lg border border-divider">
        <p className="text-sm text-primary">{message}</p>
        <button onClick={handleUndo} className="button-secondary text-sm px-3 py-1 font-semibold text-sky-400">
          Undo
        </button>
         <button onClick={() => handleClose(true)} className="p-1 text-tertiary hover:text-primary" aria-label="Dismiss">
            &times;
        </button>
      </div>
    </div>
  );
};

export default UndoToast;