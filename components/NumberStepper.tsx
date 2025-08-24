import React from 'react';

interface NumberStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

const NumberStepper: React.FC<NumberStepperProps> = ({ value, onChange, step = 1, min = -Infinity, max = Infinity }) => {
  
  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseFloat(e.target.value);
      if (!isNaN(numValue)) {
          onChange(Math.max(min, Math.min(max, numValue)));
      } else if (e.target.value === '') {
          onChange(0);
      }
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={handleDecrement} className="control-button control-button-minus" disabled={value <= min}>-</button>
      <input 
        type="number" 
        value={value} 
        onChange={handleInputChange} 
        step={step}
        min={min}
        max={max}
        className="w-16 text-center bg-transparent no-spinner text-primary font-semibold text-lg" 
      />
      <button type="button" onClick={handleIncrement} className="control-button control-button-plus" disabled={value >= max}>+</button>
    </div>
  );
};

export default NumberStepper;
