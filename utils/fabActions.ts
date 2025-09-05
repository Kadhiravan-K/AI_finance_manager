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
    { key: 'addTransaction', label: 'Add Transaction', icon: '➕', target: { modal: 'addTransaction' } },
    { key: 'openCalendar', label: 'Calendar', icon: '🗓️', target: { screen: 'calendar' } },
    // Fix: Corrected target screen to 'shoppingLists' as 'notes' screen is deprecated.
    { key: 'openNotes', label: 'Notes', icon: '📝', target: { screen: 'shoppingLists' } },
    // Fix: Corrected target screen to 'shoppingLists' as 'notes' screen is deprecated.
    { key: 'addNote', label: 'Add Note', icon: '🗒️', target: { screen: 'shoppingLists' } },
    { key: 'openTrip', label: 'Trips', icon: '✈️', target: { screen: 'tripManagement' } },
    { key: 'openSearch', label: 'Search', icon: '🔍', target: { modal: 'globalSearch' } },
    
    // Other useful screens
    { key: 'openReports', label: 'Reports', icon: '📈', target: { screen: 'reports' } },
    { key: 'openBudgets', label: 'Budgets', icon: '🎯', target: { screen: 'budgets' } },
    { key: 'openGoals', label: 'Goals', icon: '🏆', target: { screen: 'goals' } },
    { key: 'openCalculator', label: 'Calculator', icon: '🧮', target: { screen: 'calculator' } },
    
    // Management
    { key: 'manageAccounts', label: 'Accounts', icon: '🏦', target: { modal: 'accountsManager' } },
    { key: 'manageCategories', label: 'Categories', icon: '🏷️', target: { modal: 'categories' } },
];