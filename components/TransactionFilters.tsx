import React, { useState, useEffect } from 'react';
import { DateRange, CustomDateRange } from '../types';

interface TransactionFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateFilter: DateRange;
  setDateFilter: (filter: DateRange) => void;
  customDateRange: CustomDateRange;
  setCustomDateRange: React.Dispatch<React.SetStateAction<CustomDateRange>>;
}

const inputStyle = "w-full bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner shadow-slate-900/50 transition-all duration-200";

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  dateFilter,
  setDateFilter,
  customDateRange,
  setCustomDateRange
}) => {
  const [showCustom, setShowCustom] = useState(dateFilter === 'custom');
  
  useEffect(() => {
    setShowCustom(dateFilter === 'custom');
  }, [dateFilter]);
  
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as DateRange;
      setDateFilter(value);
  }

  return (
    <div className="p-4 rounded-xl glass-card space-y-4">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transactions..."
          className={`${inputStyle} pl-10`}
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select value={dateFilter} onChange={handleDateFilterChange} className={inputStyle}>
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>
        {showCustom && (
            <div className="sm:col-span-2 grid grid-cols-2 gap-4 opacity-0 animate-fadeInUp">
              <input
                type="date"
                value={customDateRange.start ? customDateRange.start.toISOString().split('T')[0] : ''}
                onChange={e => setCustomDateRange(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                className={inputStyle}
              />
              <input
                type="date"
                value={customDateRange.end ? customDateRange.end.toISOString().split('T')[0] : ''}
                onChange={e => setCustomDateRange(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                className={inputStyle}
              />
            </div>
        )}
      </div>
    </div>
  );
};

export default TransactionFilters;