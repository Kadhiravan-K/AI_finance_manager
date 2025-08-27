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

export const exportSelectedDataToJson = (appState: AppState, keysToExport: (keyof AppState)[]) => {
  const dataToExport: Partial<AppState> = {};
  
  for (const key of keysToExport) {
    if (key in appState) {
      dataToExport[key] = appState[key] as any;
    }
  }

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