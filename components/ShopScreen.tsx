import React, { useState, useMemo, useEffect } from 'react';
import { Shop, ShopProduct, ShopSale, ShopEmployee, ShopShift, ActiveModal } from '../types';
import EmptyState from './EmptyState';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomSelect from './CustomSelect';
import { getShopInsights } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

// --- PROPS ---
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

// --- SUB-COMPONENTS ---
const AnalyticsScreen: React.FC<{ shop: Shop; sales: ShopSale[]; products: ShopProduct[] }> = ({ shop, sales, products }) => {
    const [insights, setInsights] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const shopSales = useMemo(() => sales.filter(s => s.shopId === shop.id), [sales, shop.id]);
    const formatCurrency = useCurrencyFormatter(undefined, shop.currency);

    const totalRevenue = useMemo(() => shopSales.reduce((sum, s) => sum + s.totalAmount, 0), [shopSales]);
    const totalProfit = useMemo(() => shopSales.reduce((sum, s) => sum + s.profit, 0), [shopSales]);

    useEffect(() => {
        const fetchInsights = async () => {
            setIsLoading(true);
            try {
                const results = await getShopInsights(shopSales, products.filter(p => p.shopId === shop.id));
                setInsights(results);
            } catch (e) {
                console.error(e);
                setInsights(["Could not load AI insights."]);
            }
            setIsLoading(false);
        };
        fetchInsights();
    }, [shop, shopSales, products]);
    
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-subtle rounded-lg text-center">
                    <p className="text-sm text-secondary">Total Revenue</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="p-3 bg-subtle rounded-lg text-center">
                    <p className="text-sm text-secondary">Total Profit</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(totalProfit)}</p>
                </div>
            </div>
             <div className="p-4 bg-violet-900/50 border border-violet-700 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">✨ AI Insights</h4>
                {isLoading ? <div className="flex justify-center"><LoadingSpinner/></div> : (
                    <ul className="space-y-2 text-sm text-violet-200 list-disc pl-5">
                        {insights.map((insight, i) => <li key={i}>{insight}</li>)}
                    </ul>
                )}
            </div>
        </div>
    );
};

const BillingScreen: React.FC<ShopScreenProps & { shop: Shop }> = ({ shop, products, onRecordSale }) => {
    return <div className="p-4 text-center text-secondary">Billing / Point of Sale system for {shop.name}. This is a placeholder.</div>
};

const ProductsScreen: React.FC<ShopScreenProps & { shop: Shop }> = ({ shop, products, onDeleteProduct, openModal }) => {
    const shopProducts = useMemo(() => products.filter(p => p.shopId === shop.id), [products, shop.id]);
    const formatCurrency = useCurrencyFormatter(undefined, shop.currency);
    return (
        <div className="space-y-2">
            {shopProducts.map(p => (
                <div key={p.id} className="p-3 bg-subtle rounded-lg flex justify-between items-center group">
                    <div>
                        <p className="font-semibold text-primary">{p.name}</p>
                        <p className="text-xs text-secondary">{p.stockQuantity} in stock</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="font-semibold text-primary">{formatCurrency(p.sellingPrice)}</p>
                        <div className="opacity-0 group-hover:opacity-100">
                            <button onClick={() => {}} className="text-xs px-2 py-1 text-sky-300">Edit</button>
                            <button onClick={() => onDeleteProduct(p.id)} className="text-xs px-2 py-1 text-rose-400">Del</button>
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={() => {}} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400">+ Add Product</button>
        </div>
    )
};

const StaffScreen: React.FC<ShopScreenProps & { shop: Shop }> = ({ shop, employees, onDeleteEmployee }) => {
     const shopEmployees = useMemo(() => employees.filter(e => e.shopId === shop.id), [employees, shop.id]);
    return (
        <div className="space-y-2">
            {shopEmployees.map(e => <div key={e.id} className="p-3 bg-subtle rounded-lg">{e.name} <button onClick={() => onDeleteEmployee(e.id)} className="text-xs text-rose-400 float-right">Delete</button></div>)}
            <button className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger text-sky-400">+ Add Employee</button>
        </div>
    )
};

type ShopTab = 'billing' | 'analytics' | 'products' | 'staff';
const ShopTabs: React.FC<ShopScreenProps & { shop: Shop }> = (props) => {
    const [activeTab, setActiveTab] = useState<ShopTab>('billing');

    const TabButton: React.FC<{ tab: ShopTab; label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`w-full py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex-grow flex flex-col overflow-hidden">
            <div className="flex border-b border-divider flex-shrink-0">
                <TabButton tab="billing" label="Billing" />
                <TabButton tab="analytics" label="Analytics" />
                <TabButton tab="products" label="Products" />
                <TabButton tab="staff" label="Staff" />
            </div>
            <div className="flex-grow overflow-y-auto p-4">
                {activeTab === 'billing' && <BillingScreen {...props} />}
                {activeTab === 'analytics' && <AnalyticsScreen shop={props.shop} sales={props.sales} products={props.products} />}
                {activeTab === 'products' && <ProductsScreen {...props} />}
                {activeTab === 'staff' && <StaffScreen {...props} />}
            </div>
        </div>
    );
};

const ShopHeader: React.FC<{
    shops: Shop[];
    selectedShop: Shop | undefined;
    onSelectShop: (id: string) => void;
    onEditShop: () => void;
}> = ({ shops, selectedShop, onSelectShop, onEditShop }) => {
    const shopOptions = shops.map(s => ({ value: s.id, label: s.name }));

    return (
        <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between">
            <div className="flex-grow">
                <CustomSelect
                    options={shopOptions}
                    value={selectedShop?.id || ''}
                    onChange={onSelectShop}
                    placeholder="Select a Shop"
                />
            </div>
            <button onClick={onEditShop} className="ml-4 button-secondary p-2 rounded-full" aria-label="Edit Shop">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>
    );
};

// --- MAIN COMPONENT ---
export const ShopScreen: React.FC<ShopScreenProps> = (props) => {
    const { shops, openModal } = props;
    const [selectedShopId, setSelectedShopId] = useState<string | null>(shops.length > 0 ? shops[0].id : null);

    const selectedShop = useMemo(() => shops.find(s => s.id === selectedShopId), [shops, selectedShopId]);

    if (shops.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <EmptyState
                    icon="🏪"
                    title="No Shops Found"
                    message="Create your first shop to start managing your business sales and inventory."
                    actionText="Create New Shop"
                    onAction={() => openModal('editShop', {})}
                />
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col">
            <ShopHeader
                shops={shops}
                selectedShop={selectedShop}
                onSelectShop={setSelectedShopId}
                onEditShop={() => selectedShop && openModal('editShop', { shop: selectedShop })}
            />
            {selectedShop ? (
                <ShopTabs shop={selectedShop} {...props} />
            ) : (
                <div className="flex-grow flex items-center justify-center text-secondary p-4 text-center">
                    <p>Please select a shop from the dropdown above to view its details.</p>
                </div>
            )}
        </div>
    );
};
