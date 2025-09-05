import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Payee, Category } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';

const modalRoot = document.getElementById('modal-root')!;

interface PayeesModalProps {
  onClose: () => void;
  payees: Payee[];
  setPayees: React.Dispatch<React.SetStateAction<Payee[]>>;
  categories: Category[];
  onDelete: (id: string) => void;
}

const PayeesModal: React.FC<PayeesModalProps> = ({ onClose, payees, setPayees, categories, onDelete }) => {
  const [editingPayee, setEditingPayee] = useState<Payee | null>(null);
  const [formState, setFormState] = useState<Omit<Payee, 'id'>>({ identifier: '', name: '', defaultCategoryId: '' });

  const handleEdit = (payee: Payee) => {
    setEditingPayee(payee);
    setFormState({ identifier: payee.identifier, name: payee.name, defaultCategoryId: payee.defaultCategoryId });
  };

  const handleCancel = () => {
    setEditingPayee(null);
    setFormState({ identifier: '', name: '', defaultCategoryId: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPayee) {
      setPayees(prev => prev.map(p => p.id === editingPayee.id ? { ...formState, id: p.id } : p));
    } else {
      setPayees(prev => [...prev, { ...formState, id: self.crypto.randomUUID() }]);
    }
    handleCancel();
  };

  const getCategoryPath = (categoryId: string): string => {
    const path: string[] = [];
    let current = categories.find(c => c.id === categoryId);
    while (current) {
        path.unshift(current.name);
        current = categories.find(c => c.id === current.parentId);
    }
    return path.join(' / ') || 'Uncategorized';
  };
  
  const categoryOptions = categories.map(c => ({ value: c.id, label: `${getCategoryPath(c.id)} (${c.type})` }));

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Manage Payees" onClose={onClose} icon="🏢" />
        
        <div className="flex-grow overflow-y-auto p-6 space-y-2">
            {payees.map(payee => (
            <div key={payee.id} className="p-3 bg-subtle rounded-lg flex items-center justify-between">
                <div>
                <p className="font-semibold text-primary">{payee.name}</p>
                <p className="text-xs text-secondary">ID: {payee.identifier} &rarr; {getCategoryPath(payee.defaultCategoryId)}</p>
                </div>
                <div className="space-x-2">
                <button onClick={() => handleEdit(payee)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                <button onClick={() => onDelete(payee.id)} className="text-xs px-2 py-1 text-rose-400 hover:bg-rose-500/20 rounded-full transition-colors">Delete</button>
                </div>
            </div>
            ))}
            {payees.length === 0 && <p className="text-center text-secondary py-8">No payees saved yet.</p>}
        </div>

        <form onSubmit={handleSubmit} className="flex-shrink-0 p-6 border-t border-divider space-y-3 bg-subtle rounded-b-xl">
            <h3 className="font-semibold text-primary">{editingPayee ? 'Edit Payee' : 'Add New Payee'}</h3>
            <input type="text" placeholder="Name (e.g., Coffee Shop)" value={formState.name} onChange={e => setFormState(p => ({...p, name: e.target.value}))} className="w-full input-base p-2 rounded-full" required autoFocus={!!editingPayee} />
            <input type="text" placeholder="Unique Identifier (UPI, A/C No.)" value={formState.identifier} onChange={e => setFormState(p => ({...p, identifier: e.target.value}))} className="w-full input-base p-2 rounded-full" required />
            <CustomSelect 
            value={formState.defaultCategoryId}
            onChange={value => setFormState(p => ({...p, defaultCategoryId: value}))}
            options={categoryOptions}
            placeholder="Select Default Category"
            />
            <div className="flex justify-end space-x-2">
            {editingPayee && <button type="button" onClick={handleCancel} className="button-secondary px-4 py-2">Cancel</button>}
            <button type="submit" className="button-primary px-4 py-2">{editingPayee ? 'Save' : 'Add'}</button>
            </div>
        </form>
        </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default PayeesModal;