import React, { useState, useEffect } from 'react';
import { DateRange, CustomDateRange } from '../types';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

interface TransactionFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNaturalLanguageSearch: () => void;
  dateFilter: DateRange;
  setDateFilter: (filter: DateRange) => void;
  customDateRange: CustomDateRange;
  setCustomDateRange: React.Dispatch<React.SetStateAction<CustomDateRange>>;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  onNaturalLanguageSearch,
  dateFilter,
  setDateFilter,
  customDateRange,
  setCustomDateRange
}) => {
  const [showCustom, setShowCustom] = useState(dateFilter === 'custom');
  
  useEffect(() => {
    setShowCustom(dateFilter === 'custom');
  }, [dateFilter]);
  
  const dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' },
  ];
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          onNaturalLanguageSearch();
      }
  }

  return (
    <div className="p-4 rounded-xl glass-card space-y-4 relative z-20">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder='Search or ask AI: "coffee last month"'
          className="input-base w-full rounded-full py-2 px-3 pl-10"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-tertiary" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CustomSelect
          value={dateFilter}
          onChange={(value) => setDateFilter(value as DateRange)}
          options={dateFilterOptions}
        />
        {showCustom && (
            <div className="sm:col-span-2 grid grid-cols-2 gap-4 opacity-0 animate-fadeInUp">
              <CustomDatePicker
                value={customDateRange.start}
                onChange={date => setCustomDateRange(prev => ({ ...prev, start: date }))}
              />
              <CustomDatePicker
                value={customDateRange.end}
                onChange={date => setCustomDateRange(prev => ({ ...prev, end: date }))}
              />
            </div>
        )}
      </div>
    </div>
  );
};

export default TransactionFilters;