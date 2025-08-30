import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Category, TransactionType } from '../types';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface CategoryManagerModalProps {
  onClose: () => void;
  categories: Category[];
  onAddTopLevelCategory: () => void;
  onAddSubcategory: (parentCategory: Category) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ 
  onClose, 
  categories, 
  onAddTopLevelCategory,
  onAddSubcategory,
  onEditCategory, 
  onDeleteCategory 
}) => {
  const [view, setView] = useState<'main' | 'subcategories'>('main');
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);

  const handleParentClick = (parent: Category) => {
    setSelectedParent(parent);
    setView('subcategories');
  };

  const handleBack = () => {
    setSelectedParent(null);
    setView('main');
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
                    className="text-xs text-secondary hover:text-primary px-2 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Edit ${parent.name} category`}
                >
                    Edit
                </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteCategory(parent.id); }} 
                    className="text-xs text-[var(--color-accent-rose)] hover:brightness-125 px-2 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Delete ${parent.name} category`}
                >
                    Delete
                </button>
                <div onClick={() => handleParentClick(parent)} className="p-1 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
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
            <div className="flex-grow overflow-y-auto p-6 pr-4 space-y-6">
                <div>
                    <h3 className="font-semibold mb-3 text-lg border-b border-divider pb-2" style={{color: 'var(--color-accent-emerald)'}}>Income Categories</h3>
                    <div className="space-y-2">{renderTopLevelList(TransactionType.INCOME)}</div>
                </div>
                <div>
                    <h3 className="font-semibold mb-3 text-lg border-b border-divider pb-2" style={{color: 'var(--color-accent-rose)'}}>Expense Categories</h3>
                    <div className="space-y-2">{renderTopLevelList(TransactionType.EXPENSE)}</div>
                </div>
            </div>
            <div className="flex-shrink-0 p-4 border-t border-divider bg-subtle rounded-b-xl">
              <button onClick={onAddTopLevelCategory} className="button-primary w-full py-2">
                  + Add New Category
              </button>
            </div>
          </>
        )}
        {view === 'subcategories' && selectedParent && (
            <div className="opacity-0 animate-fadeInUp flex flex-col h-full">
                <ModalHeader title={`${selectedParent.icon} ${selectedParent.name}`} onBack={handleBack} onClose={onClose} />
                 <div className="p-4 border-b border-divider flex-shrink-0">
                     <button onClick={() => onEditCategory(selectedParent)} className="text-sm text-secondary hover:text-primary px-3 py-1 bg-subtle hover-bg-stronger rounded-full transition-colors">Edit Parent Category</button>
                 </div>
                <div className="flex-grow overflow-y-auto p-6 pr-4 space-y-2">
                    <h3 className="font-semibold text-secondary mb-2">Subcategories</h3>
                    {categories.filter(c => c.parentId === selectedParent.id).map(child => (
                        <div key={child.id} className="flex items-center justify-between p-2 bg-subtle rounded-lg group">
                            <span className="flex items-center gap-3"><span className="text-xl w-6 text-center">{child.icon || '📁'}</span><span className="font-medium text-primary">{child.name}</span></span>
                            <div className="space-x-2 opacity-0 group-hover:opacity-100">
                                <button onClick={() => onEditCategory(child)} className="text-xs text-secondary hover:text-primary px-2">Edit</button>
                                <button onClick={() => onDeleteCategory(child.id)} className="text-xs text-[var(--color-accent-rose)] hover:brightness-125 px-2">Delete</button>
                            </div>
                        </div>
                    ))}
                    {categories.filter(c => c.parentId === selectedParent.id).length === 0 && (
                        <p className="text-sm text-secondary text-center py-4">No subcategories yet.</p>
                    )}
                </div>
                 <div className="flex-shrink-0 p-4 border-t border-divider bg-subtle rounded-b-xl">
                    <button onClick={() => onAddSubcategory(selectedParent)} className="button-primary w-full py-2">
                        + Add New Subcategory
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default CategoryManagerModal;
