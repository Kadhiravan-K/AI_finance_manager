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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCommand(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    recognitionRef.current = recognition;
  }, []);
  
  const handleListen = async () => {
    if (!recognitionRef.current) {
        alert("Speech recognition is not supported by your browser.");
        return;
    }
    try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'denied') {
            alert("Microphone access is denied. Please enable it in your browser settings.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    } catch (error) {
        console.error("Could not check microphone permission:", error);
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setHistory(prev => [...prev, { role: 'model', text: `You've selected a file: ${file.name}. File processing is a future feature.` }]);
    }
    // Reset file input to allow selecting the same file again
    if (event.target) event.target.value = '';
  };

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
            <button type="button" onClick={() => fileInputRef.current?.click()} className="button-secondary p-3 aspect-square rounded-full flex items-center justify-center flex-shrink-0" aria-label="Attach file">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

            <button type="button" onClick={handleListen} className={`button-secondary p-3 aspect-square rounded-full flex items-center justify-center flex-shrink-0 ${isListening ? 'bg-rose-500/80 text-white animate-pulse' : ''}`} aria-label="Use voice command">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
            </button>
            
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
                placeholder="Type or speak..."
                className="w-full input-base rounded-2xl py-2 px-4 resize-none h-12"
                rows={1}
                disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !command.trim()} className="button-primary p-3 aspect-square rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AICommandModal;