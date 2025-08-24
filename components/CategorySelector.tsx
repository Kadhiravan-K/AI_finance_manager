import React, { useState, useRef, useEffect } from 'react';
import { Category } from '../types';
import CustomCheckbox from './CustomCheckbox';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onCategoryChange: (ids: string[]) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ categories, selectedCategoryIds, onCategoryChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const handleSelectionChange = (categoryId: string) => {
    let newSelection: string[];
    if (categoryId === 'all') {
      newSelection = selectedCategoryIds.includes('all') ? [] : ['all'];
    } else {
      const currentSelection = selectedCategoryIds.filter(id => id !== 'all');
      if (currentSelection.includes(categoryId)) {
        newSelection = currentSelection.filter(id => id !== categoryId);
      } else {
        newSelection = [...currentSelection, categoryId];
      }
      
      if (newSelection.length === 0 || newSelection.length === categories.length) {
        newSelection = ['all'];
      }
    }
    onCategoryChange(newSelection);
  };

  const getButtonLabel = () => {
    if (selectedCategoryIds.includes('all')) return 'All Categories';
    if (selectedCategoryIds.length === 1) {
      return categories.find(a => a.id === selectedCategoryIds[0])?.name || 'Select Category';
    }
    if (selectedCategoryIds.length > 1) return 'Multiple Categories';
    return 'Select Category';
  };

  const topLevelCategories = categories.filter(c => !c.parentId);

  return (
    <div className="relative w-full" ref={wrapperRef}>
       <button 
         type="button" 
         onClick={() => setIsDropdownOpen(!isDropdownOpen)}
         className="w-full input-base rounded-lg py-2 px-3 text-left flex justify-between items-center"
       >
         <span className="text-primary truncate">{getButtonLabel()}</span>
         <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
       </button>
       {isDropdownOpen && (
         <div className="absolute z-50 mt-1 w-full glass-card rounded-lg shadow-lg border border-divider flex flex-col max-h-60 animate-fadeInUp">
            <div className="p-2 border-b border-divider flex justify-between">
                <button onClick={() => handleSelectionChange('all')} className="text-xs text-sky-400 hover:text-sky-300 px-2 py-1">Select All</button>
            </div>
           <ul className="p-1 overflow-y-auto">
             {topLevelCategories.map(cat => (
               <li key={cat.id} className="p-2 flex items-center group hover-bg-stronger rounded-md">
                 <CustomCheckbox
                   id={`cat-${cat.id}`}
                   label={cat.name}
                   checked={selectedCategoryIds.includes('all') || selectedCategoryIds.includes(cat.id)}
                   onChange={() => handleSelectionChange(cat.id)}
                 />
               </li>
             ))}
           </ul>
         </div>
       )}
    </div>
  );
};

export default CategorySelector;