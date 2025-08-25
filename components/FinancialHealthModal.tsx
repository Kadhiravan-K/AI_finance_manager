import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AppState, FinancialProfile, Budget, TransactionType } from '../types';
import ModalHeader from './ModalHeader';
import { calculateFinancialHealthScore } from '../utils/financialHealth';
import { SettingsContext } from '../contexts/SettingsContext';
import { getAIBudgetSuggestion, getAIChatResponse } from '../services/geminiService';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import LoadingSpinner from './LoadingSpinner';

const modalRoot = document.getElementById('modal-root')!;

interface FinancialHealthModalProps {
  onClose: () => void;
  appState: AppState;
  onSaveProfile: (profile: FinancialProfile) => void;
  onSaveBudget: (categoryId: string, amount: number) => void;
  onSendCommand: (command: string) => Promise<string>;
}

type ActiveTab = 'breakdown' | 'advisor';

const FinancialHealthModal: React.FC<FinancialHealthModalProps> = ({ onClose, appState, onSaveProfile, onSaveBudget, onSendCommand }) => {
  const { financialProfile, categories } = appState;
  const { totalScore, breakdown } = useMemo(() => calculateFinancialHealthScore(appState), [appState]);
  const formatCurrency = useCurrencyFormatter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('advisor');
  
  // State for Profile editing
  const [profile, setProfile] = useState(financialProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(!financialProfile.monthlySalary);
  
  // State for AI Advisor
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', parts: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Speech recognition not supported by this browser.");
        return;
    }

    const recognition: any = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
    };
    
    recognitionRef.current = recognition;
  }, []);

  const handleListen = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
        recognitionRef.current.stop();
    } else {
        recognitionRef.current.start();
        setIsListening(true);
    }
  };


  const handleProfileChange = (field: keyof FinancialProfile, value: string) => {
    setProfile(p => ({ ...p, [field]: parseFloat(value) || 0 }));
  };

  const handleProfileSave = () => {
    onSaveProfile(profile);
    setIsEditingProfile(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isThinking) return;

    const userMessage = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', parts: userMessage }]);
    setChatInput('');
    setIsThinking(true);

    try {
        // Attempt to parse as a command first
        const commandResponse = await onSendCommand(userMessage);
        setChatHistory(prev => [...prev, { role: 'model', parts: commandResponse }]);
    } catch (commandError) {
        // If it's not a command, treat it as a conversational query
        try {
            const chatResponse = await getAIChatResponse(appState, userMessage, chatHistory); // history handled locally for now
            setChatHistory(prev => [...prev, { role: 'model', parts: chatResponse }]);
        } catch (chatError) {
            const errorMessage = chatError instanceof Error ? chatError.message : 'An unknown error occurred.';
            setChatHistory(prev => [...prev, { role: 'model', parts: `Error: ${errorMessage}` }]);
        }
    } finally {
        setIsThinking(false);
    }
  };


  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button onClick={onClick} className={`w-full py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${ active ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary' }`}>
        {children}
    </button>
  );

  const BreakdownPillar: React.FC<{title: string, score: number, maxScore: number, children: React.ReactNode}> = ({ title, score, maxScore, children }) => (
      <div className="p-4 bg-subtle rounded-lg">
          <div className="flex justify-between items-baseline">
              <h4 className="font-semibold text-primary">{title}</h4>
              <p className={`font-bold text-lg ${getScoreColor(score/maxScore*100)}`}>{score}<span className="text-sm text-secondary">/{maxScore}</span></p>
          </div>
          <div className="text-sm text-secondary mt-1">{children}</div>
      </div>
  );

  const renderBreakdown = () => (
    <div className="p-6 space-y-4 overflow-y-auto">
        <div className="text-center">
            <p className="text-secondary">Your Financial Health Score</p>
            <p className={`text-6xl font-bold ${getScoreColor(totalScore)}`}>{totalScore}<span className="text-3xl text-secondary">/100</span></p>
        </div>
        <BreakdownPillar title="Savings Rate" score={breakdown.savings.score} maxScore={40}>Your savings rate last month was <strong>{breakdown.savings.rate}%</strong>. Higher is better.</BreakdownPillar>
        <BreakdownPillar title="Debt-to-Income" score={breakdown.dti.score} maxScore={25}>Your monthly loan payments are <strong>{breakdown.dti.rate}%</strong> of your income. Lower is better.</BreakdownPillar>
        <BreakdownPillar title="Budget Adherence" score={breakdown.budget.score} maxScore={20}>You spent <strong>{breakdown.budget.adherence}%</strong> of your total budget. Staying under 100% is key.</BreakdownPillar>
        <BreakdownPillar title="Emergency Fund" score={breakdown.emergency.score} maxScore={15}>You have funded <strong>{breakdown.emergency.status}%</strong> of your emergency goal.</BreakdownPillar>
    </div>
  );
  
  const renderAdvisor = () => (
    <div className="flex-grow flex flex-col overflow-hidden">
        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
            {chatHistory.length === 0 && (
                <div className="text-center text-secondary p-4">
                <p>Chat with your AI Advisor or give it a command.</p>
                <p className="text-xs mt-2">Examples: "add expense 50 for coffee", "What's a good savings rate?"</p>
                </div>
            )}
            {chatHistory.map((entry, index) => (
                <div key={index} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-xl max-w-[80%] ${entry.role === 'user' ? 'bg-sky-800/70' : 'bg-subtle'}`}>
                    <p className="text-sm text-primary whitespace-pre-wrap">{entry.parts}</p>
                </div>
                </div>
            ))}
            {isThinking && (
                <div className="flex justify-start">
                <div className="p-3 rounded-xl bg-subtle"><LoadingSpinner /></div>
                </div>
            )}
            <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleChatSubmit} className="flex-shrink-0 p-4 border-t border-divider flex items-center gap-2">
            <textarea 
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(e); } }}
                placeholder="Ask a question or give a command..."
                className="w-full input-base rounded-2xl py-2 px-4 resize-none h-12"
                rows={1} disabled={isThinking} autoFocus
            />
             <button type="button" onClick={handleListen} title="Voice Input" className={`p-3 aspect-square rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-rose-500/50 text-rose-300 animate-pulse' : 'button-secondary'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
            </button>
            <button type="submit" disabled={isThinking || !chatInput.trim()} className="button-primary p-3 aspect-square rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
        </form>
    </div>
  );

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="AI Hub" onClose={onClose} icon="🧠" />
        <div className="flex border-b border-divider flex-shrink-0">
          <TabButton active={activeTab === 'advisor'} onClick={() => setActiveTab('advisor')}>AI Advisor</TabButton>
          <TabButton active={activeTab === 'breakdown'} onClick={() => setActiveTab('breakdown')}>Score Breakdown</TabButton>
        </div>
        {activeTab === 'breakdown' ? renderBreakdown() : renderAdvisor()}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default FinancialHealthModal;