import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { ViewOptions, AppliedViewOptions } from '../types';
import ModalHeader from './ModalHeader';
import ToggleSwitch from './ToggleSwitch';

const modalRoot = document.getElementById('modal-root')!;

interface ViewOptionsModalProps {
  options: ViewOptions;
  currentValues: AppliedViewOptions;
  onApply: (newValues: AppliedViewOptions) => void;
  onClose: () => void;
}

const ViewOptionsModal: React.FC<ViewOptionsModalProps> = ({ options, currentValues, onApply, onClose }) => {
  const [localSort, setLocalSort] = useState(currentValues.sort);
  const [localFilters, setLocalFilters] = useState(currentValues.filters);

  const handleSortChange = (key: string) => {
    if (localSort.key === key) {
      setLocalSort({ key, direction: localSort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setLocalSort({ key, direction: 'desc' });
    }
  };
  
  const handleFilterChange = (key: string, value: boolean) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply({ sort: localSort, filters: localFilters });
    onClose();
  };

  const handleReset = () => {
    const defaultSort = options.sortOptions[0] ? { key: options.sortOptions[0].key, direction: 'desc' as 'desc' } : currentValues.sort;
    const defaultFilters = options.filterOptions.reduce((acc, opt) => {
        acc[opt.key] = true;
        return acc;
    }, {} as Record<string, boolean>);

    setLocalSort(defaultSort);
    setLocalFilters(defaultFilters);
    
    onApply({ sort: defaultSort, filters: defaultFilters });
  };
  
  const isDefault = () => {
      const defaultSortKey = options.sortOptions[0]?.key;
      const isSortDefault = localSort.key === defaultSortKey && (localSort.direction === 'desc' || localSort.direction === 'asc');
      const areFiltersDefault = Object.keys(localFilters).length === 0 || Object.values(localFilters).every(v => v === true);
      return isSortDefault && areFiltersDefault;
  }

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Filter & Sort" onClose={onClose} icon="🎛️" />
        <div className="p-6 space-y-4 overflow-y-auto">
          {options.sortOptions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-secondary mb-2">Sort By</h3>
              <div className="flex flex-wrap gap-2">
                {options.sortOptions.map(opt => (
                  <button key={opt.key} onClick={() => handleSortChange(opt.key)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors flex items-center gap-1 ${localSort.key === opt.key ? 'bg-emerald-500 text-white' : 'bg-subtle hover-bg-stronger text-primary'}`}>
                    {opt.label}
                    {localSort.key === opt.key && (
                      <span className={`transition-transform duration-200 ${localSort.direction === 'asc' ? 'rotate-180' : ''}`}>↓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          {options.filterOptions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-secondary mb-2">Filters</h3>
              <div className="space-y-2">
                {options.filterOptions.map(opt => (
                  <div key={opt.key} className="p-3 bg-subtle rounded-lg flex items-center justify-between">
                    <span className="font-medium text-primary">{opt.label}</span>
                    <ToggleSwitch checked={localFilters[opt.key] !== false} onChange={(checked) => handleFilterChange(opt.key, checked)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 p-4 border-t border-divider flex justify-between items-center bg-subtle rounded-b-xl">
            <button onClick={handleReset} disabled={isDefault()} className="button-secondary px-4 py-2 disabled:opacity-50">Reset</button>
            <button onClick={handleApply} className="button-primary px-4 py-2">Apply</button>
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ViewOptionsModal;
