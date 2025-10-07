import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { ShopShift, ShopEmployee, ActiveModal } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

const modalRoot = document.getElementById('modal-root')!;

interface EditShiftModalProps {
    shift?: ShopShift;
    employees: ShopEmployee[];
    onSave: (shiftData: Omit<ShopShift, 'id' | 'shopId'>, id?: string) => void;
    onClose: () => void;
    openModal: (name: ActiveModal, props?: any) => void;
}

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const EditShiftModal: React.FC<EditShiftModalProps> = ({ shift, employees, onSave, onClose, openModal }) => {
    const isEditing = !!shift;
    const [formData, setFormData] = useState({
        employeeId: shift?.employeeId || (employees.length > 0 ? employees[0].id : ''),
        startDate: new Date(shift?.startTime || new Date()),
        startTime: shift?.startTime ? new Date(shift.startTime).toTimeString().slice(0, 5) : '09:00',
        endDate: new Date(shift?.endTime || new Date(new Date().getTime() + 8 * 60 * 60 * 1000)),
        endTime: shift?.endTime ? new Date(shift.endTime).toTimeString().slice(0, 5) : '17:00',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const getFullDate = (date: Date, time: string) => {
            const newDate = new Date(date);
            const [hours, minutes] = time.split(':').map(Number);
            newDate.setHours(hours, minutes, 0, 0);
            return newDate;
        };

        const finalStartTime = getFullDate(formData.startDate, formData.startTime);
        const finalEndTime = getFullDate(formData.endDate, formData.endTime);

        if (formData.employeeId && finalEndTime > finalStartTime) {
            onSave({
                employeeId: formData.employeeId,
                startTime: finalStartTime.toISOString(),
                endTime: finalEndTime.toISOString(),
            }, shift?.id);
            onClose();
        } else {
            alert("Please select an employee and ensure end time is after start time.");
        }
    };
    
    const employeeOptions = employees.map(e => ({ value: e.id, label: e.name }));

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[55] p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title={isEditing ? 'Edit Shift' : 'Add New Shift'} onClose={onClose} />
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className={labelStyle}>Employee</label>
                        <CustomSelect options={employeeOptions} value={formData.employeeId} onChange={val => setFormData(p => ({...p, employeeId: val}))} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyle}>Start Date & Time</label>
                            <div className="flex gap-2">
                                <CustomDatePicker value={formData.startDate} onChange={d => setFormData(p => ({...p, startDate: d}))} />
                                <button type="button" onClick={() => openModal('timePicker', { initialTime: formData.startTime, onSave: (time: string) => setFormData(p => ({...p, startTime: time}))})} className="input-base p-2 rounded-lg w-full">{formData.startTime}</button>
                            </div>
                        </div>
                        <div>
                            <label className={labelStyle}>End Date & Time</label>
                             <div className="flex gap-2">
                                <CustomDatePicker value={formData.endDate} onChange={d => setFormData(p => ({...p, endDate: d}))} />
                                <button type="button" onClick={() => openModal('timePicker', { initialTime: formData.endTime, onSave: (time: string) => setFormData(p => ({...p, endTime: time}))})} className="input-base p-2 rounded-lg w-full">{formData.endTime}</button>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                        <button type="submit" className="button-primary px-4 py-2">Save Shift</button>
                    </div>
                </form>
            </div>
        </div>,
        modalRoot
    );
};

export default EditShiftModal;
