import React, { useMemo } from 'react';
import { Trip, TripExpense } from '../types';

interface TripHistoryProps {
    trip: Trip;
    expenses: TripExpense[];
}

type HistoryItem = {
    timestamp: string;
    type: 'plan' | 'expense';
    title: string;
    description?: string;
    icon: string;
}

const TripHistory: React.FC<TripHistoryProps> = ({ trip, expenses }) => {
    const historyItems = useMemo(() => {
        const items: HistoryItem[] = [];

        // Add plan items
        (trip.plan || []).forEach(day => {
            day.items.forEach(item => {
                const itemDate = new Date(day.date);
                const [hours, minutes] = item.time.split(':').map(Number);
                itemDate.setHours(hours, minutes);
                items.push({
                    timestamp: itemDate.toISOString(),
                    type: 'plan',
                    title: `Planned: ${item.activity}`,
                    description: `at ${item.time} on ${itemDate.toLocaleDateString()}`,
                    icon: '🗓️'
                });
            });
        });

        // Add expenses
        expenses.forEach(expense => {
            items.push({
                timestamp: expense.date,
                type: 'expense',
                title: `Expense: ${expense.description}`,
                description: `on ${new Date(expense.date).toLocaleDateString()}`,
                icon: '💸'
            });
        });

        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [trip, expenses]);

    return (
        <div className="p-4">
            {historyItems.length === 0 ? (
                <p className="text-secondary text-center py-8">No history for this trip yet.</p>
            ) : (
                <div className="relative pl-5">
                    <div className="absolute left-7 top-0 h-full w-0.5 bg-divider" />
                    <div className="space-y-6">
                        {historyItems.map((item, index) => (
                            <div key={index} className="relative flex items-start gap-4">
                                <div className="absolute left-0 top-1.5 -translate-x-1/2 w-4 h-4 rounded-full bg-bg-app border-2 border-divider flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                </div>
                                <div className="flex-shrink-0 w-10 h-10 bg-subtle rounded-full flex items-center justify-center text-xl z-10">
                                    {item.icon}
                                </div>
                                <div className="flex-grow p-3 bg-subtle rounded-lg">
                                    <p className="font-semibold text-primary">{item.title}</p>
                                    <p className="text-sm text-secondary mt-1">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripHistory;
