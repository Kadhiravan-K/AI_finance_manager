import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Category, TransactionType } from '../types';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface CategoryManagerModalProps {
  onClose: () => void;
  categories: Category[];
  onAddNewCategory: (category: Omit<Category, 'id'>) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ onClose, categories, onAddNewCategory, onEditCategory, onDeleteCategory }) => {
  const [view, setView] = useState<'main' | 'subcategories'>('main');
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📁');
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>(TransactionType.EXPENSE);

  const handleParentClick = (parent: Category) => {
    setSelectedParent(parent);
    setView('subcategories');
  };

  const handleBack = () => {
    setSelectedParent(null);
    setView('main');
  };

  const handleAddTopLevelCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
        onAddNewCategory({
            name: newCategoryName.trim(),
            icon: newCategoryIcon.trim() || '📁',
            type: newCategoryType,
            parentId: null,
        });
        setNewCategoryName('');
        setNewCategoryIcon('📁');
    }
  };

  const handleAddSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() && selectedParent) {
        onAddNewCategory({
            name: newCategoryName.trim(),
            icon: newCategoryIcon.trim() || '📁',
            type: selectedParent.type,
            parentId: selectedParent.id,
        });
        setNewCategoryName('');
        setNewCategoryIcon('📁');
    }
  };
  
  const renderTopLevelList = (type: TransactionType) => {
    const topLevel = categories.filter(c => c.type === type && !c.parentId);
    return topLevel.map(parent => (
        <div key={parent.id} className="flex items-center justify-between p-2 bg-subtle rounded-lg group transition-colors hover-bg-stronger">
            <div onClick={() => handleParentClick(parent)} className="flex-grow flex items-center gap-3 cursor-pointer">
                <span className="text-xl w-6 text-center">{parent.icon || '📁'}</span>
                <span className="font-medium text-primary">{parent.name}</span>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEditCategory(parent); }} 
                    className="text-xs text-secondary hover:text-primary px-2 py-1 rounded-full transition-colors"
                    aria-label={`Edit ${parent.name} category`}
                >
                    Edit
                </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteCategory(parent.id); }} 
                    className="text-xs text-[var(--color-accent-rose)] hover:brightness-125 px-2 py-1 rounded-full transition-colors"
                    aria-label={`Delete ${parent.name} category`}
                >
                    Delete
                </button>
                <div onClick={() => handleParentClick(parent)} className="p-1 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </div>
            </div>
        </div>
    ));
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-divider opacity-0 animate-scaleIn" onClick={e => e.stopPropagation()}>
        {view === 'main' && (
          <>
            <ModalHeader title="Manage Categories" onClose={onClose} />
            <div className="flex-grow overflow-y-auto p-6 pr-4 space-y-6 pb-20">
                <div>
                    <h3 className="font-semibold mb-3 text-lg border-b border-divider pb-2" style={{color: 'var(--color-accent-emerald)'}}>Income Categories</h3>
                    <div className="space-y-2">{renderTopLevelList(TransactionType.INCOME)}</div>
                </div>
                <div>
                    <h3 className="font-semibold mb-3 text-lg border-b border-divider pb-2" style={{color: 'var(--color-accent-rose)'}}>Expense Categories</h3>
                    <div className="space-y-2">{renderTopLevelList(TransactionType.EXPENSE)}</div>
                </div>
            </div>
            <div className="flex-shrink-0 p-6 border-t border-divider mt-auto bg-subtle rounded-b-xl">
              <form onSubmit={handleAddTopLevelCategory} className="opacity-0 animate-fadeInUp">
                  <h3 className="font-semibold text-primary mb-4">Add Top-Level Category</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                      <input type="text" placeholder="Icon" value={newCategoryIcon} onChange={(e) => setNewCategoryIcon(e.target.value)} className="sm:col-span-1 input-base rounded-full py-2 px-3 text-center" maxLength={2} />
                      <input type="text" placeholder="Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="sm:col-span-3 input-base rounded-full py-2 px-3" autoFocus />
                      <select value={newCategoryType} onChange={(e) => setNewCategoryType(e.target.value as TransactionType)} className="sm:col-span-2 input-base rounded-full py-2 px-3">
                          <option value={TransactionType.EXPENSE}>Expense</option>
                          <option value={TransactionType.INCOME}>Income</option>
                      </select>
                  </div>
                  <div className="flex justify-end mt-4">
                      <button type="submit" className="button-primary px-4 py-2" disabled={!newCategoryName.trim()}>Add Category</button>
                  </div>
              </form>
            </div>
          </>
        )}
        {view === 'subcategories' && selectedParent && (
            <div className="opacity-0 animate-fadeInUp flex flex-col h-full">
                <ModalHeader title={`${selectedParent.icon} ${selectedParent.name}`} onBack={handleBack} onClose={onClose} />
                 <div className="p-4 border-b border-divider flex-shrink-0">
                     <button onClick={() => onEditCategory(selectedParent)} className="text-sm text-secondary hover:text-primary px-3 py-1 bg-subtle hover-bg-stronger rounded-full transition-colors">Edit Parent Category</button>
                 </div>
                <div className="flex-grow overflow-y-auto p-6 pr-4 space-y-2 pb-20">
                    <h3 className="font-semibold text-secondary mb-2">Subcategories</h3>
                    {categories.filter(c => c.parentId === selectedParent.id).map(child => (
                        <div key={child.id} className="flex items-center justify-between p-2 bg-subtle rounded-lg group">
                            <span className="flex items-center gap-3"><span className="text-xl w-6 text-center">{child.icon || '📁'}</span><span className="font-medium text-primary">{child.name}</span></span>
                            <div className="space-x-2">
                                <button onClick={() => onEditCategory(child)} className="text-xs text-secondary hover:text-primary px-2">Edit</button>
                                <button onClick={() => onDeleteCategory(child.id)} className="text-xs text-[var(--color-accent-rose)] hover:brightness-125 px-2">Delete</button>
                            </div>
                        </div>
                    ))}
                    {categories.filter(c => c.parentId === selectedParent.id).length === 0 && (
                        <p className="text-sm text-secondary text-center py-4">No subcategories yet.</p>
                    )}
                </div>
                 <div className="flex-shrink-0 p-6 border-t border-divider bg-subtle rounded-b-xl">
                    <form onSubmit={handleAddSubCategory}>
                        <h3 className="font-semibold text-primary mb-2">Add New Subcategory</h3>
                        <div className="flex items-center gap-3">
                            <input type="text" placeholder="Icon" value={newCategoryIcon} onChange={(e) => setNewCategoryIcon(e.target.value)} className="input-base rounded-full py-2 px-3 text-center w-16" maxLength={2} />
                            <input type="text" placeholder="Subcategory Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-grow input-base rounded-full py-2 px-3" autoFocus />
                            <button type="submit" className="button-primary py-2 px-4" disabled={!newCategoryName.trim()}>Add</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default CategoryManagerModal;