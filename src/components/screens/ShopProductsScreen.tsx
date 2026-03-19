
import React, { useState } from 'react';
import { Shop, ShopProduct, ActiveModal, ShopType } from '@/types';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import EmptyState from '@/components/common/EmptyState';

interface ShopProductsScreenProps {
    shop: Shop;
    products: ShopProduct[];
    onDelete: (id: string) => void;
    openModal: (name: ActiveModal, props?: any) => void;
}

const ShopProductsScreen: React.FC<ShopProductsScreenProps> = ({ shop, products, onDelete, openModal }) => {
    const formatCurrency = useCurrencyFormatter(undefined, shop.currency);

    const getLabels = () => {
        switch (shop.type) {
            case ShopType.SERVICE_XEROX: return { item: "Service", add: "Add Service", stock: false };
            case ShopType.SERVICE_BUSINESS: return { item: "Service", add: "Add Service", stock: false };
            case ShopType.SERVICE_REPAIR: return { item: "Part/Service", add: "Add Part/Service", stock: true };
            default: return { item: "Product", add: "Add Product", stock: true };
        }
    };
    
    const labels = getLabels();

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-primary">{labels.item} List</h3>
                {products.length > 0 && (
                    <button onClick={() => openModal('editProduct', { shopId: shop.id })} className="button-secondary text-xs px-3 py-1">
                        + {labels.add}
                    </button>
                )}
            </div>
            
            {products.length > 0 ? products.map(product => (
                <div key={product.id} className="p-3 bg-subtle rounded-lg group">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-primary">{product.name}</p>
                            {labels.stock && <p className="text-xs text-secondary">Stock: {product.stock}</p>}
                            {!labels.stock && product.category && <p className="text-xs text-secondary">{product.category}</p>}
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
                    icon={labels.stock ? "📦" : "🛠️"}
                    title={`No ${labels.item}s Yet`}
                    message={`Add your first ${labels.item.toLowerCase()} to start tracking.`}
                    actionText={labels.add}
                    onAction={() => openModal('editProduct', { shopId: shop.id })}
                />
            )}
        </div>
    );
};

export default ShopProductsScreen;
