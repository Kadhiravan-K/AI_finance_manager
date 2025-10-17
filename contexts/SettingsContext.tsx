
import { createContext } from 'react';
import { AppState, Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  currency: 'INR',
  theme: 'dark',
  language: 'en',
  isSetupComplete: false,
  hasSeenOnboarding: false,
  trustBinDeletionPeriod: { value: 30, unit: 'days' },
  notificationSettings: {
    enabled: true,
    bills: { enabled: true },
    budgets: { enabled: true, categories: {} },
    largeTransaction: { enabled: false, amount: 10000 },
    goals: { enabled: true },
  },
  dashboardWidgets: [],
  footerActions: ['dashboard', 'reports', 'budgets', 'more'],
  enabledTools: {
    investments: false,
    tripManagement: false,
    shop: false,
    refunds: true,
    achievements: false,
    challenges: true,
    learn: false,
    calendar: true,
    notes: true,
    calculator: true,
    scheduledPayments: true,
    accountTransfer: true,
    budgets: true,
    goals: false,
    payees: false,
    senders: false,
    aiHub: true,
    dataHub: false,
    feedback: true,
    faq: false,
    subscriptions: false,
    debtManager: true,
  },
  googleCalendar: {
      connected: false
  }
};


export const AppDataContext = createContext<any>(null);

// This file now primarily exports the context. 
// The provider and hook logic have been moved to hooks/useAppContext.tsx for better organization.
// Fix: Export SettingsContext as an alias for AppDataContext to resolve import errors.
export const SettingsContext = AppDataContext;