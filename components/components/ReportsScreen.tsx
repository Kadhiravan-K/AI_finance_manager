

import React, { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType, ReportPeriod, CustomDateRange, Account, ActiveModal, AppState } from '../../types';
import CategoryPieChart from '../CategoryPieChart';
import CategoryBarChart from '../CategoryBarChart';
import TimeSeriesBarChart from '../TimeSeriesBarChart';
import CustomDatePicker from '../CustomDatePicker';
import CustomSelect from '../CustomSelect';
import CustomCheckbox from '../CustomCheckbox';
import ToggleSwitch from '../ToggleSwitch';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import LiveFeedScreen from '../LiveFeedScreen';

interface ReportsScreenProps {
  appState: AppState;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  selectedAccountIds: string[];
  baseCurrency: string;
}

type ComparePeriodType = 'previous' | 'last_year' | 'last_month' | 'last_quarter' | 'custom';
type ReportType = 'breakdown' | 'trend';

// ... (Existing helper components like ReportAccountSelector and CategorySelector remain unchanged)
const ReportAccountSelector: React.FC<{ accounts: Account[], selectedIds: string[], onChange: (ids: string[]) => void }> = ({ accounts, selectedIds, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleSelectionChange = (accountId: string) => {
        let newSelection: string[];
        if (accountId === 'all') {
            newSelection = selectedIds.includes('all') ? [] : ['all'];
        } else {
            const currentSelection = selectedIds.filter(id => id !== 'all');
            if (currentSelection.includes(accountId)) {
                newSelection = currentSelection.filter(id => id !== accountId);
            } else {
                newSelection = [...currentSelection, accountId];
            }
            if (newSelection.length === accounts.length || newSelection.length === 0) {
                newSelection = ['all'];
            }
        }
        onChange(newSelection);
    };
    
     const getButtonLabel = () => {
        if (selectedIds.includes('all') || selectedIds.length === 0) return 'All Accounts';
        if (selectedIds.length === 1) return accounts.find(a => a.id === selectedIds[0])?.name || 'Select Account';
        return `${selectedIds.length} Accounts Selected`;
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full input-base rounded-lg py-2 px-3 text-left flex justify-between items-center">
                <span className="truncate">{getButtonLabel()}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform ${isOpen ? 'rotate-180':''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7 7" /></svg>
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full glass-card rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto">
                    <div className="p-1"><CustomCheckbox id="rep-acc-all" label="All Accounts" checked={selectedIds.includes('all')} onChange={() => handleSelectionChange('all')} /></div>
                    {accounts.map(acc => (
                         <div key={acc.id} className="p-1"><CustomCheckbox id={`rep-acc-${acc.id}`} label={acc.name} checked={selectedIds.includes('all') || selectedIds.includes(acc.id)} onChange={() => handleSelectionChange(acc.id)} /></div>
                    ))}
                </div>
            )}
        </div>
    );
};
const CategorySelector: React.FC<{ categories: Category[], selectedIds: string[], onChange: (ids: string[]) => void }> = ({ categories, selectedIds, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleSelectionChange = (categoryId: string) => {
        let newSelection: string[];
        if (categoryId === 'all') {
            newSelection = selectedIds.includes('all') ? [] : ['all'];
        } else {
            const currentSelection = selectedIds.filter(id => id !== 'all');
            if (currentSelection.includes(categoryId)) {
                newSelection = currentSelection.filter(id => id !== categoryId);
            } else {
                newSelection = [...currentSelection, categoryId];
            }
            if (newSelection.length === 0 || categories.filter(c => !c.parentId).length === newSelection.length) {
                newSelection = ['all'];
            }
        }
        onChange(newSelection);
    };

    const getButtonLabel = () => {
        if (selectedIds.includes('all') || selectedIds.length === 0) return 'All Categories';
        if (selectedIds.length === 1) return categories.find(c => c.id === selectedIds[0])?.name || '1 Category';
        return `${selectedIds.length} Categories`;
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full input-base rounded-lg py-2 px-3 text-left flex justify-between items-center">
                <span className="truncate">{getButtonLabel()}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform ${isOpen ? 'rotate-180':''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7