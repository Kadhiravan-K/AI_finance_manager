import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Transaction, Contact } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';
import { SettingsContext } from '../contexts/SettingsContext';
import { USER_SELF_ID } from '../constants';
import CustomCheckbox from './CustomCheckbox';

interface SplitTransactionModalProps {
  transaction: Transaction;
  onSave: (transactionId: string, splits: { personName: string; amount: number }[]) => void;
  onCancel: () => void;
  items?: { id: string, description: string, amount: string }[];
}

interface Participant {
  id: string; // contactId
  name: string;
  amount: number;
}

interface ItemParticipant {
    itemId: string;
    contactId: string;
}

const SplitTransactionModal: React.FC<SplitTransactionModalProps> = ({ transaction, onSave, onCancel, items }) => {
  const formatCurrency = useCurrencyFormatter();
  const { contacts } = useContext(SettingsContext);
  
  const allParticipants = useMemo(() => [
    { id: USER_SELF_ID, name: 'You', groupId: '' },
    ...contacts
  ], [contacts]);

  const [itemAssignments, setItemAssignments] = useState<ItemParticipant[]>(() => {
    if (!items) return [];
    // Initially, assign all items to 'You'
    return items.map(item => ({ itemId: item.id, contactId: USER_SELF_ID }));
  });

  const participantTotals = useMemo(() => {
    const totals = new Map<string, number>();
    allParticipants.forEach(p => totals.set(p.id, 0));

    if (items) {
        items.forEach(item => {
            const itemAmount = parseFloat(item.amount) || 0;
            const assignees = itemAssignments.filter(a => a.itemId === item.id);
            if (assignees.length > 0) {
                const splitAmount = itemAmount / assignees.length;
                assignees.forEach(assignee => {
                    totals.set(assignee.contactId, (totals.get(assignee.contactId) || 0) + splitAmount);
                });
            }
        });
    } else {
        // Fallback for non-itemized transactions: split total equally
        const participantsInSplit = allParticipants.filter(p => itemAssignments.some(a => a.contactId === p.id && a.itemId === 'total'));
        if (participantsInSplit.length > 0) {
            const splitAmount = transaction.amount / participantsInSplit.length;
            participantsInSplit.forEach(p => totals.set(p.id, splitAmount));
        }
    }
    
    return Array.from(totals.entries())
        .map(([id, amount]) => ({ id, name: allParticipants.find(p => p.id === id)!.name, amount }))
        .filter(p => p.amount > 0.005); // Filter out zero/tiny amounts

  }, [items, itemAssignments, transaction.amount, allParticipants]);
  
  const handleAssignmentToggle = (itemId: string, contactId: string) => {
    setItemAssignments(prev => {
        const isAssigned = prev.some(a => a.itemId === itemId && a.contactId === contactId);
        if (isAssigned) {
            return prev.filter(a => !(a.itemId === itemId && a.contactId === contactId));
        } else {
            return [...prev, { itemId, contactId }];
        }
    });
  };

  const totalAssigned = useMemo(() => participantTotals.reduce((sum, p) => sum + p.amount, 0), [participantTotals]);
  const isSaveDisabled = Math.abs(totalAssigned - transaction.amount) > 0.01;

  const handleSubmit = () => {
    if (isSaveDisabled) return;
    const finalSplits = participantTotals.map(p => ({ personName: p.name, amount: p.amount }));
    onSave(transaction.id, finalSplits);
  };
  
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Split Expense" onClose={onCancel} icon="➗" />
        
        <div className="p-6 text-center border-b border-divider">
            <p className="text-secondary text-sm">Total Amount</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(transaction.amount)}</p>
            <p className="text-secondary text-sm truncate">{transaction.description}</p>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
            {items && items.length > 0 ? (
                <div className="space-y-3">
                    <h3 className="font-semibold text-primary">Assign Items to People</h3>
                    {items.map(item => (
                        <div key={item.id} className="p-3 bg-subtle rounded-lg">
                            <div className="flex justify-between font-medium">
                                <span>{item.description}</span>
                                <span>{formatCurrency(parseFloat(item.amount) || 0)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                                {allParticipants.map(p => (
                                    <CustomCheckbox
                                        key={p.id}
                                        id={`${item.id}-${p.id}`}
                                        label={p.name}
                                        checked={itemAssignments.some(a => a.itemId === item.id && a.contactId === p.id)}
                                        onChange={() => handleAssignmentToggle(item.id, p.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-sm text-center text-secondary">No items to assign. Splits will be calculated equally for the total amount.</p>
            )}
        </div>
        
        <div className="p-4 border-t border-divider flex-shrink-0 space-y-3">
            <h3 className="font-semibold text-primary">Final Split</h3>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-2">
                {participantTotals.map(p => (
                    <div key={p.id} className="flex justify-between text-sm">
                        <span>{p.name} owes</span>
                        <span className="font-mono">{formatCurrency(p.amount)}</span>
                    </div>
                ))}
            </div>
             <div className="flex justify-between text-sm font-semibold pt-2 border-t border-divider">
                <span>Total Assigned:</span>
                <span className={`font-mono ${isSaveDisabled ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(totalAssigned)}</span>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <button onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
                <button onClick={handleSubmit} disabled={isSaveDisabled} className="button-primary px-4 py-2">Save Split</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SplitTransactionModal;
