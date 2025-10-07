import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';
import { ActiveModal, ActiveScreen, AppState, FinancialScenarioResult, ParsedReceiptData, Transaction, TransactionType, ItemizedDetail } from '../types';
import { runFinancialScenario, getAICoachAction, parseReceiptImage } from '../services/geminiService';

const modalRoot = document.getElementById('modal-root')!;

interface AIHubModalProps {
  onClose: () => void;
  onExecuteCommand: (command: any) => Promise<string>;
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>) => void;
  appState: AppState;
}

const SimulationResultCard: React.FC<{ result: FinancialScenarioResult }> = ({ result }) => {
    const getChangeColor = (changeDesc: string) => {
      if (changeDesc.toLowerCase().includes('increase') || changeDesc.toLowerCase().includes('improved') || changeDesc.toLowerCase().includes('sooner')) return 'text-emerald-400';
      if (changeDesc.toLowerCase().includes('decrease') || changeDesc.toLowerCase().includes('worsened') || changeDesc.toLowerCase().includes('delayed')) return 'text-rose-400';
      return 'text-primary';
    }
    return (
        <div className="space-y-3 p-3 bg-subtle rounded-lg border border-divider">
            <h4 className="font-semibold text-primary">{result.summary}</h4>
            <div className="space-y-2">
                {result.keyMetrics.map(metric => (
                    <div key={metric.metric} className="p-2 bg-subtle rounded-md">
                        <p className="font-medium text-secondary text-sm">{metric.metric}</p>
                        <div className="flex justify-between items-baseline">
                            <p className="text-base font-mono text-primary">{metric.oldValue} → <strong className={getChangeColor(metric.changeDescription)}>{metric.newValue}</strong></p>
                            <p className={`text-xs font-medium ${getChangeColor(metric.changeDescription)}`}>{metric.changeDescription}</p>
                        </div>
                    </div>
                ))}
            </div>
            {result.goalImpacts && result.goalImpacts.length > 0 && (
                <div>
                    <h5 className="font-semibold text-secondary text-sm mb-1">Impact on Goals</h5>
                    {result.goalImpacts.map(goal => ( <p key={goal.goalName} className="text-xs text-secondary"><strong>{goal.goalName}:</strong> <span className={getChangeColor(goal.impact)}>{goal.impact}</span></p>))}
                </div>
            )}
            <div className="p-2 bg-violet-900/50 rounded-md border border-violet-700">
                <p className="text-sm text-violet-200">{result.conclusion}</p>
            </div>
        </div>
    );
};

const AIHubModal: React.FC<AIHubModalProps> = ({ onClose, onExecuteCommand, onNavigate, appState }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'model', text?: string, component?: React.ReactNode }[]>([
      { role: 'model', text: "Hello! I'm your AI Financial Coach. Ask me to add transactions, run simulations, or analyze your spending. You can also upload a receipt image." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [file, setFile] = useState<{name: string, type: string, data: string, preview: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);
  useEffect(() => { if (!isLoading) inputRef.current?.focus(); }, [isLoading]);
  
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => setQuery(prev => prev ? `${prev} ${event.results[0][0].transcript}` : event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => { console.error('Speech recognition error:', event.error); setIsListening(false); };
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
            alert("Microphone access is denied. Please enable it in your browser settings to use voice input.");
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
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const base64Data = dataUrl.split(',')[1];
            if (base64Data) {
                setFile({ name: selectedFile.name, type: selectedFile.type, data: base64Data, preview: dataUrl });
                setQuery(`Analyze this receipt for ${selectedFile.name}`);
                inputRef.current?.focus();
            }
        };
        reader.onerror = (error) => console.error("Error reading file:", error);
        reader.readAsDataURL(selectedFile);
    }
    if (event.target) event.target.value = '';
  };

  const handleSendCommand = async (command: string, attachedFile?: {name: string, type: string, data: string}) => {
    if (attachedFile) {
        try {
            const receiptData = await parseReceiptImage(attachedFile.data, attachedFile.type);
            if (receiptData) {
                const itemizedDetails: ItemizedDetail[] = receiptData.lineItems.map(item => ({
                    description: item.description,
                    amount: item.amount,
                    categoryId: '', // User will categorize this
                }));

                const partialTransaction: Partial<Transaction> = {
                    description: receiptData.merchantName,
                    amount: receiptData.totalAmount,
                    date: receiptData.transactionDate,
                    type: TransactionType.EXPENSE,
                    itemizedDetails: itemizedDetails.length > 0 ? itemizedDetails : undefined,
                };
                
                onNavigate('dashboard', 'addTransaction', { initialTransaction: partialTransaction, isItemized: true });
                return `I've analyzed the receipt from ${receiptData.merchantName}. Please review and categorize the details.`;
            } else {
                return "I couldn't read that receipt clearly. Please try again with a clearer image.";
            }
        } catch(e) {
            console.error(e);
            return `Sorry, I had trouble analyzing that image. ${e instanceof Error ? e.message : ''}`;
        }
    }

    // If no file, proceed with normal coach action
    const chatHistoryForModel = history.map(h => ({ role: h.role, text: h.text || 'Component Response' }));
    const action = await getAICoachAction(command, appState, chatHistoryForModel);
    
    if (action.clarification) {
        return action.clarification;
    }

    switch (action.action) {
        case 'run_simulation':
            const simulationResult = await runFinancialScenario(appState, action.payload.query);
            setHistory(prev => [...prev, { role: 'model', component: <SimulationResultCard result={simulationResult} /> }]);
            return ""; // Component handles its own display
        case 'navigate':
            onNavigate(action.payload.screen);
            return `Navigating you to ${action.payload.screen}...`;
        case 'create_transaction':
            return await onExecuteCommand(action.payload);
        case 'chat':
        default:
            return action.payload.response;
    }
  };


  const handleSubmit = async (e: React.FormEvent, prompt?: string) => {
    e.preventDefault();
    const userQuery = prompt || query;
    if (!userQuery.trim() || isLoading) return;

    const attachedFile = file ? { name: file.name, type: file.type, data: file.data } : undefined;

    setHistory(prev => [...prev, { role: 'user', text: userQuery }]);
    setQuery('');
    setFile(null);
    setIsLoading(true);

    try {
        const responseText = await handleSendCommand(userQuery, attachedFile);
        if (responseText) { // handleSendCommand may have already updated history with a component
            setHistory(prev => [...prev, { role: 'model', text: responseText }]);
        }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setHistory(prev => [...prev, { role: 'model', text: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const suggestedPrompts = [ "What if I get a 15% raise?", "How much did I spend on food last month?", "Add 750 for groceries from my Main Bank account", "Show me my investment portfolio" ];

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="AI Financial Coach" onClose={onClose} icon="🧠" />
        
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {history.map((entry, index) => (
            <div key={index} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-xl max-w-[80%] ${entry.role === 'user' ? 'bg-sky-800/70' : 'bg-subtle'}`}>
                {entry.text ? <p className="text-sm text-primary whitespace-pre-wrap">{entry.text}</p> : entry.component}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex justify-start"><div className="p-3 rounded-xl bg-subtle"><LoadingSpinner /></div></div>}
          <div ref={chatEndRef} />
        </div>

        {history.length <= 1 && !file && (
            <div className="p-4 border-t border-divider flex-shrink-0">
                <div className="grid grid-cols-2 gap-2">
                    {suggestedPrompts.map(p => (
                        <button key={p} onClick={(e) => { setQuery(p); handleSubmit(e, p); }} className="p-2 text-left bg-subtle rounded-lg text-xs hover-bg-stronger text-secondary transition-colors">
                           {p}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {file && (
            <div className="p-2 border-t border-divider flex-shrink-0">
                <div className="bg-subtle p-2 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={file.preview} alt="upload preview" className="w-10 h-10 rounded object-cover"/>
                        <span className="text-xs text-secondary">{file.name}</span>
                    </div>
                    <button onClick={() => setFile(null)} className="p-1 text-rose-400">&times;</button>
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-divider flex items-end gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="button-secondary p-3 aspect-square rounded-full flex items-center justify-center flex-shrink-0" aria-label="Attach file">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*"/>

            <button type="button" onClick={handleListen} className={`button-secondary p-3 aspect-square rounded-full flex items-center justify-center flex-shrink-0 ${isListening ? 'bg-rose-500/80 text-white animate-pulse' : ''}`} aria-label="Use voice command"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg></button>
            <textarea 
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type, speak, or attach receipt..."
                className="w-full input-base rounded-2xl py-2 px-4 resize-none h-12"
                rows={1}
                disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || (!query.trim() && !file)} className="button-primary p-3 aspect-square rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AIHubModal;