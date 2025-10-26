import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Account } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { getCurrencyConversionRate } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

const modalRoot = document.getElementById('modal-root')!;

interface TransferModalProps {
  onClose: () => void;
  accounts: Account[];
  onTransfer: (fromAccountId: string, toAccountId: string, fromAmount: number, toAmount: number, notes?: string) => void;
}

type RateMode = 'auto' | 'manual';

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const TransferModal: React.FC<TransferModalProps> = ({ onClose, accounts, onTransfer }) => {
  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]?.id || '');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  
  const [rateMode, setRateMode] = useState<RateMode>('auto');
  const [rate, setRate] = useState<number>(1);
  const [isRateLoading, setIsRateLoading] = useState(false);

  const fromAccount = useMemo(() => accounts.find(a => a.id === fromAccountId), [accounts, fromAccountId]);
  const toAccount = useMemo(() => accounts.find(a => a.id === toAccountId), [accounts, toAccountId]);
  const isCrossCurrency = fromAccount?.currency !== toAccount?.currency;
  
  const fromFormatter = useCurrencyFormatter(undefined, fromAccount?.currency);
  const toFormatter = useCurrencyFormatter(undefined, toAccount?.currency);

  const fetchRate = async () => {
    if (!fromAccount || !toAccount || !isCrossCurrency || rateMode !== 'auto') return;
    setIsRateLoading(true);
    try {
      const fetchedRate = await getCurrencyConversionRate(fromAccount.currency, toAccount.currency);
      setRate(fetchedRate);
    } catch (err) {
      setError("Could not fetch conversion rate.");
      setRate(1);
    } finally {
      setIsRateLoading(false);
    }
  };

  useEffect(() => {
    if (isCrossCurrency) {
      if (rateMode === 'auto') {
        fetchRate();
      } else {
        setRate(1); // Reset to 1 for manual entry
      }
    } else {
      setRate(1); // Same currency, rate is 1
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAccountId, toAccountId, rateMode, isCrossCurrency]);

  useEffect(() => {
    // When rate changes, update the 'to' amount based on the 'from' amount
    const from = parseFloat(fromAmount);
    if (!isNaN(from) && from > 0 && isCrossCurrency) {
      setToAmount((from * rate).toFixed(2));
    } else if (!isCrossCurrency) {
      setToAmount(fromAmount);
    }
  }, [rate, fromAmount, isCrossCurrency]);


  const handleFromAmountChange = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;
    setFromAmount(value);
    const from = parseFloat(value);
    if (!isNaN(from) && from >= 0) {
      setToAmount((from * rate).toFixed(2));
    } else {
      setToAmount('');
    }
  };
  
  const handleToAmountChange = (value: string) => {
      if (!/^\d*\.?\d*$/.test(value)) return;
      setToAmount(value);
      const to = parseFloat(value);
      if (!isNaN(to) && to >= 0 && rate > 0) {
          setFromAmount((to / rate).toFixed(2));
      } else {
          setFromAmount('');
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const finalFromAmount = parseFloat(fromAmount);
    const finalToAmount = parseFloat(toAmount);

    if (!fromAccountId || !toAccountId || isNaN(finalFromAmount) || finalFromAmount <= 0) {
      setError('Please fill all fields with valid values.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('Cannot transfer to the same account.');
      return;
    }
    onTransfer(fromAccountId, toAccountId, finalFromAmount, isCrossCurrency ? finalToAmount : finalFromAmount, notes.trim() || undefined);
  };
  
  const TabButton: React.FC<{ active: boolean, children: React.ReactNode, onClick: () => void}> = ({ active, children, onClick }) => (
    <button type="button" onClick={onClick} className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors w-full ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`}>
      {children}
    </button>
  );

  const accountOptions = accounts.map(account => ({ value: account.id, label: `${account.name} (${account.currency})` }));

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider opacity-0 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Transfer Funds" onClose={onClose} />
        <div className="p-6">
          {error && <p className="text-rose-400 text-sm mb-4 text-center animate-pulse">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div><label className={labelStyle}>From</label><CustomSelect value={fromAccountId} onChange={setFromAccountId} options={accountOptions}/></div>
              <div className="mt-5 text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
              <div><label className={labelStyle}>To</label><CustomSelect value={toAccountId} onChange={setToAccountId} options={accountOptions}/></div>
            </div>
            
            {isCrossCurrency && (
                <div className="p-3 bg-subtle rounded-lg space-y-3 animate-fadeInUp">
                    <div className="flex items-center gap-2 bg-subtle p-1 rounded-full border border-divider">
                        <TabButton active={rateMode === 'auto'} onClick={() => setRateMode('auto')}>Auto Rate</TabButton>
                        <TabButton active={rateMode === 'manual'} onClick={() => setRateMode('manual')}>Manual Rate</TabButton>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-secondary flex-shrink-0">1 {fromAccount?.currency} =</span>
                        <input type="text" inputMode="decimal" value={rate.toFixed(4)} onChange={e => setRate(parseFloat(e.target.value) || 0)} readOnly={rateMode === 'auto'} className="input-base w-full rounded-lg py-1 px-2 text-center font-semibold"/>
                        <span className="text-sm text-secondary flex-shrink-0">{toAccount?.currency}</span>
                        {rateMode === 'auto' && <button type="button" onClick={fetchRate} className={`p-2 rounded-full hover-bg-stronger ${isRateLoading ? 'animate-spin' : ''}`} disabled={isRateLoading}>🔄</button>}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div><label className={labelStyle}>You Send ({fromAccount?.currency})</label><input type="text" inputMode="decimal" value={fromAmount} onChange={e => handleFromAmountChange(e.target.value)} placeholder="0.00" className="input-base w-full rounded-full py-2 px-3 no-spinner" autoFocus /></div>
                 <div><label className={labelStyle}>They Receive ({toAccount?.currency})</label><input type="text" inputMode="decimal" value={toAmount} onChange={e => handleToAmountChange(e.target.value)} placeholder="0.00" className="input-base w-full rounded-full py-2 px-3 no-spinner" readOnly={!isCrossCurrency && rateMode === 'auto'} /></div>
            </div>
            <div>
              <label htmlFor="notes" className={labelStyle}>Notes (Optional)</label>
              <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="input-base w-full rounded-lg py-2 px-3 resize-none"/>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
              <button type="submit" className="button-primary px-4 py-2">Transfer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default TransferModal;