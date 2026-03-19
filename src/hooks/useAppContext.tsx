import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, AppState } from '@/types';

interface AppDataContextType extends AppState {
  isLoading: boolean;
  profile: any;
  setSettings: (settings: AppSettings) => void;
  setAccounts: (updater: (prev: any[]) => any[]) => void;
  setPayees: (payees: any[]) => void;
  setBudgets: (updater: (prev: any[]) => any[]) => void;
  setFinancialProfile: (profile: any) => void;
  setTrips: (updater: (prev: any[]) => any[]) => void;
  setDebts: (updater: (prev: any[]) => any[]) => void;
  setCustomCalendarEvents: (updater: (prev: any[]) => any[]) => void;
  setNotes: (updater: (prev: any[]) => any[]) => void;
  onTransfer: (from: string, to: string, amount: number) => void;
  onAddAccount: (account: any) => void;
  deleteItem: (id: string, type: string) => void;
  onSaveCategory: (category: any) => void;
  onSaveRecurring: (recurring: any) => void;
  onSaveGoal: (goal: any) => void;
  onSaveTrip: (trip: any) => void;
  onSaveContact: (contact: any) => void;
  onSaveTripExpense: (expense: any) => void;
  onUpdateTripExpense: (expense: any) => void;
  onSettle: (settlement: any) => void;
  onSaveShop: (shop: any) => void;
  onSaveProduct: (shopId: string, product: any, id?: string) => void;
  onSaveEmployee: (shopId: string, employee: any, id?: string) => void;
  onSaveShift: (shopId: string, shift: any, id?: string) => void;
  onAddNote: (type: string) => void;
  onSaveInvoice: (invoice: any) => void;
  onRecordInvoicePayment: (payment: any) => void;
  onRestoreItems: (ids: string[]) => void;
  onPermanentDeleteItems: (ids: string[]) => void;
  onSaveContactGroup: (group: any) => void;
  onSaveGlossaryEntry: (entry: any) => void;
  onBuyInvestment: (investment: any) => void;
  onSellInvestment: (investment: any) => void;
  onUpdateInvestmentValue: (investment: any) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    hasSeenPrivacy: false,
    isSetupComplete: false,
    hasSeenOnboarding: false,
  });
  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [payees, setPayees] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [tripExpenses, setTripExpenses] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [shopEmployees, setShopEmployees] = useState<any[]>([]);
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [trustBin, setTrustBin] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [customCalendarEvents, setCustomCalendarEvents] = useState<any[]>([]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const value: AppDataContextType = {
    isLoading,
    settings,
    profile,
    accounts,
    categories,
    payees,
    budgets,
    tripExpenses,
    trips,
    settlements,
    shopEmployees,
    shopProducts,
    trustBin,
    contacts,
    notes,
    debts,
    customCalendarEvents,
    setSettings,
    setAccounts,
    setPayees,
    setBudgets,
    setFinancialProfile: setProfile,
    setTrips,
    setDebts,
    setCustomCalendarEvents,
    setNotes,
    onTransfer: () => {},
    onAddAccount: () => {},
    deleteItem: () => {},
    onSaveCategory: () => {},
    onSaveRecurring: () => {},
    onSaveGoal: () => {},
    onSaveTrip: () => {},
    onSaveContact: () => {},
    onSaveTripExpense: () => {},
    onUpdateTripExpense: () => {},
    onSettle: () => {},
    onSaveShop: () => {},
    onSaveProduct: () => {},
    onSaveEmployee: () => {},
    onSaveShift: () => {},
    onAddNote: () => {},
    onSaveInvoice: () => {},
    onRecordInvoicePayment: () => {},
    onRestoreItems: () => {},
    onPermanentDeleteItems: () => {},
    onSaveContactGroup: () => {},
    onSaveGlossaryEntry: () => {},
    onBuyInvestment: () => {},
    onSellInvestment: () => {},
    onUpdateInvestmentValue: () => {},
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppDataProvider');
  }
  return context;
};
