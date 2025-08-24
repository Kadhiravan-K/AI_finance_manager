import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Goal } from '../types';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface EditGoalModalProps {
  goal?: Goal;
  onSave: (goal: Omit<Goal, 'id' | 'currentAmount'>, id?: string) => void;
  onClose: () => void;
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({ goal, onSave, onClose }) => {
  const isCreating = !goal;
  
  const [name, setName] = useState(goal?.name || '');
  const [icon, setIcon] = useState(goal?.icon || '🏆');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount.toString() || '');
  const [productLink, setProductLink] = useState(goal?.productLink || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(targetAmount);
    if (name.trim() && amount > 0) {
      onSave(
        { 
          name: name.trim(), 
          icon: icon.trim() || '🏆', 
          targetAmount: amount, 
          productLink: productLink.trim() || undefined 
        }, 
        goal?.id
      );
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={isCreating ? "Create New Goal" : "Edit Goal"} onClose={onClose} />
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              placeholder="🏆" 
              value={icon} 
              onChange={e => setIcon(e.target.value)} 
              className="w-16 input-base p-2 rounded-md text-center" 
              maxLength={2} 
            />
            <input 
              type="text" 
              placeholder="Goal Name (e.g., New Laptop)" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="flex-grow input-base p-2 rounded-md" 
              required 
              autoFocus={isCreating}
            />
          </div>
          <input 
            type="number" 
            min="0.01" 
            step="0.01" 
            placeholder="Target Amount" 
            value={targetAmount} 
            onChange={e => setTargetAmount(e.target.value)} 
            className="w-full input-base p-2 rounded-md no-spinner" 
            required 
          />
          <input 
            type="text" 
            placeholder="Product Link (Optional)" 
            value={productLink} 
            onChange={e => setProductLink(e.target.value)} 
            className="w-full input-base p-2 rounded-md" 
          />
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2">Save Goal</button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default EditGoalModal;
