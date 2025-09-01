import React, { useState, useRef, useEffect, useCallback, useMemo, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Shop, ShopProduct, ShopSale, ShopSaleItem, ShopEmployee, ShopShift, ShopType } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { SettingsContext } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';
import { getCurrencyFormatter } from '../utils/currency';
import { getShopInsights } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

type ShopView = 'billing' | 'products' | 'employees' | 'shifts' | 'analytics';

const ShopFormModal: React.FC<{
    shop: Shop | null, 
    onSave: ShopScreenProps['onSaveShop'], 
    onCancel: () => void
}> = ({ shop, onSave, onCancel }) => {
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

interface ShopDetailViewProps extends ShopScreenProps {
  shop: Shop;
  onBack: () => void;
}

const ShopDetailView: React.FC<ShopDetailViewProps> = ({
  shop,
  products,
  sales,
  onBack,
  onSaveProduct,
  onDeleteProduct,
}) => {
    const [view, setView] = useState<ShopView>('analytics');
    const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
    const [showProductForm, setShowProductForm] = useState(false);
    const [insights, setInsights] = useState<string[]>([]);
    const [isLoadingInsights, setIsLoadingInsights] = useState(true);
    const formatCurrency = getCurrencyFormatter(shop.currency).format;

    useEffect(() => {
        const fetchInsights = async () => {
            setIsLoadingInsights(true);
            try {
                const result = await getShopInsights(sales, products);
                setInsights(result);
            } catch (error) {
                console.error("Failed to fetch shop insights", error);
                setInsights(["Could not load AI insights at this time."]);
            }
            setIsLoadingInsights(false);
        };
        fetchInsights();
    }, [sales, products]);

    const TabButton: React.FC<{ tab: ShopView, label: string }> = ({ tab, label }) => (
        <button onClick={() => setView(tab)} className={`px-3 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${ view === tab ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger' }`}>
            {label}
        </button>
    );

    const handleSaveProd = (productData: Omit<ShopProduct, 'id' | 'shopId'>, id?: string) => {
        onSaveProduct(shop.id, productData, id);
        setShowProductForm(false);
        setEditingProduct(null);
    };

    const renderView = () => {
        switch(view) {
            case 'analytics':
                return (
                    <div className="p-4 space-y-4">
                        <h3 className="font-semibold text-lg text-primary">AI Business Insights ✨</h3>
                        {isLoadingInsights ? <div className="flex justify-center p-8"><LoadingSpinner /></div> : (
                            <div className="space-y-2">
                                {insights.map((insight, i) => (
                                    <p key={i} className="p-3 bg-subtle rounded-lg text-sm text-secondary">💡 {insight}</p>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'products':
                return (
                    <div className="space-y-2">
                        {products.map(p => (
                            <div key={p.id} className="p-3 bg-subtle rounded-lg group">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-semibold text-primary">{p.name}</p>
                                        <p className="text-xs text-secondary">Stock: {p.stockQuantity} | Sell: {formatCurrency(p.sellingPrice)}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingProduct(p); setShowProductForm(true); }} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                                        <button onClick={() => onDeleteProduct(p.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full ml-1">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="w-full button-secondary py-2 mt-2">+ Add Product</button>
                        {showProductForm && <ProductForm product={editingProduct} onSave={handleSaveProd} onCancel={() => { setShowProductForm(false); setEditingProduct(null); }} />}
                    </div>
                );
            case 'billing':
                return <div className="p-4 text-secondary text-center">Billing/POS view coming soon!</div>
            case 'employees':
                return <div className="p-4 text-secondary text-center">Employee management coming soon!</div>
            case 'shifts':
                return <div className="p-4 text-secondary text-center">Shift management coming soon!</div>
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col">
            <ModalHeader title={shop.name} onBack={onBack} onClose={onBack} icon="🏪" />
             <div className="flex-shrink-0 p-2 overflow-x-auto border-b border-divider">
                <div className="flex items-center gap-2">
                    <TabButton tab="analytics" label="Analytics" />
                    <TabButton tab="billing" label="Billing" />
                    <TabButton tab="products" label="Products" />
                    <TabButton tab="employees" label="Employees" />
                    <TabButton tab="shifts" label="Shifts" />
                </div>
            </div>
            <div className="flex-grow overflow-y-auto p-4">
                {renderView()}
            </div>
        </div>
    );
};

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

    const handleEdit = (shop: Shop) => {
        setEditingShop(shop);
        setIsFormOpen(true);
    };

    const handleCancel = () => {
        setEditingShop(null);
        setIsFormOpen(false);
    };

    const handleSave = (shopData: Omit<Shop, 'id'>, id?: string) => {
        onSaveShop(shopData, id);
        handleCancel();
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0">
                <h2 className="text-2xl font-bold text-primary text-center">Shop Hub 🏪</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {shops.map(shop => {
                    const formatCurrency = getCurrencyFormatter(shop.currency).format;
                    const totalRevenue = sales.filter(s => s.shopId === shop.id).reduce((sum, s) => sum + s.totalAmount, 0);
                    return (
                        <div key={shop.id} className="p-4 bg-subtle rounded-lg group transition-all duration-200 hover-bg-stronger hover:scale-[1.02]">
                            <div className="flex justify-between items-start">
                                <div onClick={() => onSelectShop(shop.id)} className="flex-grow cursor-pointer">
                                    <h3 className="font-bold text-lg text-primary">{shop.name}</h3>
                                    <p className="text-sm text-secondary capitalize">{shop.type.replace('_', ' ')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-primary">{formatCurrency(totalRevenue)}</p>
                                    <p className="text-xs text-secondary">Total Revenue</p>
                                </div>
                            </div>
                             <div className="flex justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(shop)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                                <button onClick={() => onDeleteShop(shop.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full">Delete</button>
                            </div>
                        </div>
                    );
                })}
                 {shops.length === 0 && !isFormOpen && (
                    <div className="text-center py-12">
                        <p className="text-lg font-medium text-secondary">Manage your small business or side hustle.</p>
                        <p className="text-sm text-tertiary">Create your first shop to track products, sales, and profits.</p>
                    </div>
                 )}
            </div>
            <div className="p-4 border-t border-divider flex-shrink-0">
                <button onClick={() => { setEditingShop(null); setIsFormOpen(true); }} className="button-primary w-full py-2">
                + Create New Shop
                </button>
            </div>
            {isFormOpen && <ShopFormModal shop={editingShop} onSave={handleSave} onCancel={handleCancel} />}
        </div>
    );
};