import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { ShopEmployee } from '../types';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface EditEmployeeModalProps {
    employee?: ShopEmployee;
    onSave: (employeeData: Omit<ShopEmployee, 'id' | 'shopId'>, id?: string) => void;
    onClose: () => void;
}

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ employee, onSave, onClose }) => {
    const isEditing = !!employee;
    const [formData, setFormData] = useState({
        name: employee?.name || '',
        role: employee?.role || '',
        wage: employee?.wage.toString() || '',
    });

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const wage = parseFloat(formData.wage);
        if (formData.name && formData.role && wage >= 0) {
            onSave({
                name: formData.name,
                role: formData.role,
                wage,
            }, employee?.id);
            onClose();
        } else {
            alert("Please fill all fields with valid values.");
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[55] p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title={isEditing ? 'Edit Employee' : 'Add New Employee'} onClose={onClose} />
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className={labelStyle}>Employee Name</label>
                        <input id="name" type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g., John Doe" className="input-base w-full p-2 rounded-lg" required autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="role" className={labelStyle}>Role</label>
                            <input id="role" type="text" value={formData.role} onChange={e => handleChange('role', e.target.value)} placeholder="e.g., Cashier" className="input-base w-full p-2 rounded-lg" required />
                        </div>
                        <div>
                            <label htmlFor="wage" className={labelStyle}>Wage (per hour)</label>
                            <input id="wage" type="number" step="0.01" value={formData.wage} onChange={e => handleChange('wage', e.target.value)} className="input-base w-full p-2 rounded-lg no-spinner" required />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                        <button type="submit" className="button-primary px-4 py-2">Save Employee</button>
                    </div>
                </form>
            </div>
        </div>,
        modalRoot
    );
};

export default EditEmployeeModal;
