import React from 'react';
import { ActiveModal, ActiveScreen } from '../types';

export interface FabAction {
    key: string;
    label: string;
    icon: React.ReactNode;
    target: { screen?: ActiveScreen, modal?: ActiveModal };
}

export const ALL_FAB_ACTIONS: FabAction[] = [
    // Core Actions
    // Fix: Replaced JSX with emoji string for icon to be valid in a .ts file.
    { key: 'addTransaction', label: 'Add Transaction', icon: '➕', target: { modal: 'addTransaction' } },
    // Fix: Replaced JSX with emoji string for icon to be valid in a .ts file.
    { key: 'openCalendar', label: 'Calendar', icon: '🗓️', target: { screen: 'calendar' } },
    // Fix: Replaced JSX with emoji string for icon to be valid in a .ts file.
    { key: 'openNotes', label: 'Notes', icon: '📝', target: { screen: 'notes' } },
    // Fix: Replaced JSX with emoji string for icon to be valid in a .ts file.
    { key: 'openTrip', label: 'Trips', icon: '✈️', target: { screen: 'tripManagement' } },
    // Fix: Replaced JSX with emoji string for icon to be valid in a .ts file.
    { key: 'openSearch', label: 'Search', icon: '🔍', target: { modal: 'globalSearch' } },
    
    // Other useful screens
    // Fix: Replaced JSX with emoji string for icon to be valid in a .ts file.
    { key: 'openReports', label: 'Reports', icon: '📈', target: { screen: 'reports' } },
    // Fix: Replaced JSX with emoji string for icon to be valid in a .ts file.
    { key: 'openBudgets', label: 'Budgets', icon: '🎯', target: { screen: 'budgets' } },
    // Fix: Replaced JSX with emoji string for icon to be valid in a .ts file.
    { key: 'openGoals', label: 'Goals', icon: '🏆', target: { screen: 'goals' } },
    // Fix: Replaced JSX with emoji string for icon to be valid in a .ts file.
    { key: 'openCalculator', label: 'Calculator', icon: '🧮', target: { screen: 'calculator' } },
    
    // Management
    // Fix: Replaced JSX with emoji string for icon to be valid in a .ts file.
    { key: 'manageAccounts', label: 'Accounts', icon: '🏦', target: { modal: 'accountsManager' } },
    // Fix: Replaced JSX with emoji string for icon to be valid in a .ts file.
    { key: 'manageCategories', label: 'Categories', icon: '🏷️', target: { modal: 'categories' } },
];
