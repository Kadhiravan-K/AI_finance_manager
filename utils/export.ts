import { Transaction, Account, Category } from '../types';

const getCategoryPath = (categoryId: string, categories: Category[]): string => {
    const path: string[] = [];
    let current = categories.find(c => c.id === categoryId);
    while (current) {
        path.unshift(current.name);
        current = categories.find(c => c.id === current.parentId);
    }
    return path.join(' / ') || 'Uncategorized';
};

const escapeCsvCell = (cell: string | number | undefined | null): string => {
    if (cell === undefined || cell === null) {
        return '';
    }
    const cellString = String(cell);
    if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
        return `"${cellString.replace(/"/g, '""')}"`;
    }
    return cellString;
};

export const exportTransactionsToCsv = (
    transactions: Transaction[],
    accounts: Account[],
    categories: Category[],
    startDateStr: string,
    endDateStr: string
) => {
    const startDate = startDateStr ? new Date(startDateStr) : null;
    if(startDate) startDate.setHours(0, 0, 0, 0);

    const endDate = endDateStr ? new Date(endDateStr) : null;
    if(endDate) endDate.setHours(23, 59, 59, 999);
    
    const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const afterStart = startDate ? transactionDate >= startDate : true;
        const beforeEnd = endDate ? transactionDate <= endDate : true;
        return afterStart && beforeEnd;
    });

    const headers = [
        'Date', 'Account', 'Description', 'Income', 'Expense', 'Category', 'Notes'
    ];

    const rows = filteredTransactions.map(t => {
        const account = accounts.find(a => a.id === t.accountId);
        return [
            new Date(t.date).toLocaleDateString(),
            account ? account.name : 'Unknown',
            t.description,
            t.type === 'income' ? t.amount : '',
            t.type === 'expense' ? t.amount : '',
            getCategoryPath(t.categoryId, categories),
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