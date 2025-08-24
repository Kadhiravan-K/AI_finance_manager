import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, Account, Category, Sender } from '../types';
import ModalHeader from './ModalHeader';
import { exportTransactionsToCsv } from '../utils/export';
import CustomDatePicker from './CustomDatePicker';

const modalRoot = document.getElementById('modal-root')!;

interface ImportExportModalProps {
  onClose: () => void;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  senders: Sender[];
}

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const ImportExportModal: React.FC<ImportExportModalProps> = ({ onClose, transactions, accounts, categories, senders }) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleExport = () => {
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
    exportTransactionsToCsv(transactions, accounts, categories, senders, startDateStr, endDateStr);
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider opacity-0 animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <ModalHeader title="Import/Export Data" onClose={onClose} icon="📄" />
        <div className="space-y-6 pt-4 p-6">
            {/* Export Section */}
            <div>
                <h3 className="font-semibold text-lg text-primary mb-2">Export Data</h3>
                <p className="text-sm text-secondary mb-4">Select a date range to export your transaction data as a CSV file. Leave blank to export all transactions.</p>
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
                        onClick={handleExport}
                        className="button-primary px-4 py-2"
                    >
                        Export as CSV
                    </button>
                </div>
            </div>
            
            {/* Import Section */}
            <div className="pt-6 border-t border-divider">
                <h3 className="font-semibold text-lg text-primary mb-2">Import Data</h3>
                 <p className="text-sm text-secondary mb-4">Select a file to import transactions. This feature is coming soon.</p>
                 <div className="mt-4">
                     <input 
                        type="file" 
                        disabled 
                        className="w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-subtle file:text-primary hover:file:bg-card-hover disabled:opacity-50"
                     />
                 </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
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
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ImportExportModal;