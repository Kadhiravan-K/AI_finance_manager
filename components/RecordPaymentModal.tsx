import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Invoice, Account, AccountType } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomDatePicker from './CustomDatePicker';

const modalRoot = document.getElementById('modal-root')!;

interface RecordPaymentModalProps {
  invoice: Invoice;
  accounts: Account[];
  onSave: (invoice: Invoice, payment: { accountId: string; amount: number; date: string }) => void;
  onClose: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ invoice, accounts, onSave, onClose }) => {
    const depositoryAccounts = useMemo(() => accounts.filter(a => a.accountType === AccountType.DEPOSITORY), [accounts]);
    const formatCurrency = useCurrencyFormatter(undefined, invoice.shopId ? accounts.find(a => a.currency === invoice.lineItems[0]?.description) ?.currency : undefined);

    const [payment, setPayment] = useState({
        accountId: depositoryAccounts[0]?.id || '',
        amount: invoice.totalAmount.toString(),
        date: new Date(),
    });

    const handleChange = (field: keyof typeof payment, value: string | Date) => {
        setPayment(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(payment.amount);
        if (!payment.accountId || isNaN(amount) || amount <= 0) {
            alert("Please select an account and enter a valid amount.");
            return;
        }
        onSave(invoice, {
            accountId: payment.accountId,
            amount,
            date: payment.date.toISOString(),
        });
        onClose();
    };

    const accountOptions = depositoryAccounts.map(a => ({ value: a.id, label: `${a.name} (${a.currency})` }));

    const modalContent = (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title={`Payment for Invoice #${invoice.invoiceNumber}`} onClose={onClose} />
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-center text-secondary">Total Due: <strong className="text-primary">{formatCurrency(invoice.totalAmount)}</strong></p>
                    
                    <div>
                        <label className="text-sm font-medium text-secondary mb-1">Amount Received</label>
                        <input type="number" step="0.01" value={payment.amount} onChange={e => handleChange('amount', e.target.value)} className="w-full input-base p-2 rounded-lg no-spinner" required autoFocus />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-secondary mb-1">Deposit to Account</label>
                        <CustomSelect options={accountOptions} value={payment.accountId} onChange={val => handleChange('accountId', val)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-secondary mb-1">Payment Date</label>
                        <CustomDatePicker value={payment.date} onChange={d => handleChange('date', d)} />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
                        <button type="submit" className="button-primary px-4 py-2">Record Payment</button>
                    </div>
                </form>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default RecordPaymentModal;
