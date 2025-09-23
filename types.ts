// This file defines the core data structures and types used throughout the application.

// Enums
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
    NONE = 'None'
}

export enum ProcessingStatus {
  IDLE,
  PROCESSING,
  SUCCESS,
  ERROR,
}

export enum ShopType {
  PHYSICAL_RETAIL = 'physical_retail',
  ONLINE_ECOMMERCE = 'online_ecommerce',
  FREELANCE_SERVICE = 'freelance_service',
  RENTAL_BUSINESS = 'rental_business',
  GARAGE_SALE = 'garage_sale',
  OTHER = 'other',
}

export enum BusinessType {
  RETAIL = 'Retail',
  FOOD_AND_BEVERAGE = 'Food & Beverage',
  SERVICES = 'Services',
  HEALTH_AND_WELLNESS = 'Health & Wellness',
  ENTERTAINMENT = 'Entertainment',
  EDUCATION = 'Education',
  TECHNOLOGY = 'Technology',
  OTHER = 'Other',
}

export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
}

// Core Data Structures
export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO 8601 format
  notes?: string;
  senderId?: string;
  transferId?: string;
  itemizedDetails?: ItemizedDetail[];
  splitDetails?: SplitDetail[];
  payers?: { contactId: string, amount: number }[];
}

export interface ItemizedDetail {
    description: string;
    amount: number;
    categoryId: string;
    splitDetails?: SplitDetail[];
}

export interface SplitDetail {
    id: string;
    personName: string;
    amount: number;
    isSettled: boolean;
    percentage?: string;
    shares?: string;
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
    nextDueDate: string; // ISO 8601 format
    startTime?: string; // HH:MM
    reminders?: Reminder[];
    priority?: Priority;
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
  icon?: string;
}

export interface Payee {
  id: string;
  identifier: string;
  name: string;
  defaultCategoryId: string;
}

export interface Sender {
  id: string;
  identifier: string;
  name: string;
  type: SenderType;
}

export interface TripParticipant {
  contactId: string;
  name: string;
}

export interface TripItineraryItem {
  id: string;
  time: string;
  activity: string;
  type: 'travel' | 'food' | 'activity' | 'lodging' | 'other';
  notes?: string;
  isCompleted?: boolean;
  icon?: string;
}

export interface TripDayPlan {
  id: string;
  date: string;
  title: string;
  items: TripItineraryItem[];
}

export interface Trip {
  id: string;
  name: string;
  date: string;
  participants: TripParticipant[];
  currency: string;
  plan?: TripDayPlan[];
  budget?: number;
}

export interface TripExpense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  categoryId: string;
  date: string;
  notes?: string;
  payers: { contactId: string, amount: number }[];
  splitDetails: SplitDetail[];
  itemizedDetails?: ItemizedDetail[];
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
}

export interface ShopSale {
  id: string;
  shopId: string;
  items: { productId: string; quantity: number; price: number; }[];
  totalAmount: number;
  profit: number;
  date: string;
}

export interface ShopEmployee {
  id: string;
  shopId: string;
  name: string;
}

export interface ShopShift {
  id: string;
  shopId: string;
  employeeId: string;
  startTime: string;
  endTime: string;
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
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  taxRate: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes?: string;
}


export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  currentBalance: number;
  minimumPayment: number;
  apr: number;
}

export interface Refund {
  id: string;
  description: string;
  amount: number;
  date: string;
  accountId: string;
  originalTransactionId?: string;
  notes?: string;
  contactId?: string;
  isClaimed: boolean;
  claimedDate?: string;
  expectedDate?: string;
}

export interface Settlement {
  id: string;
  fromContactId: string;
  toContactId: string;
  amount: number;
  currency: string;
  date: string;
  tripId?: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  rate: number;
  isPurchased: boolean;
  priority?: Priority;
  quantity: string;
}

export interface Note {
  id: string;
  title: string;
  content: string | ChecklistItem[];
  type: 'note' | 'checklist';
  createdAt: string;
  updatedAt: string;
  tripId?: string;
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
  type: 'bill' | 'refund' | 'trip' | 'goal';
  color: 'rose' | 'sky' | 'amber' | 'violet';
  data: any;
}


// Add missing types that are referenced throughout the application
// Fix: Renamed 'shoppingLists' to 'notes' for consistency with data structures.
export type ActiveScreen = 'dashboard' | 'reports' | 'budgets' | 'more' | 'investments' | 'goals' | 'tripManagement' | 'scheduled' | 'calculator' | 'achievements' | 'tripDetails' | 'refunds' | 'dataHub' | 'shop' | 'challenges' | 'learn' | 'calendar' | 'notes' | 'manual' | 'subscriptions' | 'glossary' | 'debtManager' | 'faq' | 'live';

// Fix: Add 'miniCalculator' to ActiveModal type.
export type ActiveModal = 'addTransaction' | 'editTransaction' | 'accountsManager' | 'editAccount' | 'categories' | 'editCategory' | 'transfer' | 'settings' | 'appSettings' | 'senderManager' | 'payees' | 'editGoal' | 'editRecurring' | 'buyInvestment' | 'sellInvestment' | 'updateInvestment' | 'privacyConsent' | 'onboarding' | 'financialHealth' | 'dashboardSettings' | 'notificationSettings' | 'importExport' | 'aiHub' | 'globalSearch' | 'aiChat' | 'editTrip' | 'addTripExpense' | 'tripSummary' | 'splitTransaction' | 'contacts' | 'editContact' | 'editContactGroup' | 'editShop' | 'editNote' | 'refund' | 'addCalendarEvent' | 'timePicker' | 'camera' | 'editDebt' | 'viewOptions' | 'footerCustomization' | 'manageTools' | 'shareGuide' | 'integrations' | 'editInvoice' | 'recordPayment' | 'trustBin' | 'feedback' | 'editGlossaryEntry' | 'splitItem' | 'aiCommand' | 'miniCalculator' | 'Note' | 'TrustBinItem';


export interface DashboardWidget {
  id: 'summary' | 'netWorth' | 'portfolio' | 'goals' | 'budgets' | 'upcoming' | 'debts' | 'charts' | 'financialHealth' | 'aiCoach' | 'netWorthTrend';
  name: string;
  visible: boolean;
}

export interface FinancialProfile {
  monthlySalary: number;
  monthlyRent: number;
  monthlyEmi: number;
  emergencyFundGoal: number;
}

export type DateRange = 'all' | 'today' | 'week' | 'month' | 'custom';
export type ReportPeriod = 'week' | 'month' | 'year' | 'custom';
export interface CustomDateRange {
  start: Date | null;
  end: Date | null;
}

export interface ViewOptions {
  sortOptions: { key: string, label: string }[];
  filterOptions: { key: string, label: string, type: 'toggle' }[];
}

export interface AppliedViewOptions {
  sort: { key: string; direction: 'asc' | 'desc' };
  filters: Record<string, boolean>;
}

export type Theme = 'light' | 'dark';
export type TrustBinDeletionPeriodUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
export interface NotificationSettings {
  enabled: boolean;
  bills: { enabled: boolean };
  budgets: { enabled: boolean; categories: Record<string, boolean> };
  largeTransaction: { enabled: boolean, amount: number };
  goals: { enabled: boolean };
}

// Fix: Renamed 'shoppingLists' to 'notes' to align with the rest of the application's types.
export type ToggleableTool = 
  | 'investments' | 'tripManagement' | 'shop' | 'refunds' | 'achievements' 
  | 'challenges' | 'learn' | 'calendar' | 'notes' | 'calculator' 
  | 'scheduledPayments' | 'accountTransfer' | 'budgets' | 'goals' 
  | 'payees' | 'senders' | 'aiHub' | 'dataHub' | 'feedback' | 'faq' 
  | 'subscriptions' | 'debtManager';

export interface Settings {
  currency: string;
  theme: Theme;
  language?: string;
  fabGlowEffect?: boolean;
  hubCursorGlowEffect?: boolean;
  footerActions: ActiveScreen[];
  enabledTools: Record<ToggleableTool, boolean>;
  dashboardWidgets: DashboardWidget[];
  notificationSettings: NotificationSettings;
  trustBinDeletionPeriod: { value: number; unit: TrustBinDeletionPeriodUnit };
  googleCalendar?: { connected: boolean; calendarId?: string; };
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  lastActivityDate: string;
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

// Fix: Renamed 'shoppingList' to 'note' to align with data structures and prevent type errors.
export type ItemType = 'transaction' | 'account' | 'category' | 'recurringTransaction' | 'goal' | 'investmentHolding' | 'payee' | 'sender' | 'contact' | 'contactGroup' | 'trip' | 'tripExpense' | 'shop' | 'shopProduct' | 'shopSale' | 'shopEmployee' | 'shopShift' | 'refund' | 'settlement' | 'note' | 'glossaryEntry' | 'debt' | 'invoice';

export interface TrustBinItem {
  id: string;
  itemType: ItemType;
  item: any;
  deletedAt: string;
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

export interface SpamWarning {
  rawText: string;
  parsedData: ParsedTransactionData;
}

export interface FinancialScenarioResult {
  summary: string;
  keyMetrics: { metric: string; oldValue: string; newValue: string; changeDescription: string; }[];
  goalImpacts?: { goalName: string; impact: string; }[];
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
  streaks: UserStreak;
  unlockedAchievements: UnlockedAchievement[];
  challenges: Challenge[];
  trips: Trip[];
  tripExpenses: TripExpense[];
  financialProfile: FinancialProfile;
  refunds: Refund[];
  settlements: Settlement[];
  shops: Shop[];
  shopProducts: ShopProduct[];
  shopSales: ShopSale[];
  shopEmployees: ShopEmployee[];
  shopShifts: ShopShift[];
  notes: Note[];
  glossaryEntries: GlossaryEntry[];
  debts: Debt[];
  invoices: Invoice[];
}

export interface ModalState {
  name: ActiveModal;
  props?: Record<string, any>;
}
