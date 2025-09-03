

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

export enum AccountType {
    DEPOSITORY = 'depository', // Checking, Savings, Cash
    CREDIT = 'credit',       // Credit Cards
    INVESTMENT = 'investment', // Brokerage accounts
}

export interface Account {
    id: string;
    name: string;
    accountType: AccountType;
    creditLimit?: number;
    currency: string;
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
    productLink?: string;
}

export interface SplitDetail {
    id: string;
    personName: string;
    amount: number;
    isSettled: boolean;
    settledDate?: string;
    percentage?: string;
    shares?: string;
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
    isRefundFor?: string; // Links refund to original transaction ID
}

export interface InvestmentHolding {
    id: string;
    accountId: string; // The investment account this belongs to
    name: string;      // e.g., "Apple Inc."
    ticker?: string;   // e.g., "AAPL"
    quantity: number;
    averageCost: number; // The average price paid per share/unit
    currentValue: number; // The total current market value of this holding
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
    icon?: string;
}

export interface Contact {
    id: string;
    name: string;
    groupId: string;
}

export interface ParsedTransactionData {
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    categoryName: string;
    date: string;
    notes?: string;
    payeeIdentifier?: string;
    isSpam: boolean;
    spamConfidence: number;
    senderName?: string;
    isForwarded: boolean;
}

export interface SpamWarning {
    parsedData: ParsedTransactionData;
    rawText: string;
}

export interface FeedbackItem {
    id: string;
    message: string;
    timestamp: string;
}

export type FrequencyUnit = 'days' | 'weeks' | 'months' | 'years';
export type ReminderUnit = 'minutes' | 'hours' | 'days';

export interface RecurringTransaction {
    id: string;
    accountId: string;
    description: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    startDate: string; // ISO string
    nextDueDate: string; // ISO string
    notes?: string;
    interval: number;
    frequencyUnit: FrequencyUnit;
    startTime?: string; // "HH:MM"
    reminder?: {
        value: number;
        unit: ReminderUnit;
    }
}

export interface TripParticipant {
    contactId: string;
    name: string;
}

export interface TripPlace {
    id: string;
    name: string;
    date: string; // ISO string
    notes?: string;
    status: 'visited' | 'planned';
}

export interface Trip {
    id: string;
    name: string;
    participants: TripParticipant[];
    date: string; // ISO string
    currency: string;
    notes?: string;
    places?: TripPlace[];
}

export interface TripPayer {
    contactId: string;
    amount: number;
}

export interface ParsedTripExpense {
    description: string;
    amount: number;
    categoryName: string;
    payerName?: string;
}

export interface TripExpense {
    id: string;
    tripId: string;
    description: string;
    amount: number;
    date: string; // ISO string
    payers: TripPayer[];
    splitDetails: SplitDetail[];
    categoryId: string;
    notes?: string;
}

export type Theme = 'light' | 'dark';

export interface DashboardWidget {
    id: 'financialHealth' | 'summary' | 'upcoming' | 'budgets' | 'goals' | 'netWorth' | 'portfolio' | 'debts' | 'charts' | 'aiCoach';
    name: string;
    visible: boolean;
}

export interface NotificationSettings {
    enabled: boolean;
    bills: {
        enabled: boolean;
    };
    budgets: {
        enabled: boolean;
        // Key is categoryId, value is boolean
        categories: Record<string, boolean>;
    };
    largeTransaction: {
        enabled: boolean;
        amount: number;
    };
    goals: {
        enabled: boolean;
    };
    investments: {
        enabled: boolean;
    }
}

export type TrustBinDeletionPeriodUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

export interface TrustBinDeletionPeriod {
    value: number;
    unit: TrustBinDeletionPeriodUnit;
}

export type ToggleableTool = 
  'achievements' | 'aiHub' | 'dataHub' | 
  'investments' | 'payees' | 'refunds' | 'scheduledPayments' | 
  'senders' | 'shop' | 'calculator' | 'tripManagement' | 'accountTransfer' | 
  'calendar' | 'budgets' | 'goals' | 'learn' | 'challenges' | 'shoppingLists';

export interface Settings {
    currency: string; // e.g., 'USD', 'INR', 'EUR'
    theme: Theme;
    dashboardWidgets: DashboardWidget[];
    notificationSettings: NotificationSettings;
    trustBinDeletionPeriod: TrustBinDeletionPeriod;
    enabledTools: Record<ToggleableTool, boolean>;
    footerActions: ActiveScreen[];
    googleCalendar?: {
        connected: boolean;
        calendarId?: string;
    };
}

export type DateRange = 'all' | 'today' | 'week' | 'month' | 'custom';
export interface CustomDateRange {
    start: Date | null;
    end: Date | null;
}

export type ReportPeriod = 'week' | 'month' | 'year' | 'custom';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface UnlockedAchievement {
    achievementId: string;
    date: string; // ISO string
}

export type ItemType = 'transaction' | 'category' | 'payee' | 'sender' | 'contact' | 'contactGroup' | 'goal' | 'recurringTransaction' | 'account' | 'trip' | 'tripExpense' | 'shop' | 'shopProduct' | 'shopEmployee' | 'shopShift' | 'refund' | 'settlement' | 'shoppingList' | 'glossaryEntry';

export interface TrustBinItem {
  id: string; // unique id for the bin entry
  item: any;
  itemType: ItemType;
  deletedAt: string; // ISO string
}

// Shop Management Types
export type ShopType = 'physical' | 'online' | 'freelance' | 'garage_sale' | 'other';
export interface Shop {
    id: string;
    name: string;
    currency: string;
    type: ShopType;
    taxRate?: number; // As a percentage, e.g., 18 for 18%
    tags?: string[];
}
export interface ShopProduct {
    id: string;
    shopId: string;
    name: string;
    description?: string;
    tags?: string[];
    qrCode?: string; // Can be UPC, EAN, or custom QR
    stockQuantity: number;
    lowStockThreshold?: number;
    purchasePrice: number;
    sellingPrice: number;
    categoryId: string; // Link to main category system
}
export interface ShopSaleItem {
    productId: string; // Links to ShopProduct
    productName: string; // Denormalized for receipt generation
    quantity: number;
    pricePerUnit: number; // Selling price at the time of sale
    purchasePricePerUnit: number; // Cost at time of sale for profit calc
}

export type DiscountType = 'percentage' | 'flat';
export interface Discount {
    type: DiscountType;
    value: number; // e.g., 10 for 10% or 100 for 100 currency units
}

export interface ShopSale {
    id: string;
    shopId: string;
    timestamp: string;
    employeeId?: string; // Optional
    customerName?: string; // Optional
    items: ShopSaleItem[];
    subtotal: number;
    discount?: Discount;
    taxAmount: number;
    totalAmount: number;
    profit: number;
}
export interface ShopEmployee {
    id: string;
    shopId: string;
    name: string;
    contactInfo?: string;
    salary?: number;
    shiftId?: string;
}
export interface ShopShift {
    id: string;
    shopId: string;
    name: string; // e.g., "Morning Shift"
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
}

// New: For tracking settlements between people
export interface Settlement {
  id: string;
  timestamp: string;
  fromContactId: string; // The person who paid
  toContactId: string;   // The person who received
  amount: number;
  currency: string;
  notes?: string;
}

export type ActiveScreen = 'dashboard' | 'reports' | 'investments' | 'budgets' | 'goals' | 'scheduled' | 'calculator' | 'more' | 'achievements' | 'tripManagement' | 'tripDetails' | 'refunds' | 'dataHub' | 'shop' | 'challenges' | 'learn' | 'calendar' | 'shoppingLists' | 'manual';

export type ActiveModal = 'transfer' | 'appSettings' | 'categories' | 'payees' | 'importExport' | 'senderManager' | 'contacts' | 'feedback' | 'privacyConsent' | 'onboarding' | 'addTransaction' | 'headerMenu' | 'dashboardSettings' | 'notificationSettings' | 'addTripExpense' | 'refund' | 'editTransaction' | 'trustBin' | 'editAccount' | 'selectRefund' | 'editTrip' | 'editContact' | 'editContactGroup' | 'globalTripSummary' | 'miniCalculator' | 'editCategory' | 'notifications' | 'editGoal' | 'manageTools' | 'financialHealth' | 'shopProducts' | 'shopBilling' | 'shopEmployees' | 'editTripExpense' | 'editShop' | 'accountsManager' | 'globalSearch' | 'editRecurring' | 'buyInvestment' | 'aiHub' | 'shareGuide' | 'integrations' | 'footerCustomization' | null;

export interface ModalState {
    name: ActiveModal;
    props?: Record<string, any>;
}

export interface FinanceTrackerProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  modalStack: ModalState[];
  setModalStack: React.Dispatch<React.SetStateAction<ModalState[]>>;
  isOnline: boolean;
  mainContentRef?: React.RefObject<HTMLElement>;
  onSelectionChange?: (selectedIds: string[]) => void;
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>) => void;
  isLoading: boolean;
  initialText?: string | null;
  onSharedTextConsumed: () => void;
  onGoalComplete: () => void;
}

export interface FinancialProfile {
    monthlySalary: number;
    monthlyRent: number;
    monthlyEmi: number;
    emergencyFundGoal: number;
}

export interface Refund {
    id: string;
    description: string;
    amount: number;
    date: string; // ISO string when it was issued
    accountId: string; // Account to receive the funds
    isClaimed: boolean;
    claimedDate?: string; // ISO string when claimed
    originalTransactionId?: string; // The expense this is a refund for
    notes?: string;
    contactId?: string;
    expectedDate?: string; // ISO String
}

export interface ShoppingListItem {
  id: string;
  name: string;
  rate: number;
  isPurchased: boolean;
}

export interface ShoppingList {
  id: string;
  title: string;
  items: ShoppingListItem[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}


export interface GlossaryEntry {
  id: string;
  term: string;
  emoji: string;
  definition: string;
  usageLogic: string;
  example: string;
  tags: string[];
}

// For Backup
export interface AppState {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    budgets: Budget[];
    recurringTransactions: RecurringTransaction[];
    goals: Goal[];
    investmentHoldings: InvestmentHolding[];
    payees: Payee[];
    senders: Sender[];
    contactGroups: ContactGroup[];
    contacts: Contact[];
    settings: Settings;
    achievements: UnlockedAchievement[];
    streaks: UserStreak;
    trips?: Trip[];
    tripExpenses?: TripExpense[];
    financialProfile: FinancialProfile;
    refunds?: Refund[];
    settlements?: Settlement[];
    shoppingLists?: ShoppingList[];
    // Shop Data
    shops?: Shop[];
    shopProducts?: ShopProduct[];
    shopSales?: ShopSale[];
    shopEmployees?: ShopEmployee[];
    shopShifts?: ShopShift[];
}

// Gamification Types
export interface UserStreak {
    currentStreak: number;
    longestStreak: number;
    lastLogDate: string | null; // ISO date string
    streakFreezes: number;
}

export type ChallengeType = 'log_transaction' | 'categorize_uncategorized' | 'set_budget' | 'review_goals';

export interface Challenge {
    id: string;
    type: ChallengeType;
    description: string;
    isCompleted: boolean;
    date: string; // YYYY-MM-DD
}

export interface CalendarEvent {
    id: string;
    date: Date;
    title: string;
    type: 'bill' | 'goal' | 'refund' | 'trip';
    color: 'rose' | 'violet' | 'sky' | 'amber';
    data: any;
}