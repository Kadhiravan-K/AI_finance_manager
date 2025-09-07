import React from 'react';
import ReactDOM from 'react-dom';
import { ActiveModal, ActiveScreen } from '../types';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface AddCalendarEventModalProps {
  onClose: () => void;
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => void;
  initialDate?: Date;
}

const AddCalendarEventModal: React.FC<AddCalendarEventModalProps> = ({ onClose, onNavigate, initialDate }) => {

  const handleSelect = (screen: ActiveScreen, modal?: ActiveModal) => {
    let props = {};
    if (modal === 'editRecurring' && initialDate) {
        props = { recurringTransaction: { nextDueDate: initialDate.toISOString() }};
    } else if (modal === 'refund' && initialDate) {
        props = { refund: { expectedDate: initialDate.toISOString() }};
    } else if (modal === 'editTrip' && initialDate) {
        props = { trip: { date: initialDate.toISOString() }};
    }
    onNavigate(screen, modal, props);
  };
  
  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-sm p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
            <ModalHeader title="Add Event" onClose={onClose} />
            <div className="p-6 space-y-3">
                <p className="text-center text-sm text-secondary">What would you like to add for {initialDate ? initialDate.toLocaleDateString() : 'this date'}?</p>
                <button onClick={() => handleSelect('scheduled', 'editRecurring')} className="w-full text-left p-3 bg-subtle rounded-lg flex items-center gap-3 hover-bg-stronger transition-colors">
                    <span className="text-2xl">📅</span>
                    <span className="font-semibold text-primary">New Scheduled Bill</span>
                </button>
                <button onClick={() => handleSelect('refunds', 'refund')} className="w-full text-left p-3 bg-subtle rounded-lg flex items-center gap-3 hover-bg-stronger transition-colors">
                    <span className="text-2xl">↩️</span>
                    <span className="font-semibold text-primary">New Expected Refund</span>
                </button>
                <button onClick={() => handleSelect('tripManagement', 'editTrip')} className="w-full text-left p-3 bg-subtle rounded-lg flex items-center gap-3 hover-bg-stronger transition-colors">
                    <span className="text-2xl">✈️</span>
                    <span className="font-semibold text-primary">New Trip</span>
                </button>
            </div>
        </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AddCalendarEventModal;