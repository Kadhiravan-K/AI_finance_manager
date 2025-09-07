import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { InvestmentHolding } from '../types';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface UpdateInvestmentModalProps {
  onClose: () => void;
  onSave: (holdingId: string, newCurrentValue: number) => void;
  holding: InvestmentHolding;
}

const UpdateInvestmentModal: React.FC<UpdateInvestmentModalProps> = ({ onClose, onSave, holding }) => {
  const [currentValue, setCurrentValue] = useState(holding.currentValue.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(holding.id, parseFloat(currentValue));
    onClose();
  };

  const labelStyle = "block text-sm font-medium text-secondary mb-1";

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-sm p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={`Update ${holding.name}`} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className={labelStyle}>New Total Value</label>
                <input type="number" step="0.01" value={currentValue} onWheel={e => e.currentTarget.blur()} onChange={e => setCurrentValue(e.target.value)} placeholder="0.00" className="input-base w-full rounded-lg py-2 px-3 no-spinner" required autoFocus />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                <button type="submit" className="button-primary px-4 py-2">Update Value</button>
            </div>
        </form>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default UpdateInvestmentModal;