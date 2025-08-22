export enum ProcessingStatus {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense',
}

export interface Account {
    id: string;
    name: string;
}

export interface Category {
    id:string;
    name: string;
    type: TransactionType;
    parentId: string | null;
    icon?: string;
}

export interface Budget {
    categoryId: string;
    amount: number;
    // Stored as YYYY-MM
    month: string; 
}

export interface Goal {
    id: string;
    name: string;
    icon: string;
    targetAmount: number;
    currentAmount: number;
}

export interface SplitDetail {
    id: string;
    personName: string;
    amount: number;
    isSettled: boolean;
    settledDate?: string;
}

export interface Transaction {
    id: string;
    accountId: string;
    description: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    date: string;
    notes?: string;
    transferId?: string;
    payeeIdentifier?: string;
    senderId?: string;
    splitDetails?: SplitDetail[];
}

export interface Payee {
    id: string;
    identifier: string; // e.g., account number, UPI ID
    name: string;
    defaultCategoryId: string;
}

export type SenderType = 'trusted' | 'blocked';

export interface Sender {
    id: string;
    identifier: string; // The raw sender name from the message, e.g., "VK-AMZPAY"
    name: string; // User-defined name for this sender
    type: SenderType;
}

export interface ContactGroup {
    id: string;
    name: string;
}

export interface Contact {
    id: string;
    name: string;
    groupId: string;
}

export interface SpamWarning {
    parsedData: { 
        id: string; 
        description: string; 
        amount: number; 
        type: TransactionType; 
        categoryName: string; 
        date: string; 
        notes?: string;
        payeeIdentifier?: string;
        senderName?: string;
    };
    rawText: string;
}


export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
    id: string;
    accountId: string;
    description: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    frequency: Frequency;
    startDate: string; // ISO string
    nextDueDate: string; // ISO string
    notes?: string;
}


export interface Settings {
    currency: string; // e.g., 'USD', 'INR', 'EUR'
}

export type DateRange = 'all' | 'today' | 'week' | 'month' | 'custom';
export interface CustomDateRange {
    start: Date | null;
    end: Date | null;
}

export type ReportPeriod = 'week' | 'month' | 'year' | 'custom';

export type ActiveModal = 'reports' | 'budgets' | 'scheduled' | 'settings' | 'transfer' | 'appSettings' | 'categories' | 'payees' | 'export' | 'senderManager' | 'goals' | 'contacts' | null;