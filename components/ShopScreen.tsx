

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
import EditShopModal from './EditShopModal';
import TimeSeriesBarChart from './TimeSeriesBarChart';
import { Transaction, TransactionType } from '../types';

type ShopView = 'analytics' | 'billing' | 'products' | 'employees' | 'shifts';

// Form for creating/editing a product
const ProductForm: React.FC<{
    product: ShopProduct | null, 
    onSave: (productData: Omit<ShopProduct, 'id' | 'shopId'>, id?: string) => void, 
    onCancel: () => void
}> = ({ product, onSave, onCancel }) => {
    const [formState, setFormState] = useState({
        name: product?.name || '',
        description: product?.description || '',
        tags: product?.tags?.join(', ') || '',
        qrCode: product?.qrCode || '',
        stockQuantity: product?.stockQuantity.toString() || '0',
        lowStockThreshold: product?.lowStockThreshold?.toString() || '0',
        purchasePrice: product?.purchasePrice.toString() || '0',
        sellingPrice: product?.sellingPrice.toString() || '0',
        categoryId: product?.categoryId || 'default-shop-category-id' // Placeholder to satisfy type
    });

    const handleChange = (field: keyof typeof formState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, stockQuantity, purchasePrice, sellingPrice, lowStockThreshold, tags } = formState;
        if (name.trim()) {
            onSave({
                ...formState,
                stockQuantity: parseInt(stockQuantity) || 0,
                lowStockThreshold: parseInt(lowStockThreshold) || undefined,
                purchasePrice: parseFloat(purchasePrice) || 0,
                sellingPrice: parseFloat(sellingPrice) || 0,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            }, product?.id);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-divider bg-subtle space-y-3">
            <h4 className="font-semibold text-primary">{product ? 'Edit Product' : 'Create New Product'}</h4>
            <input type="text" value={formState.name} onChange={e => handleChange('name', e.target.value)} placeholder="Product Name" className="w-full input-base p-2 rounded-md" required/>
            <textarea value={formState.description} onChange={e => handleChange('description', e.target.value)} placeholder="Description (optional)" rows={2} className="w-full input-base p-2 rounded-md resize-none" />
            <div className="grid grid-cols-2 gap-3">
                <input type="text" value={formState.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="Tags (comma-separated)" className="w-full input-base p-2 rounded-md" />
                <input type="text" value={formState.qrCode} onChange={e => handleChange('qrCode', e.target.value)} placeholder="Barcode/QR (Optional)" className="w-full input-base p-2 rounded-md" />
            </div>
             <div className="grid grid-cols-2 gap-3">
                <input type="number" value={formState.stockQuantity} onChange={e => handleChange('stockQuantity', e.target.value)} placeholder="Stock Quantity" className="w-full input-base p-2 rounded-md no-spinner" />
                <input type="number" value={formState.lowStockThreshold} onChange={e => handleChange('lowStockThreshold', e.target.value)} placeholder="Low Stock Alert Level" className="w-full input-base p-2 rounded-md no-spinner" />
            </div>
             <div className="grid grid-cols-2 gap-3">
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

const SaleReceiptModal: React.FC<{
    sale: ShopSale;
    shop: Shop;
    onClose: () => void;
}> = ({ sale, shop, onClose }) => {
    const formatCurrency = getCurrencyFormatter(shop.currency).format;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-sm p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <h3 className="font-bold text-lg text-primary">{shop.name}</h3>
                    <p className="text-xs text-secondary">Sale Receipt</p>
                    <p className="text-xs text-secondary">{new Date(sale.timestamp).toLocaleString()}</p>
                </div>
                <div className="px-6 py-4 border-t border-b border-divider space-y-2 max-h-60 overflow-y-auto">
                    {sale.items.map(item => (
                        <div key={item.productId} className="flex justify-between text-sm">
                            <div>
                                <p className="text-primary">{item.productName}</p>
                                <p className="text-xs text-secondary">{item.quantity} x {formatCurrency(item.pricePerUnit)}</p>
                            </div>
                            <p className="text-primary font-mono">{formatCurrency(item.quantity * item.pricePerUnit)}</p>
                        </div>
                    ))}
                </div>
                <div className="px-6 py-4 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-secondary">Subtotal</span><span className="font-mono text-primary">{formatCurrency(sale.subtotal)}</span></div>
                    {sale.discount && (
                        <div className="flex justify-between"><span className="text-secondary">Discount ({sale.discount.type === 'percentage' ? `${sale.discount.value}%` : 'Flat'})</span><span className="font-mono text-rose-400">-{formatCurrency(sale.subtotal - (sale.totalAmount - sale.taxAmount))}</span></div>
                    )}
                    {sale.taxAmount > 0 && (
                         <div className="flex justify-between"><span className="text-secondary">Tax ({shop.taxRate}%)</span><span className="font-mono text-primary">{formatCurrency(sale.taxAmount)}</span></div>
                    )}
                     <div className="flex justify-between font-bold text-lg pt-2 border-t border-divider mt-2"><span className="text-primary">Total</span><span className="font-mono text-primary">{formatCurrency(sale.totalAmount)}</span></div>
                </div>
                <div className="p-4">
                    <button onClick={onClose} className="button-primary w-full py-2">New Sale</button>
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')!
    );
};


const BillingView: React.FC<{
  shop: Shop,
  products: ShopProduct[],
  employees: ShopEmployee[],
  onRecordSale: (sale: Omit<ShopSale, 'id' | 'shopId'>) => void
}> = ({ shop, products, employees, onRecordSale }) => {
    const [cart, setCart] = useState<Map<string, ShopSaleItem>>(new Map());
    const [customerName, setCustomerName] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('flat');
    const [discountValue, setDiscountValue] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [lastSale, setLastSale] = useState<ShopSale | null>(null);
    const [employeeId, setEmployeeId] = useState<string>('');

    const formatCurrency = getCurrencyFormatter(shop.currency).format;

    const filteredProducts = useMemo(() => {
        if (!productSearch.trim()) return products;
        const query = productSearch.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(query) || p.qrCode?.toLowerCase().includes(query));
    }, [products, productSearch]);

    const handleAddToCart = (product: ShopProduct) => {
        setCart(prev => {
            const newCart = new Map(prev);
            if (newCart.has(product.id)) {
                const item = newCart.get(product.id)!;
                newCart.set(product.id, { ...item, quantity: item.quantity + 1 });
            } else {
                newCart.set(product.id, {
                    productId: product.id,
                    productName: product.name,
                    quantity: 1,
                    pricePerUnit: product.sellingPrice,
                    purchasePricePerUnit: product.purchasePrice,
                });
            }
            return newCart;
        });
    };

    const handleQuantityChange = (productId: string, newQuantity: number) => {
        setCart(prev => {
            const newCart = new Map(prev);
            if (newQuantity <= 0) {
                newCart.delete(productId);
            } else {
                const item = newCart.get(productId)!;
                newCart.set(productId, { ...item, quantity: newQuantity });
            }
            return newCart;
        });
    };
    
    const cartItems = Array.from(cart.values());

    const { subtotal, discountAmount, taxAmount, totalAmount, profit } = useMemo(() => {
        const subtotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
        
        const dValue = parseFloat(discountValue) || 0;
        let discountAmount = 0;
        if (dValue > 0) {
            if (discountType === 'percentage') {
                discountAmount = (subtotal * dValue) / 100;
            } else {
                discountAmount = Math.min(dValue, subtotal);
            }
        }

        const taxableAmount = subtotal - discountAmount;
        const taxAmount = (shop.taxRate && shop.taxRate > 0) ? taxableAmount * (shop.taxRate / 100) : 0;
        const totalAmount = taxableAmount + taxAmount;
        const profit = cartItems.reduce((sum, item) => sum + (item.quantity * (item.pricePerUnit - item.purchasePricePerUnit)), 0) - discountAmount;

        return { subtotal, discountAmount, taxAmount, totalAmount, profit };
    }, [cartItems, discountValue, discountType, shop.taxRate]);

    const handleFinalizeSale = () => {
        if (cartItems.length === 0) return;
        const dValue = parseFloat(discountValue) || 0;

        const saleData: Omit<ShopSale, 'id' | 'shopId'> = {
            timestamp: new Date().toISOString(),
            items: cartItems,
            employeeId: employeeId || undefined,
            customerName: customerName.trim() || undefined,
            subtotal: subtotal,
            discount: dValue > 0 ? { type: discountType, value: dValue } : undefined,
            taxAmount: taxAmount,
            totalAmount: totalAmount,
            profit: profit,
        };
        onRecordSale(saleData);
        setLastSale({ ...saleData, id: 'temp-id', shopId: shop.id }); // Use temp-id for modal
        // Reset state
        setCart(new Map());
        setCustomerName('');
        setDiscountValue('');
        setProductSearch('');
        setEmployeeId('');
    };

    const DiscountToggle = () => (
        <div className="flex items-center gap-1 p-0.5 rounded-full bg-subtle border border-divider">
            <button onClick={() => setDiscountType('flat')} className={`px-3 py-1 text-xs rounded-full ${discountType === 'flat' ? 'bg-emerald-500 text-white' : ''}`}>Flat</button>
            <button onClick={() => setDiscountType('percentage')} className={`px-3 py-1 text-xs rounded-full ${discountType === 'percentage' ? 'bg-emerald-500 text-white' : ''}`}>%</button>
        </div>
    );
    
    return (
        <div className="flex flex-col md:flex-row h-full gap-4">
            {/* Left side: Product selection */}
            <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
                <input type="search" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products..." className="w-full input-base p-2 rounded-lg mb-3" />
                <div className="flex-grow overflow-y-auto pr-2">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {filteredProducts.map(p => (
                            <button key={p.id} onClick={() => handleAddToCart(p)} disabled={p.stockQuantity <=0} className="p-2 bg-subtle rounded-lg text-center aspect-square flex flex-col justify-center items-center hover-bg-stronger disabled:opacity-50 disabled:cursor-not-allowed">
                                <p className="text-xs font-semibold text-primary truncate">{p.name}</p>
                                <p className="text-xs text-secondary">{formatCurrency(p.sellingPrice)}</p>
                                <p className="text-[10px] text-tertiary">Qty: {p.stockQuantity}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side: Bill/Cart */}
            <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col bg-subtle p-3 rounded-lg border border-divider">
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer Name (Optional)" className="w-full input-base p-2 rounded-lg" />
                    <CustomSelect value={employeeId} onChange={setEmployeeId} options={[{value: '', label: 'No Employee'},...employees.map(e => ({ value: e.id, label: e.name }))]} />
                </div>
                <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                    {cartItems.map(item => (
                        <div key={item.productId} className="flex items-center gap-2 text-sm p-2 rounded-md bg-subtle">
                            <p className="flex-grow text-primary truncate">{item.productName}</p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleQuantityChange(item.productId, item.quantity - 1)} className="control-button">-</button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <button onClick={() => handleQuantityChange(item.productId, item.quantity + 1)} className="control-button">+</button>
                            </div>
                            <p className="w-20 text-right font-mono text-primary">{formatCurrency(item.quantity * item.pricePerUnit)}</p>
                        </div>
                    ))}
                    {cartItems.length === 0 && <p className="text-center text-secondary text-sm py-8">Cart is empty</p>}
                </div>
                
                <div className="flex-shrink-0 border-t border-divider pt-3 mt-2 space-y-2 text-sm">
                     <div className="flex justify-between"><span className="text-secondary">Subtotal</span><span className="font-mono text-primary">{formatCurrency(subtotal)}</span></div>
                     <div className="flex justify-between items-center">
                        <span className="text-secondary">Discount</span>
                        <div className="flex items-center gap-2">
                            <input type="text" inputMode="decimal" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-20 input-base p-1 rounded-md text-right no-spinner" />
                            <DiscountToggle />
                        </div>
                     </div>
                     {discountAmount > 0 && <div className="flex justify-end text-rose-400 font-mono">- {formatCurrency(discountAmount)}</div>}
                     {shop.taxRate && shop.taxRate > 0 && <div className="flex justify-between"><span className="text-secondary">Tax ({shop.taxRate}%)</span><span className="font-mono text-primary">{formatCurrency(taxAmount)}</span></div>}
                     <div className="flex justify-between font-bold text-2xl pt-2 border-t border-divider mt-2"><span className="text-primary">Total</span><span className="font-mono text-primary">{formatCurrency(totalAmount)}</span></div>
                     <button onClick={handleFinalizeSale} disabled={cartItems.length === 0} className="button-primary w-full py-3 mt-2 text-lg">Charge {formatCurrency(totalAmount)}</button>
                </div>
            </div>
            {lastSale && <SaleReceiptModal sale={lastSale} shop={shop} onClose={() => setLastSale(null)} />}
        </div>
    );
};

const AnalyticsView: React.FC<{
  shop: Shop;
  products: ShopProduct[];
  sales: ShopSale[];
}> = ({ shop, products, sales }) => {
    const formatCurrency = getCurrencyFormatter(shop.currency).format;
    const [insights, setInsights] = useState<string[]>([]);
    const [isLoadingInsights, setIsLoadingInsights] = useState(true);

    const stats = useMemo(() => {
        const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
        const salesCount = sales.length;
        const avgSaleValue = salesCount > 0 ? totalRevenue / salesCount : 0;
        return { totalRevenue, totalProfit, salesCount, avgSaleValue };
    }, [sales]);

    const bestSellers = useMemo(() => {
        const productSales = sales.flatMap(s => s.items).reduce((acc, item) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([productId, quantity]) => {
                const product = products.find(p => p.id === productId);
                return { name: product?.name || 'Unknown', quantity };
            });
    }, [sales, products]);
    
    const lowStockProducts = useMemo(() => {
        return products.filter(p => p.lowStockThreshold && p.stockQuantity <= p.lowStockThreshold);
    }, [products]);

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
    
    const salesForChart = useMemo((): Transaction[] => {
        return sales.map(s => ({
            id: s.id,
            accountId: s.shopId,
            description: `Sale ${s.id}`,
            amount: s.totalAmount,
            type: TransactionType.INCOME,
            categoryId: '',
            date: s.timestamp
        }));
    }, [sales]);

    const StatCard = ({ title, value }: { title: string, value: string }) => (
        <div className="p-3 bg-subtle rounded-lg text-center">
            <p className="text-xs text-secondary">{title}</p>
            <p className="text-lg font-bold text-primary">{value}</p>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} />
                <StatCard title="Total Profit" value={formatCurrency(stats.totalProfit)} />
                <StatCard title="Total Sales" value={stats.salesCount.toString()} />
                <StatCard title="Avg. Sale" value={formatCurrency(stats.avgSaleValue)} />
            </div>

            {lowStockProducts.length > 0 && (
                <div className="p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                    <h4 className="font-semibold text-yellow-300">Low Stock Alerts</h4>
                    <ul className="text-sm text-yellow-200 mt-2 list-disc pl-5">
                        {lowStockProducts.map(p => (
                            <li key={p.id}>{p.name} (only {p.stockQuantity} left)</li>
                        ))}
                    </ul>
                </div>
            )}
            
            <TimeSeriesBarChart title="Sales Trend (Last 30 Days)" transactions={salesForChart} period="month" type={TransactionType.INCOME} currency={shop.currency} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-subtle rounded-lg">
                    <h4 className="font-semibold text-primary mb-2">Best Sellers</h4>
                    <div className="space-y-2">
                        {bestSellers.map(p => (
                            <div key={p.name} className="flex justify-between text-sm">
                                <span className="text-primary truncate">{p.name}</span>
                                <span className="font-mono ml-2 flex-shrink-0">{p.quantity} sold</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-subtle rounded-lg">
                    <h4 className="font-semibold text-primary mb-2">AI Business Insights ✨</h4>
                    {isLoadingInsights ? <div className="flex justify-center p-4"><LoadingSpinner /></div> : (
                        <div className="space-y-2">
                            {insights.map((insight, i) => (
                                <p key={i} className="text-sm text-secondary">💡 {insight}</p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ShiftForm: React.FC<{
    shift: ShopShift | null,
    onSave: (data: Omit<ShopShift, 'id'|'shopId'>, id?: string) => void,
    onCancel: () => void
}> = ({ shift, onSave, onCancel }) => {
    const [formState, setFormState] = useState({
        name: shift?.name || '',
        startTime: shift?.startTime || '09:00',
        endTime: shift?.endTime || '17:00'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formState.name.trim()) {
            onSave(formState, shift?.id);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-divider bg-subtle space-y-3">
            <h4 className="font-semibold text-primary">{shift ? 'Edit Shift' : 'Create New Shift'}</h4>
            <input type="text" value={formState.name} onChange={e => setFormState(p => ({...p, name: e.target.value}))} placeholder="Shift Name (e.g., Morning)" className="w-full input-base p-2 rounded-md" required />
            <div className="grid grid-cols-2 gap-3">
                <input type="time" value={formState.startTime} onChange={e => setFormState(p => ({...p, startTime: e.target.value}))} className="w-full input-base p-2 rounded-md" />
                <input type="time" value={formState.endTime} onChange={e => setFormState(p => ({...p, endTime: e.target.value}))} className="w-full input-base p-2 rounded-md" />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
                <button type="submit" className="button-primary px-4 py-2">Save</button>
            </div>
        </form>
    );
};

const EmployeeForm: React.FC<{
    employee: ShopEmployee | null,
    shifts: ShopShift[],
    onSave: (data: Omit<ShopEmployee, 'id'|'shopId'>, id?: string) => void,
    onCancel: () => void
}> = ({ employee, shifts, onSave, onCancel }) => {
    const [formState, setFormState] = useState({
        name: employee?.name || '',
        contactInfo: employee?.contactInfo || '',
        salary: employee?.salary?.toString() || '',
        shiftId: employee?.shiftId || ''
    });
    
    const shiftOptions = [{value: '', label: 'No Shift'}, ...shifts.map(s => ({ value: s.id, label: s.name }))];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formState.name.trim()) {
            onSave({
                ...formState,
                salary: parseFloat(formState.salary) || undefined,
                shiftId: formState.shiftId || undefined,
            }, employee?.id);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-divider bg-subtle space-y-3">
            <h4 className="font-semibold text-primary">{employee ? 'Edit Employee' : 'Add New Employee'}</h4>
            <input type="text" value={formState.name} onChange={e => setFormState(p => ({...p, name: e.target.value}))} placeholder="Employee Name" className="w-full input-base p-2 rounded-md" required />
            <input type="text" value={formState.contactInfo} onChange={e => setFormState(p => ({...p, contactInfo: e.target.value}))} placeholder="Contact Info (Optional)" className="w-full input-base p-2 rounded-md" />
             <div className="grid grid-cols-2 gap-3">
                <input type="number" value={formState.salary} onChange={e => setFormState(p => ({...p, salary: e.target.value}))} placeholder="Salary (Optional)" className="w-full input-base p-2 rounded-md no-spinner" />
                <CustomSelect value={formState.shiftId} onChange={val => setFormState(p => ({...p, shiftId: val}))} options={shiftOptions} />
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

const ShopDetailView: React.FC<ShopDetailViewProps> = (props) => {
    const { shop, products, sales, employees, shifts, onBack, onSaveProduct, onDeleteProduct, onRecordSale, onSaveEmployee, onDeleteEmployee, onSaveShift, onDeleteShift } = props;
    const [view, setView] = useState<ShopView>('analytics');
    const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingShift, setEditingShift] = useState<ShopShift | null>(null);
    const [showShiftForm, setShowShiftForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<ShopEmployee | null>(null);
    const [showEmployeeForm, setShowEmployeeForm] = useState(false);
    
    const formatCurrency = getCurrencyFormatter(shop.currency).format;

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

    const handleSaveSh = (shiftData: Omit<ShopShift, 'id' | 'shopId'>, id?: string) => {
        onSaveShift(shop.id, shiftData, id);
        setShowShiftForm(false);
        setEditingShift(null);
    };

    const handleSaveEmp = (employeeData: Omit<ShopEmployee, 'id' | 'shopId'>, id?: string) => {
        onSaveEmployee(shop.id, employeeData, id);
        setShowEmployeeForm(false);
        setEditingEmployee(null);
    };

    const renderView = () => {
        switch(view) {
            case 'analytics': return <AnalyticsView shop={shop} products={products} sales={sales} />;
            case 'billing': return <BillingView shop={shop} products={products} employees={employees} onRecordSale={(sale) => onRecordSale(shop.id, sale)} />
            case 'products': return (
                <div className="space-y-2">
                    {products.map(p => (
                        <div key={p.id} className="p-3 bg-subtle rounded-lg group">
                            <div className="flex justify-between">
                                <div><p className="font-semibold text-primary">{p.name}</p><p className="text-xs text-secondary">Stock: {p.stockQuantity} | Sell: {formatCurrency(p.sellingPrice)}</p></div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setEditingProduct(p); setShowProductForm(true); }} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button><button onClick={() => onDeleteProduct(p.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full ml-1">Delete</button></div>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="w-full button-secondary py-2 mt-2">+ Add Product</button>
                    {showProductForm && <ProductForm product={editingProduct} onSave={handleSaveProd} onCancel={() => { setShowProductForm(false); setEditingProduct(null); }} />}
                </div>
            );
            case 'employees': return (
                 <div className="space-y-2">
                    {employees.map(e => {
                        const shift = shifts.find(s => s.id === e.shiftId);
                        return (
                             <div key={e.id} className="p-3 bg-subtle rounded-lg group"><div className="flex justify-between"><div><p className="font-semibold text-primary">{e.name}</p><p className="text-xs text-secondary">{shift?.name || 'No Shift Assigned'}</p></div><div className="opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setEditingEmployee(e); setShowEmployeeForm(true); }} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button><button onClick={() => onDeleteEmployee(e.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full ml-1">Delete</button></div></div></div>
                        )
                    })}
                    <button onClick={() => { setEditingEmployee(null); setShowEmployeeForm(true); }} className="w-full button-secondary py-2 mt-2">+ Add Employee</button>
                    {showEmployeeForm && <EmployeeForm employee={editingEmployee} shifts={shifts} onSave={handleSaveEmp} onCancel={() => { setShowEmployeeForm(false); setEditingEmployee(null); }} />}
                </div>
            );
            case 'shifts': return (
                <div className="space-y-2">
                    {shifts.map(s => (
                         <div key={s.id} className="p-3 bg-subtle rounded-lg group"><div className="flex justify-between"><div><p className="font-semibold text-primary">{s.name}</p><p className="text-xs text-secondary">{s.startTime} - {s.endTime}</p></div><div className="opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setEditingShift(s); setShowShiftForm(true); }} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button><button onClick={() => onDeleteShift(s.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full ml-1">Delete</button></div></div></div>
                    ))}
                    <button onClick={() => { setEditingShift(null); setShowShiftForm(true); }} className="w-full button-secondary py-2 mt-2">+ Add Shift</button>
                    {showShiftForm && <ShiftForm shift={editingShift} onSave={handleSaveSh} onCancel={() => { setShowShiftForm(false); setEditingShift(null); }} />}
                </div>
            );
            default: return null;
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
            {isFormOpen && <EditShopModal shop={editingShop} onSave={handleSave} onCancel={handleCancel} />}
        </div>
    );
};
