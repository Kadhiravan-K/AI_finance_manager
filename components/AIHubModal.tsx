import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';
import { ActiveModal, ActiveScreen, AppState, FinancialScenarioResult } from '../types';
import { runFinancialScenario } from '../services/geminiService';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

const modalRoot = document.getElementById('modal-root')!;

interface AIHubModalProps {
  onClose: () => void;
  onSendCommand: (command: string, file?: {name: string, type: string, data: string}) => Promise<string>;
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>) => void;
  appState: AppState;
}

const AIHubModal: React.FC<AIHubModalProps> = ({ onClose, onSendCommand, onNavigate, appState }) => {
  const [activeTab, setActiveTab] = useState<'command' | 'simulator'>('command');
  
  const TabButton = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) => (
    <button type="button" onClick={onClick} className={`w-full py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${ active ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary' }`}>
        {children}
    </button>
  );

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="AI Hub" onClose={onClose} icon="🧠" />
        <div className="flex border-b border-divider flex-shrink-0">
            <TabButton active={activeTab === 'command'} onClick={() => setActiveTab('command')}>Command</TabButton>
            <TabButton active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')}>Simulator</TabButton>
        </div>
        
        {activeTab === 'command' && <CommandView onSendCommand={onSendCommand} onNavigate={onNavigate} />}
        {activeTab === 'simulator' && <SimulatorView appState={appState} />}

      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

const CommandView: React.FC<Pick<AIHubModalProps, 'onSendCommand' | 'onNavigate'>> = ({ onSendCommand, onNavigate }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'model', text: string, fileName?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<{name: string, type: string, data: string} | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);
  useEffect(() => { inputRef.current?.focus(); }, []);
  
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => setCommand(prev => prev ? `${prev} ${event.results[0][0].transcript}` : event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => { console.error('Speech recognition error:', event.error); setIsListening(false); };
    recognitionRef.current = recognition;
  }, []);
  
  const handleListen = () => { if (isListening) recognitionRef.current.stop(); else recognitionRef.current.start(); setIsListening(!isListening); };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = (e.target?.result as string).split(',')[1];
            if (base64Data) {
                setFile({ name: selectedFile.name, type: selectedFile.type, data: base64Data });
                setHistory(prev => [...prev, { role: 'model', text: `Attached file: ${selectedFile.name}. What should I do with it?` }]);
                inputRef.current?.focus();
            }
        };
        reader.readAsDataURL(selectedFile);
    }
    if (event.target) event.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isLoading) return;

    const userCommand = command;
    const attachedFile = file;
    
    setHistory(prev => [...prev, { role: 'user', text: userCommand, fileName: attachedFile?.name }]);
    setCommand('');
    setFile(null);
    setIsLoading(true);

    try {
      const response = await onSendCommand(userCommand, attachedFile);
      setHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setHistory(prev => [...prev, { role: 'model', text: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {history.length === 0 && (
          <div className="text-center text-secondary p-4">
            <p>Give commands, ask questions, or upload a file for analysis.</p>
            <p className="text-xs mt-2">"add 500 for lunch", "go to reports", "create a savings account"</p>
          </div>
        )}
        {history.map((entry, index) => (
          <div key={index} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl max-w-[80%] ${entry.role === 'user' ? 'bg-sky-800/70' : 'bg-subtle'}`}>
              {entry.fileName && <div className="text-xs text-secondary mb-1 italic">File: {entry.fileName}</div>}
              <p className="text-sm text-primary whitespace-pre-wrap">{entry.text}</p>
            </div>
          </div>
        ))}
        {isLoading && <div className="flex justify-start"><div className="p-3 rounded-xl bg-subtle"><LoadingSpinner /></div></div>}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-divider flex items-end gap-2">
        <button type="button" onClick={() => fileInputRef.current?.click()} className="button-secondary p-3 aspect-square rounded-full flex items-center justify-center flex-shrink-0" aria-label="Attach file"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg></button>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
        <button type="button" onClick={handleListen} className={`button-secondary p-3 aspect-square rounded-full flex items-center justify-center flex-shrink-0 ${isListening ? 'bg-rose-500/80 text-white animate-pulse' : ''}`} aria-label="Use voice command"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg></button>
        <textarea ref={inputRef} value={command} onChange={e => setCommand(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }} placeholder="Type or speak..." className="w-full input-base rounded-2xl py-2 px-4 resize-none h-12" rows={1} disabled={isLoading}/>
        <button type="submit" disabled={isLoading || !command.trim()} className="button-primary p-3 aspect-square rounded-full flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
      </form>
    </>
  );
};


const SimulatorView: React.FC<{ appState: AppState }> = ({ appState }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<FinancialScenarioResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formatCurrency = useCurrencyFormatter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await runFinancialScenario(appState, query);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const getChangeColor = (changeDesc: string) => {
      if (changeDesc.includes('increase') || changeDesc.includes('improved') || changeDesc.includes('sooner')) return 'text-emerald-400';
      if (changeDesc.includes('decrease') || changeDesc.includes('worsened') || changeDesc.includes('delayed')) return 'text-rose-400';
      return 'text-primary';
  }

  return (
      <>
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
              <p className="text-center text-secondary text-sm">Explore 'what-if' scenarios to see their impact on your finances.</p>
              <p className="text-center text-tertiary text-xs">e.g., "What if I get a 10% raise?" or "Impact of spending 2000 less on dining out"</p>
              {isLoading && <div className="p-4 rounded-lg bg-subtle"><div className="flex justify-center"><LoadingSpinner /></div></div>}
              {error && <div className="p-4 rounded-lg bg-rose-900/50 text-rose-300 text-sm">{error}</div>}
              {result && (
                  <div className="space-y-4 animate-fadeInUp">
                      <div className="p-4 bg-subtle rounded-lg border border-divider">
                          <h3 className="font-semibold text-primary">Scenario: {result.summary}</h3>
                      </div>
                      <div className="p-4 bg-subtle rounded-lg border border-divider">
                          <h4 className="font-semibold text-primary mb-2">Key Impacts</h4>
                          <div className="space-y-2">
                              {result.keyMetrics.map(metric => (
                                  <div key={metric.metric} className="p-2 bg-subtle rounded-md">
                                      <p className="font-medium text-secondary">{metric.metric}</p>
                                      <div className="flex justify-between items-baseline">
                                          <p className="text-lg font-mono text-primary">{metric.oldValue} → <strong className={getChangeColor(metric.changeDescription)}>{metric.newValue}</strong></p>
                                          <p className={`text-sm font-medium ${getChangeColor(metric.changeDescription)}`}>{metric.changeDescription}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                      {result.goalImpacts && result.goalImpacts.length > 0 && (
                          <div className="p-4 bg-subtle rounded-lg border border-divider">
                              <h4 className="font-semibold text-primary mb-2">Impact on Goals</h4>
                              <div className="space-y-2">
                                {result.goalImpacts.map(goal => (
                                    <p key={goal.goalName} className="text-sm text-secondary">
                                        <strong>{goal.goalName}:</strong> <span className={getChangeColor(goal.impact)}>{goal.impact}</span>
                                    </p>
                                ))}
                              </div>
                          </div>
                      )}
                      <div className="p-4 bg-violet-900/50 rounded-lg border border-violet-700">
                          <h4 className="font-semibold text-violet-300 mb-2">Conclusion</h4>
                          <p className="text-sm text-violet-200">{result.conclusion}</p>
                      </div>
                  </div>
              )}
          </div>
          <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-divider flex items-center gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Enter your scenario..." className="w-full input-base rounded-full py-2 px-4" disabled={isLoading} />
              <button type="submit" disabled={isLoading || !query.trim()} className="button-primary px-4 py-2">Simulate</button>
          </form>
      </>
  );
};

export default AIHubModal;
