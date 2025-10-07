
import React from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface ManageTripMembersModalProps {
    onClose: () => void;
}

const ManageTripMembersModal: React.FC<ManageTripMembersModalProps> = ({ onClose }) => {
    const modalContent = (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title="Manage Trip Members" onClose={onClose} />
                <div className="p-6">
                    <p className="text-secondary">Participant management functionality coming soon.</p>
                </div>
            </div>
        </div>
    );
    
    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ManageTripMembersModal;