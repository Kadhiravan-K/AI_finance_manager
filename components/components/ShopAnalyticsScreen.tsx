


import React, { useState, useEffect, useMemo } from 'react';
import { Shop, ShopSale, ShopProduct } from '../../types';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { getShopInsights } from '../../services/geminiService';
import LoadingSpinner from '../LoadingSpinner';

interface ShopAnalyticsScreenProps {
    shop: Shop;
    sales: ShopSale[];
    products: ShopProduct[];
}

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="p-3 bg-subtle rounded-lg text-center">
        <p className="text-sm text-secondary">{title}</p>
        <p className="text-xl font-bold text-primary">{value}</p>
    </div>
);

const ShopAnalyticsScreen: React.FC<ShopAnalyticsScreenProps> = ({ shop, sales, products }) => {
    const formatCurrency = useCurrencyFormatter(undefined, shop.currency);
    const [insights, setInsights] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const analytics = useMemo(() => {
        const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
        const productSales = sales.flatMap(s => s.items).reduce((acc, item) => {
            const name = products.find(p => p.id === item.productId)?.name || 'Unknown Product';
            acc[name] = (acc[name] || 0) + item.quantity;
            return acc;
        }, {} as Record<string, number>);
        const bestsellers = Object.entries(productSales).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 3);
        return { totalRevenue, totalProfit, totalSalesCount: sales.length, bestsellers };
    }, [sales, products]);

    const fetchInsights = async () => {
        setIsLoading(true);
        try {
            const result = await getShopInsights(sales, products);
            setInsights(result);
        } catch (error) {
            console.error(error);
            setInsights(["Could not generate AI insights at this time."]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sales, products]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard title="Total Revenue" value={formatCurrency(analytics.totalRevenue)} />
                <StatCard title="Total Profit" value={formatCurrency(analytics.totalProfit)} />
                <StatCard title="Total Sales" value={String(analytics.totalSalesCount)} />
            </div>
            
             <div className="p-4 bg-subtle rounded-lg">
                <h4 className="font-semibold text-lg text-primary mb-2">Bestsellers</h4>
                <div className="space-y-2">
                    {analytics.bestsellers.map(([name, quantity]) => (
                        <div key={name} className="flex justify-between text-sm">
                            <span className="text-primary">{name}</span>
                            <span className="font-mono text-secondary">{String(quantity)} sold</span>
                        </div>
                    ))}
                    {analytics.bestsellers.length === 0 && <p className="text-center text-sm text-secondary py-4">No sales data yet.</p>}
                </div>
            </div>

            <div className="p-4 bg-violet-900/50 border border-violet-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-primary">✨ AI Insights</h4>
                    <button onClick={fetchInsights} disabled={isLoading} className="p-1 rounded-full text-violet-300 hover:bg-violet-500/50"><svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5" /></svg></button>
                </div>
                {isLoading ? <LoadingSpinner /> : (
                    <ul className="space-y-2 list-disc pl-5 text-sm text-violet-200">
                        {insights.map((insight, i) => <li key={i}>{insight}</li>)}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ShopAnalyticsScreen;