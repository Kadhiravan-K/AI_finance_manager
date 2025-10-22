import { createClient } from '@supabase/supabase-js';

// Using placeholder credentials for local development.
// For production, these should be replaced with environment variables.
const supabaseUrl = 'https://xyz.supabase.co';
const supabaseAnonKey = 'your-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase configuration is missing. Please provide SUPABASE_URL and SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const USER_SELF_ID = 'user_self';
export const TRIP_FUND_ID = 'trip_fund';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum AccountType {
  DEPOSITORY = 'depository', // Bank, cash
  CREDIT = 'credit',       // Credit Card
  INVESTMENT = 'investment', // Investment account
}

export enum Priority {
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
    NONE = 'None',
}

export interface SplitDetail {
    id: string; // contactId
    personName: string;
    amount: number;
    isSettled: boolean;
    shares?: string;
    percentage?: string;
    contactId?: string; // from ManageAdvancesModal in App.tsx
}

export interface ItemizedDetail {
    description: string;
    amount: number;
    categoryId: string;
    splitDetails?: SplitDetail[];
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO string
  notes?: string;
  senderId?: string;
  itemizedDetails?: ItemizedDetail[];
  splitDetails?: SplitDetail[];
  payers?: { contactId: string; amount: number }[];
}

export interface Reminder {
    value: number;
    unit: 'hours' | 'days' | 'weeks';
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
  nextDueDate: string; // ISO string
  reminders?: Reminder[];
  priority?: Priority;
  startTime?: string;
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

export interface Goal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  productLink?: string;
  priority?: Priority;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string; // YYYY-MM
}

export interface TripParticipant {
    contactId: string;
    name: string;
    role: 'admin' | 'member';
}

export interface TripDayPlanItem {
    id: string;
    time: string; // HH:MM
    activity: string;
    type?: 'travel' | 'food' | 'activity' | 'lodging' | 'other';
    notes?: string;
    completed?: boolean;
    categoryId?: string;
}

export interface TripDayPlan {
    id: string;
    date: string; // YYYY-MM-DD
    title: string;
    items: TripDayPlanItem[];
}

export interface Trip {
    id: string;
    name: string;
    date: string; // ISO string
    participants: TripParticipant[];
    currency: string;
    budget?: number;
    plan?: TripDayPlan[];
    advances?: { contactId: string, amount: number }[];
}

export interface Contact {
    id: string;
    name: string;
    groupId: string;
}

export interface ContactGroup {
    id: string;
    name: string;
    icon?: string;
}

export enum ShopType {
    PHYSICAL_RETAIL = 'physical_retail',
    ONLINE_STORE = 'online_store',
    SERVICE_BUSINESS = 'service_business',
    RESTAURANT_CAFE = 'restaurant_cafe',
}

export enum BusinessType {
    SOLE_PROPRIETORSHIP = 'Sole Proprietorship',
    PARTNERSHIP = 'Partnership',
    LLC = 'LLC',
    CORPORATION = 'Corporation'
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
    costPrice?: number;
    stock: number;
    category?: string;
}

export interface ShopSale {
    id: string;
    shopId: string;
    items: { productId: string; quantity: number; price: number }[];
    totalAmount: number;
    profit: number;
    date: string; // ISO string
}

export interface ShopEmployee {
    id: string;
    shopId: string;
    name: string;
    role: string;
    wage: number; // per hour
}

export interface ShopShift {
    id: string;
    shopId: string;
    employeeId: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
}

export interface Refund {
    id: string;
    description: string;
    amount: number;
    date: string; // ISO string
    accountId: string;
    originalTransactionId?: string;
    contactId?: string;
    notes?: string;
    isClaimed: boolean;
    claimedDate?: string; // ISO string
    expectedDate?: string;
}

export interface Debt {
    id: string;
    name: string;
    totalAmount: number;
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
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    tripId?: string;
    isPinned?: boolean;
    icon?: string;
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

export interface CalendarEvent {
    id: string;
    date: Date;
    title: string;
    type: 'bill' | 'refund' | 'trip' | 'goal' | 'custom';
    color: 'rose' | 'sky' | 'amber' | 'violet';
    data: any;
}

export type ActiveScreen = 
  | 'dashboard' | 'reports' | 'budgets' | 'goals' | 'investments' 
  | 'scheduled' | 'more' | 'tripManagement' | 'tripDetails' 
  | 'calculator' | 'achievements' | 'refunds' | 'dataHub' | 'shop'
  | 'challenges' | 'learn' | 'calendar' | 'notes' | 'subscriptions'
  | 'glossary' | 'manual' | 'debtManager' | 'faq' | 'live';

export type ActiveModal = 
  | 'addTransaction' | 'editTransaction' | 'transfer' | 'accounts'
  | 'editAccount' | 'categories' | 'editCategory' | 'senderManager'
  | 'payees' | 'appSettings' | 'privacyConsent' | 'editRecurring'
  | 'editGoal' | 'financialHealth' | 'importExport' | 'dashboardSettings'
  | 'footerCustomization' | 'notificationSettings' | 'globalSearch'
  | 'editTrip' | 'addTripExpense' | 'tripSummary' | 'manageTripMembers'
  | 'editShop' | 'editProduct' | 'editEmployee' | 'editShift'
  | 'refund' | 'editDebt' | 'viewOptions' | 'addCalendarEvent'
  | 'timePicker' | 'camera' | 'addNoteType' | 'linkToTrip'
  | 'editInvoice' | 'recordPayment' | 'aiChat' | 'integrations'
  | 'miniCalculator' | 'trustBin' | 'contacts' | 'editContactGroup'
  | 'editContact' | 'editGlossaryEntry' | 'shareGuide' | 'aiHub'
  | 'buyInvestment' | 'sellInvestment' | 'updateInvestment'
  | 'splitTransaction' | 'feedback' | 'manageTools' | 'manageAdvances';

export interface ModalState {
  name: ActiveModal;
  props?: Record<string, any>;
}

export interface InvestmentHolding {
    id: string;
    accountId: string;
    name: string;
    quantity: number;
    averageCost: number;
    currentValue: number;
}

export interface UnlockedAchievement {
    achievementId: string;
    date: string; // ISO string
}

export enum ChallengeType {
    LOG_TRANSACTION = 'log_transaction',
    CATEGORIZE_UNCATEGORIZED = 'categorize_uncategorized',
    SET_BUDGET = 'set_budget',
    REVIEW_GOALS = 'review_goals',
    CUSTOM_SAVINGS = 'custom_savings'
}
export interface Challenge {
    id: string;
    date: string; // YYYY-MM-DD
    type: ChallengeType | 'custom_savings';
    description: string;
    isCompleted: boolean;
}

export interface UserStreak {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string; // YYYY-MM-DD
    streakFreezes: number;
}

export enum InvoiceStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    PAID = 'Paid',
    OVERDUE = 'Overdue'
}

export interface InvoiceLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    shopId: string;
    contactId: string;
    issueDate: string; // ISO string
    dueDate: string; // ISO string
    lineItems: InvoiceLineItem[];
    taxRate: number;
    totalAmount: number;
    status: InvoiceStatus;
    notes?: string;
}

export interface Payee {
    id: string;
    identifier: string;
    name: string;
    defaultCategoryId: string;
}

export enum SenderType {
    TRUSTED = 'trusted',
    BLOCKED = 'blocked'
}

export interface Sender {
    id: string;
    identifier: string;
    name: string;
    type: SenderType;
}

export interface Settlement {
    id: string;
    fromContactId: string;
    toContactId: string;
    amount: number;
    currency: string;
    date: string; // ISO string
    tripId?: string;
}

export interface FinancialProfile {
    monthlySalary: number;
    monthlyRent: number;
    monthlyEmi: number;
    emergencyFundGoal: number;
}

export type ItemType = 'transaction' | 'recurringTransaction' | 'tripExpense' | 'refund' | 'settlement' | 'account' | 'category' | 'payee' | 'sender' | 'contact' | 'contactGroup' | 'trip' | 'shop' | 'shopProduct' | 'shopEmployee' | 'shopShift' | 'goal' | 'note' | 'glossaryEntry' | 'debt';

export interface TrustBinItem {
  id: string;
  itemType: ItemType;
  item: any;
  deletedAt: string; // ISO string
}

export type Theme = 'light' | 'dark';
export type TrustBinDeletionPeriodUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

export type ToggleableTool = 
  | 'investments' | 'tripManagement' | 'shop' | 'refunds' | 'achievements' 
  | 'challenges' | 'learn' | 'calendar' | 'notes' | 'calculator' 
  | 'scheduledPayments' | 'accountTransfer' | 'budgets' | 'goals' 
  | 'payees' | 'senders' | 'aiHub' | 'dataHub' | 'feedback' | 'faq' 
  | 'subscriptions' | 'debtManager';

export interface NotificationSettings {
    enabled: boolean;
    bills: { enabled: boolean };
    budgets: { enabled: boolean; categories: Record<string, boolean> };
    largeTransaction: { enabled: boolean; amount: number };
    goals: { enabled: boolean };
}

export interface DashboardWidget {
    id: string;
    name: string;
    visible: boolean;
}

export interface Settings {
  currency: string;
  theme: Theme;
  language: string;
  isSetupComplete: boolean;
  hasSeenOnboarding: boolean;
  hasSeenPrivacy?: boolean;
  trustBinDeletionPeriod: {
    value: number;
    unit: TrustBinDeletionPeriodUnit;
  };
  notificationSettings: NotificationSettings;
  dashboardWidgets: DashboardWidget[];
  footerActions: ActiveScreen[];
  enabledTools: Record<ToggleableTool, boolean>;
  googleCalendar?: {
      connected: boolean;
  };
  financialProfile?: FinancialProfile;
  fabGlowEffect?: boolean;
  hubCursorGlowEffect?: boolean;
}

export interface AppState {
  settings: Settings;
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
  financialProfile: FinancialProfile;
  invoices: Invoice[];
  payees: Payee[];
  senders: Sender[];
  trustBin: TrustBinItem[];
  customCalendarEvents: CalendarEvent[];
}

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
}

export type DateRange = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export interface CustomDateRange {
  start: Date | null;
  end: Date | null;
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
  rawText: string;
  parsedData: ParsedTransactionData;
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

export interface AppliedViewOptions {
    sort: {
        key: string;
        direction: 'asc' | 'desc';
    };
    filters: Record<string, boolean>;
}

export interface ViewOptions {
    sortOptions: { key: string; label: string }[];
    filterOptions: { key: string; label: string; type: 'toggle' }[];
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface TripExpense {
    id: string;
    tripId: string;
    description: string;
    amount: number;
    categoryId: string;
    date: string; // ISO string
    notes?: string;
    payers: { contactId: string; amount: number }[];
    splitDetails: SplitDetail[];
    itemizedDetails?: ItemizedDetail[];
}