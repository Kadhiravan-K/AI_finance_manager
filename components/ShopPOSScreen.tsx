
import React, { useState, useMemo } from 'react';
import { Shop, ShopProduct, ShopSale, ShopType } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface ShopPOSScreenProps {
  shop: Shop;
  products: ShopProduct[];
  onRecordSale: (shopId: string, sale: Omit<ShopSale, 'id'|'shopId'>) => void;
}

const ShopPOSScreen: React.FC<ShopPOSScreenProps> = ({ shop, products, onRecordSale }) => {
    const formatCurrency = useCurrencyFormatter(undefined, shop.currency);
    const [cart, setCart] = useState<Map<string, { quantity: number, price: number, name?: string }>>(new Map());
    const [removingItemId, setRemovingItemId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // Quick Item State
    const [quickItemName, setQuickItemName] = useState('');
    const [quickItemPrice, setQuickItemPrice] = useState('');
    const [quickItemQty, setQuickItemQty] = useState('1');

    const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [products, searchQuery, selectedCategory]);

    const handleAddToCart = (product: ShopProduct) => {
        setCart(prev => {
            const newCart = new Map<string, { quantity: number, price: number, name?: string }>(prev);
            const existing = newCart.get(product.id);
            newCart.set(product.id, {
                quantity: (existing?.quantity || 0) + 1,
                price: product.price,
                name: product.name
            });
            return newCart;
        });
    };

    const handleAddQuickItem = () => {
        if (!quickItemName.trim() || !quickItemPrice || parseFloat(quickItemPrice) < 0) return;
        const id = `quick-${Date.now()}`;
        const price = parseFloat(quickItemPrice);
        const qty = parseInt(quickItemQty) || 1;
        
        setCart(prev => {
            const newCart = new Map<string, { quantity: number, price: number, name?: string }>(prev);
            newCart.set(id, {
                quantity: qty,
                price: price,
                name: quickItemName
            });
            return newCart;
        });

        // Reset Quick Item fields
        setQuickItemName('');
        setQuickItemPrice('');
        setQuickItemQty('1');
    };
    
    const handleRemoveFromCart = (productId: string) => {
        setCart(prev => {
            const newCart = new Map<string, { quantity: number, price: number, name?: string }>(prev);
            newCart.delete(productId);
            return newCart;
        });
    };

    const handleQuantityChange = (productId: string, delta: number) => {
        setCart(prev => {
            const newCart = new Map<string, { quantity: number, price: number, name?: string }>(prev);
            const existing = newCart.get(productId);
            if (existing) {
                const newQuantity = existing.quantity + delta;
                if (newQuantity > 0) {
                    newCart.set(productId, { ...existing, quantity: newQuantity });
                } else {
                    setRemovingItemId(productId);
                    setTimeout(() => {
                        handleRemoveFromCart(productId);
                        setRemovingItemId(null);
                    }, 300);
                }
            }
            return newCart;
        });
    };

    const handleCheckout = () => {
        if (cart.size === 0) return;
        
        const saleItems = Array.from(cart.entries()).map(([productId, data]) => ({ productId, ...data }));
        const saleProfit = saleItems.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            const cost = product?.costPrice || 0; // For custom items, profit = price (assume 0 cost for now)
            return sum + (item.quantity * (item.price - cost));
        }, 0);

        const sale: Omit<ShopSale, 'id'|'shopId'> = {
            items: saleItems,
            totalAmount: cartTotal,
            profit: saleProfit,
            date: new Date().toISOString()
        };
        onRecordSale(shop.id, sale);
        setCart(new Map());
    };

    const cartTotal = useMemo(() => {
        return Array.from(cart.values()).reduce((sum: number, item: { quantity: number; price: number }) => sum + item.quantity * item.price, 0);
    }, [cart]);

    const getLabels = () => {
        switch (shop.type) {
            case ShopType.SERVICE_XEROX: return { product: "Item / Service", search: "Search services...", stock: false };
            case ShopType.SERVICE_REPAIR: return { product: "Parts / Service", search: "Search parts...", stock: true };
            case ShopType.SERVICE_BUSINESS: return { product: "Service", search: "Search services...", stock: false };
            case ShopType.WHOLESALE: return { product: "Product", search: "Search products...", stock: true };
            default: return { product: "Product", search: "Search products...", stock: true };
        }
    };
    
    const labels = getLabels();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Product Selection */}
            <div className="md:col-span-2 flex flex-col h-full">
                
                {/* Quick Add Section */}
                <div className="p-3 bg-subtle rounded-lg mb-3 flex-shrink-0 border border-divider">
                    <h4 className="text-xs font-semibold text-secondary mb-2 uppercase tracking-wider">Quick Add {labels.product}</h4>
                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={quickItemName} 
                            onChange={e => setQuickItemName(e.target.value)} 
                            placeholder={shop.type === ShopType.SERVICE_XEROX ? "e.g., Xerox (50 pgs)" : "Item Name"} 
                            className="input-base p-2 rounded-md flex-grow w-full" 
                        />
                         <input 
                            type="number" 
                            value={quickItemQty} 
                            onChange={e => setQuickItemQty(e.target.value)} 
                            onWheel={e => (e.target as HTMLInputElement).blur()}
                            placeholder="Qty" 
                            className="input-base p-2 rounded-md w-16 text-center no-spinner" 
                        />
                        <input 
                            type="number" 
                            value={quickItemPrice} 
                            onChange={e => setQuickItemPrice(e.target.value)} 
                            onWheel={e => (e.target as HTMLInputElement).blur()}
                            placeholder="Price" 
                            className="input-base p-2 rounded-md w-24 no-spinner" 
                        />
                        <button onClick={handleAddQuickItem} className="button-primary px-3 py-2 rounded-md text-sm font-semibold whitespace-nowrap">Add</button>
                    </div>
                </div>

                <div className="flex-shrink-0 mb-3 space-y-3">
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={labels.search} className="input-base w-full rounded-full py-2 px-4" />
                    {categories.length > 1 && (
                        <div className="pos-category-tabs">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`pos-category-tab ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="pos-product-grid flex-grow overflow-y-auto pr-2">
                    {filteredProducts.map(p => (
                        <button key={p.id} onClick={() => handleAddToCart(p)} disabled={labels.stock && p.stock <= 0} className="pos-product-card">
                            <span className="text-sm font-semibold text-primary truncate w-full">{p.name}</span>
                            <span className="text-xs text-secondary">{formatCurrency(p.price)}</span>
                            {labels.stock && <span className={`text-[10px] mt-1 ${p.stock < 5 ? 'text-rose-400' : 'text-tertiary'}`}>Stock: {p.stock}</span>}
                        </button>
                    ))}
                     {filteredProducts.length === 0 && <p className="col-span-full text-center text-secondary py-8">No saved {labels.product.toLowerCase()}s found.</p>}
                </div>
            </div>

            {/* Cart */}
            <div className="flex flex-col h-full bg-subtle p-4 rounded-lg border border-divider">
                <h3 className="font-semibold text-lg text-primary mb-3 flex-shrink-0">Current Sale</h3>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {cart.size === 0 ? (
                        <p className="text-center text-sm text-secondary pt-12">Cart is empty</p>
                    ) : (
                        Array.from(cart.entries()).map(([id, data]) => {
                            const product = products.find(p => p.id === id);
                            const displayName = data.name || product?.name || 'Unknown Item';
                            
                            return (
                                <div key={id} className={`pos-cart-item p-2 bg-subtle rounded-lg border border-divider ${removingItemId === id ? 'removing' : ''}`}>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-semibold text-primary truncate pr-2 w-32">{displayName}</span>
                                        <span className="font-mono text-primary">{formatCurrency(data.price * data.quantity)}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                         <span className="text-xs text-secondary">@ {formatCurrency(data.price)}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleQuantityChange(id, -1)} className="control-button control-button-minus">-</button>
                                            <span className="font-mono w-6 text-center text-sm">{data.quantity}</span>
                                            <button onClick={() => handleQuantityChange(id, 1)} className="control-button control-button-plus">+</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <div className="pt-4 border-t border-divider flex-shrink-0">
                    <div className="flex justify-between font-semibold text-lg mb-4">
                        <span className="text-primary">Total</span>
                        <span className="text-primary">{formatCurrency(cartTotal)}</span>
                    </div>
                    <button onClick={handleCheckout} disabled={cart.size === 0} className="button-primary w-full py-2">Checkout</button>
                </div>
            </div>
        </div>
    );
};

export default ShopPOSScreen;
