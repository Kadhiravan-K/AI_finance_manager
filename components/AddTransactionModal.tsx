import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import QuickAddForm from './PromptForm';
import EditTransactionModal from './EditTransactionModal';
import { Transaction, Account, ModalState } from '../types';

const modalRoot = document.getElementById('modal-root')!;

interface AddTransactionModalProps {
    onCancel: () => void;
    onSaveAuto: (text: string) => Promise<void>;
    onSaveManual: (data: Transaction | { 
      action: 'split-and-replace';
      originalTransactionId: string;
      newTransactions: Omit<Transaction, 'id'>[];
    }) => void;
    isDisabled: boolean;
    initialText?: string | null;
    accounts: Account[];
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
    accounts,
    openModal,
    onOpenCalculator,
    selectedAccountId,
}) => {
    const [activeTab, setActiveTab] = useState<'auto' | 'manual'>(initialText ? 'auto' : 'manual');
    const [text, setText] = useState(initialText || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleAutoSubmit = async () => {
        setIsLoading(true);
        await onSaveAuto(text);
        setIsLoading(false);
    };

    const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
        <button
            type="button"
            onClick={onClick}
            className={`w-full py-2 px-4 text-sm font-semibold rounded-t-lg transition-colors focus:outline-none ${
                active ? 'bg-subtle text-primary border-b-2 border-emerald-500' : 'text-secondary hover:bg-subtle'
            }`}
        >
            {children}
        </button>
    );

    if (activeTab === 'manual') {
        return (
            <EditTransactionModal
                onSave={onSaveManual}
                onCancel={onCancel}
                accounts={accounts}
                openModal={openModal}
                onOpenCalculator={onOpenCalculator}
                selectedAccountId={selectedAccountId}
            />
        );
    }
    
    // activeTab is 'auto', render the quick add modal
    const modalContent = (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel}>
             <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-6 border border-divider opacity-0 animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-primary">Add Transaction</h2>
                    <button onClick={onCancel} className="p-2 -mr-2 text-secondary hover:text-primary rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex border-b border-divider mb-4">
                    <TabButton active={true} onClick={() => {}}>🤖 Automatic (AI Parse)</TabButton>
                    <TabButton active={false} onClick={() => setActiveTab('manual')}>✍️ Manual Entry</TabButton>
                </div>
                <QuickAddForm
                    text={text}
                    setText={setText}
                    onSubmit={handleAutoSubmit}
                    isLoading={isLoading}
                    isDisabled={isDisabled}
                    disabledReason={isDisabled ? "Select a single account to add a transaction" : undefined}
                />
            </div>
        </div>
    );
    
    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AddTransactionModal;
