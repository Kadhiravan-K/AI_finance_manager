import React, { useState, useMemo, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Shop, ShopType } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { SettingsContext } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';

interface EditShopModalProps {
    shop: Shop | null;
    onSave: (shop: Omit<Shop, 'id'>, id?: string) => void;
    onCancel: () => void;
}

const EditShopModal: React.FC<EditShopModalProps> = ({ shop, onSave, onCancel }) => {
    const { settings } = useContext(SettingsContext);
    const [formState, setFormState] = useState({
        name: shop?.name || '',
        currency: shop?.currency || settings.currency,
        type: shop?.type || 'physical',
    });

    const handleChange = (field: keyof typeof formState, value: string) => {
        setFormState(prev => ({...prev, [field]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formState.name.trim()) {
            onSave({ name: formState.name.trim(), currency: formState.currency, type: formState.type as ShopType }, shop?.id);
        }
    };
    
    const currencyOptions = useMemo(() => currencies.map(c => ({
        value: c.code,
        label: `${c.code} - ${c.name}`
    })), []);
    
    const shopTypeOptions: { value: ShopType, label: string }[] = [
        { value: 'physical', label: 'Physical' },
        { value: 'online', label: 'Online' },
        { value: 'freelance', label: 'Freelance' },
        { value: 'garage_sale', label: 'Garage Sale' },
        { value: 'other', label: 'Other' }
    ];

    const modalContent = (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title={shop ? 'Edit Shop' : 'Create New Shop'} onClose={onCancel} />
                 <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" value={formState.name} onChange={e => handleChange('name', e.target.value)} placeholder="Shop Name" className="w-full input-base p-2 rounded-md sm:col-span-2" required autoFocus/>
                        <CustomSelect options={shopTypeOptions} value={formState.type} onChange={val => handleChange('type', val)} />
                        <CustomSelect options={currencyOptions} value={formState.currency} onChange={val => handleChange('currency', val)} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
                        <button type="submit" className="button-primary px-4 py-2">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
    
    return ReactDOM.createPortal(modalContent, document.getElementById('modal-root')!);
};

export default EditShopModal;
