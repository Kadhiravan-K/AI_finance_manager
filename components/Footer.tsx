import React, { useContext, useMemo } from 'react';
import { ActiveScreen } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';

interface FooterProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  onAddClick: () => void;
}

export const NAV_ITEM_DEFINITIONS: Record<ActiveScreen, { label: string, icon: React.ReactNode }> = {
    dashboard: { 
      label: 'Dashboard', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    },
    reports: { 
      label: 'Reports', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
    budgets: { 
      label: 'Budgets', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
    },
    more: { 
      label: 'More', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
    },
    investments: {
      label: 'Investments',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
    },
    goals: {
      label: 'Goals',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
    },
    tripManagement: {
        label: 'Trips',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
    },
    scheduled: { 
        label: 'Scheduled', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
    calculator: { 
        label: 'Calculator', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v11a2 2 0 01-2 2z" /></svg>
    },
    achievements: { 
        label: 'Achievements', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H4a1 1 0 00-1 1v6a1 1 0 001 1h1v4a1 1 0 001 1h8a1 1 0 001-1v-4h1a1 1 0 001-1v-6a1 1 0 00-1-1h-1V6a3 3 0 00-3-3H8a3 3 0 00-3 3v3z" /></svg>
    },
    tripDetails: {
        label: 'Trip Details',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m-6 13v-3" /></svg>
    },
    refunds: {
        label: 'Refunds',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
    },
    dataHub: {
        label: 'Data Hub',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 5 8-5" /></svg>
    },
    shop: {
        label: 'Shop',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
    },
    challenges: {
        label: 'Challenges',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
    },
    learn: {
        label: 'Learn',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    },
    calendar: { 
        label: 'Calendar', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
// Fix: Removed 'notes' which is not a valid ActiveScreen. It has been replaced by 'shoppingLists' and 'glossary'.
    shoppingLists: {
        label: 'Shopping Lists',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
    },
    // Fix: Add missing 'manual' property to NAV_ITEM_DEFINITIONS to satisfy the Record<ActiveScreen, ...> type.
    manual: {
        label: 'Manual',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    },
    // Fix: Add missing 'subscriptions' property to satisfy the Record<ActiveScreen, ...> type.
    subscriptions: {
        label: 'Subscriptions',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5" /></svg>
    },
    // Fix: Add missing 'glossary' property to NAV_ITEM_DEFINITIONS to satisfy the Record<ActiveScreen, ...> type.
    glossary: {
        label: 'Glossary',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    },
};


const Footer: React.FC<FooterProps> = ({ activeScreen, setActiveScreen, onAddClick }) => {
  const { settings } = useContext(SettingsContext);

  const navItems = useMemo(() => {
    const actions = settings.footerActions?.length === 4 
      ? settings.footerActions 
      : ['dashboard', 'reports', 'budgets', 'more'];
      
    return actions.map(screen => ({
      screen,
      ...(NAV_ITEM_DEFINITIONS[screen] || NAV_ITEM_DEFINITIONS.dashboard) // Fallback for safety
    }));
  }, [settings.footerActions]);

  return (
    <footer className="footer-nav z-20">
      {navItems.slice(0, 2).map(item => (
        <button key={item.screen} onClick={() => setActiveScreen(item.screen)} className={`footer-button ${activeScreen === item.screen ? 'active' : ''}`}>
          {item.icon}
          <span className="label">{item.label}</span>
        </button>
      ))}
      <div className="flex justify-center">
        <button onClick={onAddClick} className="footer-add-button" aria-label="Add Transaction">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {navItems.slice(2).map(item => (
        <button key={item.screen} onClick={() => setActiveScreen(item.screen)} className={`footer-button ${activeScreen === item.screen ? 'active' : ''}`}>
          {item.icon}
          <span className="label">{item.label}</span>
        </button>
      ))}
    </footer>
  );
};

export default Footer;