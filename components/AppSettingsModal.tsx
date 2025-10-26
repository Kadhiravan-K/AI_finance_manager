

import React, { useContext, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { SettingsContext, DEFAULT_SETTINGS } from '../contexts/SettingsContext';
import { currencies } from '../utils/currency';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { AppState, Theme, TrustBinDeletionPeriodUnit, ActiveScreen } from '../types';
import { createBackup, restoreBackup } from '../utils/backup';
import ToggleSwitch from './ToggleSwitch';
import ConfirmationDialog from './ConfirmationDialog';

const modalRoot = document.getElementById('modal-root')!;

interface AppSettingsModalProps {
  onClose: () => void;
  appState: AppState;
  onRestore: (state: AppState) => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ onClose, appState, onRestore }) => {
  const settingsContext = useContext(SettingsContext);
  if (!settingsContext) throw new Error("SettingsContext not found");
  const { settings, setSettings } = settingsContext;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleCurrencyChange = (currencyCode: string) => {
    setSettings(prev => ({ ...prev, currency: currencyCode }));
  };
  
  const handleThemeChange = (theme: Theme) => {
    setSettings(prev => ({ ...prev, theme: theme }));
  }

  const handleLanguageChange = (languageCode: string) => {
    setSettings(prev => ({ ...prev, language: languageCode }));
  };
  
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

  const handleConfirmReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setIsResetDialogOpen(false);
    alert("Settings have been reset to default values.");
  };

  const currencyOptions = currencies.map(c => ({
    value: c.code,
    label: `${c.name} (${c.symbol})`
  }));
  
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिन्दी (Hindi)' },
    { value: 'ta', label: 'தமிழ் (Tamil)' },
    { value: 'ml', label: 'മലയാളം (Malayalam)' },
  ];

  const trustBinUnitOptions: {value: TrustBinDeletionPeriodUnit, label: string}[] = [
      {value: 'minutes', label: 'Minutes'},
      {value: 'hours', label: 'Hours'},
      {value: 'days', label: 'Days'},
      {value: 'weeks', label: 'Weeks'},
      {value: 'months', label: 'Months'},
      {value: 'years', label: 'Years'},
  ];

  const TabButton: React.FC<{ active: boolean, children: React.ReactNode, onClick: () => void}> = ({ active, children, onClick }) => (
    <button type="button" onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors w-full ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`}>
      {children}
    </button>
  );

  const modalContent = (
    <>
      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        title="Confirm Reset Settings"
        message="Are you sure you want to reset all app settings to their default values? This will not affect your financial data like transactions or accounts."
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetDialogOpen(false)}
        confirmLabel="Reset"
      />
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
          <ModalHeader title="App Settings" onClose={onClose} icon="⚙️" />
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Appearance Section */}
            <div className="p-4 bg-subtle rounded-lg">
                <h4 className="font-semibold text-primary mb-3">Appearance</h4>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-secondary">Theme</span>
                    <div className="flex items-center gap-2 bg-subtle p-1 rounded-full border border-divider">
                        <TabButton active={settings.theme === 'dark'} onClick={() => handleThemeChange('dark')}>Dark</TabButton>
                        <TabButton active={settings.theme === 'light'} onClick={() => handleThemeChange('light')}>Light</TabButton>
                    </div>
                </div>
            </div>
            
            {/* Regional Section */}
             <div className="p-4 bg-subtle rounded-lg space-y-3">
                <h4 className="font-semibold text-primary mb-3">Regional</h4>
                <div><label className="text-sm font-medium text-secondary mb-1">Default Currency</label><CustomSelect options={currencyOptions} value={settings.currency} onChange={handleCurrencyChange} /></div>
                <div>
                  <label className="text-sm font-medium text-secondary mb-1">Language</label>
                  <CustomSelect options={languageOptions} value={settings.language || 'en'} onChange={handleLanguageChange} disabled={true} />
                  <p className="text-xs text-tertiary mt-2">Language selection is a feature planned for a future update.</p>
                </div>
            </div>
            
            {/* Data Management Section */}
            <div className="p-4 bg-subtle rounded-lg space-y-3">
                <h4 className="font-semibold text-primary mb-3">Data Management</h4>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleCreateBackup} className="button-secondary w-full py-2">Create Encrypted Backup</button>
                    <button onClick={handleRestoreClick} className="button-secondary w-full py-2">Restore from Backup</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pfh" className="hidden" />
                </div>
                <div>
                    <label className="text-sm font-medium text-secondary mb-1">Auto-delete from Trust Bin after:</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="number" onWheel={e => e.currentTarget.blur()} value={settings.trustBinDeletionPeriod.value} onChange={e => handleTrustBinPeriodChange('value', e.target.value)} className="input-base w-full p-2 rounded-lg" />
                        <CustomSelect options={trustBinUnitOptions} value={settings.trustBinDeletionPeriod.unit} onChange={v => handleTrustBinPeriodChange('unit', v)} />
                    </div>
                </div>
            </div>
            {/* Danger Zone */}
            <div className="p-4 rounded-lg bg-rose-900/50 border border-rose-500/50 space-y-2">
                <h4 className="font-semibold text-rose-300">Reset to Default</h4>
                <p className="text-xs text-rose-300/80">This will restore all appearance, regional, and tool settings to their original defaults. Your financial data will NOT be affected.</p>
                <div className="text-right pt-2">
                    <button type="button" onClick={() => setIsResetDialogOpen(true)} className="button-secondary bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/40">
                        Reset Settings
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};