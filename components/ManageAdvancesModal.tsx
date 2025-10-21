import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Trip } from '../types';
import ModalHeader from './ModalHeader';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

const modalRoot = document.getElementById('modal-root')!;

interface ManageAdvancesModalProps {
    onClose: () => void;
    trip: Trip;
    onUpdateTrip: (trip: Trip) => void;
}

const ManageAdvancesModal: React.FC<ManageAdvancesModalProps> = ({ onClose, trip, onUpdateTrip }) => {
    const formatCurrency = useCurrencyFormatter(undefined, trip.currency);
    const [advances, setAdvances] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        (trip.advances || []).forEach(adv => {
            initial[adv.contactId] = String(adv.amount);
        });
        return initial;
    });

    const handleAmountChange = (contactId: string, amount: string) => {
        setAdvances(prev => ({ ...prev, [contactId]: amount }));
    };

    const handleSave = () => {
        const newAdvances = Object.entries(advances)
            .map(([contactId, amountStr]) => ({
                contactId,
                amount: parseFloat(amountStr) || 0,
            }))
            .filter(adv => adv.amount > 0);
        
        onUpdateTrip({ ...trip, advances: newAdvances });
        onClose();
    };

    const totalCollected = Object.values(advances).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);

    const modalContent = (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[55] p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title="Manage Advances" onClose={onClose} icon="💰" />
                <div className="flex-grow overflow-y-auto p-6 space-y-3">
                    <p className="text-sm text-secondary">Enter the advance amount collected from each participant for the trip fund.</p>
                    {trip.participants.map(p => (
                        <div key={p.contactId} className="flex items-center justify-between p-2 bg-subtle rounded-lg">
                            <label htmlFor={`adv-${p.contactId}`} className="font-semibold text-primary">{p.name}</label>
                            <input
                                id={`adv-${p.contactId}`}
                                type="number"
                                step="0.01"
                                value={advances[p.contactId] || ''}
                                onChange={e => handleAmountChange(p.contactId, e.target.value)}
                                placeholder="0.00"
                                className="input-base w-28 p-2 rounded-lg text-right no-spinner"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex-shrink-0 p-4 border-t border-divider flex justify-between items-center">
                    <div>
                        <span className="text-sm text-secondary">Total Collected:</span>
                        <span className="font-bold text-lg text-primary ml-2">{formatCurrency(totalCollected)}</span>
                    </div>
                    <button onClick={handleSave} className="button-primary px-4 py-2">Save Advances</button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ManageAdvancesModal;