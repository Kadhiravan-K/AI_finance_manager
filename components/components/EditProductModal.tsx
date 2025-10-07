

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { ShopProduct } from '../../types';
import ModalHeader from '../ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface EditProductModalProps {
    product?: ShopProduct;
    onSave: (productData: Omit<ShopProduct, 'id' | 'shopId'>, id?: string) => void;
    onClose: () => void;
}

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const EditProductModal: React.FC<EditProductModalProps> = ({ product, onSave, onClose }) => {
    const isEditing = !!product;
    const [formData, setFormData] = useState({
        name: product?.name || '',
        price: product?.price.toString() || '',
        stock: product?.stock.toString() || '',
        costPrice: product?.costPrice?.toString() || '',
        category: product?.category || '',
    });

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(formData.price);
        const stock = parseInt(formData.stock, 10);
        const costPrice = parseFloat(formData.costPrice);

        if (formData.name && price > 0 && stock >= 0) {
            onSave({
                name: formData.name,
                price,
                stock,
                costPrice: isNaN(costPrice) ? undefined : costPrice,
                category: formData.category.trim() || undefined,
            }, product?.id);
            onClose();
        } else {
            alert("Please fill all fields with valid values.");
        }
    };

    const modalContent = (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[55] p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title={isEditing ? 'Edit Product' : 'Add New Product'} onClose={onClose} />
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className={labelStyle}>Product Name</label>
                        <input id="name" type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g., Organic Coffee Beans" className="input-base w-full p-2 rounded-lg" required autoFocus />
                    </div>
                    <div>
                        <label htmlFor="category" className={labelStyle}>Category</label>
                        <input id="category" type="text" value={formData.category} onChange={e => handleChange('category', e.target.value)} placeholder="e.g., Beverages" className="input-base w-full p-2 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="costPrice" className={labelStyle}>Cost Price</label>
                            <input id="costPrice" type="number" step="0.01" value={formData.costPrice} onChange={e => handleChange('costPrice', e.target.value)} placeholder="0.00" className="input-base w-full p-2 rounded-lg no-spinner" />
                        </div>
                        <div>
                            <label htmlFor="price" className={labelStyle}>Selling Price</label>
                            <input id="price" type="number" step="0.01" value={formData.price} onChange={e => handleChange('price', e.target.value)} className="input-base w-full p-2 rounded-lg no-spinner" required />
                        </div>
                        <div>
                            <label htmlFor="stock" className={labelStyle}>Stock</label>
                            <input id="stock" type="number" step="1" value={formData.stock} onChange={e => handleChange('stock', e.target.value)} className="input-base w-full p-2 rounded-lg no-spinner" required />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                        <button type="submit" className="button-primary px-4 py-2">Save Product</button>
                    </div>
                </form>
            </div>
        </div>
    );
    
    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default EditProductModal;