import React, { useContext, useRef } from 'react';
import ReactDOM from 'react-dom';
import { SettingsContext } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { AppState, Theme, TrustBinDeletionPeriodUnit } from '../types';
import { createBackup, restoreBackup } from '../utils/backup';

const modalRoot = document.getElementById('modal-root')!;

interface AppSettingsModalProps {
  onClose: () => void;
  appState: AppState;
  onRestore: (state: AppState) => void;
}

const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ onClose, appState, onRestore }) => {
  const { settings, setSettings } = useContext(SettingsContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCurrencyChange = (currencyCode: string) => {
    setSettings(prev => ({ ...prev, currency: currencyCode }));
  };
  
  const handleThemeChange = (theme: Theme) => {
    setSettings(prev => ({ ...prev, theme: theme }));
  }
  
  const handleTrustBinPeriodChange = (field: 'value' | 'unit', value: string | number) => {
      setSettings(prev => ({
          ...prev,
          trustBinDeletionPeriod: {
              ...prev.trustBinDeletionPeriod,
              [field]: field === 'value' ? parseInt(value as string, 10) : value
          }
      }))
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

  const currencyOptions = currencies.map(c => ({
    value: c.code,
    label: `${c.name} (${c.symbol})`
  }));
  
  const trustBinUnitOptions: {value: TrustBinDeletionPeriodUnit, label: string}[] = [
      {value: 'minutes', label: 'Minutes'},
      {value: 'hours', label: 'Hours'},
      {value: 'days', label: 'Days'},
      {value: 'weeks', label: 'Weeks'},
      {value: 'months', label: 'Months'},
      {value: 'years', label: 'Years'},
  ];
  
  const TabButton = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void}) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors w-full ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`}>
      {children}
    </button>
  );

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="App Settings" onClose={onClose} icon="⚙️" />
        <div className="p-6 space-y-4 flex-grow overflow-y-auto">
            <div>
                <label className="block text-sm font-medium text-secondary mb-1">Currency</label>
                <CustomSelect
                    value={settings.currency}
                    onChange={handleCurrencyChange}
                    options={currencyOptions}
                />
            </div>
            <div className="pt-4 border-t border-divider">
                <label className="block text-sm font-medium text-secondary mb-2">Appearance</label>
                <div className="flex items-center gap-2 bg-subtle p-1 rounded-full border border-divider">
                        <TabButton active={settings.theme === 'dark'} onClick={() => handleThemeChange('dark')}>Dark</TabButton>
                        <TabButton active={settings.theme === 'light'} onClick={() => handleThemeChange('light')}>Light</TabButton>
                </div>
            </div>
             <div className="pt-4 border-t border-divider">
                <label className="block text-sm font-medium text-secondary mb-2">Trust Bin Auto-Deletion</label>
                <div className="flex gap-2">
                    <input 
                        type="number" 
                        value={settings.trustBinDeletionPeriod.value} 
                        onChange={e => handleTrustBinPeriodChange('value', e.target.value)}
                        className="input-base w-24 rounded-lg py-2 px-3 no-spinner"
                    />
                    <div className="flex-grow">
                        <CustomSelect
                            value={settings.trustBinDeletionPeriod.unit}
                            onChange={(v) => handleTrustBinPeriodChange('unit', v as TrustBinDeletionPeriodUnit)}
                            options={trustBinUnitOptions}
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-divider">
                <h3 className="font-semibold text-primary mb-2">Data Management</h3>
                <div className="flex gap-2">
                    <button onClick={handleCreateBackup} className="button-secondary w-full text-center p-2 text-sm">Create Backup</button>
                    <button onClick={handleRestoreClick} className="button-secondary w-full text-center p-2 text-sm">Restore from Backup</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pfh" className="hidden" />
                </div>
            </div>

            <div className="pt-4 border-t border-divider">
            <h3 className="font-semibold text-primary mb-2">Privacy Policy</h3>
            <div className="text-xs text-secondary space-y-2">
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
        <div className="p-4 text-center text-xs text-tertiary border-t border-divider">
            <p>Version 1.6.0 (Final Confirm)</p>
        </div>
        <div className="flex justify-end p-6 pt-4 border-t border-divider">
            <button onClick={onClose} className="button-secondary px-4 py-2">
                Done
            </button>
            </div>
        </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AppSettingsModal;