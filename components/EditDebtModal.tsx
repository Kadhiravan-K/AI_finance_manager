import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Debt } from '../types';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface EditDebtModalProps {
    debt?: Debt;
    onSave: (debtData: Omit<Debt, 'id' | 'currentBalance'>, id?: string) => void;
    onClose: () => void;
}

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const EditDebtModal: React.FC<EditDebtModalProps> = ({ debt, onSave, onClose }) => {
    const isEditing = !!debt;
    const [formData, setFormData] = useState({
        name: debt?.name || '',
        totalAmount: debt?.totalAmount.toString() || '',
        minimumPayment: debt?.minimumPayment.toString() || '',
        apr: debt?.apr.toString() || '',
    });

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const totalAmount = parseFloat(formData.totalAmount);
        const minimumPayment = parseFloat(formData.minimumPayment);
        const apr = parseFloat(formData.apr);

        if (formData.name && totalAmount > 0 && minimumPayment > 0 && apr >= 0) {
            onSave({
                name: formData.name,
                totalAmount,
                minimumPayment,
                apr,
            }, debt?.id);
            onClose();
        } else {
            alert("Please fill all fields with valid numbers.");
        }
    };

    const modalContent = (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title={isEditing ? 'Edit Debt' : 'Add New Debt'} onClose={onClose} />
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className={labelStyle}>Debt Name</label>
                        <input id="name" type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g., Visa Credit Card" className="input-base w-full p-2 rounded-lg" required autoFocus />
                    </div>
                    <div>
                        <label htmlFor="totalAmount" className={labelStyle}>Current Balance</label>
                        <input id="totalAmount" type="number" step="0.01" value={formData.totalAmount} onChange={e => handleChange('totalAmount', e.target.value)} className="input-base w-full p-2 rounded-lg no-spinner" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="minimumPayment" className={labelStyle}>Minimum Payment</label>
                            <input id="minimumPayment" type="number" step="0.01" value={formData.minimumPayment} onChange={e => handleChange('minimumPayment', e.target.value)} className="input-base w-full p-2 rounded-lg no-spinner" required />
                        </div>
                        <div>
                            <label htmlFor="apr" className={labelStyle}>Interest Rate (APR %)</label>
                            <input id="apr" type="number" step="0.01" value={formData.apr} onChange={e => handleChange('apr', e.target.value)} className="input-base w-full p-2 rounded-lg no-spinner" required />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                        <button type="submit" className="button-primary px-4 py-2">Save Debt</button>
                    </div>
                </form>
            </div>
        </div>
    );
    
    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default EditDebtModal;
