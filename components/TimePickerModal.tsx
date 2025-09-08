import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface TimePickerModalProps {
  initialTime: string; // HH:MM (24h)
  onSave: (time: string) => void;
  onClose: () => void;
}

const TimeScroller: React.FC<{
  values: string[];
  value: string;
  onChange: (newValue: string) => void;
}> = ({ values, value, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const timeoutRef = useRef<number | undefined>(undefined);
  const isInteracting = useRef(false);

  useEffect(() => {
    const el = itemRefs.current.get(value);
    if (el && containerRef.current && !isInteracting.current) {
        containerRef.current.scrollTo({
            top: el.offsetTop - containerRef.current.offsetTop - (containerRef.current.offsetHeight / 2) + (el.offsetHeight / 2),
            behavior: 'smooth'
        });
    }
  }, [value]);

  const handleScroll = useCallback(() => {
    isInteracting.current = true;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
        const container = containerRef.current;
        if (!container) return;

        const containerCenter = container.scrollTop + container.offsetHeight / 2;
        let closestValue = value;
        let minDistance = Infinity;

        values.forEach(val => {
            const el = itemRefs.current.get(val);
            if (el) {
                const elCenter = el.offsetTop - container.offsetTop + el.offsetHeight / 2;
                const distance = Math.abs(containerCenter - elCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestValue = val;
                }
            }
        });
        
        if (closestValue !== value) {
            onChange(closestValue);
        }
        isInteracting.current = false;
    }, 150);
  }, [onChange, value, values]);
  
  return (
    <div ref={containerRef} onScroll={handleScroll} className="time-scroller">
        {/* Padding elements to center the first and last items */}
        <div style={{ height: 'calc(50% - 1.25rem)' }}></div>
        {values.map(v => (
            <div
                key={v}
                ref={el => { if (el) itemRefs.current.set(v, el); }}
                className={`time-scroller-item ${v === value ? 'selected' : ''}`}
            >
                {v}
            </div>
        ))}
        <div style={{ height: 'calc(50% - 1.25rem)' }}></div>
    </div>
  );
};

const TimePickerModal: React.FC<TimePickerModalProps> = ({ initialTime, onSave, onClose }) => {
  const parseInitialTime = (time24: string) => {
    const [h24, m] = time24.split(':').map(Number);
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const period = h24 >= 12 ? 'PM' : 'AM';
    return {
      hour: String(h12).padStart(2, '0'),
      minute: String(m).padStart(2, '0'),
      period,
    };
  };

  const [hour, setHour] = useState(parseInitialTime(initialTime).hour);
  const [minute, setMinute] = useState(parseInitialTime(initialTime).minute);
  const [period, setPeriod] = useState(parseInitialTime(initialTime).period);

  const handleSave = () => {
    let h24 = parseInt(hour, 10);
    if (period === 'PM' && h24 < 12) {
      h24 += 12;
    }
    if (period === 'AM' && h24 === 12) { // Midnight case
      h24 = 0;
    }
    const finalTime = `${String(h24).padStart(2, '0')}:${minute}`;
    onSave(finalTime);
    onClose();
  };

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []);
  const periods = useMemo(() => ['AM', 'PM'], []);

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[55] p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-xs p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Select Time" onClose={onClose} />
        <div className="p-6 flex flex-col items-center gap-6">
            <div className="w-full text-center p-3 rounded-lg bg-subtle border border-divider">
                <span className="text-3xl font-mono tracking-widest text-primary">{hour}:{minute} {period}</span>
            </div>
          <div className="relative w-full time-picker-container">
            <TimeScroller values={hours} value={hour} onChange={setHour} />
            <TimeScroller values={minutes} value={minute} onChange={setMinute} />
            <TimeScroller values={periods} value={period} onChange={setPeriod} />
          </div>
          <button type="button" onClick={handleSave} className="button-primary w-full py-2">
            Save Time
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default TimePickerModal;