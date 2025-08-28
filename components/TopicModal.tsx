import React from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';

const modalRoot = document.getElementById('modal-root')!;

interface TopicModalProps {
  topic: string;
  content: { explanation: string; actionableTips: string[] } | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

const TopicModal: React.FC<TopicModalProps> = ({ topic, content, isLoading, error, onClose }) => {
  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={topic} onClose={onClose} icon="💡" />
        <div className="flex-grow overflow-y-auto p-6">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner />
            </div>
          )}
          {error && <p className="text-center text-rose-400">{error}</p>}
          {content && (
            <div className="space-y-6 animate-fadeInUp">
              <div>
                <h3 className="font-bold text-lg text-primary mb-2">Explanation</h3>
                <p className="text-secondary whitespace-pre-wrap">{content.explanation}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg text-primary mb-2">Actionable Tips</h3>
                <ul className="space-y-3">
                  {content.actionableTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-subtle rounded-lg">
                      <span className="text-emerald-400 font-bold mt-1">✓</span>
                      <p className="text-secondary">{tip}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default TopicModal;
