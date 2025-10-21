




import React, { useState, useMemo, useContext } from 'react';
import { Shop, ShopProduct, ShopSale, ShopEmployee, ShopShift, ActiveModal, Invoice, InvoiceStatus } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { AppDataContext, SettingsContext } from '../contexts/SettingsContext';
import EmptyState from './EmptyState';
import ShopPOSScreen from './ShopPOSScreen';
import ShopProductsScreen from './ShopProductsScreen';
import ShopAnalyticsScreen from './ShopAnalyticsScreen';
import CustomSelect from './CustomSelect';

interface ShopScreenProps {
  shops: Shop[];
  products: ShopProduct[];
  sales: ShopSale[];
  employees: ShopEmployee[];
  shifts: ShopShift[];
  onSaveShop: (shop: Omit<Shop, 'id'>, id?: string) => void;
  onDeleteShop: (id: string) => void;
  onSaveProduct: (shopId: string, product: Omit<ShopProduct, 'id'|'shopId'>, id?: string) => void;
  onDeleteProduct: (id: string) => void;
  onRecordSale: (shopId: string, sale: Omit<ShopSale, 'id'|'shopId'>) => void;
  onSaveEmployee: (shopId: string, employee: Omit<ShopEmployee, 'id'|'shopId'>, id?: string) => void;
  onDeleteEmployee: (id: string) => void;
  onSaveShift: (shopId: string, shift: Omit<ShopShift, 'id'|'shopId'>, id?: string) => void;
  onDeleteShift: (id: string) => void;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

type ShopDetailsTab = 'billing' | 'products' | 'invoices' | 'analytics' | 'employees';

const InvoicesList: React.FC<{ shop: Shop; openModal: (name: ActiveModal, props?: any) => void }> = ({ shop, openModal }) => {
    const { invoices } = useContext(AppDataContext);
    const { contacts } = useContext(SettingsContext);
    const formatCurrency = useCurrencyFormatter(undefined, shop.currency);

    const shopInvoices = useMemo(() => (invoices || []).filter(inv => inv.shopId === shop.id), [invoices, shop.id]);
    const contactMap = useMemo(() => new Map(contacts.map(c => [c.id, c.name])), [contacts]);

    const statusColors: Record<Invoice['status'], string> = {
        [InvoiceStatus.DRAFT]: 'bg-slate-500', 
        [InvoiceStatus.SENT]: 'bg-sky-500', 
        [InvoiceStatus.PAID]: 'bg-emerald-500', 
        [InvoiceStatus.OVERDUE]: 'bg-rose-500'
    };
    
    return (
        <div className="space-y-3">
             {shopInvoices.map(invoice => (
                <div key={invoice.id} className="p-3 bg-subtle rounded-lg group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-primary">Invoice #{invoice.invoiceNumber}</p>
                            <p className="text-xs text-secondary">To: {contactMap.get(invoice.contactId) || 'Unknown'}</p>
                            <p className="text-xs text-tertiary">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-primary">{formatCurrency(invoice.totalAmount)}</p>
                            <div className="flex items-center justify-end gap-2 mt-1">
                                <span className={`px-2 py-0.5 text-xs font-semibold text-white rounded-full ${statusColors[invoice.status]}`}>{invoice.status}</span>
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-divider opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal('editInvoice', { invoice, shop })} className="text-xs px-2 py-1 text-sky-300">Edit</button>
                        {invoice.status !== 'Paid' && <button onClick={() => openModal('recordPayment', { invoice })} className="button-primary px-3 py-1 text-sm">Record Payment</button>}
                    </div>
                </div>
            ))}
            {shopInvoices.length === 0 && <p className="text-center text-secondary py-8">No invoices created for this shop yet.</p>}
        </div>
    );
};

const ShopEmployeesScreen: React.FC<{
    shop: Shop;
    employees: ShopEmployee[];
    shifts: ShopShift[];
    onDeleteEmployee: (id: string) => void;
    onDeleteShift: (id: string) => void;
    openModal: (name: ActiveModal, props?: any) => void;
}> = ({ shop, employees, shifts, onDeleteEmployee, onDeleteShift, openModal }) => {
    const formatCurrency = useCurrencyFormatter(undefined, shop.currency);
    const shopEmployees = employees.filter(e => e.shopId === shop.id);
    const shopShifts = shifts.filter(s => s.shopId === shop.id).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg text-primary">Employees</h3>
                    <button onClick={() => openModal('editEmployee', { shopId: shop.id })} className="button-secondary text-sm px-3 py-1">+ Add Employee</button>
                </div>
                <div className="space-y-2">
                    {shopEmployees.map(emp => (
                        <div key={emp.id} className="p-3 bg-subtle rounded-lg group">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-primary">{emp.name}</p>
                                    <p className="text-xs text-secondary">{emp.role} - {formatCurrency(emp.wage)}/hr</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100">
                                    <button onClick={() => openModal('editEmployee', { employee: emp, shopId: shop.id })} className="text-xs px-2 py-1 text-sky-300">Edit</button>
                                    <button onClick={() => onDeleteEmployee(emp.id)} className="text-xs px-2 py-1 text-rose-400">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {shopEmployees.length === 0 && <p className="text-center text-sm text-secondary py-4">No employees added yet.</p>}
                </div>
            </div>
            <div>
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg text-primary">Shifts</h3>
                    <button onClick={() => openModal('editShift', { shopId: shop.id, employees: shopEmployees })} className="button-secondary text-sm px-3 py-1" disabled={shopEmployees.length === 0}>+ Add Shift</button>
                </div>
                 <div className="space-y-2">
                    {shopShifts.map(shift => {
                        const employee = shopEmployees.find(e => e.id === shift.employeeId);
                        return (
                            <div key={shift.id} className="p-3 bg-subtle rounded-lg group">
                                <p className="font-semibold text-primary">{employee?.name || 'Unknown'}</p>
                                <p className="text-xs text-secondary">
                                    {new Date(shift.startTime).toLocaleString()} - {new Date(shift.endTime).toLocaleString()}
                                </p>
                                 <div className="flex justify-end opacity-0 group-hover:opacity-100">
                                    <button onClick={() => openModal('editShift', { shift, shopId: shop.id, employees: shopEmployees })} className="text-xs px-2 py-1 text-sky-300">Edit</button>
                                    <button onClick={() => onDeleteShift(shift.id)} className="text-xs px-2 py-1 text-rose-400">Delete</button>
                                </div>
                            </div>
                        );
                    })}
                     {shopShifts.length === 0 && <p className="text-center text-sm text-secondary py-4">No shifts recorded yet.</p>}
                </div>
            </div>
        </div>
    );
};

const ShopDetails: React.FC<Omit<ShopScreenProps, 'shops' | 'onSaveShop' | 'onDeleteShop'> & {shop: Shop; onBack: () => void;}> = ({ shop, openModal, products, sales, employees, shifts, onDeleteProduct, onRecordSale, onDeleteEmployee, onDeleteShift, onBack }) => {
    const [activeTab, setActiveTab] = useState<ShopDetailsTab>('billing');

    // FIX: Add children to TabButton to resolve type error.
    const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; }> = ({ active, onClick, children }) => (
        <button type="button" onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`}>
            {children}
        </button>
    );
    
    const shopProducts = useMemo(() => products.filter(p => p.shopId === shop.id), [products, shop.id]);
    const shopSales = useMemo(() => sales.filter(s => s.shopId === shop.id), [sales, shop.id]);

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between gap-4">
                <button onClick={onBack} className="p-2 -ml-2 text-secondary hover:text-primary rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-2xl font-bold text-primary truncate">{shop.name}</h2>
                <button onClick={() => openModal('editShop', { shop: shop })} className="button-secondary text-sm p-2 rounded-full aspect-square">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
            </div>
            <div className="flex-shrink-0 p-2 overflow-x-auto border-b border-divider">
                <div className="flex items-center gap-1 pos-category-tabs">
                    <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')}>Billing</TabButton>
                    <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')}>Products</TabButton>
                    <TabButton active={activeTab === 'invoices'} onClick={() => setActiveTab('invoices')}>Invoices</TabButton>
                    <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>Analytics</TabButton>
                    <TabButton active={activeTab === 'employees'} onClick={() => setActiveTab('employees')}>Employees</TabButton>
                </div>
            </div>
             <div className="flex-grow overflow-y-auto p-6">
                {activeTab === 'billing' && <ShopPOSScreen shop={shop} products={shopProducts} onRecordSale={onRecordSale} />}
                {activeTab === 'products' && <ShopProductsScreen shop={shop} products={shopProducts} onDelete={onDeleteProduct} openModal={openModal} />}
                {activeTab === 'invoices' && <InvoicesList shop={shop} openModal={openModal} />}
                {activeTab === 'analytics' && <ShopAnalyticsScreen shop={shop} sales={shopSales} products={shopProducts} />}
                {activeTab === 'employees' && <ShopEmployeesScreen shop={shop} employees={employees} shifts={shifts} onDeleteEmployee={onDeleteEmployee} onDeleteShift={onDeleteShift} openModal={openModal} />}
             </div>
             {activeTab === 'invoices' && (
                <div className="p-4 border-t border-divider flex-shrink-0">
                    <button onClick={() => openModal('editInvoice', { shop })} className="button-primary w-full py-2">+ Create New Invoice</button>
                </div>
             )}
        </div>
    )
};

export const ShopScreen: React.FC<ShopScreenProps> = ({ shops, openModal, ...rest }) => {
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

    if (shops.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4">
                 <EmptyState
                    icon="🏪"
                    title="Welcome to the Shop Hub"
                    message="Create your first shop to start managing sales, products, and invoices."
                    actionText="Create First Shop"
                    onAction={() => openModal('editShop')}
                />
            </div>
        )
    }

    const selectedShop = shops.find(s => s.id === selectedShopId);

    if (selectedShop) {
        return <ShopDetails shop={selectedShop} openModal={openModal} onBack={() => setSelectedShopId(null)} {...rest} />;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary">Shop Hub</h2>
                <button onClick={() => openModal('editShop')} className="button-primary text-sm px-4 py-2">
                    + Add Shop
                </button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-3">
                {shops.map(shop => (
                    <button key={shop.id} onClick={() => setSelectedShopId(shop.id)} className="w-full text-left p-4 bg-subtle rounded-lg flex justify-between items-center hover-bg-stronger transition-colors">
                        <div>
                            <p className="font-semibold text-primary">{shop.name}</p>
                            <p className="text-xs text-secondary">{shop.type}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                ))}
            </div>
        </div>
    );
};
