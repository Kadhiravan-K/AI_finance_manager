
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import EditTransactionModal from './EditTransactionModal';
import { Transaction, Account, ModalState, Contact } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import LoadingSpinner from './LoadingSpinner';

const modalRoot = document.getElementById('modal-root')!;

interface AddTransactionModalProps {
    onCancel: () => void;
    onSaveAuto: (text: string, accountId?: string) => Promise<void>;
    onSaveManual: (data: Transaction | { 
      action: 'split-and-replace';
      originalTransactionId: string;
      newTransactions: Omit<Transaction, 'id'>[];
    }) => void;
    isDisabled: boolean;
    initialText?: string | null;
    onInitialTextConsumed?: () => void;
    initialTab?: 'auto' | 'manual';
    accounts: Account[];
    contacts: Contact[];
    openModal: (name: ModalState['name'], props?: Record<string, any>) => void;
    onOpenCalculator: (onResult: (result: number) => void) => void;
    selectedAccountId?: string;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
    onCancel,
    onSaveAuto,
    onSaveManual,
    isDisabled,
    initialText,
    onInitialTextConsumed,
    initialTab,
    accounts,
    contacts,
    openModal,
    onOpenCalculator,
    selectedAccountId,
}) => {
    const [activeTab, setActiveTab] = useState<'auto' | 'manual'>(initialTab || 'auto');
    const [text, setText] = useState(initialText || '');
    const [isLoading, setIsLoading] = useState(false);
    const [autoSelectedAccountId, setAutoSelectedAccountId] = useState(selectedAccountId || accounts[0]?.id || '');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any | null>(null);

    useEffect(() => {
        if (initialText) {
            setText(initialText);
            setActiveTab('auto');
            if (onInitialTextConsumed) {
                onInitialTextConsumed();
            }
        }
    }, [initialText, onInitialTextConsumed]);
    
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
            setText(prev => prev ? `${prev} ${transcript}` : transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            // The new permission check should prevent 'not-allowed', but this is a good fallback.
            if (event.error !== 'no-speech') {
              console.error('Speech recognition error:', event.error);
            }
            setIsListening(false);
        };
        
        recognitionRef.current = recognition;
    }, []);

    const handleListen = async () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported by your browser.");
            return;
        }
        
        // Check for microphone permission
        try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            if (permissionStatus.state === 'denied') {
                alert("Microphone access is denied. Please enable it in your browser settings to use voice input.");
                return;
            }
            
            // permissionStatus.state is 'granted' or 'prompt'
            if (isListening) {
                recognitionRef.current.stop();
            } else {
                recognitionRef.current.start();
                setIsListening(true);
            }
        } catch (error) {
            console.error("Could not check microphone permission:", error);
            alert("Could not access microphone. Please ensure you are on a secure (HTTPS) connection.");
        }
    };

    const handleAutoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onSaveAuto(text, autoSelectedAccountId);
        setIsLoading(false);
    };

    const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
        <button
            type="button"
            onClick={onClick}
            className={`w-full py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${
                active ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary'
            }`}
        >
            {children}
        </button>
    );
    
    const accountOptions = accounts.map(account => ({ value: account.id, label: account.name }));
    
    const modalContent = (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg border border-divider opacity-0 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <ModalHeader title="Add Transaction" onClose={onCancel} />
            <div className="flex border-b border-divider flex-shrink-0">
              <TabButton active={activeTab === 'auto'} onClick={() => setActiveTab('auto')}>🤖 Automatic (AI Parse)</TabButton>
              <TabButton active={activeTab === 'manual'} onClick={() => setActiveTab('manual')}>✍️ Manual Entry</TabButton>
            </div>
            
            {activeTab === 'auto' ? (
                <form onSubmit={handleAutoSubmit} className="p-6 space-y-4">
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-secondary mb-1">Save to Account</label>
                    <CustomSelect
                      value={autoSelectedAccountId}
                      onChange={setAutoSelectedAccountId}
                      options={accountOptions}
                      placeholder="Select an account"
                    />
                  </div>
                  <div className="relative">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder='Paste message or Quick Add: "Lunch 500"'
                        className="w-full h-24 p-3 pr-12 transition-all duration-200 resize-none shadow-inner themed-textarea"
                        disabled={!autoSelectedAccountId}
                        aria-label="Transaction message input"
                        autoFocus
                    />
                    <button type="button" onClick={handleListen} title="Voice Input" className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${isListening ? 'bg-rose-500/50 text-rose-300 animate-pulse' : 'bg-subtle hover:bg-card-hover'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                    </button>
                  </div>
                  <div className="p-3 bg-subtle rounded-lg flex items-start gap-3">
                    <div className="text-2xl pt-1">💡</div>
                    <div>
                        <h4 className="font-semibold text-primary">Pro Tip</h4>
                        <p className="text-xs text-secondary">
                          Use the 'Share' feature in your SMS or payment app to send transaction details directly here.
                          <button type="button" onClick={() => openModal('shareGuide')} className="text-xs text-sky-400 hover:text-sky-300 font-semibold ml-1">See How</button>
                        </p>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!autoSelectedAccountId || !text.trim()}
                    className="button-primary w-full flex items-center justify-center font-bold py-3 px-4"
                  >
                    {isLoading ? <LoadingSpinner /> : 'Quick Add'}
                  </button>
                </form>
            ) : (
                <EditTransactionModal
                   isEmbedded={true}
                   onSave={onSaveManual}
                   onCancel={onCancel}
                   accounts={accounts}
                   contacts={contacts}
                   openModal={openModal}
                   onOpenCalculator={onOpenCalculator}
                   selectedAccountId={selectedAccountId}
                />
            )}
        </div>
      </div>
    );
    
    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AddTransactionModal;
