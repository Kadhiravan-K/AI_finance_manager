import React from 'react';
import { ActiveScreen } from '../types';

interface FooterProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
}

const Footer: React.FC<FooterProps> = ({ activeScreen, setActiveScreen }) => {
  const navItems: { screen: ActiveScreen, label: string, icon: JSX.Element }[] = [
    { 
      screen: 'dashboard', 
      label: 'Dashboard', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    },
    { 
      screen: 'reports', 
      label: 'Reports', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
    // Placeholder for the FAB
    { 
      screen: 'budgets', 
      label: 'Budgets', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l-2 2V8a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H9l-2 2V8z" /></svg>
    },
    { 
      screen: 'more', 
      label: 'More', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
    },
  ];

  return (
    <footer className="footer-nav">
      {navItems.slice(0, 2).map(item => (
        <button key={item.screen} onClick={() => setActiveScreen(item.screen)} className={`footer-button ${activeScreen === item.screen ? 'active' : ''}`}>
          {item.icon}
          <span className="label">{item.label}</span>
        </button>
      ))}
      <div className="footer-nav-placeholder"></div>
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