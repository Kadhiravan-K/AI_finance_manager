import React, { useState, useMemo } from 'react';
import { Category, TransactionType } from '../types';

interface EditCategoryModalProps {
  category: Category;
  categories: Category[];
  onSave: (category: Category) => void;
  onCancel: () => void;
}

const inputStyle = "w-full bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner shadow-slate-900/50 transition-all duration-200";
const labelStyle = "block text-sm font-medium text-slate-400 mb-1";
const primaryButtonStyle = "px-4 py-2 rounded-lg text-white font-semibold bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-200 transform active:scale-[0.98] disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed";
const secondaryButtonStyle = "px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600/80 transition-colors";

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ category, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Category>(category);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let newFormData = { ...formData, [name]: value };

    if (name === 'type') {
      // If type changes, parent is no longer valid
      newFormData.parentId = null;
    }
    
    if(name === 'parentId' && value === '') {
        newFormData.parentId = null;
    }

    setFormData(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const parentOptions = useMemo(() => {
    // Cannot be its own parent
    return categories.filter(c => c.id !== formData.id && c.type === formData.type && !c.parentId);
  }, [categories, formData.type, formData.id]);

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-700/50 opacity-0 animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-6">Edit Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-6 gap-3">
             <div className="col-span-1">
              <label htmlFor="icon" className={labelStyle}>Icon</label>
              <input
                type="text"
                id="icon"
                name="icon"
                value={formData.icon || ''}
                onChange={handleChange}
                maxLength={2}
                className={`${inputStyle} text-center`}
              />
            </div>
            <div className="col-span-5">
              <label htmlFor="name" className={labelStyle}>Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputStyle}
              />
            </div>
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
            <label htmlFor="parentId" className={labelStyle}>Parent Category</label>
            <select
              id="parentId"
              name="parentId"
              value={formData.parentId || ''}
              onChange={handleChange}
              className={inputStyle}
            >
              <option value="">Make this a Top-Level Category</option>
              {parentOptions.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className={secondaryButtonStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
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

export default EditCategoryModal;