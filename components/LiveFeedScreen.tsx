import React, { useMemo, useContext } from 'react';
import { AppState, ActiveModal, Transaction, Goal, RecurringTransaction, UnlockedAchievement, Challenge, TransactionType } from '../types';
import { AppDataContext, SettingsContext } from '../contexts/SettingsContext';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import EmptyState from './EmptyState';
import { ALL_ACHIEVEMENTS } from '../utils/achievements';
import { getCategoryPath } from '../utils/categories';

// Feed item type
interface FeedItem {
  id: string;
  timestamp: string;
  type: 'transaction' | 'goal_progress' | 'goal_completed' | 'bill_due' | 'achievement' | 'challenge' | 'streak_update';
  icon: string;
  title: string;
  description: React.ReactNode;
  data: any;
  colorClass: string;
}

// Time formatting helper
const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};


// Main Component
interface LiveFeedScreenProps {
    appState: AppState;
    openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

const LiveFeedScreen: React.FC<LiveFeedScreenProps> = ({ appState, openModal }) => {
    const formatCurrency = useCurrencyFormatter();
    const settingsContext = useContext(SettingsContext);
    if (!settingsContext) {
        return null;
    }
    const { categories } = settingsContext;

    const feedItems = useMemo((): FeedItem[] => {
        const items: FeedItem[] = [];

        // 1. Transactions
        appState.transactions.slice(0, 30).forEach(t => {
            items.push({
                id: `tx-${t.id}`,
                timestamp: t.date,
                type: 'transaction',
                icon: t.type === 'income' ? '🟢' : '🔴',
                title: t.type === 'income' ? 'Income Received' : 'Expense Recorded',
                description: (
                    <>
                        <strong className={t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(t.amount)}</strong> for "{t.description}"
                    </>
                ),
                data: t,
                colorClass: 'border-slate-500'
            });
        });
        
        // 2. Goal updates (check last 10 transactions)
        const recentTx = appState.transactions.slice(0, 10);
        const goalContributionCategory = categories.find(c => c.name === 'Goal Contributions')?.id;
        recentTx.forEach(tx => {
            if (tx.categoryId === goalContributionCategory && tx.description.includes('Contribution to goal:')) {
                const goalName = tx.description.replace('Contribution to goal: ', '');
                const goal = appState.goals.find(g => g.name === goalName);
                if (goal) {
                    const isCompleted = goal.currentAmount >= goal.targetAmount;
                    items.push({
                        id: `goal-${goal.id}-${tx.id}`,
                        timestamp: tx.date,
                        type: isCompleted ? 'goal_completed' : 'goal_progress',
                        icon: isCompleted ? '🎉' : '🏆',
                        title: isCompleted ? 'Goal Achieved!' : 'Goal Progress',
                        description: `You contributed ${formatCurrency(tx.amount)} to your "${goal.name}" goal.`,
                        data: goal,
                        colorClass: 'border-violet-500'
                    });
                }
            }
        });

        // 3. Upcoming Bills (due in next 7 days)
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        appState.recurringTransactions.forEach(rt => {
            const dueDate = new Date(rt.nextDueDate);
            if (dueDate <= oneWeekFromNow && dueDate >= new Date()) {
                 items.push({
                    id: `bill-${rt.id}`,
                    timestamp: rt.nextDueDate,
                    type: 'bill_due',
                    icon: '📅',
                    title: `Bill Due Soon: ${rt.description}`,
                    description: `${formatCurrency(rt.amount)} is due on ${dueDate.toLocaleDateString()}`,
                    data: rt,
                    colorClass: 'border-yellow-500'
                });
            }
        });

        // 4. Achievements (last 5 unlocked)
        appState.unlockedAchievements.slice(-5).forEach(ua => {
            const achievement = ALL_ACHIEVEMENTS.find(a => a.id === ua.achievementId);
            if (achievement) {
                items.push({
                    id: `achieve-${ua.achievementId}`,
                    timestamp: ua.date,
                    type: 'achievement',
                    icon: achievement.icon,
                    title: 'Achievement Unlocked!',
                    description: `You earned the "${achievement.name}" achievement.`,
                    data: achievement,
                    colorClass: 'border-sky-500'
                });
            }
        });
        
        // Sort and limit
        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);

    }, [appState, categories, formatCurrency]);

    const handleItemClick = (item: FeedItem) => {
        switch (item.type) {
            case 'transaction':
                openModal('editTransaction', { transaction: item.data });
                break;
            case 'goal_progress':
            case 'goal_completed':
                openModal('editGoal', { goal: item.data });
                break;
             case 'bill_due':
                openModal('editRecurring', { recurringTransaction: item.data });
                break;
            default:
                break;
        }
    };


    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0">
                <h2 className="text-2xl font-bold text-primary text-center">Live Feed ⚡️</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-6">
                {feedItems.length === 0 ? (
                    <EmptyState
                        icon="⚡️"
                        title="Your Feed is Empty"
                        message="Your financial activities will appear here in real-time as you use the app."
                    />
                ) : (
                    <div className="relative pl-5">
                        {/* Timeline line */}
                        <div className="absolute left-7 top-0 h-full w-0.5 bg-divider" />
                        
                        <div className="space-y-6">
                            {feedItems.map(item => (
                                <div key={item.id} className="relative flex items-start gap-4">
                                    <div className="absolute left-0 top-1.5 -translate-x-1/2 w-4 h-4 rounded-full bg-bg-app border-2 border-divider flex items-center justify-center">
                                       <div className={`w-2 h-2 rounded-full ${item.colorClass.replace('border-', 'bg-')}`}></div>
                                    </div>
                                    <div className="flex-shrink-0 w-10 h-10 bg-subtle rounded-full flex items-center justify-center text-xl z-10">
                                        {item.icon}
                                    </div>
                                    <div onClick={() => handleItemClick(item)} className={`flex-grow p-3 bg-subtle rounded-lg border-l-4 ${item.colorClass} cursor-pointer hover-bg-stronger`}>
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-primary">{item.title}</p>
                                            <p className="text-xs text-tertiary">{formatTimeAgo(item.timestamp)}</p>
                                        </div>
                                        <p className="text-sm text-secondary mt-1">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveFeedScreen;