import { Transaction, Account, Category, Sender, AppState } from '../types';

const getCategoryPath = (categoryId: string, categories: Category[]): string => {
    const path: string[] = [];
    let current = categories.find(c => c.id === categoryId);
    while (current) {
        path.unshift(current.name);
        current = categories.find(c => c.id === current.parentId);
    }
    return path.join(' / ') || 'Uncategorized';
};

// Security enhancement: Sanitize cells to prevent CSV Injection
const escapeCsvCell = (cell: string | number | undefined | null): string => {
    if (cell === undefined || cell === null) {
        return '';
    }
    let cellString = String(cell);
    
    // If the cell starts with a character that could trigger a formula in a spreadsheet, prepend a single quote
    if (['=', '+', '-', '@'].includes(cellString.charAt(0))) {
        cellString = `'` + cellString;
    }

    if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
        return `"${cellString.replace(/"/g, '""')}"`;
    }
    return cellString;
};

export const exportTransactionsToCsv = (
    transactions: Transaction[],
    accounts: Account[],
    categories: Category[],
    senders: Sender[],
    startDate: Date | null,
    endDate: Date | null
) => {
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);
    
    const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const afterStart = startDate ? transactionDate >= startDate : true;
        const beforeEnd = endDate ? transactionDate <= endDate : true;
        return afterStart && beforeEnd;
    });

    const headers = [
        'Date', 'Account', 'Description', 'Income', 'Expense', 'Category', 'Sender', 'Notes'
    ];

    const rows = filteredTransactions.map(t => {
        const account = accounts.find(a => a.id === t.accountId);
        const sender = t.senderId ? senders.find(s => s.id === t.senderId) : null;
        return [
            new Date(t.date).toLocaleDateString(),
            account ? account.name : 'Unknown',
            t.description,
            t.type === 'income' ? t.amount : '',
            t.type === 'expense' ? t.amount : '',
            getCategoryPath(t.categoryId, categories),
            sender ? sender.name : '',
            t.notes || ''
        ].map(escapeCsvCell).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `finance_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const dateKeyMap: Partial<Record<keyof AppState, string[]>> = {
    transactions: ['date'],
    recurringTransactions: ['nextDueDate'],
    tripExpenses: ['date'],
    shopSales: ['date'],
    shopShifts: ['startTime', 'endTime'],
    refunds: ['date', 'expectedDate'],
    notes: ['createdAt', 'updatedAt'],
    unlockedAchievements: ['date'],
    challenges: ['date'],
    invoices: ['issueDate', 'dueDate'],
    customCalendarEvents: ['date'],
};


export const exportSelectedDataToJson = (appState: AppState, keysToExport: (keyof AppState)[], startDate: Date | null, endDate: Date | null) => {
  const dataToExport: Partial<AppState> = {};

  if (startDate) startDate.setHours(0, 0, 0, 0);
  if (endDate) endDate.setHours(23, 59, 59, 999);
  
  keysToExport.forEach(key => {
    const data = appState[key];
    const dateKeys = dateKeyMap[key];

    if (Array.isArray(data) && dateKeys && (startDate || endDate)) {
        const filteredData = data.filter(item => {
            // Check if any of the date keys fall within the range
            return dateKeys.some(dKey => {
                const itemDateValue = item[dKey];
                if (!itemDateValue) return false;
                const itemDate = new Date(itemDateValue);
                const afterStart = startDate ? itemDate >= startDate : true;
                const beforeEnd = endDate ? itemDate <= endDate : true;
                return afterStart && beforeEnd;
            });
        });
        (dataToExport as any)[key] = filteredData;
    } else {
        // No date keys or no date range provided, export all
        (dataToExport as any)[key] = data;
    }
  });

  const jsonContent = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `finance_hub_export_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};