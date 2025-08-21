import React, { useState } from 'react';
import { Payee, Category } from '../types';

interface PayeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  payees: Payee[];
  setPayees: React.Dispatch<React.SetStateAction<Payee[]>>;
  categories: Category[];
}

const PayeesModal: React.FC<PayeesModalProps> = ({ isOpen, onClose, payees, setPayees, categories }) => {
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

  const handleDelete = (id: string) => {
    setPayees(prev => prev.filter(p => p.id !== id));
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


  if (!isOpen) return null;

  return (
    <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] flex flex-col border border-slate-700/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white">Manage Payees</h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto pr-2 space-y-2 mb-4">
        {payees.map(payee => (
          <div key={payee.id} className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">{payee.name}</p>
              <p className="text-xs text-slate-400">ID: {payee.identifier} &rarr; {getCategoryPath(payee.defaultCategoryId)}</p>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(payee)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-md">Edit</button>
              <button onClick={() => handleDelete(payee.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-md">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex-shrink-0 pt-4 border-t border-slate-700 space-y-3">
        <h3 className="font-semibold">{editingPayee ? 'Edit Payee' : 'Add New Payee'}</h3>
        <input type="text" placeholder="Name (e.g., Coffee Shop)" value={formState.name} onChange={e => setFormState(p => ({...p, name: e.target.value}))} className="w-full bg-slate-700/80 p-2 rounded-md" required />
        <input type="text" placeholder="Unique Identifier (UPI, A/C No.)" value={formState.identifier} onChange={e => setFormState(p => ({...p, identifier: e.target.value}))} className="w-full bg-slate-700/80 p-2 rounded-md" required />
        <select value={formState.defaultCategoryId} onChange={e => setFormState(p => ({...p, defaultCategoryId: e.target.value}))} className="w-full bg-slate-700/80 p-2 rounded-md" required>
            <option value="" disabled>Select Default Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{getCategoryPath(c.id)} ({c.type})</option>)}
        </select>
        <div className="flex justify-end space-x-2">
          {editingPayee && <button type="button" onClick={handleCancel} className="px-4 py-2 rounded-lg bg-slate-600">Cancel</button>}
          <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600">{editingPayee ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
};

export default PayeesModal;