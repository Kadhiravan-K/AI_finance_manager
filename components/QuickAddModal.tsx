import React from 'react';
import ReactDOM from 'react-dom';
import QuickAddForm from './PromptForm';

const modalRoot = document.getElementById('modal-root')!;

interface QuickAddModalProps {
  onClose: () => void;
  text: string;
  setText: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isDisabled: boolean;
  disabledReason?: string;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ onClose, ...formProps }) => {
  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-6 border border-divider opacity-0 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">Quick Add Transaction</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-secondary hover:text-primary rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <QuickAddForm {...formProps} />
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default QuickAddModal;