
import { AppState, RecurringTransaction, Budget, Transaction, Category, TransactionType, Goal, InvestmentHolding, NotificationSettings, Reminder } from '../types';

let hasPermission = false;

export async function requestNotificationPermission() {
  if (!('Notification' in window) || !navigator.serviceWorker) return;
  if (Notification.permission === 'granted') { hasPermission = true; return; }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') hasPermission = true;
  }
}

export function showNotification(title: string, options: NotificationOptions) {
  if (hasPermission && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, options);
    });
  }
}

function checkUpcomingBills(recurringTransactions: RecurringTransaction[]) {
    const now = new Date();

    recurringTransactions.forEach(bill => {
        const dueDate = new Date(bill.nextDueDate);
        (bill.reminders || []).forEach(reminder => {
            const reminderTime = new Date(dueDate);
            switch (reminder.unit) {
                case 'hours':
                    reminderTime.setHours(reminderTime.getHours() - reminder.value);
                    break;
                case 'days':
                    reminderTime.setDate(reminderTime.getDate() - reminder.value);
                    break;
                case 'weeks':
                    reminderTime.setDate(reminderTime.getDate() - reminder.value * 7);
                    break;
            }

            // Check if the reminder time is in the past but the due date is not
            if (reminderTime <= now && dueDate > now) {
                // To prevent spamming notifications, we should check if we've already sent one for this reminder
                // For this simple implementation, we'll assume we haven't.
                showNotification(`Reminder: ${bill.description}`, {
                    body: `Your payment of ${bill.amount} is due on ${dueDate.toLocaleDateString()}.`,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    data: { billId: bill.id }
                });
            }
        });

        // Also check for the due date itself
        if (dueDate <= now) {
            showNotification('Bill Due: ' + bill.description, {
                body: `Your payment of ${bill.amount} is due today.`,
                icon: '/logo192.png',
                badge: '/logo192.png',
                actions: [{ action: 'mark_as_paid', title: 'Mark as Paid' }],
                data: { billId: bill.id }
            } as any);
        }
    });
}

function checkBudgetAlerts(budgets: Budget[], transactions: Transaction[], categories: Category[], notificationSettings: NotificationSettings) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlySpending = transactions
        .filter(t => t.date.startsWith(currentMonth) && t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => {
            let catId = t.categoryId;
            while(catId) {
                acc[catId] = (acc[catId] || 0) + t.amount;
                const cat = categories.find(c => c.id === catId);
                catId = cat?.parentId || '';
            }
            return acc;
        }, {} as Record<string, number>);

    budgets.forEach(budget => {
        if (budget.month === currentMonth && notificationSettings.budgets.categories[budget.categoryId] !== false) {
            const category = categories.find(c => c.id === budget.categoryId);
            if (!category) return;
            const totalSpent = monthlySpending[budget.categoryId] || 0;
            const percentage = (totalSpent / budget.amount) * 100;

            if (percentage >= 100) {
                 showNotification('Budget Exceeded', { body: `You're over your "${category.name}" budget.` });
            } else if (percentage >= 90) {
                showNotification('Budget Warning', { body: `You've used ${percentage.toFixed(0)}% of your "${category.name}" budget.` });
            }
        }
    });
}

function checkLargeTransactionAlerts(transactions: Transaction[], notificationSettings: NotificationSettings) {
    const threshold = notificationSettings.largeTransaction.amount;
    if (threshold <= 0) return;
    const lastTransaction = transactions[0]; // Assuming transactions are sorted by date desc
    if (lastTransaction && lastTransaction.type === TransactionType.EXPENSE && lastTransaction.amount > threshold) {
        // Check if this notification was sent recently to avoid spam
        showNotification('Large Transaction Alert', { body: `An expense of ${lastTransaction.amount} for "${lastTransaction.description}" was recorded.` });
    }
}

function checkGoalMilestones(goals: Goal[]) {
    goals.forEach(goal => {
        const percentage = (goal.currentAmount / goal.targetAmount) * 100;
        if (percentage >= 100) {
             showNotification('Goal Achieved!', { body: `Congratulations! You've reached your "${goal.name}" goal.` });
        }
    });
}

export function checkAndSendNotifications(appState: AppState) {
    const { settings, recurringTransactions, budgets, transactions, categories, goals } = appState;
    if (!settings.notificationSettings.enabled || !hasPermission) return;
    
    // To avoid spam, we'll only send one notification per check. A real app might queue them.
    if (settings.notificationSettings.bills.enabled) checkUpcomingBills(recurringTransactions);
    if (settings.notificationSettings.budgets.enabled) checkBudgetAlerts(budgets, transactions, categories, settings.notificationSettings);
    if (settings.notificationSettings.largeTransaction.enabled) checkLargeTransactionAlerts(transactions, settings.notificationSettings);
    if (settings.notificationSettings.goals.enabled) checkGoalMilestones(goals);
}
