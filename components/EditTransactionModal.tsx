import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Transaction, TransactionType, Account, Category, Payee } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';

interface EditTransactionModalProps {
  transaction: Transaction;
  onSave: (transaction: Transaction) => void;
  onCancel: () => void;
  accounts: Account[];
}

const inputStyle = "w-full bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner shadow-slate-900/50 transition-all duration-200";
const labelStyle = "block text-sm font-medium text-slate-400 mb-1";
const primaryButtonStyle = "px-4 py-2 rounded-lg text-white font-semibold bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-200 transform active:scale-[0.98] disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed";
const secondaryButtonStyle = "px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600/80 transition-colors";

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, onSave, onCancel, accounts }) => {
  const { categories, payees, setPayees } = useContext(SettingsContext);
  const [formData, setFormData] = useState<Transaction>(transaction);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const formatCurrency = useCurrencyFormatter({currencyDisplay: 'narrowSymbol', minimumFractionDigits: 0});

  useEffect(() => {
    setFormData(transaction);
    const initialCategory = categories.find(c => c.id === transaction.categoryId);
    if (initialCategory) {
      setSelectedParentId(initialCategory.parentId || initialCategory.id);
    } else {
      setSelectedParentId(null);
    }
  }, [transaction, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let newFormData = { ...formData };

    if (name === 'amount') {
        newFormData.amount = parseFloat(value);
    } else if (name === 'date') {
        newFormData.date = new Date(value).toISOString();
    } else {
        newFormData = { ...newFormData, [name]: value };
    }
    
    if (name === 'type') {
        setSelectedParentId(null);
        newFormData.categoryId = '';
    }
    
    setFormData(newFormData);
  };
  
  const handleParentCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const parentId = e.target.value;
      setSelectedParentId(parentId);
      
      const subCategories = categories.filter(c => c.parentId === parentId);
      setFormData(prev => ({
          ...prev,
          categoryId: subCategories.length > 0 ? '' : parentId,
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const handleSavePayee = () => {
      if (!formData.payeeIdentifier) return;

      const newPayee: Payee = {
          id: self.crypto.randomUUID(),
          identifier: formData.payeeIdentifier,
          name: formData.description,
          defaultCategoryId: formData.categoryId,
      };
      setPayees(prev => [...prev, newPayee]);
      // Maybe show a success message
  };

  const isPayeeSaved = useMemo(() => {
    if (!formData.payeeIdentifier) return true; // No identifier, so nothing to save
    return payees.some(p => p.identifier.toLowerCase() === formData.payeeIdentifier?.toLowerCase());
  }, [payees, formData.payeeIdentifier]);
  
  const parentCategories = useMemo(() => {
      return categories.filter(c => c.type === formData.type && c.parentId === null);
  }, [categories, formData.type]);
  
  const subCategories = useMemo(() => {
      if (!selectedParentId) return [];
      return categories.filter(c => c.parentId === selectedParentId);
  }, [categories, selectedParentId]);


  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="glass-card rounded-xl shadow-2xl w-full max-w-md border border-slate-700/50 opacity-0 animate-scaleIn flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <ModalHeader title="Edit Transaction" onClose={onCancel} />
        <form onSubmit={handleSubmit} className="space-y-4 p-6 overflow-y-auto">
          <div>
            <label htmlFor="description" className={labelStyle}>Description</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>
          {formData.payeeIdentifier && (
              <div className="p-2 bg-slate-700/50 rounded-lg flex items-center justify-between text-sm">
                  <span className="text-slate-400">Identifier: <code className="text-slate-300">{formData.payeeIdentifier}</code></span>
                  <button type="button" onClick={handleSavePayee} disabled={isPayeeSaved} className="text-xs px-2 py-1 bg-emerald-600/50 text-emerald-200 rounded-md hover:bg-emerald-600 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed">
                      {isPayeeSaved ? 'Saved' : 'Save Payee'}
                  </button>
              </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className={labelStyle}>Amount ({formatCurrency(0).replace(/[\d\s.,]/g, '')})</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                className={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="date" className={labelStyle}>Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date.split('T')[0]}
                onChange={handleChange}
                className={inputStyle}
              />
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="parentCategory" className={labelStyle}>Category</label>
              <select
                id="parentCategory"
                name="parentCategory"
                value={selectedParentId || ''}
                onChange={handleParentCategoryChange}
                className={inputStyle}
              >
                <option value="" disabled>Select Category</option>
                {parentCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="categoryId" className={labelStyle}>Subcategory</label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                disabled={subCategories.length === 0}
                className={`${inputStyle} disabled:bg-slate-700/50 disabled:cursor-not-allowed`}
              >
                <option value={selectedParentId || ''} disabled={subCategories.length > 0}>-</option>
                {subCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="notes" className={labelStyle}>Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={2}
              className={`${inputStyle} resize-none`}
            />
          </div>
          <div>
              <label htmlFor="type" className={labelStyle}>Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={inputStyle}
              >
                <option value={TransactionType.EXPENSE}>Expense</option>
                <option value={TransactionType.INCOME}>Income</option>
              </select>
            </div>
          <div>
              <label htmlFor="accountId" className={labelStyle}>Account</label>
              <select
                id="accountId"
                name="accountId"
                value={formData.accountId}
                onChange={handleChange}
                className={inputStyle}
              >
                {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700/50 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className={secondaryButtonStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.categoryId}
              className={primaryButtonStyle}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;