import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface TimePickerModalProps {
  initialTime: string;
  onSave: (time: string) => void;
  onClose: () => void;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({ initialTime, onSave, onClose }) => {
  const [time, setTime] = useState(initialTime);

  const handleSave = () => {
    onSave(time);
    onClose();
  };
  
  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-xs p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
            <ModalHeader title="Select Time" onClose={onClose} />
            <div className="p-6 flex flex-col items-center gap-4">
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="input-base p-3 rounded-lg w-full text-2xl text-center"
                    autoFocus
                />
                <div className="flex w-full justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                    <button type="button" onClick={handleSave} className="button-primary px-4 py-2">Save</button>
                </div>
            </div>
        </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default TimePickerModal;
