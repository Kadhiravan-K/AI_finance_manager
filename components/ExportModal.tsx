import React, { useState } from 'react';
import { Transaction, Account, Category } from '../types';
import ModalHeader from './ModalHeader';
import { exportTransactionsToCsv } from '../utils/export';

interface ExportModalProps {
  onClose: () => void;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

const inputStyle = "w-full bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner shadow-slate-900/50 transition-all duration-200";
const labelStyle = "block text-sm font-medium text-slate-400 mb-1";
const primaryButtonStyle = "px-4 py-2 rounded-lg text-white font-semibold bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-200 transform active:scale-[0.98]";
const secondaryButtonStyle = "px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600/80 transition-colors";

const ExportModal: React.FC<ExportModalProps> = ({ onClose, transactions, accounts, categories }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExport = () => {
    exportTransactionsToCsv(transactions, accounts, categories, startDate, endDate);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="glass-card rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-700/50 opacity-0 animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <ModalHeader title="Export Data" onClose={onClose} onBack={onClose} />
        <div className="space-y-4 pt-4">
            <p className="text-sm text-slate-400">Select a date range to export your transaction data as a CSV file. Leave blank to export all transactions.</p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className={labelStyle}>Start Date</label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className={inputStyle}
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className={labelStyle}>End Date</label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className={inputStyle}
                    />
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className={secondaryButtonStyle}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleExport}
                    className={primaryButtonStyle}
                >
                    Export as CSV
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;