import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Category, TransactionType } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';

const modalRoot = document.getElementById('modal-root')!;

interface EditCategoryModalProps {
  category?: Category;
  initialParentId?: string;
  initialType?: TransactionType;
  categories: Category[];
  onSave: (category: Omit<Category, 'id'>, id?: string) => void;
  onCancel: () => void;
}

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ 
  category, 
  initialParentId, 
  initialType, 
  categories, 
  onSave, 
  onCancel 
}) => {
  const isCreating = !category;
  
  const [formData, setFormData] = useState({
    name: category?.name || '',
    icon: category?.icon || '📁',
    type: category?.type || initialType || TransactionType.EXPENSE,
    parentId: category?.parentId || initialParentId || null,
  });

  const handleChange = (name: string, value: string | TransactionType | null) => {
    let newFormData = { ...formData, [name]: value };

    if (name === 'type') {
      newFormData.parentId = null; // Reset parent if type changes
    }
    
    if (name === 'parentId' && value === '') {
        newFormData.parentId = null;
    }

    setFormData(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, category?.id);
    onCancel();
  };

  const parentOptions = useMemo(() => {
    return [
        { value: '', label: 'Make this a Top-Level Category'},
        ...categories
            .filter(c => c.id !== category?.id && c.type === formData.type && !c.parentId)
            .map(c => ({ value: c.id, label: c.name }))
    ];
  }, [categories, formData.type, category?.id]);
  
  const typeOptions = [
      { value: TransactionType.EXPENSE, label: 'Expense' },
      { value: TransactionType.INCOME, label: 'Income' },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider opacity-0 animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <ModalHeader title={isCreating ? "Add Category" : "Edit Category"} onClose={onCancel} />
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-6 gap-3">
             <div className="col-span-1">
              <label htmlFor="icon" className={labelStyle}>Icon</label>
              <input
                type="text"
                id="icon"
                name="icon"
                value={formData.icon || ''}
                onChange={(e) => handleChange('icon', e.target.value)}
                maxLength={2}
                className="input-base w-full rounded-full py-2 px-3 text-center"
              />
            </div>
            <div className="col-span-5">
              <label htmlFor="name" className={labelStyle}>Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="input-base w-full rounded-full py-2 px-3"
              />
            </div>
          </div>
          <div>
            <label className={labelStyle}>Type</label>
            <CustomSelect
                value={formData.type}
                onChange={(v) => handleChange('type', v as TransactionType)}
                options={typeOptions}
                disabled={!!initialParentId}
            />
          </div>
          <div>
            <label className={labelStyle}>Parent Category</label>
            <CustomSelect
                value={formData.parentId || ''}
                onChange={(v) => handleChange('parentId', v)}
                options={parentOptions}
                disabled={!!initialParentId}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="button-secondary px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary px-4 py-2"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default EditCategoryModal;
