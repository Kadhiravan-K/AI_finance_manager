import React from 'react';

interface CustomCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ id, label, checked, onChange }) => {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 transition-colors bg-subtle border-divider group-hover:border-accent-sky peer-checked:bg-accent-sky peer-checked:border-accent-sky`}>
          {/* Checkmark */}
          <svg className={`w-full h-full text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 8 6 11 13 4"></polyline>
          </svg>
        </div>
      </div>
      {label && <span className="ml-3 text-primary group-hover:text-primary transition-colors">{label}</span>}
    </label>
  );
};

export default CustomCheckbox;
