import React, { createContext, useState, ReactNode } from 'react';
import { Settings, Payee, Category, Sender, Contact, ContactGroup, Theme } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  payees: Payee[];
  setPayees: React.Dispatch<React.SetStateAction<Payee[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  senders: Sender[];
  setSenders: React.Dispatch<React.SetStateAction<Sender[]>>;
  contactGroups: ContactGroup[];
  setContactGroups: React.Dispatch<React.SetStateAction<ContactGroup[]>>;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

export const SettingsContext = createContext<SettingsContextType>({
  settings: { currency: 'INR', theme: 'dark' },
  setSettings: () => {},
  payees: [],
  setPayees: () => {},
  categories: [],
  setCategories: () => {},
  senders: [],
  setSenders: () => {},
  contactGroups: [],
  setContactGroups: () => {},
  contacts: [],
  setContacts: () => {},
});

const DEFAULT_CONTACT_GROUPS: ContactGroup[] = [
    { id: 'group-friends', name: 'Friends' },
    { id: 'group-business', name: 'Business' },
    { id: 'group-relatives', name: 'Relatives' },
];


export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<Settings>('finance-tracker-settings', { currency: 'INR', theme: 'dark' });
  const [payees, setPayees] = useLocalStorage<Payee[]>('finance-tracker-payees', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('finance-tracker-categories', []);
  const [senders, setSenders] = useLocalStorage<Sender[]>('finance-tracker-senders', []);
  const [contactGroups, setContactGroups] = useLocalStorage<ContactGroup[]>('finance-tracker-contact-groups', DEFAULT_CONTACT_GROUPS);
  const [contacts, setContacts] = useLocalStorage<Contact[]>('finance-tracker-contacts', []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, payees, setPayees, categories, setCategories, senders, setSenders, contactGroups, setContactGroups, contacts, setContacts }}>
      {children}
    </SettingsContext.Provider>
  );
};