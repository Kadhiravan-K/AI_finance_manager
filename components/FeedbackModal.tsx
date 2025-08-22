import React, { useState } from 'react';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';

interface FeedbackModalProps {
  onClose: () => void;
  onSend: (message: string) => Promise<{ queued: boolean }>;
  isSending: boolean;
}

const primaryButtonStyle = "px-4 py-2 w-full rounded-lg text-white font-semibold bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-200 transform active:scale-[0.98] disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center";
const secondaryButtonStyle = "px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600/80 transition-colors";

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, onSend, isSending }) => {
  const [message, setMessage] = useState('');
  const [sendStatus, setSendStatus] = useState<'sent' | 'queued' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    
    const result = await onSend(message);
    if (result.queued) {
      setSendStatus('queued');
    } else {
      setSendStatus('sent');
    }
    setMessage('');
    setTimeout(() => {
      onClose();
    }, 2500);
  };
  
  const renderStatus = () => {
      if(sendStatus === 'sent'){
          return <div className="text-center p-4 bg-emerald-900/50 border border-emerald-700 text-emerald-200 rounded-xl animate-scaleIn">Feedback sent successfully. Thank you!</div>
      }
      if(sendStatus === 'queued'){
           return <div className="text-center p-4 bg-sky-900/50 border border-sky-700 text-sky-200 rounded-xl animate-scaleIn">You're offline. Your feedback has been saved and will be sent automatically when you reconnect.</div>
      }
      return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-slate-700/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Send Feedback" onClose={onClose} icon="📨" />
        <div className="p-6 space-y-4">
          {sendStatus ? renderStatus() : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="feedback-message" className="block text-sm font-medium text-slate-400 mb-1">
                  Have a suggestion or found a bug? Let us know!
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your feedback..."
                  rows={5}
                  className="w-full bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner shadow-slate-900/50 transition-all duration-200 resize-none"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={onClose} className={secondaryButtonStyle}>Cancel</button>
                <button type="submit" disabled={!message.trim() || isSending} className={primaryButtonStyle}>
                  {isSending ? <LoadingSpinner /> : 'Send Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
