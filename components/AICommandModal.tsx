import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';
import { ActiveModal, ActiveScreen } from '../types';

const modalRoot = document.getElementById('modal-root')!;

interface AICommandModalProps {
  onClose: () => void;
  onSendCommand: (command: string) => Promise<string>;
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>) => void;
}

const AICommandModal: React.FC<AICommandModalProps> = ({ onClose, onSendCommand, onNavigate }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
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
    if (!command.trim() || isLoading) return;

    const userCommand = command;
    setHistory(prev => [...prev, { role: 'user', text: userCommand }]);
    setCommand('');
    setIsLoading(true);

    try {
      const response = await onSendCommand(userCommand);
      setHistory(prev => [...prev, { role: 'model', text: response }]);

      // Simple navigation heuristic
      if (response.toLowerCase().includes("opening") || response.toLowerCase().includes("navigating")) {
        // FIX: Explicitly type `screens` as `ActiveScreen[]` to prevent type errors when calling `onNavigate`.
        const screens: ActiveScreen[] = ['dashboard', 'reports', 'budgets', 'goals', 'investments', 'shop', 'tripManagement'];
        for (const screen of screens) {
            if(userCommand.toLowerCase().includes(screen)) {
                onNavigate(screen);
                break;
            }
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setHistory(prev => [...prev, { role: 'model', text: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="AI Command Center" onClose={onClose} icon="✨" />
        
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {history.length === 0 && (
            <div className="text-center text-secondary p-4">
              <p>Ask me to do anything.</p>
              <p className="text-xs mt-2">Examples: "add 500 for lunch", "go to reports", "create a savings account"</p>
            </div>
          )}
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
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your command..."
                className="w-full input-base rounded-2xl py-2 px-4 resize-none h-12"
                rows={1}
                disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !command.trim()} className="button-primary p-3 aspect-square rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AICommandModal;