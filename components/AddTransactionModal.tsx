import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import EditTransactionModal from './EditTransactionModal';
import { Transaction, Account, ModalState } from '../types';
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
    const [autoSelectedAccountId, setAutoSelectedAccountId] = useState(selectedAccountId || accounts[0]?.id || '');

    useEffect(() => {
        if (initialText) {
            setText(initialText);
            setActiveTab('auto');
        }
    }, [initialText]);

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
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder='Paste message or Quick Add: "Lunch 500"'
                    className="w-full h-24 p-3 transition-all duration-200 resize-none shadow-inner themed-textarea"
                    disabled={!autoSelectedAccountId}
                    aria-label="Transaction message input"
                    autoFocus
                  />
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