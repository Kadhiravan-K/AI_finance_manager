import React, { useState, useMemo, useContext } from 'react';
import ReactDOM from 'react-dom';
import { Account, AccountType, Transaction } from '../types';
import CustomCheckbox from './CustomCheckbox';
import { getCurrencyFormatter } from '../utils/currency';
import ModalHeader from './ModalHeader';
import { AppDataContext, SettingsContext } from '../contexts/SettingsContext';
import CustomSelect from './CustomSelect';
import { currencies } from '../utils/currency';

const modalRoot = document.getElementById('modal-root')!;

interface AccountSelectorModalProps {
  onClose: () => void;
}

const AccountSelectorModal: React.FC<AccountSelectorModalProps> = ({ onClose }) => {
    const { settings } = useContext(SettingsContext);
    const dataContext = useContext(AppDataContext);

    if (!dataContext) return null;

    const { accounts, transactions: allTransactions, selectedAccountIds, setSelectedAccountIds, onAddAccount, onEditAccount, onDeleteAccount } = dataContext;

    const [showAddForm, setShowAddForm] = useState(accounts.length === 0);
    
    const accountBalances = useMemo(() => {
        const balances = new Map<string, { balance: number, currency: string }>();
        accounts.forEach((acc: Account) => balances.set(acc.id, { balance: 0, currency: acc.currency }));
        allTransactions.forEach((t: Transaction) => {
        if (balances.has(t.accountId)) {
            const current = balances.get(t.accountId)!;
            const newBalance = current.balance + (t.type === 'income' ? t.amount : -t.amount);
            balances.set(t.accountId, { ...current, balance: newBalance });
        }
        });
        return balances;
    }, [accounts, allTransactions]);
    
    const totalSelectedBalanceByCurrency = useMemo(() => {
        const totals: Record<string, number> = {};
        selectedAccountIds.forEach((id: string) => {
            const accDetails = accountBalances.get(id);
            if (accDetails) {
                totals[accDetails.currency] = (totals[accDetails.currency] || 0) + accDetails.balance;
            }
        });
        return Object.entries(totals);
    }, [selectedAccountIds, accountBalances]);

    const handleSelectionChange = (accountId: string) => {
        if (accountId === 'all') {
        if (selectedAccountIds.length === accounts.length) {
            setSelectedAccountIds([]); // Deselect all
        } else {
            setSelectedAccountIds(accounts.map((a: Account) => a.id)); // Select all
        }
        } else {
        const newSelection = new Set(selectedAccountIds);
        if (newSelection.has(accountId)) {
            newSelection.delete(accountId);
        } else {
            newSelection.add(accountId);
        }
        setSelectedAccountIds(Array.from(newSelection));
        }
    };
    
    const AccountForm = ({ onCancel }: { onCancel: () => void; }) => {
        const [name, setName] = useState('');
        const [openingBalance, setOpeningBalance] = useState('');
        const [accountType, setAccountType] = useState<AccountType>(AccountType.DEPOSITORY);
        const [creditLimit, setCreditLimit] = useState('');
        const [currency, setCurrency] = useState(settings.currency);

        const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAddAccount(name, accountType, currency, parseFloat(creditLimit) || undefined, parseFloat(openingBalance) || undefined);
            onCancel();
        }
        };
        
        const currencyOptions = useMemo(() => currencies.map(c => ({ value: c.code, label: `${c.code} - ${c.name}`})), []);
        const accountTypeOptions = [ { value: AccountType.DEPOSITORY, label: 'Bank/Cash' }, { value: AccountType.CREDIT, label: 'Credit Card' }, { value: AccountType.INVESTMENT, label: 'Investment' }];

        return (
            <form onSubmit={handleSubmit} className="mb-4 space-y-3 p-3 bg-subtle rounded-lg border border-divider animate-fadeInUp">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Account name" className="w-full input-base p-2 rounded-md" required />
            <div className="grid grid-cols-2 gap-3">
                <CustomSelect value={accountType} onChange={val => setAccountType(val as AccountType)} options={accountTypeOptions} />
                <CustomSelect value={currency} onChange={setCurrency} options={currencyOptions} />
            </div>
            {accountType === AccountType.CREDIT && ( <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="Credit Limit" className="w-full input-base p-2 rounded-md no-spinner"/> )}
            <input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="Opening Balance" className="w-full input-base p-2 rounded-md no-spinner"/>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="button-secondary px-3 py-1 text-sm">Cancel</button>
                <button type="submit" className="button-primary px-3 py-1 text-sm">Save</button>
            </div>
            </form>
        );
    }
    
    const modalContent = (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
                <ModalHeader title="Select Accounts" onClose={onClose} icon="🏦" />
                <div className="p-4 border-b border-divider">
                     <div className="p-2 flex justify-between items-center">
                        <CustomCheckbox
                            id="acc-all-modal"
                            label="All Accounts"
                            checked={accounts.length > 0 && selectedAccountIds.length === accounts.length}
                            onChange={() => handleSelectionChange('all')}
                        />
                        <div className="text-right">
                            <p className="font-semibold text-primary text-sm">Total Selected</p>
                            {totalSelectedBalanceByCurrency.length > 0 ? totalSelectedBalanceByCurrency.map(([currency, balance]) => (
                                <p key={currency} className="text-xs font-mono text-secondary">{getCurrencyFormatter(currency).format(balance as number)}</p>
                            )) : <p className="text-xs font-mono text-secondary">{getCurrencyFormatter(settings.currency).format(0)}</p>}
                        </div>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-2">
                    {accounts.map((account: Account) => {
                        const balanceInfo = accountBalances.get(account.id);
                        const formatCurrency = getCurrencyFormatter(account.currency).format;
                        const isSelected = selectedAccountIds.includes(account.id);
                        return (
                            <div key={account.id} className={`p-2 flex justify-between items-center group hover-bg-stronger rounded-md transition-colors`}>
                                <div className="flex-grow">
                                    <CustomCheckbox
                                        id={`acc-modal-${account.id}`}
                                        label={account.name}
                                        checked={isSelected}
                                        onChange={() => handleSelectionChange(account.id)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <p className="text-sm font-bold text-primary w-24 text-right">{formatCurrency(balanceInfo?.balance || 0)}</p>
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-28">
                                        <button onClick={() => onEditAccount(account)} className="text-xs text-secondary hover:text-primary px-2 py-1 rounded-full transition-colors">Edit</button>
                                        <button onClick={() => onDeleteAccount(account.id)} className="text-xs text-rose-400 hover:brightness-125 px-2 py-1 rounded-full transition-colors">Delete</button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                 <div className="p-4 border-t border-divider">
                    {!showAddForm ? (
                        <button onClick={() => setShowAddForm(true)} className="w-full button-secondary py-2">+ Add Account</button>
                    ) : (
                        <AccountForm onCancel={() => setShowAddForm(false)} />
                    )}
                </div>
            </div>
        </div>
    )

    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AccountSelectorModal;