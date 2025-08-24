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
      <div className="relative flex items-center">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-5 h-5 bg-subtle border-2 border-divider rounded-md flex-shrink-0
                        peer-checked:bg-emerald-500 peer-checked:border-emerald-500
                        transition-colors duration-200">
        </div>
        <svg
          className={`absolute left-0.5 top-0.5 w-4 h-4 text-white pointer-events-none
                      transform scale-0 peer-checked:scale-100 transition-transform duration-200`}
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="ml-3 text-primary group-hover:text-primary transition-colors">{label}</span>
    </label>
  );
};

export default CustomCheckbox;
