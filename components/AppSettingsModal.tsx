import React, { useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, setSettings } = useContext(SettingsContext);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({ ...prev, currency: e.target.value }));
  };

  if (!isOpen) return null;

  return (
    <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-700/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">App Settings</h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-slate-400 mb-1">Currency</label>
          <select
            id="currency"
            value={settings.currency}
            onChange={handleCurrencyChange}
            className="w-full bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-emerald-500"
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>
            ))}
          </select>
        </div>
      </div>
       <div className="flex justify-end pt-6 mt-4 border-t border-slate-700">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600/80 transition-colors">
            Done
          </button>
        </div>
    </div>
  );
};

export default AppSettingsModal;