import React from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface AddTransactionModeModalProps {
  onClose: () => void;
  onSelectMode: (mode: 'auto' | 'manual') => void;
}

const AddTransactionModeModal: React.FC<AddTransactionModeModalProps> = ({ onClose, onSelectMode }) => {

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Add Transaction" onClose={onClose} />
        <div className="p-6 space-y-4">
            <p className="text-center text-secondary">How would you like to add a new transaction?</p>
            <button 
                onClick={() => onSelectMode('auto')}
                className="w-full text-left p-4 bg-subtle rounded-lg flex items-center gap-4 hover-bg-stronger transition-colors"
            >
                <span className="text-3xl">🤖</span>
                <div>
                    <h3 className="font-bold text-primary">Automatic (AI Parse)</h3>
                    <p className="text-sm text-secondary">Paste a message from your bank to have the AI extract the details.</p>
                </div>
            </button>
            <button 
                onClick={() => onSelectMode('manual')}
                className="w-full text-left p-4 bg-subtle rounded-lg flex items-center gap-4 hover-bg-stronger transition-colors"
            >
                <span className="text-3xl">✍️</span>
                 <div>
                    <h3 className="font-bold text-primary">Manual Entry</h3>
                    <p className="text-sm text-secondary">Fill out a full form with categories, splits, and notes.</p>
                </div>
            </button>
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AddTransactionModeModal;