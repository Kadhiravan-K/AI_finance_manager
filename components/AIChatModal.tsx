import React, { useState, useRef, useEffect, useContext } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';
import { AppState } from '../types';
import { getAIChatResponse } from '../services/geminiService';

const modalRoot = document.getElementById('modal-root')!;

interface AIChatModalProps {
  onClose: () => void;
  appState: AppState;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ onClose, appState }) => {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'model', text: string }[]>([
      { role: 'model', text: "Hello! I'm your AI financial coach. How can I help you understand your finances better today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    // Fix: Corrected property from 'parts' to 'text' for consistency.
    const currentHistory = history.map(h => ({ role: h.role, text: h.text }));
    
    setHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setMessage('');
    setIsLoading(true);

    try {
      // The service function expects a specific format for history
      const response = await getAIChatResponse(appState, userMessage, currentHistory);
      setHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setHistory(prev => [...prev, { role: 'model', text: `Sorry, I ran into an error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="AI Financial Coach" onClose={onClose} icon="🧠" />
        
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {history.map((entry, index) => (
            <div key={index} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-xl max-w-[80%] ${entry.role === 'user' ? 'bg-sky-800/70' : 'bg-subtle'}`}>
                <p className="text-sm text-primary whitespace-pre-wrap">{entry.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
              <div className="p-3 rounded-xl bg-subtle">
                <LoadingSpinner />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-divider flex items-center gap-2">
            <textarea 
                ref={inputRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask a question..."
                className="w-full input-base rounded-2xl py-2 px-4 resize-none h-12"
                rows={1}
                disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !message.trim()} className="button-primary p-3 aspect-square rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AIChatModal;