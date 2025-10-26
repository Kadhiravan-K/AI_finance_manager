import React, { useState, useMemo, useRef, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, Account, Category, Sender, AppState, TransactionType } from '../types';
import ModalHeader from './ModalHeader';
import { exportTransactionsToCsv, exportSelectedDataToJson } from '../utils/export';
import CustomDatePicker from './CustomDatePicker';
import CustomCheckbox from './CustomCheckbox';
import { AppDataContext } from '../contexts/SettingsContext';
import LoadingSpinner from './LoadingSpinner';

const modalRoot = document.getElementById('modal-root')!;

interface ImportExportModalProps {
  onClose: () => void;
  appState: AppState;
}

type Tab = 'simple' | 'advanced';

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const ImportExportModal: React.FC<ImportExportModalProps> = ({ onClose, appState }) => {
  const [activeTab, setActiveTab] = useState<Tab>('simple');
  // Date states for simple export
  const [simpleStartDate, setSimpleStartDate] = useState<Date | null>(null);
  const [simpleEndDate, setSimpleEndDate] = useState<Date | null>(null);
  
  // Date states for advanced export
  const [advancedStartDate, setAdvancedStartDate] = useState<Date | null>(null);
  const [advancedEndDate, setAdvancedEndDate] = useState<Date | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [selectedDataKeys, setSelectedDataKeys] = useState<Set<keyof AppState>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { accounts, findOrCreateCategory, setTransactions } = useContext(AppDataContext);

  const handleExportCsv = () => {
    const { transactions, accounts, categories, senders } = appState;
    exportTransactionsToCsv(transactions, accounts, categories, senders, simpleStartDate, simpleEndDate);
  };
  
  const handleExportJson = () => {
    if (selectedDataKeys.size === 0) {
        alert("Please select at least one data type to export.");
        return;
    }
    exportSelectedDataToJson(appState, Array.from(selectedDataKeys), advancedStartDate, advancedEndDate);
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

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);

    try {
        const text = await file.text();
        const rows = text.split('\n').slice(1);
        const newTransactions: Transaction[] = [];
        const requiredAccounts = new Set<string>();

        rows.forEach(row => {
            if (row.trim()) {
                const accountName = row.split(',')[1]?.trim();
                if (accountName) {
                    requiredAccounts.add(accountName.toLowerCase());
                }
            }
        });

        const existingAccounts = new Set(accounts.map((a: Account) => a.name.toLowerCase()));
        const missingAccounts = Array.from(requiredAccounts).filter(name => !existingAccounts.has(name));

        if (missingAccounts.length > 0) {
            alert(`The following accounts are not found: ${missingAccounts.join(', ')}. Please create them before importing.`);
            setIsImporting(false);
            return;
        }

        for (const row of rows) {
            if (!row.trim()) continue;
            const [dateStr, accountName, description, incomeStr, expenseStr, categoryName] = row.split(',');
            
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) continue;

                const account = accounts.find((a: Account) => a.name.toLowerCase() === accountName.trim().toLowerCase())!;
                const income = parseFloat(incomeStr);
                const expense = parseFloat(expenseStr);
                
                const type = !isNaN(income) && income > 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
                const amount = type === TransactionType.INCOME ? income : expense;
                if (isNaN(amount) || amount <= 0) continue;

                const categoryId = findOrCreateCategory(categoryName.trim(), type);

                newTransactions.push({
                    id: self.crypto.randomUUID(),
                    date: date.toISOString(),
                    accountId: account.id,
                    description: description.trim(),
                    amount,
                    type,
                    categoryId,
                });
            } catch (e) {
                console.error("Failed to parse row:", row, e);
            }
        }
        
        if (newTransactions.length > 0) {
            if (window.confirm(`Found ${newTransactions.length} transactions to import. This will add them to your existing data. Continue?`)) {
                await setTransactions((prev: Transaction[]) => [...prev, ...newTransactions]);
                alert('Import successful!');
                onClose();
            }
        } else {
            alert('No valid transactions found to import.');
        }
    } catch (err) {
        alert("Failed to read or process the file.");
    } finally {
        setIsImporting(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
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
         <div className="flex border-b border-divider flex-shrink:0">
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
                            <CustomDatePicker value={simpleStartDate} onChange={setSimpleStartDate} />
                        </div>
                        <div>
                            <label className={labelStyle}>End Date</label>
                            <CustomDatePicker value={simpleEndDate} onChange={setSimpleEndDate} />
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
                    <p className="text-sm text-secondary mb-4">Select modules and an optional date range. Items without dates (like categories or settings) will be fully exported regardless of the date range.</p>
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={labelStyle}>Start Date</label>
                            <CustomDatePicker value={advancedStartDate} onChange={setAdvancedStartDate} />
                        </div>
                        <div>
                            <label className={labelStyle}>End Date</label>
                            <CustomDatePicker value={advancedEndDate} onChange={setAdvancedEndDate} />
                        </div>
                    </div>
                    <div className="p-3 rounded-lg bg-subtle border border-divider">
                        <div className="flex justify-end pb-2 border-b border-divider">
                            <button onClick={handleToggleAll} className="text-xs font-semibold text-sky-400 hover:text-sky-300">
                                {selectedDataKeys.size === dataModules.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 max-h-48 overflow-y-auto">
                            {dataModules.map(module => (
                                <CustomCheckbox 
                                    key={module.key}
                                    id={`export-${String(module.key)}`}
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
                <h3 className="font-semibold text-lg text-primary mb-2">Import Transactions (CSV)</h3>
                 <p className="text-sm text-secondary mb-4">Select a CSV file to import. Format must be: Date, Account, Description, Income, Expense, Category. Ensure all accounts in the file already exist in the app.</p>
                 <div className="mt-4">
                     <input 
                        type="file" 
                        ref={fileInputRef}
                        accept=".csv"
                        onChange={handleImportCsv}
                        disabled={isImporting} 
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