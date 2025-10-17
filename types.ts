

// This is a comprehensive types file based on imports from other files.

export const USER_SELF_ID = 'user-self';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum AccountType {
  DEPOSITORY = 'depository',
  CREDIT = 'credit',
  INVESTMENT = 'investment',
}

export enum SenderType {
  TRUSTED = 'trusted',
  BLOCKED = 'blocked',
}

export enum Priority {
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
    NONE = 'None',
}

export type DateRange = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
export type CustomDateRange = { start: Date | null; end: Date | null };

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  notes?: string;
  senderId?: string;
  itemizedDetails?: ItemizedDetail[];
  splitDetails?: SplitDetail[];
  payers?: { contactId: string; amount: number }[];
}

export interface Account {
  id: string;
  name: string;
  accountType: AccountType;
  currency: string;
  creditLimit?: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  parentId: string | null;
  icon?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string; // YYYY-MM
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  productLink?: string;
  priority?: Priority;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  frequencyUnit: 'days' | 'weeks' | 'months' | 'years';
  interval: number;
  nextDueDate: string;
  startTime?: string;
  reminders?: Reminder[];
  priority?: Priority;
}

export interface Reminder {
    value: number;
    unit: 'hours' | 'days' | 'weeks';
}


export interface InvestmentHolding {
  id: string;
  accountId: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentValue: number;
}

export interface Contact {
  id: string;
  name: string;
  groupId: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  icon: string;
}

export interface TripParticipant {
    contactId: string;
    name: string;
    role: 'admin' | 'member';
}

export interface Trip {
    id: string;
    name: string;
    date: string;
    participants: TripParticipant[];
    currency: string;
    budget?: number;
    plan?: TripDayPlan[];
}

export interface TripDayPlan {
    id: string;
    date: string;
    title: string;
    items: TripDayPlanItem[];
}

export interface TripDayPlanItem {
    id: string;
    time: string;
    activity: string;
    type: 'travel' | 'food' | 'activity' | 'lodging' | 'other';
    notes?: string;
    icon?: string;
    completed?: boolean;
}

export interface TripExpense {
    id: string;
    tripId: string;
    description: string;
    amount: number;
    categoryId: string;
    date: string;
    payers: { contactId: string, amount: number }[];
    splitDetails: SplitDetail[];
    notes?: string;
    itemizedDetails?: ItemizedDetail[];
}

export enum ShopType {
    PHYSICAL_RETAIL = "Physical Retail",
    ONLINE_ECOMMERCE = "Online E-commerce",
    SERVICE_BASED = "Service-based",
    RESTAURANT_CAFE = "Restaurant/Cafe",
}
export enum BusinessType {
    SOLE_PROPRIETORSHIP = "Sole Proprietorship",
    PARTNERSHIP = "Partnership",
    CORPORATION = "Corporation",
    LLC = "LLC",
}
export interface Shop {
    id: string;
    name: string;
    currency: string;
    type: ShopType;
    businessType?: BusinessType;
    taxRate?: number;
}
export interface ShopProduct {
    id: string;
    shopId: string;
    name: string;
    price: number;
    stock: number;
    costPrice?: number;
    category?: string;
}
export interface ShopSale {
    id: string;
    shopId: string;
    items: { productId: string; quantity: number; price: number }[];
    totalAmount: number;
    profit: number;
    date: string;
}
export interface ShopEmployee {
    id: string;
    shopId: string;
    name: string;
    role: string;
    wage: number;
}
export interface ShopShift {
    id: string;
    shopId: string;
    employeeId: string;
    startTime: string;
    endTime: string;
}

export interface Refund {
    id: string;
    description: string;
    amount: number;
    date: string; // Date of refund request/issue
    accountId: string; // Account to receive the funds
    originalTransactionId?: string;
    notes?: string;
    contactId?: string; // Who is refunding
    expectedDate?: string;
    isClaimed: boolean;
    claimedDate?: string;
}
export interface Settlement {
    id: string;
    tripId?: string;
    fromContactId: string;
    toContactId: string;
    amount: number;
    date: string;
    currency: string;
}
export interface Debt {
    id: string;
    name: string;
    totalAmount: number; // initial amount
    currentBalance: number;
    minimumPayment: number;
    apr: number; // Annual Percentage Rate
}
export interface ChecklistItem {
    id: string;
    name: string;
    isPurchased: boolean;
    rate: number;
    quantity: string;
    priority: Priority;
}
export interface Note {
    id: string;
    title: string;
    content: string | ChecklistItem[];
    type: 'note' | 'checklist';
    createdAt: string;
    updatedAt: string;
    tripId?: string;
    isPinned?: boolean;
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
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
}
export interface UnlockedAchievement {
    achievementId: string;
    date: string;
}
export type ChallengeType = 'log_transaction' | 'categorize_uncategorized' | 'set_budget' | 'review_goals' | 'custom_savings';
export interface Challenge {
    id: string;
    date: string;
    type: ChallengeType;
    description: string;
    isCompleted: boolean;
}
export interface UserStreak {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string;
    streakFreezes: number;
}

export type ItemType = 'transaction' | 'recurringTransaction' | 'tripExpense' | 'refund' | 'settlement' | 'account' | 'category' | 'payee' | 'sender' | 'contact' | 'contactGroup' | 'trip' | 'shop' | 'shopProduct' | 'shopEmployee' | 'shopShift' | 'goal' | 'note' | 'glossaryEntry' | 'debt';

export interface TrustBinItem {
    id: string;
    itemType: ItemType;
    item: any;
    deletedAt: string;
}


export interface AppState {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  goals: Goal[];
  investmentHoldings: InvestmentHolding[];
  contacts: Contact[];
  contactGroups: ContactGroup[];
  trips: Trip[];
  tripExpenses: TripExpense[];
  shops: Shop[];
  shopProducts: ShopProduct[];
  shopSales: ShopSale[];
  shopEmployees: ShopEmployee[];
  shopShifts: ShopShift[];
  refunds: Refund[];
  settlements: Settlement[];
  debts: Debt[];
  notes: Note[];
  glossaryEntries: GlossaryEntry[];
  unlockedAchievements: UnlockedAchievement[];
  challenges: Challenge[];
  streaks: UserStreak;
  settings: Settings;
  financialProfile: FinancialProfile;
  invoices: Invoice[];
  payees: Payee[];
  senders: Sender[];
  trustBin: TrustBinItem[];
  customCalendarEvents: CalendarEvent[];
}

export type ActiveScreen = 'dashboard' | 'reports' | 'budgets' | 'goals' | 'investments' | 'more' | 'scheduled' | 'tripManagement' | 'tripDetails' | 'calculator' | 'achievements' | 'shop' | 'refunds' | 'dataHub' | 'challenges' | 'learn' | 'calendar' | 'notes' | 'subscriptions' | 'glossary' | 'manual' | 'debtManager' | 'faq' | 'live';
export type ActiveModal = 'addTransaction' | 'editTransaction' | 'editNote' | 'accounts' | 'editAccount' | 'categories' | 'editCategory' | 'transfer' | 'senderManager' | 'payees' | 'settings' | 'appSettings' | 'onboarding' | 'privacyConsent' | 'editRecurring' | 'editGoal' | 'addFunds' | 'buyInvestment' | 'sellInvestment' | 'updateInvestment' | 'financialHealth' | 'importExport' | 'dashboardSettings' | 'footerCustomization' | 'notificationSettings' | 'aiHub' | 'globalSearch' | 'editTrip' | 'addTripExpense' | 'tripSummary' | 'manageTripMembers' | 'editShop' | 'editProduct' | 'refund' | 'editDebt' | 'viewOptions' | 'addCalendarEvent' | 'timePicker' | 'camera' | 'addNoteType' | 'linkToTrip' | 'editInvoice' | 'recordPayment' | 'aiChat' | 'integrations' | 'splitTransaction' | 'miniCalculator' | 'trustBin' | 'contacts' | 'editContact' | 'editContactGroup' | 'editGlossaryEntry' | 'shareGuide' | 'feedback' | 'manageTools' | 'editEmployee' | 'editShift';
export type ModalState = { name: ActiveModal; props?: Record<string, any> };
export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';


export interface DashboardWidget {
  id: 'summary' | 'netWorth' | 'financialHealth' | 'aiCoach' | 'portfolio' | 'goals' | 'budgets' | 'upcoming' | 'debts' | 'netWorthTrend' | 'charts';
  name: string;
  visible: boolean;
}

export interface FinancialProfile {
  monthlySalary: number;
  monthlyRent: number;
  monthlyEmi: number;
  emergencyFundGoal: number;
}
export interface SpamWarning {
  rawText: string;
  parsedData: ParsedTransactionData;
}
export interface ItemizedDetail {
  description: string;
  amount: number;
  categoryId: string;
  splitDetails?: SplitDetail[];
}
export interface SplitDetail {
  id: string; // Contact ID
  personName: string;
  amount: number;
  isSettled: boolean;
  shares?: string;
  percentage?: string;
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

export interface ParsedTripExpense {
  description: string;
  amount: number;
  categoryName: string;
  payerName?: string;
}
export interface ParsedReceiptData {
  merchantName: string;
  transactionDate: string;
  totalAmount: number;
  lineItems: { description: string; amount: number }[];
}
export interface FinancialScenarioResult {
    summary: string;
    keyMetrics: {
        metric: string;
        oldValue: string;
        newValue: string;
        changeDescription: string;
    }[];
    goalImpacts?: {
        goalName: string;
        impact: string;
    }[];
    conclusion: string;
}
export interface IdentifiedSubscription {
  vendorName: string;
  averageAmount: number;
  frequency: 'monthly' | 'yearly' | 'weekly' | 'irregular';
  transactionCount: number;
  category: string;
}
export interface PersonalizedChallenge {
    description: string;
    estimatedSavings: number;
}
export interface ProactiveInsight {
    insightType: 'anomaly' | 'forecast' | 'subscription_suggestion' | 'generic';
    title: string;
    message: string;
}

export interface Sender {
  id: string;
  name: string;
  identifier: string;
  type: SenderType;
}

export interface Payee {
  id: string;
  identifier: string;
  name: string;
  defaultCategoryId: string;
}

export type Theme = 'light' | 'dark';
export type TrustBinDeletionPeriodUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

export interface Profile {
  id: string;
  updated_at: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

export interface Settings {
    user_id?: string;
    currency: string;
    theme: Theme;
    language: string;
    isSetupComplete: boolean;
    hasSeenOnboarding: boolean;
    trustBinDeletionPeriod: {
        value: number;
        unit: TrustBinDeletionPeriodUnit;
    };
    notificationSettings: NotificationSettings;
    dashboardWidgets: DashboardWidget[];
    footerActions: ActiveScreen[];
    enabledTools: Record<ToggleableTool, boolean>;
    fabGlowEffect?: boolean;
    hubCursorGlowEffect?: boolean;
    googleCalendar?: {
        connected: boolean;
    };
}
export interface NotificationSettings {
    enabled: boolean;
    bills: {
        enabled: boolean;
    };
    budgets: {
        enabled: boolean;
        categories: Record<string, boolean>; // categoryId -> isEnabled
    };
    largeTransaction: {
        enabled: boolean;
        amount: number;
    };
    goals: {
        enabled: boolean;
    };
}

export type ToggleableTool = 
  | 'investments' | 'tripManagement' | 'shop' | 'refunds' | 'achievements' 
  | 'challenges' | 'learn' | 'calendar' | 'notes' | 'calculator' 
  | 'scheduledPayments' | 'accountTransfer' | 'budgets' | 'goals' 
  | 'payees' | 'senders' | 'aiHub' | 'dataHub' | 'feedback' | 'faq' 
  | 'subscriptions' | 'debtManager';

export interface ViewOptions {
    sortOptions: { key: string; label: string }[];
    filterOptions: { key: string; label: string; type: 'toggle' }[];
}
export interface AppliedViewOptions {
    sort: { key: string; direction: 'asc' | 'desc' };
    filters: Record<string, boolean>;
}

export enum InvoiceStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    PAID = 'Paid',
    OVERDUE = 'Overdue',
}
export interface Invoice {
    id: string;
    invoiceNumber: string;
    shopId: string;
    contactId: string;
    issueDate: string;
    dueDate: string;
    lineItems: InvoiceLineItem[];
    taxRate: number;
    totalAmount: number;
    status: InvoiceStatus;
    notes?: string;
}
export interface InvoiceLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface CalendarEvent {
    id: string;
    date: Date;
    title: string;
    type: 'bill' | 'refund' | 'trip' | 'goal' | 'custom';
    color: 'rose' | 'sky' | 'amber' | 'violet';
    data: any;
}
