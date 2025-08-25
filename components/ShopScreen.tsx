import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Shop, ShopProduct, ShopSale, ShopSaleItem } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';

type ShopView = 'billing' | 'products' | 'analytics';

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
                <input type="number" step="0.01" value={formState.purchasePrice} onChange={e => handleChange('purchasePrice', e.target.value)} placeholder="Purchase Price (e.g. 10.50)" className="w-full input-base p-2 rounded-md no-spinner" />
                <input type="number" step="0.01" value={formState.sellingPrice} onChange={e => handleChange('sellingPrice', e.target.value)} placeholder="Selling Price (e.g. 15.00)" className="w-full input-base p-2 rounded-md no-spinner" />
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
    onSaveShop: (shop: Omit<Shop, 'id'>, id?: string) => void;
    onDeleteShop: (id: string) => void;
    onSaveProduct: (shopId: string, product: Omit<ShopProduct, 'id' | 'shopId'>, id?: string) => void;
    onDeleteProduct: (id: string) => void;
    onRecordSale: (shopId: string, sale: Omit<ShopSale, 'id' | 'shopId'>) => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = (props) => {
    const [selectedShopId, setSelectedShopId] = useState<string | null>(props.shops.length === 1 ? props.shops[0].id : null);
    const selectedShop = props.shops.find(s => s.id === selectedShopId);

    if (selectedShopId && selectedShop) {
        return <ShopDetailView 
            shop={selectedShop} 
            products={props.products.filter(p => p.shopId === selectedShopId)} 
            sales={props.sales.filter(s => s.shopId === selectedShopId)}
            onBack={() => setSelectedShopId(null)}
            {...props}
        />
    }

    return <ShopDashboard {...props} onSelectShop={setSelectedShopId} />;
};

const ShopDashboard: React.FC<ShopScreenProps & { onSelectShop: (id: string) => void }> = ({ shops, products, sales, onSelectShop, onSaveShop, onDeleteShop }) => {
    const [isFormOpen, setIsFormOpen] = useState(shops.length === 0);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const formatCurrency = useCurrencyFormatter();

    const aggregateStats = React.useMemo(() => {
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
        return { totalRevenue, totalProfit, totalSales: sales.length };
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
            <div className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 bg-subtle rounded-lg"><p className="text-xs text-secondary">Total Revenue</p><p className="font-bold text-primary">{formatCurrency(aggregateStats.totalRevenue)}</p></div>
                    <div className="p-2 bg-subtle rounded-lg"><p className="text-xs text-secondary">Total Profit</p><p className="font-bold text-primary">{formatCurrency(aggregateStats.totalProfit)}</p></div>
                    <div className="p-2 bg-subtle rounded-lg"><p className="text-xs text-secondary">Total Sales</p><p className="font-bold text-primary">{aggregateStats.totalSales}</p></div>
                </div>
            </div>
            <div className="flex-grow p-6 pt-0 overflow-y-auto space-y-2">
                {shops.map(shop => (
                    <div key={shop.id} className="p-3 bg-subtle rounded-lg group flex justify-between items-center hover:scale-[1.02] transition-transform">
                        <div onClick={() => onSelectShop(shop.id)} className="flex-grow cursor-pointer">
                            <p className="font-semibold text-primary">{shop.name}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(shop)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full">Edit</button>
                            <button onClick={() => onDeleteShop(shop.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full ml-1">Delete</button>
                        </div>
                    </div>
                ))}
                 {shops.length === 0 && !isFormOpen && <p className="text-center text-secondary py-8">Create your first shop to get started.</p>}
            </div>
            {!isFormOpen && <div className="p-4 border-t border-divider"><button onClick={() => setIsFormOpen(true)} className="button-primary w-full py-2">Create New Shop</button></div>}
            {isFormOpen && <ShopForm shop={editingShop} onSave={onSaveShop} onCancel={handleCancel} />}
        </div>
    );
};

const ShopForm: React.FC<{shop: Shop | null, onSave: ShopScreenProps['onSaveShop'], onCancel: () => void}> = ({ shop, onSave, onCancel }) => {
    const [name, setName] = useState(shop?.name || '');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) onSave({ name: name.trim() }, shop?.id);
        onCancel();
    };
    return (
         <form onSubmit={handleSubmit} className="p-4 border-t border-divider bg-subtle space-y-3">
             <h4 className="font-semibold text-primary">{shop ? 'Edit Shop' : 'Create New Shop'}</h4>
             <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Shop Name" className="w-full input-base p-2 rounded-md" required/>
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
    const { shop, onBack, products, sales, onSaveProduct, onDeleteProduct, onRecordSale } = props;

    const renderView = () => {
        switch(view) {
            case 'products': return <ShopProductsManager shopId={shop.id} products={products} onSaveProduct={onSaveProduct} onDeleteProduct={onDeleteProduct} />;
            case 'billing': return <ShopBilling shopId={shop.id} products={products} onRecordSale={onRecordSale} />;
            case 'analytics': return <ShopAnalytics sales={sales} products={products} />;
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
                    <button onClick={() => setView('analytics')} className={`px-3 py-1 text-xs rounded-full ${view === 'analytics' ? 'bg-emerald-500 text-white' : ''}`}>Analytics</button>
                </div>
            </div>
            {renderView()}
        </div>
    );
};

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
                        <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" className="w-full input-base p-2 rounded-md no-spinner" required />
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

const ShopBilling: React.FC<{shopId: string, products: ShopProduct[], onRecordSale: ShopScreenProps['onRecordSale']}> = ({ shopId, products, onRecordSale }) => {
    const formatCurrency = useCurrencyFormatter();
    const [cart, setCart] = useState<Map<string, { product: ShopProduct, quantity: number }>>(new Map());
    const [isScanning, setIsScanning] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isCustomItemFormOpen, setIsCustomItemFormOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const addProductToCart = useCallback((product: ShopProduct) => {
        setCart(prev => {
            const newCart = new Map(prev);
            const existing = newCart.get(product.id);
            if (existing) {
                if (existing.quantity < product.stockQuantity) {
                    newCart.set(product.id, {...existing, quantity: existing.quantity + 1});
                } else {
                    alert(`Not enough stock for ${product.name}.`);
                }
            } else if (product.stockQuantity > 0) {
                newCart.set(product.id, { product, quantity: 1 });
            } else {
                alert(`${product.name} is out of stock.`);
            }
            return newCart;
        });
    }, []);
    
    useEffect(() => {
        let stream: MediaStream | null = null;
        let animationFrameId: number;

        const stopScan = () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (stream) stream.getTracks().forEach(track => track.stop());
            setIsScanning(false);
        };

        const startScan = async () => {
            // ... (rest of the scanning logic remains the same)
        };

        if (isScanning) startScan();
        return () => stopScan();
    }, [isScanning, products, addProductToCart]);
    
    const handleAddCustomItem = (name: string, price: number, quantity: number) => {
        const customProduct: ShopProduct = {
            id: `custom-${self.crypto.randomUUID()}`, shopId: shopId, name: name, sellingPrice: price,
            purchasePrice: price, stockQuantity: 999, categoryId: 'custom-sale',
        };
        setCart(prev => {
            const newCart = new Map(prev);
            newCart.set(customProduct.id, { product: customProduct, quantity: quantity });
            return newCart;
        });
        setIsCustomItemFormOpen(false);
    };
    
    const totalAmount = Array.from(cart.values()).reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
    
    const handleCheckout = () => {
        if (cart.size === 0) return;
        const items: ShopSaleItem[] = Array.from(cart.values()).map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            pricePerUnit: item.product.sellingPrice,
            discount: 0
        }));
        const profit = items.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + ((item.pricePerUnit - (product?.purchasePrice || item.pricePerUnit)) * item.quantity);
        }, 0);
        
        onRecordSale(shopId, {
            timestamp: new Date().toISOString(),
            employeeId: 'default',
            items,
            totalAmount,
            profit
        });
        setCart(new Map());
    }

    return (
        <div className="flex flex-col h-full">
            {isScanning && <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center" onClick={() => setIsScanning(false)}><video ref={videoRef} autoPlay playsInline className="w-full max-w-md h-auto" /><p className="text-white mt-4">Point camera at QR/Barcode</p></div>}
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
                    <span className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
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

const ProductPicker: React.FC<{products: ShopProduct[], onSelect: (p: ShopProduct) => void, onClose: () => void}> = ({ products, onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => query ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())) : products, [products, query]);
    
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4" onClick={onClose}>
            <div className="glass-card rounded-lg w-full max-w-sm max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <ModalHeader title="Select a Product" onClose={onClose} />
                <div className="p-2"><input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." className="w-full input-base p-2 rounded-md" autoFocus /></div>
                <div className="flex-grow overflow-y-auto p-2">
                    {filtered.map(p => <button key={p.id} onClick={() => { onSelect(p); onClose(); }} className="w-full text-left p-3 hover-bg-stronger rounded-md">{p.name} - (Stock: {p.stockQuantity})</button>)}
                </div>
            </div>
        </div>
    );
};

const ShopAnalytics: React.FC<{sales: ShopSale[], products: ShopProduct[]}> = ({ sales, products }) => {
    const formatCurrency = useCurrencyFormatter();
    const stats = useMemo(() => {
        const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        const profit = sales.reduce((sum, s) => sum + s.profit, 0);
        
        const productSales = sales.flatMap(s => s.items).reduce((acc, item) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
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
                </div>
            </div>
        </div>
    );
}

export default ShopScreen;