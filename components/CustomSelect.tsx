import React, { useState, useEffect, useRef, useMemo } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  defaultValue?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder, disabled, defaultValue }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  useEffect(() => {
    if (isOpen) {
        // Focus the search input when the dropdown opens
        setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
  }
  
  const toggleOpen = () => {
    if (!isOpen) {
        setSearchTerm('');
    }
    setIsOpen(!isOpen);
  };

  const filteredOptions = useMemo(() =>
    options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    ), [options, searchTerm]);

  const effectiveValue = value || defaultValue;
  const effectiveSelectedOption = options.find(option => option.value === effectiveValue);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className="w-full input-base rounded-lg py-2 px-3 text-left flex justify-between items-center focus:ring-2 focus:ring-[var(--color-accent-emerald)] focus:outline-none disabled:bg-subtle disabled:cursor-not-allowed"
      >
        <span className={selectedOption ? 'text-primary truncate' : 'text-tertiary'}>
          {effectiveSelectedOption?.label || placeholder}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && !disabled && (
        <div 
          className="absolute z-[600] mt-1 w-full glass-card rounded-lg shadow-lg border border-divider flex flex-col max-h-60"
          style={{ animation: 'fadeInUp 0.2s ease-out' }}
        >
          <div className="p-2 sticky top-0 bg-subtle backdrop-blur-sm z-10">
            <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full input-base p-2 rounded-md text-sm"
                onClick={e => e.stopPropagation()}
            />
          </div>
          <ul className="p-1 overflow-y-auto">
            {placeholder && !defaultValue && (
                <li
                    onClick={() => handleSelect('')}
                    className="px-3 py-2 text-tertiary rounded-md hover-bg-stronger cursor-pointer"
                >
                    {placeholder}
                </li>
            )}
            {filteredOptions.map(option => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`px-3 py-2 rounded-md hover-bg-stronger cursor-pointer ${value === option.value ? 'bg-[var(--color-accent-emerald)] text-white' : 'text-primary'}`}
              >
                {option.label}
              </li>
            ))}
             {filteredOptions.length === 0 && (
                <li className="px-3 py-2 text-secondary text-center text-sm">No results found.</li>
             )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;