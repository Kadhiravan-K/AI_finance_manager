import React, { useState, useMemo } from 'react';

interface CustomDatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());

  const daysInMonth = useMemo(() => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    return date.getDate();
  }, [currentMonth]);

  const firstDayOfMonth = useMemo(() => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    return date.getDay();
  }, [currentMonth]);

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onChange(newDate);
    setIsOpen(false);
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };
  
  const handleMonthSelect = (monthIndex: number) => {
      setCurrentMonth(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(monthIndex);
          return newDate;
      });
  };

  const handleYearSelect = (year: number) => {
       setCurrentMonth(prev => {
          const newDate = new Date(prev);
          newDate.setFullYear(year);
          return newDate;
      });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));
  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full input-base rounded-lg py-2 px-3 text-left flex justify-between items-center"
      >
        <span className="text-primary">{value ? value.toLocaleDateString() : 'Select a date'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </button>

      {isOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[700] p-4"
            onClick={() => setIsOpen(false)}
        >
            <div 
                className="glass-card rounded-xl shadow-2xl w-full max-w-xs p-4 border border-divider animate-scaleIn"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover-bg-stronger text-primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <select value={currentMonth.getMonth()} onChange={(e) => handleMonthSelect(parseInt(e.target.value, 10))} className="input-base rounded-md p-1 font-semibold text-primary bg-subtle">
                            {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
                        </select>
                         <select value={currentMonth.getFullYear()} onChange={(e) => handleYearSelect(parseInt(e.target.value, 10))} className="input-base rounded-md p-1 font-semibold text-primary bg-subtle">
                            {years.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover-bg-stronger text-primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm text-secondary mb-2">
                    {dayNames.map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const isSelected = value &&
                            value.getDate() === day &&
                            value.getMonth() === currentMonth.getMonth() &&
                            value.getFullYear() === currentMonth.getFullYear();
                        
                        return (
                            <button
                                key={day}
                                onClick={() => handleDayClick(day)}
                                className={`p-2 rounded-full text-center transition-colors text-primary ${
                                    isSelected ? 'bg-[var(--color-accent-emerald)] text-white font-bold' : 'hover:bg-subtle'
                                }`}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;