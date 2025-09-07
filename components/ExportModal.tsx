import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, Account, Category, Sender, AppState } from '../types';
import ModalHeader from './ModalHeader';
import { exportTransactionsToCsv, exportSelectedDataToJson } from '../utils/export';
import CustomDatePicker from './CustomDatePicker';
import CustomCheckbox from './CustomCheckbox';

const modalRoot = document.getElementById('modal-root')!;

interface ImportExportModalProps {
  onClose: () => void;
  appState: AppState;
}

type Tab = 'simple' | 'advanced';

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const ImportExportModal: React.FC<ImportExportModalProps> = ({ onClose, appState }) => {
  const [activeTab, setActiveTab] = useState<Tab>('simple');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [selectedDataKeys, setSelectedDataKeys] = useState<Set<keyof AppState>>(new Set());

  const handleExportCsv = () => {
    const { transactions, accounts, categories, senders } = appState;
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
    exportTransactionsToCsv(transactions, accounts, categories, senders, startDateStr, endDateStr);
  };
  
  const handleExportJson = () => {
    if (selectedDataKeys.size === 0) {
        alert("Please select at least one data type to export.");
        return;
    }
    exportSelectedDataToJson(appState, Array.from(selectedDataKeys));
  }

  const handleDataKeyToggle = (key: keyof AppState, checked: boolean) => {
    setSelectedDataKeys(prev => {
        const newSet = new Set(prev);
        if (checked) newSet.add(key);
        else newSet.delete(key);
        return newSet;
    });
  };
  
  const dataModules: { key: keyof AppState; label: string }[] = [
    { key: 'transactions', label: 'Transactions' },
    { key: 'accounts', label: 'Accounts' },
    { key: 'categories', label: 'Categories' },
    { key: 'budgets', label: 'Budgets' },
    { key: 'recurringTransactions', label: 'Recurring Payments' },
    { key: 'goals', label: 'Goals' },
    { key: 'investmentHoldings', label: 'Investments' },
    { key: 'payees', label: 'Payees' },
    { key: 'senders', label: 'Senders' },
    { key: 'contacts', label: 'Contacts' },
    { key: 'contactGroups', label: 'Contact Groups' },
    { key: 'trips', label: 'Trips' },
    { key: 'tripExpenses', label: 'Trip Expenses' },
    { key: 'shops', label: 'Shops' },
    { key: 'shopProducts', label: 'Shop Products' },
    { key: 'shopSales', label: 'Shop Sales' },
    { key: 'shopEmployees', label: 'Shop Employees' },
    { key: 'shopShifts', label: 'Shop Shifts' },
    { key: 'settings', label: 'App Settings' },
  ];

  const handleToggleAll = () => {
    if (selectedDataKeys.size === dataModules.length) {
      setSelectedDataKeys(new Set()); // Deselect all
    } else {
      setSelectedDataKeys(new Set(dataModules.map(m => m.key))); // Select all
    }
  };

  const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`w-full py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${ active ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary' }`}>
        {children}
    </button>
  );

  const modalContent = (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 border border-divider opacity-0 animate-scaleIn flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <ModalHeader title="Import/Export Data" onClose={onClose} icon="📄" />
         <div className="flex border-b border-divider flex-shrink-0">
            <TabButton active={activeTab === 'simple'} onClick={() => setActiveTab('simple')}>Simple (CSV)</TabButton>
            <TabButton active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')}>Advanced (JSON)</TabButton>
        </div>

        <div className="space-y-6 pt-4 p-6 overflow-y-auto">
            {activeTab === 'simple' && (
                <div className="animate-fadeInUp">
                    <h3 className="font-semibold text-lg text-primary mb-2">Export Transactions to CSV</h3>
                    <p className="text-sm text-secondary mb-4">Select a date range to export your transaction data. Leave blank to export all transactions.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyle}>Start Date</label>
                            <CustomDatePicker value={startDate} onChange={setStartDate} />
                        </div>
                        <div>
                            <label className={labelStyle}>End Date</label>
                            <CustomDatePicker value={endDate} onChange={setEndDate} />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="button-primary px-4 py-2"
                        >
                            Export as CSV
                        </button>
                    </div>
                </div>
            )}
             {activeTab === 'advanced' && (
                <div className="animate-fadeInUp">
                    <h3 className="font-semibold text-lg text-primary mb-2">Advanced Export to JSON</h3>
                    <p className="text-sm text-secondary mb-4">Select the specific data modules you want to export. This is useful for creating custom backups or migrating parts of your data.</p>
                    <div className="p-3 rounded-lg bg-subtle border border-divider">
                        <div className="flex justify-end pb-2 border-b border-divider">
                            <button onClick={handleToggleAll} className="text-xs font-semibold text-sky-400 hover:text-sky-300">
                                {selectedDataKeys.size === dataModules.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                            {dataModules.map(module => (
                                <CustomCheckbox 
                                    key={module.key}
                                    id={`export-${module.key}`}
                                    label={module.label}
                                    checked={selectedDataKeys.has(module.key)}
                                    onChange={checked => handleDataKeyToggle(module.key, checked)}
                                />
                            ))}
                        </div>
                    </div>
                     <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={handleExportJson}
                            className="button-primary px-4 py-2"
                        >
                            Export as JSON
                        </button>
                    </div>
                </div>
             )}
            
            <div className="pt-6 border-t border-divider">
                <h3 className="font-semibold text-lg text-primary mb-2">Import Data</h3>
                 <p className="text-sm text-secondary mb-4">Select a CSV or JSON file to import data. This feature is coming soon.</p>
                 <div className="mt-4">
                     <input 
                        type="file" 
                        disabled 
                        className="w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-subtle file:text-primary hover:file:bg-card-hover disabled:opacity-50"
                     />
                 </div>
            </div>
        </div>
         <div className="flex justify-end space-x-3 p-4 border-t border-divider">
            <button
                type="button"
                onClick={onClose}
                className="button-secondary px-4 py-2"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ImportExportModal;