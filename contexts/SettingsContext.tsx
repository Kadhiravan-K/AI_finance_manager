import React, { createContext, useState, ReactNode } from 'react';
import { Settings, Payee, Category, Sender, Contact, ContactGroup, Theme, DashboardWidget, NotificationSettings, TrustBinDeletionPeriodUnit, ToggleableTool, FinancialProfile } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

interface SettingsContextType {
  settings: Settings;
  setSettings: (value: Settings | ((val: Settings) => Settings)) => Promise<void>;
  payees: Payee[];
  setPayees: (value: Payee[] | ((val: Payee[]) => Payee[])) => Promise<void>;
  categories: Category[];
  setCategories: (value: Category[] | ((val: Category[]) => Category[])) => Promise<void>;
  senders: Sender[];
  setSenders: (value: Sender[] | ((val: Sender[]) => Sender[])) => Promise<void>;
  contactGroups: ContactGroup[];
  setContactGroups: (value: ContactGroup[] | ((val: ContactGroup[]) => ContactGroup[])) => Promise<void>;
  contacts: Contact[];
  setContacts: (value: Contact[] | ((val: Contact[]) => Contact[])) => Promise<void>;
  financialProfile: FinancialProfile;
  setFinancialProfile: (value: FinancialProfile | ((val: FinancialProfile) => FinancialProfile)) => Promise<void>;
}

const DEFAULT_DASHBOARD_WIDGETS: DashboardWidget[] = [
    { id: 'financialHealth', name: "Financial Health", visible: true },
    { id: 'netWorth', name: 'Net Worth', visible: true },
    { id: 'portfolio', name: 'Investment Portfolio', visible: true },
    { id: 'summary', name: 'Income/Expense Summary', visible: true },
    { id: 'debts', name: 'Debts (Owed to You)', visible: true },
    { id: 'upcoming', name: 'Upcoming/Due Bills', visible: true },
    { id: 'goals', name: 'Goals Summary', visible: true },
    { id: 'budgets', name: 'Budgets Summary', visible: true },
    { id: 'charts', name: 'Spending Charts', visible: true },
];

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    enabled: true,
    bills: { enabled: true },
    budgets: { enabled: true, categories: {} },
    largeTransaction: { enabled: false, amount: 1000 },
    goals: { enabled: true },
    investments: { enabled: true },
};

const DEFAULT_SETTINGS: Settings = {
    currency: 'INR',
    theme: 'dark',
    dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
    notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
    trustBinDeletionPeriod: {
        value: 30,
        unit: 'days'
    },
    enabledTools: {
        calculator: true,
        investments: true,
        payees: true,
        senders: true,
        tripManagement: true,
    }
};

const DEFAULT_FINANCIAL_PROFILE: FinancialProfile = {
    monthlySalary: 0,
    monthlyRent: 0,
    monthlyEmi: 0,
    emergencyFundGoal: 0,
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  setSettings: async () => {},
  payees: [],
  setPayees: async () => {},
  categories: [],
  setCategories: async () => {},
  senders: [],
  setSenders: async () => {},
  contactGroups: [],
  setContactGroups: async () => {},
  contacts: [],
  setContacts: async () => {},
  financialProfile: DEFAULT_FINANCIAL_PROFILE,
  setFinancialProfile: async () => {},
});

const DEFAULT_CONTACT_GROUPS: ContactGroup[] = [
    { id: 'group-friends', name: 'Friends' },
    { id: 'group-business', name: 'Business' },
    { id: 'group-relatives', name: 'Relatives' },
];


export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<Settings>('finance-tracker-settings', DEFAULT_SETTINGS);
  const [payees, setPayees] = useLocalStorage<Payee[]>('finance-tracker-payees', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('finance-tracker-categories', []);
  const [senders, setSenders] = useLocalStorage<Sender[]>('finance-tracker-senders', []);
  const [contactGroups, setContactGroups] = useLocalStorage<ContactGroup[]>('finance-tracker-contact-groups', DEFAULT_CONTACT_GROUPS);
  const [contacts, setContacts] = useLocalStorage<Contact[]>('finance-tracker-contacts', []);
  const [financialProfile, setFinancialProfile] = useLocalStorage<FinancialProfile>('finance-tracker-financial-profile', DEFAULT_FINANCIAL_PROFILE);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, payees, setPayees, categories, setCategories, senders, setSenders, contactGroups, setContactGroups, contacts, setContacts, financialProfile, setFinancialProfile }}>
      {children}
    </SettingsContext.Provider>
  );
};