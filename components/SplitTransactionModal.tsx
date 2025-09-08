import React, { useState, useEffect, useMemo } from 'react';
import { Transaction } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';

interface SplitTransactionModalProps {
  transaction: Transaction;
  onSave: (transactionId: string, splits: { personName: string; amount: number }[]) => void;
  onCancel: () => void;
}

type SplitMode = 'equally' | 'percentage' | 'shares' | 'manual';

interface Participant {
  id: string;
  name: string;
  amount: number;
  percentage: string;
  shares: string;
}

const SplitTransactionModal: React.FC<SplitTransactionModalProps> = ({ transaction, onSave, onCancel }) => {
  const formatCurrency = useCurrencyFormatter();
  const [mode, setMode] = useState<SplitMode>('equally');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  
  useEffect(() => {
    // Initialize with "You" as the first participant
    setParticipants([{ id: 'you', name: 'You', amount: 0, percentage: '100', shares: '1' }]);
  }, [transaction]);

  useEffect(() => {
    // Recalculate whenever mode or participants change
    const totalAmount = transaction.amount;
    let newParticipants = [...participants];
    const numParticipants = newParticipants.length;

    switch (mode) {
      case 'equally':
        const splitAmount = numParticipants > 0 ? totalAmount / numParticipants : 0;
        newParticipants = newParticipants.map(p => ({ ...p, amount: splitAmount }));
        break;
      case 'percentage':
        let totalPercentage = newParticipants.reduce((sum, p) => sum + (parseFloat(p.percentage) || 0), 0);
        newParticipants = newParticipants.map(p => {
            const percentage = parseFloat(p.percentage) || 0;
            const amount = totalPercentage > 0 ? (percentage / totalPercentage) * totalAmount : 0;
            return { ...p, amount };
        });
        break;
      case 'shares':
        let totalShares = newParticipants.reduce((sum, p) => sum + (parseFloat(p.shares) || 0), 0);
        newParticipants = newParticipants.map(p => {
            const shares = parseFloat(p.shares) || 0;
            const amount = totalShares > 0 ? (shares / totalShares) * totalAmount : 0;
            return { ...p, amount };
        });
        break;
      case 'manual':
        // In manual mode, amounts are controlled by user input, so we don't recalculate them here.
        break;
    }
    setParticipants(newParticipants);
  }, [mode, participants.length, transaction.amount]);

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName.trim()) {
      setParticipants(prev => [...prev, {
        id: self.crypto.randomUUID(),
        name: newPersonName.trim(),
        amount: 0,
        percentage: '',
        shares: '1',
      }]);
      setNewPersonName('');
    }
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };
  
  const handleParticipantChange = (id: string, field: 'percentage' | 'shares' | 'amount', value: string) => {
    let newParticipants = participants.map(p => p.id === id ? { ...p, [field]: value } : p);

    const totalAmount = transaction.amount;

    if (mode === 'percentage') {
        let totalPercentage = newParticipants.reduce((sum, p) => sum + (parseFloat(p.percentage) || 0), 0);
         newParticipants = newParticipants.map(p => {
            const percentage = parseFloat(p.percentage) || 0;
            const amount = totalPercentage > 0 ? (percentage / totalPercentage) * totalAmount : 0;
            return { ...p, amount };
        });
    } else if (mode === 'shares') {
        let totalShares = newParticipants.reduce((sum, p) => sum + (parseFloat(p.shares) || 0), 0);
        newParticipants = newParticipants.map(p => {
            const shares = parseFloat(p.shares) || 0;
            const amount = totalShares > 0 ? (shares / totalShares) * totalAmount : 0;
            return { ...p, amount };
        });
    } else if (mode === 'manual') {
        const changedParticipant = newParticipants.find(p => p.id === id);
        if(changedParticipant) changedParticipant.amount = parseFloat(value) || 0;
    }
    
    setParticipants(newParticipants);
  };

  const totalAssigned = useMemo(() => participants.reduce((sum, p) => sum + p.amount, 0), [participants]);
  const isSaveDisabled = Math.abs(totalAssigned - transaction.amount) > 0.01; // Allow for small floating point discrepancies

  const handleSubmit = () => {
    if (isSaveDisabled) return;
    onSave(transaction.id, participants.map(({ name, amount }) => ({ personName: name, amount })));
  };

  const TabButton = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void}) => (
    <button onClick={onClick} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex-grow ${active ? 'bg-emerald-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-slate-700/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Split Expense" onClose={onCancel} icon="➗" />
        
        <div className="p-6 text-center border-b border-slate-700/50">
            <p className="text-slate-400 text-sm">Total Amount</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(transaction.amount)}</p>
            <p className="text-slate-300 text-sm truncate">{transaction.description}</p>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg mb-4">
                <TabButton active={mode === 'equally'} onClick={() => setMode('equally')}>Equally</TabButton>
                <TabButton active={mode === 'percentage'} onClick={() => setMode('percentage')}>%</TabButton>
                <TabButton active={mode === 'shares'} onClick={() => setMode('shares')}>Shares</TabButton>
                <TabButton active={mode === 'manual'} onClick={() => setMode('manual')}>Manual</TabButton>
            </div>
            <div className="space-y-2">
                {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg">
                        <span className="font-semibold flex-grow truncate">{p.name}</span>
                        {mode === 'percentage' && <input type="number" onWheel={e => e.currentTarget.blur()} value={p.percentage} onBlur={() => handleParticipantChange(p.id, 'percentage', p.percentage)} onChange={e => setParticipants(parts => parts.map(part => part.id === p.id ? {...part, percentage: e.target.value} : part))} className="w-16 bg-slate-800 p-1 rounded-md text-center no-spinner" placeholder="%" />}
                        {mode === 'shares' && <input type="number" onWheel={e => e.currentTarget.blur()} value={p.shares} onBlur={() => handleParticipantChange(p.id, 'shares', p.shares)} onChange={e => setParticipants(parts => parts.map(part => part.id === p.id ? {...part, shares: e.target.value} : part))} className="w-16 bg-slate-800 p-1 rounded-md text-center no-spinner" placeholder="sh." />}
                        {mode === 'manual' ? 
                            <input type="number" onWheel={e => e.currentTarget.blur()} value={p.amount || ''} onChange={e => handleParticipantChange(p.id, 'amount', e.target.value)} className="w-24 bg-slate-800 p-1 rounded-md text-right no-spinner" />
                            :
                            <span className="w-24 text-right font-mono">{formatCurrency(p.amount)}</span>
                        }
                        {p.id !== 'you' && (
                           <button onClick={() => handleRemoveParticipant(p.id)} className="w-7 h-7 flex items-center justify-center text-rose-400 flex-shrink-0 hover:bg-rose-500/10 rounded-full">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                        )}
                    </div>
                ))}
            </div>
             <form onSubmit={handleAddParticipant} className="flex items-center gap-2 mt-4">
                <input type="text" value={newPersonName} onChange={e => setNewPersonName(e.target.value)} placeholder="Add person..." className="flex-grow bg-slate-700/80 p-2 rounded-md border border-slate-600"/>
                <button type="submit" className="px-4 py-2 rounded-lg bg-sky-600 font-semibold text-sm">Add</button>
            </form>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-slate-700 space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-semibold">Total Assigned:</span>
                <span className={`font-mono ${isSaveDisabled ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(totalAssigned)}</span>
            </div>
             <div className="flex justify-between text-sm">
                <span className="font-semibold">Remaining:</span>
                <span className="font-mono">{formatCurrency(transaction.amount - totalAssigned)}</span>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-600">Cancel</button>
                <button onClick={handleSubmit} disabled={isSaveDisabled} className="px-4 py-2 rounded-lg bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed">Save Split</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SplitTransactionModal;