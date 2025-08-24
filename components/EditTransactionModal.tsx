import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, TransactionType, Account, Category, Payee, SplitDetail, Contact, ModalState } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import CustomCheckbox from './CustomCheckbox';

const modalRoot = document.getElementById('modal-root')!;

interface EditTransactionModalProps {
  transaction?: Transaction;
  onSave: (data: Transaction | { 
    action: 'split-and-replace';
    originalTransactionId: string;
    newTransactions: Omit<Transaction, 'id'>[];
  }) => void;
  onCancel: () => void;
  accounts: Account[];
  openModal: (name: ModalState['name'], props?: Record<string, any>) => void;
  selectedAccountId?: string;
  onLaunchRefundPicker?: () => void;
  onOpenCalculator: (onResult: (result: number) => void) => void;
  isEmbedded?: boolean;
}

const inputBaseClasses = "w-full rounded-lg py-2 px-3 shadow-inner transition-all duration-200 input-base";
const labelBaseClasses = "block text-sm font-medium text-secondary mb-1";

type SplitMode = 'equally' | 'percentage' | 'shares' | 'manual';

interface Item {
    id: string; // client-side UUID
    description: string;
    amount: string;
    categoryId: string;
    parentId: string | null;
    splitMode: SplitMode;
    splitDetails: SplitDetail[];
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, onSave, onCancel, accounts, openModal, selectedAccountId, onLaunchRefundPicker, onOpenCalculator, isEmbedded = false }) => {
  const { categories, payees, setPayees, contacts, contactGroups } = useContext(SettingsContext);
  const isCreating = !transaction;

  const defaultTransaction = useMemo(() => ({
    id: '',
    accountId: selectedAccountId || accounts[0]?.id || '',
    description: '',
    amount: 0,
    type: TransactionType.EXPENSE,
    categoryId: '',
    date: new Date().toISOString(),
    notes: '',
    splitDetails: [],
  }), [selectedAccountId, accounts]);


  const [formData, setFormData] = useState<Transaction>(transaction || defaultTransaction);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const formatCurrency = useCurrencyFormatter({currencyDisplay: 'narrowSymbol'});
  
  const [isItemized, setIsItemized] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [splittingItemId, setSplittingItemId] = useState<string | null>(null);
  const [showContactPicker, setShowContactPicker] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (transaction) {
      setFormData(transaction);
      const initialCategory = categories.find(c => c.id === transaction.categoryId);
      setSelectedParentId(initialCategory?.parentId || (initialCategory ? initialCategory.id : null));
    }
  }, [transaction, categories]);
  
  useEffect(() => {
    if (isItemized && items.length === 0) {
      const initialCategory = categories.find(c => c.id === formData.categoryId);
      const youSplit: SplitDetail = { 
        id: 'you', 
        personName: 'You', 
        amount: formData.amount, 
        isSettled: true,
        shares: '1',
        percentage: '100'
      };
      setItems([{
        id: self.crypto.randomUUID(),
        description: formData.description,
        amount: String(formData.amount),
        categoryId: formData.categoryId,
        parentId: initialCategory?.parentId || null,
        splitMode: 'equally',
        splitDetails: formData.splitDetails && formData.splitDetails.length > 0 ? formData.splitDetails : [youSplit]
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isItemized, formData]);

  const calculateSplits = useCallback((participants: SplitDetail[], totalAmount: number, mode: SplitMode): SplitDetail[] => {
    let newParticipants = [...participants];
    const numParticipants = newParticipants.length;
    if (numParticipants === 0) return [];

    switch (mode) {
        case 'equally':
            const splitAmount = totalAmount / numParticipants;
            newParticipants = newParticipants.map(p => ({ ...p, amount: splitAmount }));
            break;
        case 'percentage':
            let totalPercentage = newParticipants.reduce((sum, p) => sum + (parseFloat(p.percentage || '0') || 0), 0);
            if (totalPercentage === 0) totalPercentage = 100; // Avoid division by zero
            newParticipants = newParticipants.map(p => {
                const percentage = parseFloat(p.percentage || '0') || 0;
                return { ...p, amount: (percentage / totalPercentage) * totalAmount };
            });
            break;
        case 'shares':
            let totalShares = newParticipants.reduce((sum, p) => sum + (parseFloat(p.shares || '0') || 0), 0);
            if (totalShares === 0) totalShares = numParticipants; // Avoid division by zero
            newParticipants = newParticipants.map(p => {
                const shares = parseFloat(p.shares || '0') || 0;
                return { ...p, amount: (shares / totalShares) * totalAmount };
            });
            break;
        case 'manual':
            const zeroAmountParticipants = newParticipants.filter(p => p.amount === 0);
            if (zeroAmountParticipants.length === 1) {
                const nonZeroParticipants = newParticipants.filter(p => p.amount !== 0);
                const sumOfNonZero = nonZeroParticipants.reduce((sum, p) => sum + p.amount, 0);
                
                if (!isNaN(sumOfNonZero) && sumOfNonZero < totalAmount) {
                    const remainder = totalAmount - sumOfNonZero;
                    const participantToFill = zeroAmountParticipants[0];
                    const index = newParticipants.findIndex(p => p.id === participantToFill.id);
                    if (index !== -1) {
                        newParticipants = [
                            ...newParticipants.slice(0, index),
                            { ...newParticipants[index], amount: remainder },
                            ...newParticipants.slice(index + 1),
                        ];
                    }
                }
            }
            break;
    }
    return newParticipants;
  }, []);

  const handleChange = (name: keyof Transaction, value: any) => {
    let newFormData = { ...formData, [name]: value };
    if (name === 'type') {
        setSelectedParentId(null);
        newFormData.categoryId = '';
    }
    setFormData(newFormData);
  };
  
  const handleParentCategoryChange = (parentId: string) => {
      setSelectedParentId(parentId);
      const subCategories = categories.filter(c => c.parentId === parentId);
      setFormData(prev => ({ ...prev, categoryId: subCategories.length > 0 ? '' : parentId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isItemized) {
        const newTransactions = items.map(item => ({
            accountId: formData.accountId,
            description: item.description,
            amount: parseFloat(item.amount) || 0,
            type: TransactionType.EXPENSE,
            categoryId: item.categoryId || item.parentId!,
            date: formData.date,
            notes: formData.notes,
            payeeIdentifier: formData.payeeIdentifier,
            senderId: formData.senderId,
            splitDetails: item.splitDetails,
        }));

        onSave({
            action: 'split-and-replace',
            originalTransactionId: formData.id,
            newTransactions: newTransactions.filter(t => (t.amount > 0 || (t.amount === 0 && t.description.trim() !== ''))),
        });
    } else {
        onSave(formData);
    }
  };
  
  const handleSavePayee = () => {
      if (!formData.payeeIdentifier) return;
      const newPayee: Payee = {
          id: self.crypto.randomUUID(),
          identifier: formData.payeeIdentifier,
          name: formData.description,
          defaultCategoryId: formData.categoryId,
      };
      setPayees(prev => [...prev, newPayee]);
  };

  // Item management
  const handleItemChange = (itemId: string, field: keyof Item, value: any) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        let updatedItem = { ...item, [field]: value };
        if (field === 'amount' || field === 'splitMode') {
            const totalAmount = parseFloat(updatedItem.amount) || 0;
            updatedItem.splitDetails = calculateSplits(updatedItem.splitDetails, totalAmount, updatedItem.splitMode);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, {
      id: self.crypto.randomUUID(),
      description: '',
      amount: '0',
      categoryId: '',
      parentId: null,
      splitMode: 'equally',
      splitDetails: []
    }]);
  };
  
  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const handleAddParticipants = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newParticipants: SplitDetail[] = [];
    selectedContacts.forEach(contactId => {
        if (!item.splitDetails.some(p => p.id === contactId)) {
            const contact = contacts.find(c => c.id === contactId);
            if (contact) {
                newParticipants.push({
                    id: contact.id,
                    personName: contact.name,
                    amount: 0,
                    isSettled: false,
                    shares: '1',
                    percentage: '0',
                });
            }
        }
    });
    
    const updatedParticipants = [...item.splitDetails, ...newParticipants];
    const totalAmount = parseFloat(item.amount) || 0;

    setItems(prev => prev.map(i => i.id === itemId ? {
        ...i,
        splitDetails: calculateSplits(updatedParticipants, totalAmount, i.splitMode)
    } : i));

    setShowContactPicker(null);
    setSelectedContacts(new Set());
  };

  const handleRemoveParticipant = (itemId: string, personId: string) => {
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      const updatedParticipants = item.splitDetails.filter(p => p.id !== personId);
      const totalAmount = parseFloat(item.amount) || 0;

      setItems(prev => prev.map(i => i.id === itemId ? {
        ...i,
        splitDetails: calculateSplits(updatedParticipants, totalAmount, i.splitMode)
      } : i));
  };

  const handleIncludeMe = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.splitDetails.some(p => p.id === 'you')) return;

    const youParticipant: SplitDetail = {
      id: 'you',
      personName: 'You',
      amount: 0, // will be recalculated
      isSettled: true,
      shares: '1',
      percentage: '0',
    };
    
    let updatedParticipants = [...item.splitDetails, youParticipant];
     // Sort to keep "You" at the top
    updatedParticipants.sort((a, b) => {
        if (a.id === 'you') return -1;
        if (b.id === 'you') return 1;
        return a.personName.localeCompare(b.personName);
    });

    const totalAmount = parseFloat(item.amount) || 0;
    
    setItems(prev => prev.map(i => i.id === itemId ? {
        ...i,
        splitDetails: calculateSplits(updatedParticipants, totalAmount, i.splitMode)
    } : i));
  };
  
  const handleSplitDetailChange = (itemId: string, personId: string, field: 'percentage' | 'shares' | 'amount', value: string) => {
     const item = items.find(i => i.id === itemId);
     if(!item) return;

     let newDetails = item.splitDetails.map(p => p.id === personId ? {...p, [field]: value} : p);
     
     if (item.splitMode === 'manual') {
         newDetails = newDetails.map(p => p.id === personId ? {...p, amount: parseFloat(value) || 0} : p);
     }
     
     const totalAmount = parseFloat(item.amount) || 0;
     setItems(prev => prev.map(i => i.id === itemId ? {...i, splitDetails: calculateSplits(newDetails, totalAmount, i.splitMode) } : i));
  }

  const handleShareChange = (itemId: string, personId: string, delta: number) => {
     const item = items.find(i => i.id === itemId);
     if(!item) return;
     const person = item.splitDetails.find(p => p.id === personId);
     if (!person) return;
     const currentShares = parseFloat(person.shares || '1') || 1;
     const newShares = Math.max(0.5, currentShares + delta); // Set a minimum share
     handleSplitDetailChange(itemId, personId, 'shares', String(newShares));
  }
   const handlePercentageChange = (itemId: string, personId: string, delta: number) => {
     const item = items.find(i => i.id === itemId);
     if(!item) return;
     const person = item.splitDetails.find(p => p.id === personId);
     if (!person) return;
     const currentPercentage = parseFloat(person.percentage || '0') || 0;
     const newPercentage = Math.max(0, currentPercentage + delta);
     handleSplitDetailChange(itemId, personId, 'percentage', String(newPercentage));
  }


  const isPayeeSaved = useMemo(() => {
    if (!formData.payeeIdentifier) return true;
    return payees.some(p => p.identifier.toLowerCase() === formData.payeeIdentifier?.toLowerCase());
  }, [payees, formData.payeeIdentifier]);
  
  const parentCategories = useMemo(() => categories.filter(c => c.type === formData.type && !c.parentId), [categories, formData.type]);
  const subCategories = useMemo(() => selectedParentId ? categories.filter(c => c.parentId === selectedParentId) : [], [categories, selectedParentId]);
  
  const itemsTotal = useMemo(() => items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0), [items]);
  const isSaveDisabled = isItemized && Math.abs(itemsTotal - formData.amount) > 0.01;

  const renderSplitManager = (item: Item) => {
    const totalAssigned = item.splitDetails.reduce((sum, p) => sum + p.amount, 0);
    const itemAmount = parseFloat(item.amount) || 0;
    const remainder = itemAmount - totalAssigned;
    const youIsIncluded = item.splitDetails.some(p => p.id === 'you');

    const TabButton = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void}) => (
        <button type="button" onClick={onClick} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors flex-grow ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`}>
        {children}
        </button>
    );

    return (
        <div className="p-4 bg-subtle rounded-lg space-y-4 border border-divider shadow-lg animate-slideFadeIn">
            <div className="flex items-center gap-2 p-1 rounded-full bg-subtle border border-divider">
                <TabButton active={item.splitMode === 'equally'} onClick={() => handleItemChange(item.id, 'splitMode', 'equally')}>Equally</TabButton>
                <TabButton active={item.splitMode === 'percentage'} onClick={() => handleItemChange(item.id, 'splitMode', 'percentage')}>%</TabButton>
                <TabButton active={item.splitMode === 'shares'} onClick={() => handleItemChange(item.id, 'splitMode', 'shares')}>Shares</TabButton>
                <TabButton active={item.splitMode === 'manual'} onClick={() => handleItemChange(item.id, 'splitMode', 'manual')}>Manual</TabButton>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {item.splitDetails.map(p => (
                    <div key={p.id} className="flex items-center gap-2 p-1.5 bg-subtle rounded-lg">
                        <span className="font-semibold flex-grow truncate text-sm pl-1 text-primary">{p.personName}</span>
                        
                        {item.splitMode === 'percentage' && (
                            <div className="flex items-center gap-1">
                                <button type="button" onClick={() => handlePercentageChange(item.id, p.id, -5)} className="control-button control-button-minus">-</button>
                                <div className="relative w-16">
                                    <input type="number" value={p.percentage || ''} onChange={e => handleSplitDetailChange(item.id, p.id, 'percentage', e.target.value)} className="w-full text-center bg-transparent no-spinner px-1 text-primary" />
                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-tertiary text-xs">%</span>
                                </div>
                                <button type="button" onClick={() => handlePercentageChange(item.id, p.id, 5)} className="control-button control-button-plus">+</button>
                            </div>
                        )}
                        {item.splitMode === 'shares' && (
                             <div className="flex items-center gap-1">
                                <button type="button" onClick={() => handleShareChange(item.id, p.id, -0.5)} className="control-button control-button-minus">-</button>
                                <input type="number" step="0.5" value={p.shares || ''} onChange={e => handleSplitDetailChange(item.id, p.id, 'shares', e.target.value)} className="w-12 text-center bg-transparent no-spinner text-primary" />
                                <button type="button" onClick={() => handleShareChange(item.id, p.id, 0.5)} className="control-button control-button-plus">+</button>
                            </div>
                        )}

                        {item.splitMode === 'manual' ?
                            <input type="number" min="0" step="0.01" value={p.amount || ''} onChange={e => handleSplitDetailChange(item.id, p.id, 'amount', e.target.value)} placeholder={formatCurrency(0)} className="w-24 p-1 rounded-md text-right no-spinner input-base" />
                            :
                            <span className="w-24 text-right font-mono text-sm text-primary">{formatCurrency(p.amount)}</span>
                        }
                        <button type="button" onClick={() => handleRemoveParticipant(item.id, p.id)} className="text-rose-400 text-xl leading-none px-1 flex-shrink-0">&times;</button>
                    </div>
                ))}
                 {!youIsIncluded && (
                    <div className="text-center pt-1">
                        <button type="button" onClick={() => handleIncludeMe(item.id)} className="text-xs text-sky-400 hover:text-sky-300 font-semibold">
                            + Include Me
                        </button>
                    </div>
                )}
            </div>
            
             <div className="relative">
                <button type="button" onClick={() => setShowContactPicker(showContactPicker === item.id ? null : item.id)} className="w-full text-left p-1.5 rounded-full border border-divider hover-bg-stronger text-xs text-center" style={{ color: 'var(--color-accent-sky)' }}>
                    + Add Person...
                </button>
                {showContactPicker === item.id && (
                    <div className="absolute bottom-full mb-1 w-full z-20 glass-card rounded-lg shadow-lg max-h-40 flex flex-col">
                        <div className="overflow-y-auto p-1">
                            {contactGroups.map(group => (
                                <div key={group.id}>
                                    <h4 className="text-xs font-bold text-secondary p-2 bg-subtle sticky top-0">{group.name}</h4>
                                    {contacts.filter(c => c.groupId === group.id).map(contact => (
                                        <div key={contact.id} className="px-2 py-1">
                                            <CustomCheckbox
                                              id={`contact-${contact.id}-${item.id}`}
                                              label={contact.name}
                                              checked={selectedContacts.has(contact.id)}
                                              onChange={() => {
                                                setSelectedContacts(prev => {
                                                  const newSet = new Set(prev);
                                                  if (newSet.has(contact.id)) newSet.delete(contact.id);
                                                  else newSet.add(contact.id);
                                                  return newSet;
                                                });
                                              }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                         <button type="button" onClick={() => handleAddParticipants(item.id)} className="w-full text-center p-2 text-sm text-white rounded-b-lg sticky bottom-0" style={{ backgroundColor: 'var(--color-accent-emerald)' }}>Add Selected</button>
                    </div>
                )}
            </div>
            <div className="text-xs text-secondary text-right">
                Remaining: <span className={`font-mono ${Math.abs(remainder) > 0.01 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(remainder)}</span>
            </div>
        </div>
    );
  }

  const renderItem = (item: Item) => {
    const itemSubCategories = item.parentId ? categories.filter(c => c.parentId === item.parentId) : [];
    
    return (
        <div key={item.id} className="p-3 bg-subtle rounded-lg space-y-3 border border-divider">
            <div className="flex items-start gap-2">
                <div className="flex-grow space-y-2">
                    <input type="text" placeholder="Item Description" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className={inputBaseClasses} />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <input type="number" min="0" step="0.01" placeholder="Amount" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} className={`${inputBaseClasses} no-spinner pr-8`} />
                            <button type="button" onClick={() => onOpenCalculator(result => handleItemChange(item.id, 'amount', String(result)))} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zM6 7a1 1 0 011-1h2a1 1 0 110 2H7a1 1 0 01-1-1zm0 4a1 1 0 011-1h5a1 1 0 110 2H7a1 1 0 01-1-1zm-2 4a1 1 0 000 2h8a1 1 0 100-2H4z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        <div>
                             <CustomSelect value={item.parentId || ''} onChange={val => {
                                 const subCats = categories.filter(c => c.parentId === val);
                                 handleItemChange(item.id, 'parentId', val);
                                 handleItemChange(item.id, 'categoryId', subCats.length > 0 ? '' : val);
                             }} options={parentCategories.map(cat => ({ value: cat.id, label: `${cat.icon} ${cat.name}` }))} placeholder="Category"/>
                        </div>
                    </div>
                    {item.parentId && itemSubCategories.length > 0 && <CustomSelect value={item.categoryId} onChange={val => handleItemChange(item.id, 'categoryId', val)} options={itemSubCategories.map(cat => ({ value: cat.id, label: `${cat.icon} ${cat.name}` }))} placeholder="Subcategory" defaultValue={item.parentId || ''} />}
                </div>
                <div className="flex flex-col space-y-1">
                     <button type="button" onClick={() => setSplittingItemId(splittingItemId === item.id ? null : item.id)} className={`px-2 py-1 text-xs rounded-full font-semibold transition-colors ${splittingItemId === item.id ? 'bg-sky-500 text-white' : 'button-secondary'}`}>Manage Split</button>
                     {items.length > 1 && <button type="button" onClick={() => handleRemoveItem(item.id)} className="px-2 py-1 text-xs rounded-full font-semibold text-white" style={{ backgroundColor: 'var(--color-accent-rose)'}}>Remove</button>}
                </div>
            </div>
            {splittingItemId === item.id && renderSplitManager(item)}
        </div>
    );
  };
  
  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 overflow-y-auto flex-grow">
       {/* Row 1: Account & Date */}
       <div className="grid grid-cols-2 gap-4">
           <div>
            <label className={labelBaseClasses}>Account</label>
            <CustomSelect value={formData.accountId} onChange={(value) => handleChange('accountId', value)} options={accounts.map(account => ({ value: account.id, label: account.name }))}/>
          </div>
          <div>
            <label className={labelBaseClasses}>Date</label>
            <CustomDatePicker value={new Date(formData.date)} onChange={(date) => handleChange('date', date.toISOString())}/>
          </div>
       </div>
       
       {/* Main form switch */}
       {!isItemized ? (
        <div className='space-y-4 animate-fadeInUp'>
            {/* Row 2: Amount & Type */}
            <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label htmlFor="amount" className={labelBaseClasses}>Amount ({formatCurrency(0).replace(/[\d\s.,]/g, '')})</label>
                    <div className="relative">
                        <input type="number" id="amount" name="amount" value={formData.amount} onChange={(e) => handleChange('amount', parseFloat(e.target.value))} step="0.01" min="0.01" className={`${inputBaseClasses} pr-8`} autoFocus/>
                        <button type="button" onClick={() => onOpenCalculator(result => handleChange('amount', result))} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zM6 7a1 1 0 011-1h2a1 1 0 110 2H7a1 1 0 01-1-1zm0 4a1 1 0 011-1h5a1 1 0 110 2H7a1 1 0 01-1-1zm-2 4a1 1 0 000 2h8a1 1 0 100-2H4z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                    </div>
                    <div>
                        <label className={labelBaseClasses}>Type</label>
                        <CustomSelect value={formData.type} onChange={(value) => handleChange('type', value as TransactionType)} options={[{ value: TransactionType.EXPENSE, label: 'Expense' }, { value: TransactionType.INCOME, label: 'Income' }]}/>
                    </div>
            </div>
            {/* Row 3: Category & Subcategory */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className={labelBaseClasses}>Category</label>
                <CustomSelect value={selectedParentId || ''} onChange={handleParentCategoryChange} options={parentCategories.map(cat => ({ value: cat.id, label: `${cat.icon} ${cat.name}` }))} placeholder="Select Category"/>
                </div>
                <div>
                <label className={labelBaseClasses}>Subcategory</label>
                <CustomSelect value={formData.categoryId} onChange={(value) => handleChange('categoryId', value)} options={subCategories.map(cat => ({ value: cat.id, label: `${cat.icon} ${cat.name}` }))} placeholder="-" disabled={subCategories.length === 0} defaultValue={selectedParentId || ''}/>
                </div>
            </div>
            {/* Row 4: Description */}
            <div>
                <label htmlFor="description" className={labelBaseClasses}>Description</label>
                <input type="text" id="description" name="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} className={inputBaseClasses}/>
            </div>
        </div>
       ) : (
         <div className="space-y-4 animate-fadeInUp">
            <div>
                <label className={labelBaseClasses}>Total Amount</label>
                <input type="number" value={formData.amount} readOnly className={`${inputBaseClasses} opacity-70 cursor-not-allowed`} />
            </div>
         </div>
       )}

      {formData.payeeIdentifier && (
          <div className="p-2 bg-subtle rounded-lg flex items-center justify-between text-sm">
              <span className="text-secondary">Identifier: <code className="text-primary">{formData.payeeIdentifier}</code></span>
              <button type="button" onClick={handleSavePayee} disabled={isPayeeSaved} className="text-xs px-2 py-1 rounded-full hover:bg-emerald-600 disabled:cursor-not-allowed" style={{ backgroundColor: isPayeeSaved ? 'var(--color-bg-button-secondary)' : 'rgba(16, 185, 129, 0.5)', color: isPayeeSaved ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)'}}>
                  {isPayeeSaved ? 'Saved' : 'Save Payee'}
              </button>
          </div>
      )}
      <div>
        <label htmlFor="notes" className={labelBaseClasses}>Notes (Optional)</label>
        <textarea id="notes" name="notes" value={formData.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} rows={2} className={`${inputBaseClasses} resize-none`}/>
      </div>
      {/* Itemized Split Section */}
      {formData.type === TransactionType.EXPENSE && (
          <div className="pt-4 border-t border-divider">
            <div className="flex items-center justify-between">
                <label htmlFor="isItemized" className="font-medium text-primary">Itemize & Split Transaction</label>
                <button type="button" onClick={() => setIsItemized(!isItemized)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isItemized ? 'bg-emerald-500' : 'bg-subtle'}`}>
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isItemized ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            {isItemized && (
                <div className="mt-4 space-y-3 p-3 rounded-lg animate-fadeInUp modal-content-area">
                   <div className="space-y-2">{items.map(item => renderItem(item))}</div>
                   <button type="button" onClick={handleAddItem} className="w-full text-center p-2 mt-2 text-sm bg-subtle rounded-full border border-dashed border-divider hover-bg-stronger" style={{ color: 'var(--color-accent-sky)' }}>
                       + Add Item
                   </button>
                    {/* Summary */}
                    <div className="text-xs space-y-1 pt-2 border-t border-divider">
                         <div className="flex justify-between"><span className="text-secondary">Total of Items:</span> <span className={`font-mono ${isSaveDisabled ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(itemsTotal)}</span></div>
                         <div className="flex justify-between"><span className="text-secondary">Remaining:</span> <span className="font-mono text-primary">{formatCurrency(formData.amount - itemsTotal)}</span></div>
                         {isSaveDisabled && <p className="text-center text-xs pt-1" style={{color: 'var(--color-accent-rose)'}}>Total of items must match the transaction amount.</p>}
                    </div>
                </div>
            )}
          </div>
      )}
      <div className="flex justify-between items-center pt-4 border-t border-divider mt-4">
        <div>
          {isCreating && onLaunchRefundPicker ? (
            <button type="button" onClick={onLaunchRefundPicker} className="button-secondary px-4 py-2 text-sm" style={{borderColor: 'var(--color-accent-sky)', color: 'var(--color-accent-sky)'}}>
              Find Expense to Refund
            </button>
          ) : (
            formData.type === TransactionType.EXPENSE && (
              <button type="button" onClick={() => openModal('refund', { transaction: formData })} className="button-secondary px-4 py-2 text-sm" style={{borderColor: 'var(--color-accent-sky)', color: 'var(--color-accent-sky)'}}>
                Process a Refund
              </button>
            )
          )}
        </div>
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="button-secondary px-4 py-2">Cancel</button>
          <button type="submit" disabled={(!formData.categoryId && !isItemized) || isSaveDisabled} className="button-primary px-4 py-2">Save Changes</button>
        </div>
      </div>
    </form>
  );

  if (isEmbedded) {
    return formBody;
  }
  
  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel} aria-modal="true" role="dialog">
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg border border-divider opacity-0 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <ModalHeader title={isCreating ? "Add Transaction" : "Edit Transaction"} onClose={onCancel} />
        {formBody}
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default EditTransactionModal;