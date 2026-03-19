import React, { useState, useEffect } from 'react';

interface NumberStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

const NumberStepper: React.FC<NumberStepperProps> = ({ value, onChange, step = 1, min = -Infinity, max = Infinity }) => {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    // Sync with parent when prop changes, but not during local editing
    setLocalValue(String(value));
  }, [value]);

  const commitChange = (val: string) => {
    let numValue = parseFloat(val);
    if (isNaN(numValue)) numValue = min > 0 ? min : 0;
    const clampedValue = Math.max(min, Math.min(max, numValue));
    
    if (clampedValue !== value) {
        onChange(clampedValue);
    }
    // Always format the local state to the committed value
    setLocalValue(String(clampedValue));
  };
  
  const handleIncrement = () => {
    const numericValue = parseFloat(localValue) || 0;
    const newValue = Math.min(max, numericValue + step);
    setLocalValue(String(newValue));
    onChange(newValue);
  };

  const handleDecrement = () => {
    const numericValue = parseFloat(localValue) || 0;
    const newValue = Math.max(min, numericValue - step);
    setLocalValue(String(newValue));
    onChange(newValue);
  };
  
  const handleBlur = () => {
      commitChange(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          commitChange(localValue);
          e.currentTarget.blur();
      }
  };

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={handleDecrement} className="control-button control-button-minus" disabled={parseFloat(localValue) <= min}>-</button>
      <input 
        type="text"
        inputMode="decimal"
        value={localValue} 
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onWheel={(e) => (e.target as HTMLElement).blur()}
        className="w-16 text-center bg-transparent no-spinner text-primary font-semibold text-lg" 
      />
      <button type="button" onClick={handleIncrement} className="control-button control-button-plus" disabled={parseFloat(localValue) >= max}>+</button>
    </div>
  );
};

export default NumberStepper;