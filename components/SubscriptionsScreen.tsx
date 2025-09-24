
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppDataContext, SettingsContext } from '../contexts/SettingsContext';
import { IdentifiedSubscription, RecurringTransaction, TransactionType } from '../types';
import { identifySubscriptions } from '../services/geminiService';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

interface SubscriptionsScreenProps {
    onAddRecurring: (data: Partial<RecurringTransaction>) => void;
}

const SubscriptionsScreen: React.FC<SubscriptionsScreenProps> = ({ onAddRecurring }) => {
    const dataContext = useContext(AppDataContext);
    const settingsContext = useContext(SettingsContext);
    
    const [subscriptions, setSubscriptions] = useState<IdentifiedSubscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const formatCurrency = useCurrencyFormatter();

    const analyzeTransactions = async () => {
        if (!dataContext || !settingsContext) return;
        
        setIsLoading(true);
        setError(null);
        setSubscriptions([]);
        
        try {
            const results = await identifySubscriptions(dataContext.transactions, settingsContext.categories);
            results.sort((a, b) => b.averageAmount - a.averageAmount);
            setSubscriptions(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        analyzeTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateBill = (sub: IdentifiedSubscription) => {
        if (!dataContext) return;

        const categoryId = dataContext.findOrCreateCategory(sub.category, TransactionType.EXPENSE);
        const recurringData: Partial<RecurringTransaction> = {
            description: `${sub.vendorName} Subscription`,
            amount: sub.averageAmount,
            type: TransactionType.EXPENSE,
            categoryId,
            frequencyUnit: sub.frequency === 'yearly' ? 'years' : 'months',
            interval: 1,
            nextDueDate: new Date().toISOString(),
        };
        onAddRecurring(recurringData);
        // Remove from suggestions
        setSubscriptions(prev => prev.filter(s => s.vendorName !== sub.vendorName));
    };
    
    const handleDismiss = (sub: IdentifiedSubscription) => {
        setSubscriptions(prev => prev.filter(s => s.vendorName !== sub.vendorName));
    };


    const totalMonthlyCost = useMemo(() => {
        return subscriptions
            .filter(s => s.frequency === 'monthly')
            .reduce((sum, s) => sum + s.averageAmount, 0);
    }, [subscriptions]);
    
    const totalYearlyCost = useMemo(() => {
        return subscriptions
            .filter(s => s.frequency === 'yearly')
            .reduce((sum, s) => sum + s.averageAmount, 0);
    }, [subscriptions]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-secondary">AI is analyzing your transactions...</p>
                    <p className="text-xs text-tertiary">This may take a moment.</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-12 px-4">
                    <p className="text-2xl mb-2">😟</p>
                    <p className="font-semibold text-rose-400">Analysis Failed</p>
                    <p className="text-sm text-secondary mt-2">{error}</p>
                </div>
            );
        }

        if (subscriptions.length === 0) {
            return (
                <EmptyState
                    icon="🔁"
                    title="No Subscriptions Found"
                    message="The AI couldn't identify any recurring payments from your transaction history yet. Add more transactions for a better analysis."
                />
            );
        }

        return (
            <div className="space-y-3">
                {subscriptions.map((sub, index) => (
                    <div key={index} className="p-3 bg-subtle rounded-lg group animate-fadeInUp" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-primary">{sub.vendorName}</p>
                                <p className="text-xs text-secondary capitalize">{sub.frequency} &bull; {sub.transactionCount} transactions</p>
                            </div>
                            <div className="text-right">
                               <p className="font-semibold text-primary">{formatCurrency(sub.averageAmount)}</p>
                               <p className="text-xs text-tertiary">{sub.category}</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-divider opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDismiss(sub)} className="text-xs px-2 py-1 text-rose-400 hover:bg-rose-500/20 rounded-full transition-colors">Dismiss</button>
                            <button onClick={() => handleCreateBill(sub)} className="button-primary px-3 py-1 text-sm">Create Bill</button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary text-center flex-grow">Subscriptions</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => onAddRecurring({})} className="button-secondary text-sm px-3 py-1.5">
                        + Create Bill
                    </button>
                    <button onClick={analyzeTransactions} disabled={isLoading} className="button-secondary text-sm p-2 rounded-full aspect-square">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5" /></svg>
                    </button>
                </div>
            </div>
            
            {(totalMonthlyCost > 0 || totalYearlyCost > 0) && !isLoading && !error && (
                 <div className="p-4 grid grid-cols-2 gap-4 flex-shrink-0">
                    <div className="p-3 bg-subtle rounded-lg text-center">
                        <p className="text-xs text-secondary">Est. Monthly Total</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(totalMonthlyCost)}</p>
                    </div>
                     <div className="p-3 bg-subtle rounded-lg text-center">
                        <p className="text-xs text-secondary">Est. Yearly Total</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(totalYearlyCost)}</p>
                    </div>
                </div>
            )}
            
            <div className="flex-grow overflow-y-auto p-6 pt-2">
                {renderContent()}
            </div>
        </div>
    );
};

export default SubscriptionsScreen;
