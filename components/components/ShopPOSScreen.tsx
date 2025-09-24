

import React, { useState, useMemo } from 'react';
import { Shop, ShopProduct, ShopSale } from '../../types';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface ShopPOSScreenProps {
  shop: Shop;
  products: ShopProduct[];
  onRecordSale: (shopId: string, sale: Omit<ShopSale, 'id'|'shopId'>) => void;
}

const ShopPOSScreen: React.FC<ShopPOSScreenProps> = ({ shop, products, onRecordSale }) => {
    const formatCurrency = useCurrencyFormatter(undefined, shop.currency);
    const [cart, setCart] = useState<Map<string, { quantity: number, price: number }>>(new Map());
    const [removingItemId, setRemovingItemId] = useState<string | null>(null);

    const handleAddToCart = (product: ShopProduct) => {
        setCart(prev => {
            const newCart = new Map(prev);
            const existing = newCart.get(product.id);
            newCart.set(product.id, {
                quantity: (existing?.quantity || 0) + 1,
                price: product.price
            });
            return newCart;
        });
    };
    
    const handleRemoveFromCart = (productId: string) => {
        setCart(prev => {
            const newCart = new Map(prev);
            newCart.delete(productId);
            return newCart;
        });
    };

    const handleQuantityChange = (productId: string, delta: number) => {
        setCart(prev => {
            const newCart = new Map(prev);
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

        const sale: Omit<ShopSale, 'id'|'shopId'> = {
            items: Array.from(cart.entries()).map(([productId, data]) => ({ productId, ...data })),
            totalAmount: cartTotal,
            profit: 0, // Profit calculation requires cost of goods
            date: new Date().toISOString()
        };
        onRecordSale(shop.id, sale);
        setCart(new Map());
    };

    const cartTotal = useMemo(() => {
        return Array.from(cart.values()).reduce((sum, item) => sum + item.quantity * item.price, 0);
    }, [cart]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Product Selection */}
            <div className="md:col-span-2 flex flex-col h-full">
                <h3 className="font-semibold text-lg text-primary mb-3">Products</h3>
                <div className="pos-product-grid flex-grow overflow-y-auto pr-2">
                    {products.map(p => (
                        <button key={p.id} onClick={() => handleAddToCart(p)} disabled={p.stock <= 0} className="pos-product-card">
                            <span className="text-sm font-semibold text-primary">{p.name}</span>
                            <span className="text-xs text-secondary">{formatCurrency(p.price)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cart */}
            <div className="flex flex-col h-full bg-subtle p-4 rounded-lg border border-divider">
                <h3 className="font-semibold text-lg text-primary mb-3 flex-shrink-0">Cart</h3>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {cart.size === 0 ? (
                        <p className="text-center text-sm text-secondary pt-12">Cart is empty</p>
                    ) : (
                        Array.from(cart.entries()).map(([productId, data]) => {
                            const product = products.find(p => p.id === productId);
                            return (
                                <div key={productId} className={`pos-cart-item p-2 bg-subtle rounded-lg border border-divider ${removingItemId === productId ? 'removing' : ''}`}>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-semibold text-primary truncate pr-2">{product?.name || 'Unknown'}</span>
                                        <span className="font-mono text-primary">{formatCurrency(data.price * data.quantity)}</span>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-1">
                                        <button onClick={() => handleQuantityChange(productId, -1)} className="control-button control-button-minus">-</button>
                                        <span className="font-mono w-8 text-center">{data.quantity}</span>
                                        <button onClick={() => handleQuantityChange(productId, 1)} className="control-button control-button-plus">+</button>
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
