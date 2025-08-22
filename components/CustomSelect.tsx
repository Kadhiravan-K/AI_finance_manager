import React, { useState, useEffect, useRef } from 'react';

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
  const wrapperRef = useRef<HTMLDivElement>(null);

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
  
  const handleSelect = (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
  }

  const effectiveValue = value || defaultValue;
  const effectiveSelectedOption = options.find(option => option.value === effectiveValue);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white text-left flex justify-between items-center focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner shadow-slate-900/50 disabled:bg-slate-700/50 disabled:cursor-not-allowed"
      >
        <span className={selectedOption ? 'text-white' : 'text-slate-400'}>
          {effectiveSelectedOption?.label || placeholder}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && !disabled && (
        <div 
          className="absolute z-50 mt-1 w-full glass-card rounded-lg shadow-lg border border-slate-700/50 max-h-60 overflow-y-auto"
          style={{ animation: 'fadeInUp 0.2s ease-out' }}
        >
          <ul className="p-1">
            {placeholder && !defaultValue && <li
                onClick={() => handleSelect('')}
                className="px-3 py-2 text-slate-400 rounded-md hover:bg-slate-700/50 cursor-pointer"
            >
                {placeholder}
            </li>}
            {options.map(option => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`px-3 py-2 rounded-md hover:bg-slate-700/50 cursor-pointer ${value === option.value ? 'bg-emerald-600/50 text-white' : 'text-slate-200'}`}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;