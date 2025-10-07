
import React, { useState, useMemo, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Shop, ShopType, BusinessType } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { SettingsContext } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';

const modalRoot = document.getElementById('modal-root')!;

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
        type: shop?.type || ShopType.PHYSICAL_RETAIL,
        businessType: shop?.businessType || '',
        taxRate: shop?.taxRate?.toString() || '',
    });

    const handleChange = (field: keyof typeof formState, value: string) => {
        setFormState(prev => ({...prev, [field]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formState.name.trim()) {
            onSave({ 
                name: formState.name.trim(), 
                currency: formState.currency, 
                type: formState.type as ShopType,
                businessType: formState.businessType as BusinessType || undefined,
                taxRate: parseFloat(formState.taxRate) || undefined 
            }, shop?.id);
            onCancel();
        }
    };
    
    const currencyOptions = useMemo(() => currencies.map(c => ({ value: c.code, label: `${c.code} - ${c.name}`})), []);
    const shopTypeOptions = useMemo(() => Object.entries(ShopType).map(([key, value]) => ({ value, label: key.replace(/_/g, ' ') })), []);
    const businessTypeOptions = useMemo(() => Object.entries(BusinessType).map(([key, value]) => ({ value, label: value })), []);

    return ReactDOM.createPortal(
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[55] p-4" onClick={onCancel}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title={shop ? 'Edit Shop' : 'Create New Shop'} onClose={onCancel} />
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-secondary mb-1">Shop Name</label>
                        <input type="text" value={formState.name} onChange={e => handleChange('name', e.target.value)} className="w-full input-base p-2 rounded-lg" required autoFocus />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Shop Type</label>
                            <CustomSelect value={formState.type} onChange={val => handleChange('type', val)} options={shopTypeOptions} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Business Type</label>
                            <CustomSelect value={formState.businessType} onChange={val => handleChange('businessType', val)} options={businessTypeOptions} placeholder="Optional" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Default Currency</label>
                            <CustomSelect value={formState.currency} onChange={val => handleChange('currency', val)} options={currencyOptions} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Tax Rate (%)</label>
                            <input type="number" step="0.01" value={formState.taxRate} onChange={e => handleChange('taxRate', e.target.value)} placeholder="e.g. 5" className="w-full input-base p-2 rounded-lg no-spinner" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
                        <button type="submit" className="button-primary px-4 py-2">Save Shop</button>
                    </div>
                </form>
            </div>
        </div>,
        modalRoot
    );
};

export default EditShopModal;
