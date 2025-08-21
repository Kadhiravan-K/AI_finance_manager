import React, { createContext, useState, ReactNode } from 'react';
import { Settings, Payee, Category } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  payees: Payee[];
  setPayees: React.Dispatch<React.SetStateAction<Payee[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

export const SettingsContext = createContext<SettingsContextType>({
  settings: { currency: 'INR' },
  setSettings: () => {},
  payees: [],
  setPayees: () => {},
  categories: [],
  setCategories: () => {},
});

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<Settings>('finance-tracker-settings', { currency: 'INR' });
  const [payees, setPayees] = useLocalStorage<Payee[]>('finance-tracker-payees', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('finance-tracker-categories', []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, payees, setPayees, categories, setCategories }}>
      {children}
    </SettingsContext.Provider>
  );
};