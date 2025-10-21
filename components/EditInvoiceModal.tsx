

import React, { useState, useMemo, useContext, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Invoice, Shop, Contact, InvoiceLineItem, ShopProduct, InvoiceStatus } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomDatePicker from './CustomDatePicker';
import { SettingsContext } from '../contexts/SettingsContext';

const modalRoot = document.getElementById('modal-root')!;

interface EditInvoiceModalProps {
  invoice?: Invoice;
  shop: Shop;
  contacts: Contact[];
  products: ShopProduct[];
  onSave: (invoiceData: Omit<Invoice, 'id'>, id?: string) => void;
  onClose: () => void;
}

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ invoice, shop, contacts, products, onSave, onClose }) => {
    const isEditing = !!invoice;
    const formatCurrency = useCurrencyFormatter(undefined, shop.currency);
    const shopProducts = useMemo(() => products.filter(p => p.shopId === shop.id), [products, shop.id]);

    const [formState, setFormState] = useState({
        contactId: invoice?.contactId || '',
        issueDate: new Date(invoice?.issueDate || new Date()),
        dueDate: new Date(invoice?.dueDate || new Date()),
        notes: invoice?.notes || '',
    });

    const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(invoice?.lineItems || [{ id: self.crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]);
    
    const totals = useMemo(() => {
        const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const tax = subtotal * ((shop.taxRate || 0) / 100);
        const total = subtotal + tax;
        return { subtotal, tax, total };
    }, [lineItems, shop.taxRate]);

    const handleItemChange = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
        setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleProductSelect = (id: string, productId: string) => {
        const product = shopProducts.find(p => p.id === productId);
        if (product) {
            setLineItems(prev => prev.map(item => item.id === id ? { ...item, description: product.name, unitPrice: product.price } : item));
        }
    };

    const handleAddItem = () => setLineItems(prev => [...prev, { id: self.crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]);
    const handleRemoveItem = (id: string) => setLineItems(prev => prev.filter(item => item.id !== id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.contactId || lineItems.length === 0 || totals.total <= 0) {
            alert("Please select a customer and add at least one valid line item.");
            return;
        }

        const invoiceData: Omit<Invoice, 'id'> = {
            invoiceNumber: invoice?.invoiceNumber || String(Date.now()).slice(-6),
            shopId: shop.id,
            contactId: formState.contactId,
            issueDate: formState.issueDate.toISOString(),
            dueDate: formState.dueDate.toISOString(),
            lineItems,
            taxRate: shop.taxRate || 0,
            totalAmount: totals.total,
            status: invoice?.status || InvoiceStatus.DRAFT,
            notes: formState.notes,
        };
        onSave(invoiceData, invoice?.id);
        onClose();
    };
    
    const contactOptions = contacts.map(c => ({ value: c.id, label: c.name }));
    const productOptions = [{value: '', label: 'Select a product'}, ...shopProducts.map(p => ({value: p.id, label: `${p.name} - ${formatCurrency(p.price)}`}))];

    const modalContent = (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[55] p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-2xl p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title={isEditing ? 'Edit Invoice' : 'Create Invoice'} onClose={onClose} />
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2"><label className="text-sm font-medium text-secondary mb-1">Customer</label><CustomSelect options={contactOptions} value={formState.contactId} onChange={val => setFormState(p => ({...p, contactId: val}))} placeholder="Select a customer..." /></div>
                        <div><label className="text-sm font-medium text-secondary mb-1">Invoice #</label><input type="text" value={invoice?.invoiceNumber || 'Auto'} readOnly className="w-full input-base p-2 rounded-lg" /></div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-secondary mb-1">Issue Date</label><CustomDatePicker value={formState.issueDate} onChange={d => setFormState(p => ({...p, issueDate: d}))} /></div>
                        <div><label className="text-sm font-medium text-secondary mb-1">Due Date</label><CustomDatePicker value={formState.dueDate} onChange={d => setFormState(p => ({...p, dueDate: d}))} /></div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-divider">
                        {lineItems.map(item => (
                            <div key={item.id} className="grid grid-cols-[1fr_80px_100px_auto] gap-2 items-center">
                                <CustomSelect options={productOptions} value={""} onChange={val => handleProductSelect(item.id, val)} />
                                <input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="input-base p-2 rounded-lg text-center no-spinner" min="1" />
                                <input type="number" step="0.01" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="input-base p-2 rounded-lg text-right no-spinner" />
                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-rose-400 p-2">×</button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddItem} className="w-full text-center p-2 text-sm text-sky-400 hover:text-sky-300">+ Add Line Item</button>
                    </div>

                    <div className="pt-4 border-t border-divider grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-secondary mb-1">Notes</label>
                            <textarea value={formState.notes} onChange={e => setFormState(p => ({...p, notes: e.target.value}))} rows={3} className="input-base w-full p-2 rounded-lg resize-none" />
                        </div>
                        <div className="space-y-2 text-right">
                            <div className="flex justify-between items-center"><span className="text-secondary">Subtotal:</span><span className="text-primary">{formatCurrency(totals.subtotal)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-secondary">Tax ({shop.taxRate || 0}%):</span><span className="text-primary">{formatCurrency(totals.tax)}</span></div>
                            <div className="flex justify-between items-center font-bold text-lg border-t border-divider pt-2 mt-2"><span className="text-primary">Total:</span><span className="text-primary">{formatCurrency(totals.total)}</span></div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                        <button type="submit" className="button-primary px-4 py-2">Save Invoice</button>
                    </div>
                </form>
            </div>
        </div>
    );
    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default EditInvoiceModal;