import React from 'react';

interface ToggleOption {
  value: string;
  label: string;
}

interface SlidingToggleProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  typeSpecificStyles?: Record<string, { active: string; inactive: string }>;
}

const SlidingToggle: React.FC<SlidingToggleProps> = ({ options, value, onChange, typeSpecificStyles }) => {
  const selectedIndex = options.findIndex(o => o.value === value);
  const sliderStyle = {
    transform: `translateX(${selectedIndex * 100}%)`,
  };
  
  const defaultStyles = {
    expense: { active: 'bg-rose-500', inactive: ''},
    income: { active: 'bg-emerald-500', inactive: ''}
  };
  const styles = typeSpecificStyles || defaultStyles;

  return (
    <div className="relative grid grid-cols-2 gap-1 p-1 rounded-full bg-subtle border border-divider">
      <div 
        className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-in-out" 
        style={sliderStyle}
      >
        <div className={`w-full h-full rounded-full ${value === 'expense' ? styles.expense.active : styles.income.active}`}></div>
      </div>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`relative w-full py-2 text-sm font-semibold rounded-full z-10 transition-colors duration-200 ${value === option.value ? 'text-white' : 'text-primary'}`}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SlidingToggle;