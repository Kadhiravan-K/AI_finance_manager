import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Transaction, TransactionType, Account, Category, Payee, SplitDetail, Contact } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

interface EditTransactionModalProps {
  transaction: Transaction;
  onSave: (data: Transaction | { 
    action: 'split-and-replace';
    originalTransactionId: string;
    newTransactions: Omit<Transaction, 'id'>[];
  }) => void;
  onCancel: () => void;
  accounts: Account[];
}

const inputStyle = "w-full bg-slate-700/80 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner shadow-slate-900/50 transition-all duration-200";
const labelStyle = "block text-sm font-medium text-slate-400 mb-1";
const primaryButtonStyle = "px-4 py-2 rounded-lg text-white font-semibold bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-200 transform active:scale-[0.98] disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed";
const secondaryButtonStyle = "px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600/80 transition-colors";

type SplitMode = 'equally' | 'percentage' | 'shares' | 'manual';

interface Participant {
  id: string;
  contactId: string; // From the main contacts list
  name: string;
  amount: number;
  percentage: string;
  shares: string;
}

interface Item {
    id: string; // client-side UUID
    description: string;
    amount: string;
    categoryId: string;
    parentId: string | null;
    splitDetails: SplitDetail[];
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, onSave, onCancel, accounts }) => {
  const { categories, payees, setPayees, contacts, contactGroups } = useContext(SettingsContext);
  const [formData, setFormData] = useState<Transaction>(transaction);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const formatCurrency = useCurrencyFormatter({currencyDisplay: 'narrowSymbol'});
  
  // Itemized Splitting state
  const [isItemized, setIsItemized] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [splittingItemId, setSplittingItemId] = useState<string | null>(null);
  const [showContactPicker, setShowContactPicker] = useState<string | null>(null); // holds item id

  useEffect(() => {
    setFormData(transaction);
    const initialCategory = categories.find(c => c.id === transaction.categoryId);
    setSelectedParentId(initialCategory?.parentId || (initialCategory ? initialCategory.id : null));
  }, [transaction, categories]);
  
  // Initialize items when itemization is turned on
  useEffect(() => {
    if (isItemized && items.length === 0) {
      const initialCategory = categories.find(c => c.id === transaction.categoryId);
      setItems([{
        id: self.crypto.randomUUID(),
        description: transaction.description,
        amount: String(transaction.amount),
        categoryId: transaction.categoryId,
        parentId: initialCategory?.parentId || null,
        splitDetails: transaction.splitDetails || [{ id: 'you', personName: 'You', amount: transaction.amount, isSettled: true }]
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isItemized, transaction]);


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
            categoryId: item.categoryId,
            date: formData.date,
            notes: formData.notes,
            payeeIdentifier: formData.payeeIdentifier,
            senderId: formData.senderId,
            splitDetails: item.splitDetails,
        }));

        onSave({
            action: 'split-and-replace',
            originalTransactionId: transaction.id,
            newTransactions: newTransactions.filter(t => t.amount > 0), // Don't save zero-amount items
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
    setItems(prevItems => prevItems.map(item => (item.id === itemId ? { ...item, [field]: value } : item)));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, {
      id: self.crypto.randomUUID(),
      description: '',
      amount: '0',
      categoryId: '',
      parentId: null,
      splitDetails: []
    }]);
  };
  
  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  // Per-item split management
  const handleAddParticipant = (itemId: string, contact: Contact) => {
      setItems(prev => prev.map(item => {
          if (item.id === itemId && !item.splitDetails.some(p => p.personName === contact.name)) {
              return { ...item, splitDetails: [...item.splitDetails, { id: contact.id, personName: contact.name, amount: 0, isSettled: false }] };
          }
          return item;
      }));
      setShowContactPicker(null);
  };

  const handleRemoveParticipant = (itemId: string, personName: string) => {
      setItems(prev => prev.map(item => {
          if (item.id === itemId) {
              return { ...item, splitDetails: item.splitDetails.filter(p => p.personName !== personName) };
          }
          return item;
      }));
  };

  const isPayeeSaved = useMemo(() => {
    if (!formData.payeeIdentifier) return true;
    return payees.some(p => p.identifier.toLowerCase() === formData.payeeIdentifier?.toLowerCase());
  }, [payees, formData.payeeIdentifier]);
  
  const parentCategories = useMemo(() => categories.filter(c => c.type === formData.type && !c.parentId), [categories, formData.type]);
  const subCategories = useMemo(() => selectedParentId ? categories.filter(c => c.parentId === selectedParentId) : [], [categories, selectedParentId]);
  
  const itemsTotal = useMemo(() => items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0), [items]);
  const isSaveDisabled = isItemized && Math.abs(itemsTotal - formData.amount) > 0.01;

  const renderItem = (item: Item) => {
    const itemSubCategories = item.parentId ? categories.filter(c => c.parentId === item.parentId) : [];
    
    return (
        <div key={item.id} className="p-3 bg-slate-900/40 rounded-lg space-y-3 border border-slate-700/50">
            <div className="flex items-start gap-2">
                <div className="flex-grow space-y-2">
                    <input type="text" placeholder="Item Description" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className={inputStyle} />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="Amount" value={item.amount} onChange={e => handleItemChange(item.id, 'amount', e.target.value)} className={inputStyle} />
                        <div>
                             <CustomSelect value={item.parentId || ''} onChange={val => handleItemChange(item.id, 'parentId', val)} options={parentCategories.map(cat => ({ value: cat.id, label: `${cat.icon} ${cat.name}` }))} placeholder="Category"/>
                        </div>
                    </div>
                    {item.parentId && <CustomSelect value={item.categoryId} onChange={val => handleItemChange(item.id, 'categoryId', val)} options={itemSubCategories.map(cat => ({ value: cat.id, label: `${cat.icon} ${cat.name}` }))} placeholder="Subcategory" defaultValue={item.parentId || ''} />}
                </div>
                <div className="flex flex-col space-y-1">
                     <button type="button" onClick={() => setSplittingItemId(splittingItemId === item.id ? null : item.id)} className={`px-2 py-1 text-xs rounded-md font-semibold transition-colors ${splittingItemId === item.id ? 'bg-sky-500' : 'bg-slate-600'}`}>Manage Split</button>
                     {items.length > 1 && <button type="button" onClick={() => handleRemoveItem(item.id)} className="px-2 py-1 text-xs rounded-md bg-rose-600/80 font-semibold">Remove</button>}
                </div>
            </div>
            {splittingItemId === item.id && (
                <div className="p-2 bg-slate-800/50 rounded-md space-y-2 animate-fadeInUp">
                    {/* Simplified split view for now */}
                    <p className="text-xs text-slate-400">Splitting: {formatCurrency(parseFloat(item.amount) || 0)}</p>
                    {item.splitDetails.map(sd => (
                        <div key={sd.id} className="flex justify-between items-center text-sm">
                            <span>{sd.personName}</span>
                            {sd.personName !== 'You' && <button onClick={() => handleRemoveParticipant(item.id, sd.personName)} className="text-rose-400">&times;</button>}
                        </div>
                    ))}
                     <div className="relative">
                        <button type="button" onClick={() => setShowContactPicker(showContactPicker === item.id ? null : item.id)} className="w-full text-left p-1 bg-slate-700/80 rounded-md border border-slate-600 text-sky-300 hover:bg-slate-700 text-xs">
                            + Add Person...
                        </button>
                        {showContactPicker === item.id && (
                            <div className="absolute bottom-full mb-1 w-full z-10 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                               {contactGroups.map(group => (
                                   <div key={group.id}>
                                        <h4 className="text-xs font-bold text-slate-400 p-2 bg-slate-900/50 sticky top-0">{group.name}</h4>
                                        {contacts.filter(c => c.groupId === group.id).map(contact => (
                                            <button type="button" key={contact.id} onClick={() => handleAddParticipant(item.id, contact)} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-emerald-600/50 text-sm">
                                                {contact.name}
                                            </button>
                                        ))}
                                   </div>
                               ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
  };


  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel} aria-modal="true" role="dialog">
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg border border-slate-700/50 opacity-0 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Edit Transaction" onClose={onCancel} />
        <form onSubmit={handleSubmit} className="space-y-4 p-6 overflow-y-auto">
           {/* Row 1: Account & Date */}
           <div className="grid grid-cols-2 gap-4">
               <div>
                <label className={labelStyle}>Account</label>
                <CustomSelect value={formData.accountId} onChange={(value) => handleChange('accountId', value)} options={accounts.map(account => ({ value: account.id, label: account.name }))}/>
              </div>
              <div>
                <label className={labelStyle}>Date</label>
                <CustomDatePicker value={new Date(formData.date)} onChange={(date) => handleChange('date', date.toISOString())}/>
              </div>
           </div>
           
           {/* Main form switch */}
           {!isItemized ? (
            <div className='space-y-4 animate-fadeInUp'>
                {/* Row 2: Amount & Type */}
                <div className="grid grid-cols-2 gap-4">
                        <div>
                        <label htmlFor="amount" className={labelStyle}>Amount ({formatCurrency(0).replace(/[\d\s.,]/g, '')})</label>
                        <input type="number" id="amount" name="amount" value={formData.amount} onChange={(e) => handleChange('amount', parseFloat(e.target.value))} step="0.01" className={inputStyle}/>
                        </div>
                        <div>
                            <label className={labelStyle}>Type</label>
                            <CustomSelect value={formData.type} onChange={(value) => handleChange('type', value as TransactionType)} options={[{ value: TransactionType.EXPENSE, label: 'Expense' }, { value: TransactionType.INCOME, label: 'Income' }]}/>
                        </div>
                </div>
                {/* Row 3: Category & Subcategory */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className={labelStyle}>Category</label>
                    <CustomSelect value={selectedParentId || ''} onChange={handleParentCategoryChange} options={parentCategories.map(cat => ({ value: cat.id, label: `${cat.icon} ${cat.name}` }))} placeholder="Select Category"/>
                    </div>
                    <div>
                    <label className={labelStyle}>Subcategory</label>
                    <CustomSelect value={formData.categoryId} onChange={(value) => handleChange('categoryId', value)} options={subCategories.map(cat => ({ value: cat.id, label: `${cat.icon} ${cat.name}` }))} placeholder="-" disabled={subCategories.length === 0} defaultValue={selectedParentId || ''}/>
                    </div>
                </div>
                {/* Row 4: Description */}
                <div>
                    <label htmlFor="description" className={labelStyle}>Description</label>
                    <input type="text" id="description" name="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} className={inputStyle}/>
                </div>
            </div>
           ) : (
             <div className="space-y-4 animate-fadeInUp">
                <div>
                    <label className={labelStyle}>Total Amount</label>
                    <input type="number" value={formData.amount} readOnly className={`${inputStyle} opacity-70 cursor-not-allowed`} />
                </div>
             </div>
           )}

          {formData.payeeIdentifier && (
              <div className="p-2 bg-slate-700/50 rounded-lg flex items-center justify-between text-sm">
                  <span className="text-slate-400">Identifier: <code className="text-slate-300">{formData.payeeIdentifier}</code></span>
                  <button type="button" onClick={handleSavePayee} disabled={isPayeeSaved} className="text-xs px-2 py-1 bg-emerald-600/50 text-emerald-200 rounded-md hover:bg-emerald-600 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed">
                      {isPayeeSaved ? 'Saved' : 'Save Payee'}
                  </button>
              </div>
          )}
          <div>
            <label htmlFor="notes" className={labelStyle}>Notes (Optional)</label>
            <textarea id="notes" name="notes" value={formData.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} rows={2} className={`${inputStyle} resize-none`}/>
          </div>
          {/* Itemized Split Section */}
          {formData.type === TransactionType.EXPENSE && (
              <div className="pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                    <label htmlFor="isItemized" className="font-medium text-slate-300">Itemize & Split Transaction</label>
                    <button type="button" onClick={() => setIsItemized(!isItemized)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isItemized ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isItemized ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                {isItemized && (
                    <div className="mt-4 space-y-3 p-3 bg-slate-800/40 rounded-lg animate-fadeInUp">
                       <div className="space-y-2">{items.map(item => renderItem(item))}</div>
                       <button type="button" onClick={handleAddItem} className="w-full text-center p-2 text-sm bg-slate-700/80 rounded-md border border-dashed border-slate-600 text-sky-300 hover:bg-slate-700">
                           + Add Item
                       </button>
                        {/* Summary */}
                        <div className="text-xs space-y-1 pt-2 border-t border-slate-700/50">
                             <div className="flex justify-between"><span className="text-slate-400">Total of Items:</span> <span className={`font-mono ${isSaveDisabled ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(itemsTotal)}</span></div>
                             <div className="flex justify-between"><span className="text-slate-400">Remaining:</span> <span className="font-mono">{formatCurrency(formData.amount - itemsTotal)}</span></div>
                             {isSaveDisabled && <p className="text-rose-400 text-center text-xs pt-1">Total of items must match the transaction amount.</p>}
                        </div>
                    </div>
                )}
              </div>
          )}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700/50 mt-4">
            <button type="button" onClick={onCancel} className={secondaryButtonStyle}>Cancel</button>
            <button type="submit" disabled={!formData.categoryId && !isItemized || isSaveDisabled} className={primaryButtonStyle}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;