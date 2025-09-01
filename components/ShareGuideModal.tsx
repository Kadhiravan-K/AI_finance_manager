import React from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface ShareGuideModalProps {
  onClose: () => void;
}

const ShareGuideModal: React.FC<ShareGuideModalProps> = ({ onClose }) => {
  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Auto-Add from G-Pay" onClose={onClose} icon="📲" />
        <div className="p-6 space-y-4 overflow-y-auto">
          <p className="text-secondary text-sm">
            While direct integration isn't possible for security reasons, you can instantly add transactions from Google Pay (or any payment app) using the 'Share' feature. Here's how:
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 bg-subtle rounded-lg">
              <div className="text-2xl font-bold text-emerald-400">1.</div>
              <div>
                <h4 className="font-semibold text-primary">Find a Transaction</h4>
                <p className="text-sm text-secondary">Open your Google Pay, bank, or payment app and find the transaction confirmation message or notification.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 bg-subtle rounded-lg">
              <div className="text-2xl font-bold text-emerald-400">2.</div>
              <div>
                <h4 className="font-semibold text-primary">Tap 'Share'</h4>
                <p className="text-sm text-secondary">Look for a 'Share' button. For SMS messages, you can long-press the message and choose 'Share'.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 bg-subtle rounded-lg">
              <div className="text-2xl font-bold text-emerald-400">3.</div>
              <div>
                <h4 className="font-semibold text-primary">Select 'Finance Hub'</h4>
                <p className="text-sm text-secondary">Choose this app ('Finance Hub') from the list of apps in the share sheet.</p>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-tertiary pt-4">
            The transaction text will be automatically pasted into the AI parser, ready for you to confirm!
          </p>
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ShareGuideModal;
