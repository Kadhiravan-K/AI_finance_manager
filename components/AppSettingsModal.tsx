import React, { useContext, useRef } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { AppState, Theme } from '../types';
import { createBackup, restoreBackup } from '../utils/backup';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onRestore: (state: AppState) => void;
}

const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ isOpen, onClose, appState, onRestore }) => {
  const { settings, setSettings } = useContext(SettingsContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCurrencyChange = (currencyCode: string) => {
    setSettings(prev => ({ ...prev, currency: currencyCode }));
  };
  
  const handleThemeChange = (theme: Theme) => {
    setSettings(prev => ({ ...prev, theme: theme }));
  }
  
  const handleCreateBackup = async () => {
      const password = prompt("Please enter a password to encrypt your backup. This password will be required to restore your data.");
      if(password) {
          try {
            await createBackup(appState, password);
            alert("Backup created successfully!");
          } catch(err) {
              console.error("Backup failed", err);
              alert("Backup failed. See console for details.");
          }
      }
  };

  const handleRestoreClick = () => {
      fileInputRef.current?.click();
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const password = prompt("Please enter the password for this backup file.");
          if(password){
              try {
                  const restoredState = await restoreBackup(file, password);
                  if (window.confirm("Restore successful. This will overwrite all current data. Are you sure you want to continue?")) {
                      onRestore(restoredState);
                  }
              } catch(err) {
                  console.error("Restore failed", err);
                  alert(`Restore failed: ${err instanceof Error ? err.message : "Unknown error"}`);
              }
          }
      }
      // Reset file input
      if(fileInputRef.current) fileInputRef.current.value = "";
  };


  if (!isOpen) return null;

  const currencyOptions = currencies.map(c => ({
    value: c.code,
    label: `${c.name} (${c.symbol})`
  }));

  return (
    <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-slate-700/50 animate-scaleIn" onClick={e => e.stopPropagation()}>
      <ModalHeader title="App Settings" onClose={onClose} icon="⚙️" />
      <div className="p-6 space-y-4 flex-grow overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Currency</label>
          <CustomSelect
            value={settings.currency}
            onChange={handleCurrencyChange}
            options={currencyOptions}
          />
        </div>
        <div className="pt-4 border-t border-slate-700/50">
           <label className="block text-sm font-medium text-slate-400 mb-2">Appearance</label>
           <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
                <button onClick={() => handleThemeChange('dark')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full ${settings.theme === 'dark' ? 'bg-emerald-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
                    Dark
                </button>
                <button onClick={() => handleThemeChange('light')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full ${settings.theme === 'light' ? 'bg-emerald-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
                    Light
                </button>
           </div>
        </div>

        <div className="pt-4 border-t border-slate-700/50">
            <h3 className="font-semibold text-white mb-2">Data Management</h3>
            <div className="flex gap-2">
                <button onClick={handleCreateBackup} className="w-full text-center p-2 text-sm bg-sky-600/80 rounded-md text-sky-200 hover:bg-sky-600">Create Backup</button>
                <button onClick={handleRestoreClick} className="w-full text-center p-2 text-sm bg-violet-600/80 rounded-md text-violet-200 hover:bg-violet-600">Restore from Backup</button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pfh" className="hidden" />
            </div>
        </div>

        <div className="pt-4 border-t border-slate-700/50">
           <h3 className="font-semibold text-white mb-2">Privacy Policy</h3>
           <div className="text-xs text-slate-400 space-y-2">
              <p><strong>Local, Encrypted Storage:</strong> Your privacy is paramount. All of your financial data (transactions, accounts, budgets, etc.) is stored exclusively on your local device. We never see or have access to it. This data is also encrypted on your device for an added layer of security.</p>
              <p><strong>External Services:</strong> To provide smart features, certain non-identifiable data is sent to external services:</p>
              <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Transaction Parsing:</strong> When you use the "Quick Add" feature, the text you enter is sent to the Google Gemini API for analysis and categorization.</li>
                  <li><strong>Feedback:</strong> If you choose to send feedback, the content of your message will be sent to the app developer to help improve the service.</li>
              </ul>
              <p>By using this app, you consent to this data handling. We are committed to not collecting any personally identifiable information.</p>
           </div>
        </div>
      </div>
      <div className="p-4 text-center text-xs text-slate-500 border-t border-slate-700/50">
        <p>Version 1.4.0 (Launch Ready)</p>
      </div>
       <div className="flex justify-end p-6 pt-4 border-t border-slate-700">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600/80 transition-colors">
            Done
          </button>
        </div>
    </div>
  );
};

export default AppSettingsModal;