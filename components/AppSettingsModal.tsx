import React, { useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, setSettings } = useContext(SettingsContext);

  const handleCurrencyChange = (currencyCode: string) => {
    setSettings(prev => ({ ...prev, currency: currencyCode }));
  };

  if (!isOpen) return null;

  const currencyOptions = currencies.map(c => ({
    value: c.code,
    label: `${c.name} (${c.symbol})`
  }));

  return (
    <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-slate-700/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
      <ModalHeader title="App Settings" onClose={onClose} icon="⚙️" />
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Currency</label>
          <CustomSelect
            value={settings.currency}
            onChange={handleCurrencyChange}
            options={currencyOptions}
          />
        </div>
      </div>
       <div className="flex justify-end p-6 pt-4 mt-auto border-t border-slate-700">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600/80 transition-colors">
            Done
          </button>
        </div>
    </div>
  );
};

export default AppSettingsModal;