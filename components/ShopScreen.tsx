import React, { useState, useRef, useEffect, useCallback, useMemo, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Shop, ShopProduct, ShopSale, ShopSaleItem, ShopEmployee, ShopShift, ShopType, Category, PaymentMethod, HeldBill, ActiveModal } from '../types';
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
    shop: Shop,
    product: ShopProduct | null, 
    onSave: (productData: Omit<ShopProduct, 'id' | 'shopId'>, id?: string) => void, 
    onCancel: () => void,
    categories: Category[]
}> = ({ shop, product, onSave, onCancel, categories }) => {
    const [formState, setFormState] = useState({
        name: product?.name || '',
        description: product?.description || '',
        tags: product?.tags?.join(', ') || '',
        qrCode: product?.qrCode || '',
        stockQuantity: product?.stockQuantity.toString() || '',
        lowStockThreshold: product?.lowStockThreshold?.toString() || '',
        purchasePrice: product?.purchasePrice.toString() || '',
        sellingPrice: product?.sellingPrice.toString() || '',
        categoryId: product?.categoryId || ''
    });
    
    const isRetail = ['physical_retail', 'online_ecommerce', 'garage_sale'].includes(shop.type);
    const isRental = shop.type === 'rental_business';
    const isService = shop.type === 'freelance_service';

    const handleChange = (field: keyof typeof formState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, stockQuantity, purchasePrice, sellingPrice, lowStockThreshold, tags, categoryId } = formState;
        if (name.trim()) {
            onSave({
                ...formState,
                stockQuantity: parseInt(stockQuantity) || 0,
                lowStockThreshold: parseInt(lowStockThreshold) || undefined,
                purchasePrice: parseFloat(purchasePrice) || 0,
                sellingPrice: parseFloat(sellingPrice) || 0,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                categoryId: categoryId || undefined,
            }, product?.id);
        }
    };

    const categoryOptions = useMemo(() => {
        return [{value: '', label: 'No Category'}, ...categories.filter(c => c.type === 'income').map(c => ({value: c.id, label: c.name}))]
    }, [categories]);

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-divider bg-subtle space-y-3">
            <h4 className="font-semibold text-primary">{product ? `Edit ${isService ? 'Service' : 'Product'}` : `Create New ${isService ? 'Service' : 'Product'}`}</h4>
            <input type="text" value={formState.name} onChange={e => handleChange('name', e.target.value)} placeholder={isService ? 'Service Name' : 'Product Name'} className="w-full input-base p-2 rounded-md" required/>
            <textarea value={formState.description} onChange={e => handleChange('description', e.target.value)} placeholder="Description (optional)" rows={2} className="w-full input-base p-2 rounded-md resize-none" />
            <div className="grid grid-cols-2 gap-3">
                <input type="text" value={formState.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="Tags (comma-separated)" className="w-full input-base p-2 rounded-md" />
                {isRetail && <input type="text" value={formState.qrCode} onChange={e => handleChange('qrCode', e.target.value)} placeholder="Barcode/QR (Optional)" className="w-full input-base p-2 rounded-md" />}
            </div>
            
            {!isService && (
                 <div className="grid grid-cols-2 gap-3">
                    <input type="number" onWheel={e => e.currentTarget.blur()} value={formState.stockQuantity} onChange={e => handleChange('stockQuantity', e.target.value)} placeholder={isRental ? 'Available Units' : 'Stock Quantity'} className="w-full input-base p-2 rounded-md no-spinner" />
                    {isRetail && <input type="number" onWheel={e => e.currentTarget.blur()} value={formState.lowStockThreshold} onChange={e => handleChange('lowStockThreshold', e.target.value)} placeholder="Low Stock Alert Level" className="w-full input-base p-2 rounded-md no-spinner" />}
                </div>
            )}

             <div className="grid grid-cols-2 gap-3">
                {isRetail && <input type="text" inputMode="decimal" onWheel={e => e.currentTarget.blur()} value={formState.purchasePrice} onChange={e => handleChange('purchasePrice', e.target.value)} placeholder="Purchase Price" className="w-full input-base p-2 rounded-md no-spinner" />}
                <input type="text" inputMode="decimal" onWheel={e => e.currentTarget.blur()} value={formState.sellingPrice} onChange={e => handleChange('sellingPrice', e.target.value)} placeholder={isRental ? "Price Per Rental" : (isService ? "Service Price" : "Selling Price")} className="w-full input-base p-2 rounded-md no-spinner" />
            </div>
            <div>
                 <label className="text-sm font-medium text-secondary mb-1">Category</label>
                 <CustomSelect value={formState.categoryId} onChange={val => handleChange('categoryId', val)} options={categoryOptions} />
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
                     {sale.paymentMethod === 'cash' && sale.amountPaid && (
                         <>
                            <div className="flex justify-between"><span className="text-secondary">Cash Paid</span><span className="font-mono text-primary">{formatCurrency(sale.amountPaid)}</span></div>
                            <div className="flex justify-between"><span className="text-secondary">Change Due</span><span className="font-mono text-primary">{formatCurrency(sale.changeGiven || 0)}</span></div>
                         </>
                     )}
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
  onRecordSale: (sale: Omit<ShopSale, 'id' | 'shopId'>) => void,
  categories: Category[],
}> = ({ shop, products, employees, onRecordSale, categories }) => {
    const [cart, setCart] = useState<Map<string, ShopSaleItem>>(new Map());
    const [customerName, setCustomerName] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('flat');
    const [discountValue, setDiscountValue] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [lastSale, setLastSale] = useState<ShopSale | null>(null);
    const [employeeId, setEmployeeId] = useState<string>('');
    const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showHeldBills, setShowHeldBills] = useState(false);
    const [heldBills, setHeldBills] = useState<HeldBill[]>([]);

    const formatCurrency = getCurrencyFormatter(shop.currency).format;
    const shopCategories = useMemo(() => {
        const categoryIds = new Set(products.map(p => p.categoryId).filter(Boolean));
        return categories.filter(c => categoryIds.has(c.id));
    }, [products, categories]);

    const filteredProducts = useMemo(() => {
        let prods = products;
        if (activeCategoryId !== 'all') {
            prods = prods.filter(p => p.categoryId === activeCategoryId);
        }
        if (!productSearch.trim()) return prods;
        const query = productSearch.toLowerCase();
        return prods.filter(p => p.name.toLowerCase().includes(query) || p.qrCode?.toLowerCase().includes(query));
    }, [products, productSearch, activeCategoryId]);

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
        const itemToRemove = cart.get(productId);
        if(!itemToRemove) return;

        if (newQuantity <= 0) {
            const el = document.getElementById(`cart-item-${productId}`);
            el?.classList.add('removing');
            setTimeout(() => {
                 setCart(prev => {
                    const newCart = new Map(prev);
                    newCart.delete(productId);
                    return newCart;
                });
            }, 300);
        } else {
             setCart(prev => {
                const newCart = new Map(prev);
                const item = newCart.get(productId)!;
                newCart.set(productId, { ...item, quantity: newQuantity });
                return newCart;
            });
        }
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

    const resetCart = () => {
        setCart(new Map());
        setCustomerName('');
        setDiscountValue('');
        setProductSearch('');
        setEmployeeId('');
    }

    const handleFinalizeSale = (paymentMethod: PaymentMethod, amountPaid?: number, changeGiven?: number) => {
        if (cartItems.length === 0) return;
        const dValue = parseFloat(discountValue) || 0;

        const saleData: Omit<ShopSale, 'id' | 'shopId'> = {
            timestamp: new Date().toISOString(),
            items: cartItems,
            employeeId: employeeId || undefined,
            customerName: customerName.trim() || undefined,
            subtotal, discount: dValue > 0 ? { type: discountType, value: dValue } : undefined,
            taxAmount, totalAmount, profit, paymentMethod, amountPaid, changeGiven,
        };
        onRecordSale(saleData);
        setLastSale({ ...saleData, id: self.crypto.randomUUID(), shopId: shop.id });
        resetCart();
        setShowPaymentModal(false);
    };

    const handleHoldBill = () => {
        if (cartItems.length === 0) return;
        const newHeldBill: HeldBill = {
            id: self.crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            customerName: customerName.trim() || `Bill ${heldBills.length + 1}`,
            items: cartItems,
        };
        setHeldBills(prev => [...prev, newHeldBill]);
        resetCart();
    };

    const handleRestoreBill = (bill: HeldBill) => {
        setCart(new Map(bill.items.map(item => [item.productId, item])));
        setCustomerName(bill.customerName || '');
        setHeldBills(prev => prev.filter(b => b.id !== bill.id));
        setShowHeldBills(false);
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 overflow-hidden">
             {showPaymentModal && <PaymentModal total={totalAmount} shop={shop} onFinalize={handleFinalizeSale} onClose={() => setShowPaymentModal(false)} />}
             {showHeldBills && <HeldBillsModal bills={heldBills} onRestore={handleRestoreBill} onClose={() => setShowHeldBills(false)} />}

            {/* Left side: Product selection */}
            <div className="w-full md:w-3/5 flex flex-col min-h-0">
                <input type="search" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products by name or barcode..." className="w-full input-base p-2 rounded-lg mb-3 flex-shrink-0" />
                <div className="pos-category-tabs flex-shrink-0">
                    <button onClick={() => setActiveCategoryId('all')} className={`pos-category-tab ${activeCategoryId === 'all' ? 'active' : ''}`}>All</button>
                    {shopCategories.map(c => <button key={c.id} onClick={() => setActiveCategoryId(c.id)} className={`pos-category-tab ${activeCategoryId === c.id ? 'active' : ''}`}>{c.name}</button>)}
                </div>
                <div className="flex-grow overflow-y-auto pr-2 pt-3">
                    <div className="pos-product-grid">
                        <button className="pos-product-card bg-sky-500/20 border-sky-500/50 hover:border-sky-400">
                            <span className="text-3xl">＋</span>
                            <p className="text-xs font-semibold text-primary">Custom Item</p>
                        </button>
                        {filteredProducts.map(p => (
                            <button key={p.id} onClick={() => handleAddToCart(p)} disabled={p.stockQuantity <=0} className="pos-product-card">
                                <p className="text-xs font-semibold text-primary leading-tight">{p.name}</p>
                                <p className="text-xs text-secondary mt-1">{formatCurrency(p.sellingPrice)}</p>
                                <p className="text-[10px] text-tertiary">Qty: {p.stockQuantity}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side: Bill/Cart */}
            <div className="w-full md:w-2/5 flex flex-col bg-subtle p-3 rounded-lg border border-divider min-h-0">
                <div className="grid grid-cols-2 gap-2 mb-2 flex-shrink-0">
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer Name (Optional)" className="w-full input-base p-2 rounded-lg" />
                    <CustomSelect value={employeeId} onChange={setEmployeeId} options={[{value: '', label: 'No Employee'},...employees.map(e => ({ value: e.id, label: e.name }))]} />
                </div>
                <div className="p-1 rounded-lg bg-slate-900/30 flex justify-around gap-1 mb-2 flex-shrink-0">
                    <button onClick={handleHoldBill} className="text-xs p-2 rounded-md hover-bg-stronger w-full">Hold</button>
                    <button onClick={() => setShowHeldBills(true)} className="text-xs p-2 rounded-md hover-bg-stronger w-full relative">Retrieve <span className="absolute -top-1 -right-1 text-[10px] bg-sky-500 text-white rounded-full h-4 w-4 flex items-center justify-center">{heldBills.length}</span></button>
                    <button onClick={resetCart} className="text-xs p-2 rounded-md hover-bg-stronger w-full text-rose-400">Clear</button>
                </div>

                <div className="flex-grow overflow-y-auto space-y-1 pr-1 bg-slate-900/20 rounded-lg min-h-0">
                    {cartItems.map(item => (
                        <div key={item.productId} id={`cart-item-${item.productId}`} className="pos-cart-item flex items-center gap-2 text-sm p-2">
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
                            <input type="text" inputMode="decimal" onWheel={e => e.currentTarget.blur()} value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-20 input-base p-1 rounded-md text-right no-spinner" />
                            <div className="flex items-center gap-1 p-0.5 rounded-full bg-subtle border border-divider">
                                <button onClick={() => setDiscountType('flat')} className={`px-3 py-1 text-xs rounded-full ${discountType === 'flat' ? 'bg-emerald-500 text-white' : ''}`}>Flat</button>
                                <button onClick={() => setDiscountType('percentage')} className={`px-3 py-1 text-xs rounded-full ${discountType === 'percentage' ? 'bg-emerald-500 text-white' : ''}`}>%</button>
                            </div>
                        </div>
                     </div>
                     {discountAmount > 0 && <div className="flex justify-end text-rose-400 font-mono">- {formatCurrency(discountAmount)}</div>}
                     {shop.taxRate && shop.taxRate > 0 && <div className="flex justify-between"><span className="text-secondary">Tax ({shop.taxRate}%)</span><span className="font-mono text-primary">{formatCurrency(taxAmount)}</span></div>}
                     <div className="flex justify-between font-bold text-2xl pt-2 border-t border-divider mt-2"><span className="text-primary">Total</span><span className="font-mono text-primary">{formatCurrency(totalAmount)}</span></div>
                     <button onClick={() => setShowPaymentModal(true)} disabled={cartItems.length === 0} className="button-primary w-full py-3 mt-2 text-lg">Finalize Payment</button>
                </div>
            </div>
            {lastSale && <SaleReceiptModal sale={lastSale} shop={shop} onClose={() => setLastSale(null)} />}
        </div>
    );
};

// ... other components from ShopScreen.tsx remain unchanged ...

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

interface ShiftFormProps {
    shift: ShopShift | null,
    onSave: (data: Omit<ShopShift, 'id'|'shopId'>, id?: string) => void,
    onCancel: () => void,
    openModal: (name: ActiveModal, props?: Record<string, any>) => void,
}

const ShiftForm: React.FC<ShiftFormProps> = ({ shift, onSave, onCancel, openModal }) => {
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
                 <button type="button" onClick={() => openModal('timePicker', { initialTime: formState.startTime, onSave: (t: string) => setFormState(p=>({...p, startTime: t})) })} className="w-full input-base p-2 rounded-md">{formState.startTime}</button>
                 <button type="button" onClick={() => openModal('timePicker', { initialTime: formState.endTime, onSave: (t: string) => setFormState(p=>({...p, endTime: t})) })} className="w-full input-base p-2 rounded-md">{formState.endTime}</button>
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
                <input type="number" onWheel={e => e.currentTarget.blur()} value={formState.salary} onChange={e => setFormState(p => ({...p, salary: e.target.value}))} placeholder="Salary (Optional)" className="w-full input-base p-2 rounded-md no-spinner" />
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
    openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

interface ShopDetailViewProps extends ShopScreenProps {
  shop: Shop;
  onBack: () => void;
}

const ShopDetailView: React.FC<ShopDetailViewProps> = (props) => {
    const { shop, products, sales, employees, shifts, onBack, onSaveProduct, onDeleteProduct, onRecordSale, onSaveEmployee, onDeleteEmployee, onSaveShift, onDeleteShift, openModal } = props;
    const [view, setView] = useState<ShopView>('billing');
    const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingShift, setEditingShift] = useState<ShopShift | null>(null);
    const [showShiftForm, setShowShiftForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<ShopEmployee | null>(null);
    const [showEmployeeForm, setShowEmployeeForm] = useState(false);
    const { categories } = useContext(SettingsContext);
    
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
    
    const handleAddDefaultShifts = () => {
        const defaults = [
            { name: 'Morning Shift', startTime: '09:00', endTime: '17:00' },
            { name: 'Evening Shift', startTime: '17:00', endTime: '01:00' }
        ];
        defaults.forEach(d => {
            if (!shifts.some(s => s.name === d.name)) {
                onSaveShift(shop.id, d);
            }
        });
    };

    const handleSaveEmp = (employeeData: Omit<ShopEmployee, 'id' | 'shopId'>, id?: string) => {
        onSaveEmployee(shop.id, employeeData, id);
        setShowEmployeeForm(false);
        setEditingEmployee(null);
    };

    const renderView = () => {
        switch(view) {
            case 'analytics': return <AnalyticsView shop={shop} products={products} sales={sales} />;
            case 'billing': return <BillingView shop={shop} products={products} employees={employees} onRecordSale={(sale) => onRecordSale(shop.id, sale)} categories={categories} />
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
                    {showProductForm && <ProductForm shop={shop} product={editingProduct} onSave={handleSaveProd} onCancel={() => { setShowProductForm(false); setEditingProduct(null); }} categories={categories} />}
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
                     {shifts.length === 0 && (
                        <button onClick={handleAddDefaultShifts} className="w-full button-secondary py-2 mt-2">Add Default Shifts</button>
                    )}
                    {showShiftForm && <ShiftForm shift={editingShift} onSave={handleSaveSh} onCancel={() => { setShowShiftForm(false); setEditingShift(null); }} openModal={openModal} />}
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
                    <TabButton tab="billing" label="Billing" />
                    <TabButton tab="analytics" label="Analytics" />
                    <TabButton tab="products" label="Products" />
                    <TabButton tab="employees" label="Employees" />
                    <TabButton tab="shifts" label="Shifts" />
                </div>
            </div>
            <div className={`flex-grow overflow-hidden ${view === 'billing' ? 'p-4' : 'overflow-y-auto p-4'}`}>
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

const ShopDashboard: React.FC<ShopScreenProps & { onSelectShop: (id: string) => void }> = (props) => {
    const { shops, sales, products, onSelectShop, onSaveShop, onDeleteShop } = props;
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

    const StatCard = ({ title, value, icon, colorClass }: { title: string, value: string, icon: string, colorClass: string }) => (
        <div className="p-3 bg-subtle rounded-lg flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass}/20`}>
                <span className={`text-xl ${colorClass}`}>{icon}</span>
            </div>
            <div>
                <p className="text-xs text-secondary">{title}</p>
                <p className="text-lg font-bold text-primary">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0">
                <h2 className="text-2xl font-bold text-primary text-center">Shop Hub 🏪</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {shops.map(shop => {
                    const formatCurrency = getCurrencyFormatter(shop.currency).format;
                    const shopProductsCount = products.filter(p => p.shopId === shop.id).length;
                    const shopSalesData = sales.filter(s => s.shopId === shop.id);
                    const shopSalesCount = shopSalesData.length;
                    const totalProfit = shopSalesData.reduce((sum, s) => sum + s.profit, 0);
                    const totalRevenue = shopSalesData.reduce((sum, s) => sum + s.totalAmount, 0);

                    return (
                        <div key={shop.id} onClick={() => onSelectShop(shop.id)} className="glass-card p-4 rounded-xl group cursor-pointer flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-primary">{shop.name}</h3>
                                    <p className="text-xs text-secondary capitalize">{shop.type.replace('_', ' ')}</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(shop); }} className="text-xs text-sky-400 hover:brightness-125 px-2 py-1 rounded-full transition-colors bg-subtle hover-bg-stronger">Edit</button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteShop(shop.id); }} className="text-xs text-rose-400 hover:brightness-125 px-2 py-1 rounded-full transition-colors bg-subtle hover-bg-stronger">Delete</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon="💰" colorClass="text-emerald-400" />
                                <StatCard title="Total Profit" value={formatCurrency(totalProfit)} icon="💸" colorClass="text-green-400" />
                                <StatCard title="Total Sales" value={shopSalesCount.toString()} icon="🧾" colorClass="text-sky-400" />
                                <StatCard title="Products" value={shopProductsCount.toString()} icon="📦" colorClass="text-violet-400" />
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

const PaymentModal: React.FC<{
    total: number;
    shop: Shop;
    onClose: () => void;
    onFinalize: (paymentMethod: PaymentMethod, amountPaid?: number, changeGiven?: number) => void;
}> = ({ total, shop, onClose, onFinalize }) => {
    const [method, setMethod] = useState<PaymentMethod>('cash');
    const [cashPaid, setCashPaid] = useState('');
    const formatCurrency = getCurrencyFormatter(shop.currency).format;
    const change = (parseFloat(cashPaid) || 0) - total;

    const quickCashOptions = [total, Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100].filter((v, i, a) => a.indexOf(v) === i && v > total);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-sm p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title="Payment" onClose={onClose} />
                <div className="p-6 space-y-4">
                    <div className="text-center">
                        <p className="text-secondary text-sm">Amount Due</p>
                        <p className="text-4xl font-bold text-primary">{formatCurrency(total)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {['cash', 'card', 'upi', 'other'].map(m => (
                            <button key={m} onClick={() => setMethod(m as PaymentMethod)} className={`w-full py-2 text-sm font-semibold rounded-full transition-colors ${method === m ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary'}`}>
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                            </button>
                        ))}
                    </div>
                    {method === 'cash' && (
                        <div className="space-y-3 animate-fadeInUp">
                            <input type="text" inputMode="decimal" onWheel={e => e.currentTarget.blur()} value={cashPaid} onChange={e => setCashPaid(e.target.value)} placeholder="Cash Received" className="w-full input-base p-2 rounded-lg text-center text-lg" autoFocus />
                            <div className="flex gap-2 justify-center">
                                {quickCashOptions.map(val => <button key={val} onClick={() => setCashPaid(val.toString())} className="button-secondary text-xs px-3 py-1.5">{formatCurrency(val)}</button>)}
                            </div>
                            {change >= 0 && <p className="text-center text-lg">Change Due: <strong className="text-sky-400">{formatCurrency(change)}</strong></p>}
                        </div>
                    )}
                     <button onClick={() => onFinalize(method, method === 'cash' ? parseFloat(cashPaid) : undefined, method === 'cash' ? change : undefined)} className="button-primary w-full py-3 mt-2 text-lg">Confirm Sale</button>
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')!
    )
};

const HeldBillsModal: React.FC<{
    bills: HeldBill[];
    onClose: () => void;
    onRestore: (bill: HeldBill) => void;
}> = ({ bills, onClose, onRestore }) => (
    ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-sm p-0 border border-divider animate-scaleIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <ModalHeader title="Held Bills" onClose={onClose} />
                <div className="flex-grow p-4 space-y-2 overflow-y-auto">
                    {bills.map(bill => (
                        <button key={bill.id} onClick={() => onRestore(bill)} className="w-full p-3 bg-subtle rounded-lg text-left hover-bg-stronger">
                            <p className="font-semibold text-primary">{bill.customerName}</p>
                            <p className="text-xs text-secondary">{bill.items.length} items • {new Date(bill.timestamp).toLocaleTimeString()}</p>
                        </button>
                    ))}
                    {bills.length === 0 && <p className="text-center text-sm text-secondary py-8">No bills on hold.</p>}
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')!
    )
);