import React from 'react';
import ReactDOM from 'react-dom';

const modalRoot = document.getElementById('modal-root')!;

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onCancel}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-sm p-6 border border-rose-500/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg text-rose-400 mb-2">{title}</h3>
        <p className="text-sm text-secondary mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="button-secondary px-4 py-2">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="button-primary px-4 py-2 bg-rose-600 hover:bg-rose-500">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ConfirmationDialog;