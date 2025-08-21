import React, { useState, useMemo } from 'react';
import { Category, TransactionType } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddNewCategory: (category: Omit<Category, 'id'>) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const primaryButtonStyle = "px-4 py-2 rounded-lg text-white font-semibold bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-200 transform active:scale-[0.98] disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed";
const secondaryButtonStyle = "px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600/80 transition-colors";

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose, categories, onAddNewCategory, onEditCategory, onDeleteCategory }) => {
  const [view, setView] = useState<'main' | 'subcategories'>('main');
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📁');
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [showAddForm, setShowAddForm] = useState(false);

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
        setShowAddForm(false);
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
        <div key={parent.id} onClick={() => handleParentClick(parent)} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg group cursor-pointer hover:bg-slate-700 transition-all duration-200 hover:scale-[1.02]">
          <span className="flex items-center gap-3">
            <span className="text-xl w-6 text-center">{parent.icon || '📁'}</span>
            <span className="font-medium text-slate-200">{parent.name}</span>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </div>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] flex flex-col border border-slate-700/50 opacity-0 animate-scaleIn" onClick={e => e.stopPropagation()}>
        {view === 'main' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">Manage Categories</h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                <div>
                    <h3 className="font-semibold text-emerald-400 mb-3 text-lg border-b border-emerald-500/20 pb-2">Income Categories</h3>
                    <div className="space-y-2">{renderTopLevelList(TransactionType.INCOME)}</div>
                </div>
                <div>
                    <h3 className="font-semibold text-rose-400 mb-3 text-lg border-b border-rose-500/20 pb-2">Expense Categories</h3>
                    <div className="space-y-2">{renderTopLevelList(TransactionType.EXPENSE)}</div>
                </div>
            </div>
            {showAddForm && (
                <form onSubmit={handleAddTopLevelCategory} className="flex-shrink-0 pt-6 border-t border-slate-700 mt-4 opacity-0 animate-fadeInUp">
                    <h3 className="font-semibold text-white mb-4">Add Top-Level Category</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                        <input type="text" placeholder="Icon" value={newCategoryIcon} onChange={(e) => setNewCategoryIcon(e.target.value)} className="sm:col-span-1 bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 text-center" maxLength={2} />
                        <input type="text" placeholder="Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="sm:col-span-3 bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500" />
                        <select value={newCategoryType} onChange={(e) => setNewCategoryType(e.target.value as TransactionType)} className="sm:col-span-2 bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-emerald-500">
                            <option value={TransactionType.EXPENSE}>Expense</option>
                            <option value={TransactionType.INCOME}>Income</option>
                        </select>
                    </div>
                     <div className="flex justify-end mt-4 space-x-3">
                         <button type="button" onClick={() => setShowAddForm(false)} className={secondaryButtonStyle}>Cancel</button>
                         <button type="submit" className={primaryButtonStyle} disabled={!newCategoryName.trim()}>Add</button>
                    </div>
                </form>
            )}
            <div className="flex justify-end pt-4 mt-4 border-t border-slate-700 space-x-3">
                {!showAddForm && <button onClick={() => setShowAddForm(true)} className={primaryButtonStyle}>Add Category</button>}
                <button onClick={onClose} className={secondaryButtonStyle}>Close</button>
            </div>
          </>
        )}
        {view === 'subcategories' && selectedParent && (
            <div className="opacity-0 animate-fadeInUp">
                <div className="flex items-center mb-6">
                    <button onClick={handleBack} className="p-2 mr-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2"><span className="text-2xl">{selectedParent.icon}</span> {selectedParent.name}</h2>
                    <div className="ml-auto space-x-2">
                        <button onClick={() => onEditCategory(selectedParent)} className="text-sm text-slate-400 hover:text-white px-3 py-1 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors">Edit</button>
                        <button onClick={() => onDeleteCategory(selectedParent.id)} className="text-sm text-rose-400 hover:text-rose-300 px-3 py-1 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors">Delete</button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-2 max-h-64">
                    <h3 className="font-semibold text-slate-300 mb-2">Subcategories</h3>
                    {categories.filter(c => c.parentId === selectedParent.id).map(child => (
                        <div key={child.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg group">
                            <span className="flex items-center gap-3"><span className="text-xl w-6 text-center">{child.icon || '📁'}</span><span className="font-medium text-slate-300">{child.name}</span></span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                                <button onClick={() => onEditCategory(child)} className="text-xs text-slate-400 hover:text-white px-2">Edit</button>
                                <button onClick={() => onDeleteCategory(child.id)} className="text-xs text-rose-400 hover:text-rose-300 px-2">Delete</button>
                            </div>
                        </div>
                    ))}
                    {categories.filter(c => c.parentId === selectedParent.id).length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">No subcategories yet.</p>
                    )}
                </div>
                 <form onSubmit={handleAddSubCategory} className="flex-shrink-0 pt-6 border-t border-slate-700 mt-4">
                    <h3 className="font-semibold text-white mb-4">Add New Subcategory</h3>
                     <div className="flex items-center gap-3">
                        <input type="text" placeholder="Icon" value={newCategoryIcon} onChange={(e) => setNewCategoryIcon(e.target.value)} className="bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 text-center w-16" maxLength={2} />
                        <input type="text" placeholder="Subcategory Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-grow bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500" />
                        <button type="submit" className={`${primaryButtonStyle} py-2 px-4`} disabled={!newCategoryName.trim()}>Add</button>
                    </div>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManagerModal;