import React, { useState, useRef, useEffect, useCallback, useMemo, useContext } from 'react';
// FIX: Added ShopType to the import list to resolve type errors.
import { Shop, ShopProduct, ShopSale, ShopSaleItem, ShopEmployee, ShopShift, ShopType } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { SettingsContext } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';
import { getCurrencyFormatter } from '../utils/currency';

type ShopView = 'billing' | 'products' | 'employees' | 'shifts' | 'analytics';

// Form for creating/editing a product
const ProductForm: React.FC<{
    product: ShopProduct | null, 
    onSave: (productData: Omit<ShopProduct, 'id' | 'shopId'>, id?: string) => void, 
    onCancel: () => void
}> = ({ product, onSave, onCancel }) => {
    const [formState, setFormState] = useState({
        name: product?.name || '',
        qrCode: product?.qrCode || '',
        stockQuantity: product?.stockQuantity.toString() || '',
        purchasePrice: product?.purchasePrice.toString() || '',
        sellingPrice: product?.sellingPrice.toString() || '',
        categoryId: product?.categoryId || 'default-shop-category-id' // Placeholder to satisfy type
    });

    const handleChange = (field: keyof typeof formState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, stockQuantity, purchasePrice, sellingPrice } = formState;
        if (name.trim()) {
            onSave({
                ...formState,
                stockQuantity: parseInt(stockQuantity) || 0,
                purchasePrice: parseFloat(purchasePrice) || 0,
                sellingPrice: parseFloat(sellingPrice) || 0,
            }, product?.id);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-divider bg-subtle space-y-3">
            <h4 className="font-semibold text-primary">{product ? 'Edit Product' : 'Create New Product'}</h4>
            <div className="grid grid-cols-2 gap-3">
                <input type="text" value={formState.name} onChange={e => handleChange('name', e.target.value)} placeholder="Product Name" className="w-full input-base p-2 rounded-md col-span-2" required/>
                <input type="number" value={formState.stockQuantity} onChange={e => handleChange('stockQuantity', e.target.value)} placeholder="Stock Quantity" className="w-full input-base p-2 rounded-md no-spinner" />
                <input type="text" value={formState.qrCode} onChange={e => handleChange('qrCode', e.target.value)} placeholder="Barcode/QR (Optional)" className="w-full input-base p-2 rounded-md" />
                <input type="text" inputMode="decimal" value={formState.purchasePrice} onChange={e => handleChange('purchasePrice', e.target.value)} placeholder="Purchase Price (e.g. 10.50)" className="w-full input-base p-2 rounded-md no-spinner" />
                <input type="text" inputMode="decimal" value={formState.sellingPrice} onChange={e => handleChange('sellingPrice', e.target.value)} placeholder="Selling Price (e.g. 15.00)" className="w-full input-base p-2 rounded-md no-spinner" />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
                <button type="submit" className="button-primary px-4 py-2">Save</button>
            </div>
        </form>
    );
};


// Main Screen Props
interface ShopScreenProps {
    shops: Shop[];
    products: ShopProduct[];
    sales: ShopSale[];
    employees: ShopEmployee[];
    shifts: ShopShift[];
    onSaveShop: (shop: Omit<Shop, 'id'>, id?: string) => void;
    onDeleteShop: (id: string) => void;
    onSaveProduct: (shopId: string, product: Omit<ShopProduct, 'id' | 'shopId'>, id?: string) => void;
    onDeleteProduct: (id: string) => void;
    onRecordSale: (shopId: string, sale: Omit<ShopSale, 'id' | 'shopId'>) => void;
    onSaveEmployee: (shopId: string, employee: Omit<ShopEmployee, 'id' | 'shopId'>, id?: string) => void;
    onDeleteEmployee: (id: string) => void;
    onSaveShift: (shopId: string, shift: Omit<ShopShift, 'id' | 'shopId'>, id?: string) => void;
    onDeleteShift: (id: string) => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = (props) => {
    const [selectedShopId, setSelectedShopId] = useState<string | null>(props.shops.length === 1 ? props.shops[0].id : null);
    const selectedShop = props.shops.find(s => s.id === selectedShopId);

    if (selectedShopId && selectedShop) {
        return <ShopDetailView 
            shop={selectedShop} 
            products={props.products.filter(p => p.shopId === selectedShopId)} 
            sales={props.sales.filter(s => s.shopId === selectedShopId)}
            employees={props.employees.filter(e => e.shopId === selectedShopId)}
            shifts={props.shifts.filter(s => s.shopId === selectedShopId)}
            onBack={() => setSelectedShopId(null)}
            {...props}
        />
    }

    return <ShopDashboard {...props} onSelectShop={setSelectedShopId} />;
};

const ShopDashboard: React.FC<ShopScreenProps & { onSelectShop: (id: string) => void }> = ({ shops, sales, onSelectShop, onSaveShop, onDeleteShop }) => {
    const [isFormOpen, setIsFormOpen] = useState(shops.length === 0);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);

    const shopsByCurrency = useMemo(() => {
        return shops.reduce((acc, shop) => {
            (acc[shop.currency] = acc[shop.currency] || []).push(shop);
            return acc;
        }, {} as Record<string, Shop[]>);
    }, [shops]);

    const profitByShop = useMemo(() => {
        const profitMap = new Map<string, number>();
        sales.forEach(sale => {
            profitMap.set(sale.shopId, (profitMap.get(sale.shopId) || 0) + sale.profit);
        });
        return profitMap;
    }, [sales]);

    const handleEdit = (shop: Shop) => {
        setEditingShop(shop);
        setIsFormOpen(true);
    };

    const handleCancel = () => {
        setEditingShop(null);
        setIsFormOpen(false);
    };
    
    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0">
                <h2 className="text-2xl font-bold text-primary text-center">Shop Hub 🏪</h2>
            </div>
            <div className="flex-grow p-6 pt-4 overflow-y-auto space-y-4">
                {Object.entries(shopsByCurrency).map(([currency, currencyShops]) => {
                    const currencyProfit = currencyShops.reduce((sum, shop) => sum + (profitByShop.get(shop.id) || 0), 0);
                    const formatCurrency = getCurrencyFormatter(currency).format;

                    return (
                        <div key={currency}>
                            <div className="flex justify-between items-baseline mb-2 p-2 bg-subtle rounded-t-lg">
                                <h3 className="font-semibold text-lg text-secondary">{currency} Shops</h3>
                                <span className={`font-bold ${currencyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatCurrency(currencyProfit)}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {currencyShops.map(shop => {
                                    const shopProfit = profitByShop.get(shop.id) || 0;
                                    return (
                                        <div key={shop.id} className="p-3 bg-subtle rounded-lg group flex justify-between items-center hover:scale-[1.02] transition-transform">
                                            <div onClick={() => onSelectShop(shop.id)} className="flex-grow cursor-pointer">
                                                <p className="font-semibold text-primary">{shop.name}</p>
                                                <p className={`text-sm font-medium ${shopProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {shopProfit >= 0 ? 'Profit: ' : 'Loss: '} {formatCurrency(Math.abs(shopProfit))}
                                                </p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(shop)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                                                <button onClick={() => onDeleteShop(shop.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full ml-1">Delete</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}
                {shops.length === 0 && !isFormOpen && <p className="text-center text-secondary py-8">Create your first shop to get started.</p>}
            </div>
            {!isFormOpen && <div className="p-4 border-t border-divider"><button onClick={() => setIsFormOpen(true)} className="button-primary w-full py-2">Create New Shop</button></div>}
            {isFormOpen && <ShopForm shop={editingShop} onSave={onSaveShop} onCancel={handleCancel} />}
        </div>
    );
};

const ShopForm: React.FC<{shop: Shop | null, onSave: ShopScreenProps['onSaveShop'], onCancel: () => void}> = ({ shop, onSave, onCancel }) => {
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
            // FIX: The 'type' property was missing. Added it to the object passed to onSave.
            onSave({ name: formState.name.trim(), currency: formState.currency, type: formState.type as ShopType }, shop?.id);
        }
        onCancel();
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

    return (
         <form onSubmit={handleSubmit} className="p-4 border-t border-divider bg-subtle space-y-3">
             <h4 className="font-semibold text-primary">{shop ? 'Edit Shop' : 'Create New Shop'}</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" value={formState.name} onChange={e => handleChange('name', e.target.value)} placeholder="Shop Name" className="w-full input-base p-2 rounded-md sm:col-span-2" required/>
                <CustomSelect options={shopTypeOptions} value={formState.type} onChange={val => handleChange('type', val)} />
                <CustomSelect options={currencyOptions} value={formState.currency} onChange={val => handleChange('currency', val)} />
             </div>
             <div className="flex justify-end gap-2">
                 <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
                 <button type="submit" className="button-primary px-4 py-2">Save</button>
             </div>
        </form>
    );
}

interface ShopDetailViewProps extends ShopScreenProps {
    shop: Shop;
    onBack: () => void;
}

const ShopDetailView: React.FC<ShopDetailViewProps> = (props) => {
    const [view, setView] = useState<ShopView>('billing');
    const { shop, onBack, products, sales, employees, shifts, onSaveProduct, onDeleteProduct, onRecordSale, onSaveEmployee, onDeleteEmployee, onSaveShift, onDeleteShift } = props;

    const renderView = () => {
        switch(view) {
            case 'products': return <ShopProductsManager shopId={shop.id} products={products} onSaveProduct={onSaveProduct} onDeleteProduct={onDeleteProduct} />;
            case 'employees': return <ShopEmployeesManager shopId={shop.id} employees={employees} shifts={shifts} onSaveEmployee={onSaveEmployee} onDeleteEmployee={onDeleteEmployee} />;
            case 'shifts': return <ShopShiftsManager shopId={shop.id} shifts={shifts} onSaveShift={onSaveShift} onDeleteShift={onDeleteShift} />;
            case 'billing': return <ShopBilling shop={shop} products={products} onRecordSale={onRecordSale} />;
            case 'analytics': return <ShopAnalytics sales={sales} products={products} shop={shop} />;
        }
    }
    
    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-2 -ml-2 text-secondary hover:text-primary rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                    <h2 className="text-xl font-bold text-primary">{shop.name}</h2>
                </div>
                 <div className="flex items-center gap-1 bg-subtle p-1 rounded-full border border-divider">
                    <button onClick={() => setView('billing')} className={`px-3 py-1 text-xs rounded-full ${view === 'billing' ? 'bg-emerald-500 text-white' : ''}`}>Billing</button>
                    <button onClick={() => setView('products')} className={`px-3 py-1 text-xs rounded-full ${view === 'products' ? 'bg-emerald-500 text-white' : ''}`}>Products</button>
                    <button onClick={() => setView('employees')} className={`px-3 py-1 text-xs rounded-full ${view === 'employees' ? 'bg-emerald-500 text-white' : ''}`}>Employees</button>
                    <button onClick={() => setView('shifts')} className={`px-3 py-1 text-xs rounded-full ${view === 'shifts' ? 'bg-emerald-500 text-white' : ''}`}>Shifts</button>
                    <button onClick={() => setView('analytics')} className={`px-3 py-1 text-xs rounded-full ${view === 'analytics' ? 'bg-emerald-500 text-white' : ''}`}>Analytics</button>
                </div>
            </div>
            {renderView()}
        </div>
    );
};

// ... other components from original file

const ShopProductsManager: React.FC<{shopId: string, products: ShopProduct[], onSaveProduct: ShopScreenProps['onSaveProduct'], onDeleteProduct: ShopScreenProps['onDeleteProduct']}> = ({ shopId, products, onSaveProduct, onDeleteProduct }) => { 
    const [isFormOpen, setIsFormOpen] = useState(products.length === 0);
    const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
    const formatCurrency = useCurrencyFormatter();

    const handleEdit = (product: ShopProduct) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    }
    
    const handleCancel = () => {
        setEditingProduct(null);
        setIsFormOpen(false);
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow p-6 overflow-y-auto space-y-2">
                {products.map(p => (
                    <div key={p.id} className="p-3 bg-subtle rounded-lg group flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-primary">{p.name}</p>
                            <p className="text-xs text-secondary">Stock: {p.stockQuantity} | Price: {formatCurrency(p.sellingPrice)}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(p)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                            <button onClick={() => onDeleteProduct(p.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full ml-1">Delete</button>
                        </div>
                    </div>
                ))}
                {products.length === 0 && !isFormOpen && <p className="text-center text-secondary py-8">No products added yet.</p>}
            </div>
            {!isFormOpen && <div className="p-4 border-t border-divider"><button onClick={() => setIsFormOpen(true)} className="button-primary w-full py-2">Add New Product</button></div>}
            {isFormOpen && <ProductForm product={editingProduct} onSave={(prod, id) => onSaveProduct(shopId, prod, id)} onCancel={handleCancel} />}
        </div>
    );
}

const ShopEmployeesManager: React.FC<{shopId: string, employees: ShopEmployee[], shifts: ShopShift[], onSaveEmployee: ShopScreenProps['onSaveEmployee'], onDeleteEmployee: ShopScreenProps['onDeleteEmployee']}> = ({ shopId, employees, shifts, onSaveEmployee, onDeleteEmployee }) => {
    const [isFormOpen, setIsFormOpen] = useState(employees.length === 0);
    const [editingEmployee, setEditingEmployee] = useState<ShopEmployee | null>(null);
    
    const handleEdit = (employee: ShopEmployee) => {
        setEditingEmployee(employee);
        setIsFormOpen(true);
    }
    
    const handleCancel = () => {
        setEditingEmployee(null);
        setIsFormOpen(false);
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow p-6 overflow-y-auto space-y-2">
                 {employees.map(e => (
                    <div key={e.id} className="p-3 bg-subtle rounded-lg group flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-primary">{e.name}</p>
                            <p className="text-xs text-secondary">{shifts.find(s => s.id === e.shiftId)?.name || 'No Shift'}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEdit(e)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                             <button onClick={() => onDeleteEmployee(e.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full ml-1">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
            {!isFormOpen && <div className="p-4 border-t border-divider"><button onClick={() => setIsFormOpen(true)} className="button-primary w-full py-2">Add New Employee</button></div>}
            {isFormOpen && <EmployeeForm employee={editingEmployee} shifts={shifts} onSave={(emp, id) => onSaveEmployee(shopId, emp, id)} onCancel={handleCancel} />}
        </div>
    );
};

const EmployeeForm: React.FC<{employee: ShopEmployee | null, shifts: ShopShift[], onSave: (emp: Omit<ShopEmployee, 'id' | 'shopId'>, id?: string) => void, onCancel: () => void}> = ({ employee, shifts, onSave, onCancel }) => {
    const [form, setForm] = useState({ name: employee?.name || '', contactInfo: employee?.contactInfo || '', salary: employee?.salary?.toString() || '', shiftId: employee?.shiftId || '' });
    const shiftOptions = shifts.map(s => ({ value: s.id, label: s.name }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...form, salary: parseFloat(form.salary) || undefined }, employee?.id);
    };
    
    return (
         <form onSubmit={handleSubmit} className="p-4 border-t border-divider bg-subtle space-y-3">
            <input type="text" value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} placeholder="Employee Name" className="w-full input-base p-2 rounded-md" required/>
            <div className="grid grid-cols-2 gap-3">
                <input type="text" value={form.contactInfo} onChange={e => setForm(f=>({...f, contactInfo: e.target.value}))} placeholder="Contact Info (Optional)" className="w-full input-base p-2 rounded-md"/>
                <input type="text" inputMode="decimal" value={form.salary} onChange={e => setForm(f=>({...f, salary: e.target.value}))} placeholder="Salary (Optional)" className="w-full input-base p-2 rounded-md no-spinner" />
            </div>
            <CustomSelect options={shiftOptions} value={form.shiftId} onChange={val => setForm(f=>({...f, shiftId: val}))} placeholder="Assign Shift..." />
            <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button><button type="submit" className="button-primary px-4 py-2">Save</button></div>
        </form>
    );
};

const ShopShiftsManager: React.FC<{shopId: string, shifts: ShopShift[], onSaveShift: ShopScreenProps['onSaveShift'], onDeleteShift: ShopScreenProps['onDeleteShift']}> = ({ shopId, shifts, onSaveShift, onDeleteShift }) => {
    const [isFormOpen, setIsFormOpen] = useState(shifts.length === 0);
    const [editingShift, setEditingShift] = useState<ShopShift | null>(null);

    const handleEdit = (shift: ShopShift) => { setEditingShift(shift); setIsFormOpen(true); };
    const handleCancel = () => { setEditingShift(null); setIsFormOpen(false); };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow p-6 overflow-y-auto space-y-2">
                 {shifts.map(s => (
                    <div key={s.id} className="p-3 bg-subtle rounded-lg group flex justify-between items-center">
                        <div><p className="font-semibold text-primary">{s.name}</p><p className="text-xs text-secondary">{s.startTime} - {s.endTime}</p></div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEdit(s)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button><button onClick={() => onDeleteShift(s.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full ml-1">Delete</button></div>
                    </div>
                ))}
            </div>
            {!isFormOpen && <div className="p-4 border-t border-divider"><button onClick={() => setIsFormOpen(true)} className="button-primary w-full py-2">Add New Shift</button></div>}
            {isFormOpen && <ShiftForm shift={editingShift} onSave={(shift, id) => onSaveShift(shopId, shift, id)} onCancel={handleCancel} />}
        </div>
    );
};

const ShiftForm: React.FC<{shift: ShopShift | null, onSave: (s: Omit<ShopShift, 'id' | 'shopId'>, id?:string) => void, onCancel: () => void}> = ({ shift, onSave, onCancel }) => {
    const [form, setForm] = useState({ name: shift?.name || '', startTime: shift?.startTime || '', endTime: shift?.endTime || '' });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form, shift?.id); };
    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-divider bg-subtle space-y-3">
            <input type="text" value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} placeholder="Shift Name" className="w-full input-base p-2 rounded-md" required/>
            <div className="grid grid-cols-2 gap-3">
                <input type="time" value={form.startTime} onChange={e => setForm(f=>({...f, startTime: e.target.value}))} className="w-full input-base p-2 rounded-md"/>
                <input type="time" value={form.endTime} onChange={e => setForm(f=>({...f, endTime: e.target.value}))} className="w-full input-base p-2 rounded-md"/>
            </div>
            <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button><button type="submit" className="button-primary px-4 py-2">Save</button></div>
        </form>
    );
};

const CustomItemForm: React.FC<{onSave: (name: string, price: number, quantity: number) => void, onClose: () => void}> = ({ onSave, onClose }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('1');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && parseFloat(price) > 0 && parseInt(quantity) > 0) {
            onSave(name.trim(), parseFloat(price), parseInt(quantity));
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="glass-card rounded-lg w-full max-w-sm flex flex-col" onClick={e => e.stopPropagation()}>
                <ModalHeader title="Add Custom Item" onClose={onClose} />
                <div className="p-4 space-y-3">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Item Name" className="w-full input-base p-2 rounded-md" required autoFocus />
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" className="w-full input-base p-2 rounded-md no-spinner" required />
                        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Quantity" className="w-full input-base p-2 rounded-md no-spinner" required />
                    </div>
                </div>
                <div className="p-4 border-t border-divider flex justify-end">
                    <button type="submit" className="button-primary px-4 py-2">Add to Cart</button>
                </div>
            </form>
        </div>
    );
};

const ShopBilling: React.FC<{shop: Shop, products: ShopProduct[], onRecordSale: ShopScreenProps['onRecordSale']}> = ({ shop, products, onRecordSale }) => {
    const formatCurrency = useCurrencyFormatter(undefined, shop.currency);
    const [cart, setCart] = useState<Map<string, { product: ShopProduct, quantity: number }>>(new Map());
    const [isScanning, setIsScanning] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isCustomItemFormOpen, setIsCustomItemFormOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const addProductToCart = useCallback((product: ShopProduct, quantity: number) => {
        setCart(prev => {
            const newCart = new Map(prev);
            const existing = newCart.get(product.id);
            const currentQuantityInCart = existing ? existing.quantity : 0;
            const requestedTotalQuantity = currentQuantityInCart + quantity;

            if (quantity <= 0) return prev;

            if (product.id.startsWith('custom-') || requestedTotalQuantity <= product.stockQuantity) {
                newCart.set(product.id, { product, quantity: requestedTotalQuantity });
            } else {
                alert(`Not enough stock for ${product.name}. Only ${product.stockQuantity - currentQuantityInCart} more available.`);
            }
            return newCart;
        });
    }, []);
    
    useEffect(() => {
        // Barcode scanning logic is complex and requires a third-party library,
        // which is outside the scope of this environment. This effect is a placeholder.
    }, [isScanning, products, addProductToCart]);
    
    const handleAddCustomItem = (name: string, price: number, quantity: number) => {
        const customProduct: ShopProduct = {
            id: `custom-${self.crypto.randomUUID()}`, shopId: shop.id, name: name, sellingPrice: price,
            purchasePrice: price, stockQuantity: 999, categoryId: 'custom-sale',
        };
        addProductToCart(customProduct, quantity);
        setIsCustomItemFormOpen(false);
    };
    
    const cartTotals = useMemo(() => {
        const subtotal = Array.from(cart.values()).reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
        const taxAmount = shop.taxRate ? subtotal * (shop.taxRate / 100) : 0;
        const totalAmount = subtotal + taxAmount;
        return { subtotal, taxAmount, totalAmount };
    }, [cart, shop.taxRate]);
    
    const handleCheckout = () => {
        if (cart.size === 0) return;
        // FIX: Added missing productName and purchasePricePerUnit properties to match the ShopSaleItem type.
        const items: ShopSaleItem[] = Array.from(cart.values()).map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            pricePerUnit: item.product.sellingPrice,
            purchasePricePerUnit: item.product.purchasePrice,
        }));

        const profit = items.reduce((sum, item) => {
            return sum + (item.pricePerUnit - item.purchasePricePerUnit) * item.quantity;
        }, 0);
        
        // FIX: Added missing subtotal and taxAmount properties to match the ShopSale type.
        onRecordSale(shop.id, {
            timestamp: new Date().toISOString(),
            items,
            subtotal: cartTotals.subtotal,
            taxAmount: cartTotals.taxAmount,
            totalAmount: cartTotals.totalAmount,
            profit,
        });
        setCart(new Map());
    }

    return (
        <div className="flex flex-col h-full">
            {isPickerOpen && <ProductPicker products={products} onSelect={addProductToCart} onClose={() => setIsPickerOpen(false)} />}
            {isCustomItemFormOpen && <CustomItemForm onSave={handleAddCustomItem} onClose={() => setIsCustomItemFormOpen(false)} />}
            
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-2">
                    {Array.from(cart.values()).map(item => (
                        <div key={item.product.id} className="p-2 bg-subtle rounded-lg flex items-center">
                            <div className="flex-grow">
                                <p className="font-semibold text-primary">{item.product.name}</p>
                                <p className="text-xs text-secondary">{item.quantity} x {formatCurrency(item.product.sellingPrice)}</p>
                            </div>
                            <p className="font-bold text-primary">{formatCurrency(item.product.sellingPrice * item.quantity)}</p>
                        </div>
                    ))}
                    {cart.size === 0 && <p className="text-center text-secondary py-8">Cart is empty. Scan or add products to begin.</p>}
                </div>
            </div>
            <div className="p-4 border-t border-divider bg-subtle">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-primary">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(cartTotals.totalAmount)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                    <button onClick={() => setIsScanning(true)} className="button-secondary w-full py-2">Scan</button>
                    <button onClick={() => setIsPickerOpen(true)} className="button-secondary w-full py-2">Pick Item</button>
                    <button onClick={() => setIsCustomItemFormOpen(true)} className="button-secondary w-full py-2">Custom</button>
                </div>
                <button onClick={handleCheckout} className="button-primary w-full py-2">Checkout</button>
            </div>
        </div>
    );
};

const ProductPicker: React.FC<{products: ShopProduct[], onSelect: (p: ShopProduct, quantity: number) => void, onClose: () => void}> = ({ products, onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [quantities, setQuantities] = useState<Record<string, string>>({});

    const filtered = useMemo(() => query ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())) : products, [products, query]);

    const handleQuantityChange = (productId: string, value: string) => {
        setQuantities(prev => ({ ...prev, [productId]: value }));
    };

    const handleAdd = (product: ShopProduct) => {
        const quantity = parseInt(quantities[product.id] || '1', 10);
        if (quantity > 0) {
            onSelect(product, quantity);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4" onClick={onClose}>
            <div className="glass-card rounded-lg w-full max-w-sm max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <ModalHeader title="Select a Product" onClose={onClose} />
                <div className="p-2"><input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." className="w-full input-base p-2 rounded-md" autoFocus /></div>
                <div className="flex-grow overflow-y-auto p-2 space-y-2">
                    {filtered.map(p => (
                        <div key={p.id} className="p-2 bg-subtle rounded-lg flex items-center gap-2">
                            <div className="flex-grow">
                                <p className="font-semibold text-primary">{p.name}</p>
                                <p className="text-xs text-secondary">Stock: {p.stockQuantity}</p>
                            </div>
                            <input
                                type="number"
                                value={quantities[p.id] || '1'}
                                onChange={e => handleQuantityChange(p.id, e.target.value)}
                                className="input-base w-16 p-2 rounded-md no-spinner text-center"
                                min="1"
                                max={p.stockQuantity}
                            />
                            <button onClick={() => handleAdd(p)} className="button-primary px-3 py-2 text-sm">Add</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ShopAnalytics: React.FC<{sales: ShopSale[], products: ShopProduct[], shop: Shop}> = ({ sales, products, shop }) => {
    const formatCurrency = useCurrencyFormatter(undefined, shop.currency);
    const stats = useMemo(() => {
        const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        const profit = sales.reduce((sum, s) => sum + s.profit, 0);
        
        const productSales = sales.flatMap(s => s.items).reduce((acc, item) => {
            if (!item.productId.startsWith('custom-')) {
                acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
            }
            return acc;
        }, {} as Record<string, number>);
        
        const bestsellers = Object.entries(productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([productId, quantity]) => ({ product: products.find(p => p.id === productId), quantity }));

        return { revenue, profit, bestsellers };
    }, [sales, products]);

    const StatCard: React.FC<{title: string, value: string}> = ({title, value}) => (
        <div className="p-4 bg-subtle rounded-lg text-center">
            <p className="text-sm text-secondary">{title}</p>
            <p className="text-xl font-bold text-primary">{value}</p>
        </div>
    );

    return (
        <div className="p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <StatCard title="Total Revenue" value={formatCurrency(stats.revenue)} />
                <StatCard title="Total Profit" value={formatCurrency(stats.profit)} />
            </div>
            <div>
                <h4 className="font-semibold text-primary mb-2">Bestselling Products</h4>
                <div className="space-y-2">
                    {stats.bestsellers.map(({ product, quantity }, index) => product ? (
                        <div key={product.id} className="p-3 bg-subtle rounded-lg flex justify-between items-center">
                            <span>{index + 1}. {product.name}</span>
                            <span className="font-semibold">{quantity} sold</span>
                        </div>
                    ) : null)}
                     {stats.bestsellers.length === 0 && <p className="text-center text-sm text-secondary">No sales data yet.</p>}
                </div>
            </div>
        </div>
    );
}

export default ShopScreen;
