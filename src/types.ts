export type ActiveScreen = 
  | 'dashboard' 
  | 'finance' 
  | 'trips' 
  | 'shop' 
  | 'notes' 
  | 'calendar' 
  | 'reports' 
  | 'settings' 
  | 'goals' 
  | 'investments' 
  | 'subscriptions' 
  | 'debts' 
  | 'calculator' 
  | 'faq' 
  | 'glossary' 
  | 'manual' 
  | 'liveFeed' 
  | 'challenges' 
  | 'learn'
  | 'scheduled'
  | 'refunds'
  | 'dataHub'
  | 'tripManagement'
  | 'tripDetails'
  | 'achievements'
  | 'more'
  | 'debtManager';

export type ActiveModal = 
  | 'auth' 
  | 'addTransaction' 
  | 'editTransaction' 
  | 'transfer' 
  | 'accounts' 
  | 'editAccount' 
  | 'categories' 
  | 'editCategory' 
  | 'senderManager' 
  | 'payees' 
  | 'appSettings' 
  | 'privacyConsent' 
  | 'editRecurring' 
  | 'editGoal' 
  | 'financialHealth' 
  | 'importExport' 
  | 'dashboardSettings' 
  | 'footerCustomization' 
  | 'notificationSettings' 
  | 'globalSearch' 
  | 'editTrip' 
  | 'addTripExpense' 
  | 'tripSummary' 
  | 'manageTripMembers' 
  | 'editShop' 
  | 'editProduct' 
  | 'editEmployee' 
  | 'editShift' 
  | 'refund' 
  | 'editDebt' 
  | 'viewOptions' 
  | 'addCalendarEvent' 
  | 'timePicker' 
  | 'camera' 
  | 'addNoteType' 
  | 'linkToTrip' 
  | 'editInvoice' 
  | 'recordPayment' 
  | 'aiChat' 
  | 'integrations' 
  | 'miniCalculator' 
  | 'trustBin' 
  | 'contacts' 
  | 'editContactGroup' 
  | 'editContact' 
  | 'editGlossaryEntry' 
  | 'shareGuide' 
  | 'aiHub' 
  | 'buyInvestment' 
  | 'sellInvestment' 
  | 'updateInvestment' 
  | 'splitTransaction' 
  | 'feedback' 
  | 'manageTools' 
  | 'manageAdvances';

export interface ModalState {
  name: ActiveModal;
  props?: Record<string, any>;
}

export type Theme = 'light' | 'dark';
export type TrustBinDeletionPeriodUnit = 'days' | 'weeks' | 'months';

export interface AppSettings {
  theme: Theme;
  hasSeenPrivacy: boolean;
  isSetupComplete: boolean;
  hasSeenOnboarding: boolean;
  currency?: string;
  dashboardWidgets?: string[];
  trustBinDeletionPeriod?: number;
  trustBinDeletionPeriodUnit?: TrustBinDeletionPeriodUnit;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  photoURL?: string;
}

export interface Profile extends User {
  bio?: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
}

export type AccountType = 'cash' | 'bank' | 'credit' | 'investment' | 'other';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  date: string;
  note?: string;
  payeeId?: string;
  senderId?: string;
  isRecurring?: boolean;
  recurringId?: string;
  itemizedDetails?: ItemizedDetail[];
  splitDetails?: SplitDetail[];
}

export interface ItemizedDetail {
  id: string;
  name: string;
  amount: number;
  categoryId?: string;
}

export interface SplitDetail {
  id: string;
  contactId: string;
  amount: number;
  isPaid: boolean;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextDate: string;
  note?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  categoryId?: string;
  priority: Priority;
  status: 'active' | 'completed' | 'paused';
}

export type Priority = 'low' | 'medium' | 'high';

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'weekly';
  spent: number;
}

export interface InvestmentHolding {
  id: string;
  accountId: string;
  symbol: string;
  name: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
}

export interface Debt {
  id: string;
  name: string;
  amount: number;
  interestRate: number;
  dueDate?: string;
  accountId?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  type: ItemType;
  createdAt: string;
  updatedAt: string;
  tripId?: string;
  checklistItems?: ChecklistItem[];
}

export type ItemType = 'text' | 'checklist';

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  priority?: Priority;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  budget: number;
  participants: TripParticipant[];
  expenses: TripExpense[];
}

export interface TripParticipant {
  id: string;
  name: string;
  email?: string;
}

export interface TripExpense {
  id: string;
  tripId: string;
  amount: number;
  categoryId: string;
  date: string;
  paidById: string;
  splitDetails: SplitDetail[];
}

export interface Shop {
  id: string;
  name: string;
  type: ShopType;
  businessType: BusinessType;
}

export type ShopType = 'physical' | 'online';
export type BusinessType = 'retail' | 'service' | 'other';

export interface ShopProduct {
  id: string;
  shopId: string;
  name: string;
  price: number;
  stock: number;
}

export interface ShopEmployee {
  id: string;
  shopId: string;
  name: string;
  role: string;
}

export interface ShopShift {
  id: string;
  shopId: string;
  employeeId: string;
  startTime: string;
  endTime: string;
}

export interface ShopSale {
  id: string;
  shopId: string;
  amount: number;
  date: string;
  items: { productId: string; quantity: number; price: number }[];
}

export interface Invoice {
  id: string;
  shopId: string;
  contactId: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Refund {
  id: string;
  transactionId: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed';
}

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  tags: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  color?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActive: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  current: number;
  deadline: string;
}

export type ChallengeType = 'saving' | 'spending' | 'other';

export interface SpamWarning {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface FinancialProfile {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

export interface FinancialScenarioResult {
  name: string;
  description: string;
  impact: number;
}

export interface ParsedReceiptData {
  merchant: string;
  date: string;
  total: number;
  items: ItemizedDetail[];
}

export interface ParsedTransactionData {
  amount: number;
  date: string;
  note?: string;
  categoryId?: string;
}

export interface ParsedTripExpense extends ParsedTransactionData {
  tripId: string;
}

export interface ProactiveInsight {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  contactIds: string[];
}

export interface Sender {
  id: string;
  name: string;
  type: SenderType;
}

export type SenderType = 'person' | 'organization';

export interface Settlement {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  date: string;
}

export interface TripMessage {
  id: string;
  tripId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface TripDayPlan {
  id: string;
  tripId: string;
  date: string;
  items: TripDayPlanItem[];
}

export interface TripDayPlanItem {
  id: string;
  time: string;
  activity: string;
  location?: string;
}

export interface ToggleableTool {
  id: string;
  name: string;
  enabled: boolean;
}

export interface TrustBinItem {
  id: string;
  type: string;
  data: any;
  deletedAt: string;
}

export interface IdentifiedSubscription {
  id: string;
  name: string;
  amount: number;
  frequency: string;
}

export interface ViewOptions {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filterBy?: string;
}

export interface AppliedViewOptions extends ViewOptions {
  active: boolean;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface CustomDateRange extends DateRange {
  label: string;
}

export const USER_SELF_ID = 'self';
export const TRIP_FUND_ID = 'trip_fund';

export interface AppState {
  settings: AppSettings;
  accounts: Account[];
  categories: Category[];
  payees: Payee[];
  budgets: Budget[];
  tripExpenses: TripExpense[];
  trips: Trip[];
  settlements: Settlement[];
  shopEmployees: ShopEmployee[];
  shopProducts: ShopProduct[];
  trustBin: TrustBinItem[];
  contacts: Contact[];
  notes: Note[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  goals: Goal[];
  debts: Debt[];
  investmentHoldings: InvestmentHolding[];
  financialProfile: FinancialProfile;
  glossaryEntries: GlossaryEntry[];
  customCalendarEvents: CalendarEvent[];
  shopSales: ShopSale[];
  shopShifts: ShopShift[];
  challenges: Challenge[];
  refunds: Refund[];
  [key: string]: any;
}

export interface Payee {
  id: string;
  name: string;
  defaultCategoryId?: string;
}
