// This file contains type definitions for the entire application.

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum AccountType {
  DEPOSITORY = 'depository',
  CREDIT = 'credit',
  INVESTMENT = 'investment',
}

export type Priority = 'None' | 'Low' | 'Medium' | 'High';

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
  shares?: string;
  percentage?: string;
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
  senderId?: string;
  payeeId?: string;
  isRecurring?: boolean;
  transferId?: string;
  payers?: { contactId: string; amount: number }[];
  splitDetails?: SplitDetail[];
  itemizedDetails?: ItemizedDetail[];
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

export interface Payee {
  id: string;
  name: string;
  identifier: string;
  defaultCategoryId: string;
}

export enum SenderType {
  TRUSTED = 'trusted',
  BLOCKED = 'blocked',
}

export interface Sender {
  id: string;
  name: string;
  identifier: string;
  type: SenderType;
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
  endDate?: string;
  notes?: string;
  priority?: Priority;
  startTime?: string;
  reminderDays?: number;
}

export interface InvestmentHolding {
  id: string;
  accountId: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentValue: number;
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
  currency: string;
  participants: TripParticipant[];
  budget?: number;
  plan?: TripDayPlan[];
}

export interface TripExpense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  categoryId: string;
  date: string;
  notes?: string;
  payers: { contactId: string; amount: number }[];
  splitDetails: SplitDetail[];
  itemizedDetails?: ItemizedDetail[];
}

export type Theme = 'light' | 'dark';
export type TrustBinDeletionPeriodUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

export type ToggleableTool = 'achievements' | 'aiHub' | 'dataHub' | 'investments' | 'payees' | 'refunds' | 'scheduledPayments' | 'senders' | 'shop' | 'calculator' | 'tripManagement' | 'accountTransfer' | 'calendar' | 'budgets' | 'goals' | 'learn' | 'challenges' | 'shoppingLists' | 'subscriptions' | 'debtManager' | 'faq' | 'feedback';

export interface NotificationSettings {
    enabled: boolean;
    bills: { enabled: boolean };
    budgets: { enabled: boolean; categories: Record<string, boolean> };
    largeTransaction: { enabled: boolean; amount: number };
    goals: { enabled: boolean };
    investments: { enabled: boolean };
}

export interface DashboardWidget {
    id: 'financialHealth' | 'aiCoach' | 'summary' | 'upcoming' | 'budgets' | 'goals' | 'charts' | 'netWorth' | 'portfolio' | 'debts' | 'netWorthTrend';
    name: string;
    visible: boolean;
}

export interface Settings {
    currency: string;
    theme: Theme;
    dashboardWidgets: DashboardWidget[];
    notificationSettings: NotificationSettings;
    trustBinDeletionPeriod: {
        value: number;
        unit: TrustBinDeletionPeriodUnit;
    };
    enabledTools: Record<ToggleableTool, boolean>;
    footerActions: ActiveScreen[];
    googleCalendar: {
      connected: boolean;
    };
    fabGlowEffect?: boolean;
    hubCursorGlowEffect?: boolean;
}

export interface FinancialProfile {
  monthlySalary: number;
  monthlyRent: number;
  monthlyEmi: number;
  emergencyFundGoal: number;
}

export interface Debt {
    id: string;
    name: string;
    totalAmount: number;
    minimumPayment: number;
    apr: number;
    currentBalance: number;
}

export type ItemType = 'transaction' | 'account' | 'category' | 'payee' | 'sender' | 'contact' | 'contactGroup' | 'goal' | 'recurringTransaction' | 'trip' | 'tripExpense' | 'shop' | 'shopProduct' | 'shopEmployee' | 'shopShift' | 'refund' | 'settlement' | 'shoppingList' | 'glossaryEntry' | 'debt';

export type DeletableItem = Transaction | Account | Category | Payee | Sender | Contact | ContactGroup | Goal | RecurringTransaction | Trip | TripExpense | Shop | ShopProduct | ShopEmployee | ShopShift | Refund | Settlement | ShoppingList | GlossaryEntry | Debt;

export interface TrustBinItem {
  id: string;
  item: DeletableItem;
  itemType: ItemType;
  deletedAt: string;
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

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string | null;
  streakFreezes: number;
}

export type ChallengeType = 'log_transaction' | 'categorize_uncategorized' | 'set_budget' | 'review_goals' | 'custom_savings';

export interface Challenge {
  id: string;
  date: string;
  type: ChallengeType;
  description: string;
  isCompleted: boolean;
}

export interface Refund {
    id: string;
    description: string;
    amount: number;
    date: string;
    accountId: string;
    originalTransactionId?: string;
    contactId?: string;
    notes?: string;
    expectedDate?: string;
    isClaimed: boolean;
    claimedDate?: string;
}

export interface Settlement {
    id: string;
    timestamp: string;
    fromContactId: string;
    toContactId: string;
    amount: number;
    currency: string;
}

export interface ShoppingListItem {
    id: string;
    name: string;
    quantity: string;
    rate: number;
    isPurchased: boolean;
    priority: Priority;
}

export interface ShoppingList {
    id: string;
    title: string;
    items: ShoppingListItem[];
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
    challenges: Challenge[];
    trips: Trip[];
    tripExpenses: TripExpense[];
    financialProfile: FinancialProfile;
    shops: Shop[];
    shopProducts: ShopProduct[];
    shopSales: ShopSale[];
    shopEmployees: ShopEmployee[];
    shopShifts: ShopShift[];
    refunds: Refund[];
    settlements: Settlement[];
    shoppingLists: ShoppingList[];
    glossaryEntries: GlossaryEntry[];
    debts: Debt[];
}

export type ActiveScreen = 'dashboard' | 'reports' | 'budgets' | 'goals' | 'investments' | 'scheduled' | 'more' | 'tripManagement' | 'achievements' | 'calculator' | 'calendar' | 'challenges' | 'dataHub' | 'glossary' | 'learn' | 'manual' | 'refunds' | 'shop' | 'shoppingLists' | 'subscriptions' | 'tripDetails' | 'debtManager' | 'faq';

export type ActiveModal = 'addTransaction' | 'editTransaction' | 'accountsManager' | 'editAccount' | 'categories' | 'editCategory' | 'payees' | 'senderManager' | 'appSettings' | 'importExport' | 'feedback' | 'transfer' | 'splitTransaction' | 'viewOptions' | 'globalSearch' | 'aiHub' | 'trustBin' | 'dashboardSettings' | 'notificationSettings' | 'manageTools' | 'editTrip' | 'addTripExpense' | 'tripSummary' | 'editGoal' | 'financialHealth' | 'addCalendarEvent' | 'editNote' | 'aiChat' | 'refund' | 'editContact' | 'editContactGroup' | 'contacts' | 'integrations' | 'footerCustomization' | 'editGlossaryEntry' | 'buyInvestment' | 'sellInvestment' | 'updateInvestment' | 'editShop' | 'editRecurring' | 'shareGuide' | 'timePicker' | 'editDebt' | 'camera';

export interface ModalState {
  name: ActiveModal;
  props?: Record<string, any>;
}

export interface UndoToastState {
    message: string;
    onUndo: () => void;
    onConfirm: () => void;
}

export enum ProcessingStatus {
    IDLE,
    PROCESSING,
    SUCCESS,
    ERROR
}

export type DateRange = 'all' | 'today' | 'week' | 'month' | 'custom';
export type ReportPeriod = 'week' | 'month' | 'year' | 'custom';

export interface CustomDateRange {
  start: Date | null;
  end: Date | null;
}

export interface AppliedViewOptions {
  sort: { key: string; direction: 'asc' | 'desc' };
  filters: Record<string, boolean>;
}

export interface ViewOptions {
  sortOptions: { key: string; label: string }[];
  filterOptions: { key: string; label: string; type: 'toggle' }[];
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

export interface SpamWarning {
    rawText: string;
    parsedData: ParsedTransactionData;
}

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: 'bill' | 'refund' | 'goal' | 'trip';
  color: 'rose' | 'sky' | 'amber' | 'violet';
  data: any;
}

export type ShopType = 'physical_retail' | 'online_ecommerce' | 'freelance_service' | 'rental_business' | 'garage_sale' | 'other';
export enum BusinessType {
    B2B = 'B2B', B2C = 'B2C', C2C = 'C2C', C2B = 'C2B', B2G = 'B2G', G2B = 'G2B',
    G2C = 'G2C', C2G = 'C2G', B2B2C = 'B2B2C', D2C = 'D2C', B2E = 'B2E',
    B2BSaaS = 'B2B SaaS', P2P = 'P2P', B2B2B = 'B2B2B', B2C2B = 'B2C2B',
    C2C2B = 'C2C2B', C2B2B = 'C2B2B', B2B2G = 'B2B2G'
}

export interface Shop {
    id: string;
    name: string;
    type: ShopType;
    businessType?: BusinessType;
    currency: string;
    taxRate?: number;
}

export interface ShopProduct {
    id: string;
    shopId: string;
    name: string;
    description?: string;
    tags?: string[];
    qrCode?: string;
    stockQuantity: number;
    lowStockThreshold?: number;
    purchasePrice: number;
    sellingPrice: number;
    categoryId?: string;
}

export interface ShopSaleItem {
    productId: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
    purchasePricePerUnit: number;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'other';

export interface ShopSale {
    id: string;
    shopId: string;
    timestamp: string;
    items: ShopSaleItem[];
    employeeId?: string;
    customerName?: string;
    subtotal: number;
    discount?: {
        type: 'percentage' | 'flat';
        value: number;
    };
    taxAmount: number;
    totalAmount: number;
    profit: number;
    paymentMethod: PaymentMethod;
    amountPaid?: number;
    changeGiven?: number;
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
    name: string;
    startTime: string;
    endTime: string;
}

export interface HeldBill {
    id: string;
    timestamp: string;
    customerName: string;
    items: ShopSaleItem[];
}