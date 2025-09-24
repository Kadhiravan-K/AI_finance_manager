

import React, { useState } from 'react';
import { Shop, ShopProduct, ActiveModal } from '../../types';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import EmptyState from '../EmptyState';

interface ShopProductsScreenProps {
    shop: Shop;
    products: ShopProduct[];
    onDelete: (id: string) => void;
    openModal: (name: ActiveModal, props?: any) => void;
}

const ShopProductsScreen: React.FC<ShopProductsScreenProps> = ({ shop, products, onDelete, openModal }) => {
    const formatCurrency = useCurrencyFormatter(undefined, shop.currency);

    return (
        <div className="space-y-3">
            {products.length > 0 ? products.map(product => (
                <div key={product.id} className="p-3 bg-subtle rounded-lg group">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-primary">{product.name}</p>
                            <p className="text-xs text-secondary">Stock: {product.stock}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="font-semibold text-primary">{formatCurrency(product.price)}</p>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openModal('editProduct', { product, shopId: shop.id })} className="text-xs px-2 py-1 text-sky-300">Edit</button>
                                <button onClick={() => onDelete(product.id)} className="text-xs px-2 py-1 text-rose-400">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )) : (
                <EmptyState
                    icon="📦"
                    title="No Products Yet"
                    message="Add your first product to start tracking inventory and sales."
                    actionText="Add Product"
                    onAction={() => openModal('editProduct', { shopId: shop.id })}
                />
            )}
            {products.length > 0 && (
                <button onClick={() => openModal('editProduct', { shopId: shop.id })} className="w-full button-secondary py-2 mt-4">+ Add New Product</button>
            )}
        </div>
    );
};

export default ShopProductsScreen;
