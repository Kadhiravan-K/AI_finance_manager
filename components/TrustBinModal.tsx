import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  TrustBinItem,
  Transaction,
  RecurringTransaction,
  TripExpense,
  Refund,
  Settlement,
  Goal,
  Note,
  GlossaryEntry,
  Account,
  Category,
  Payee,
  Sender,
  Contact,
  ContactGroup,
  Trip,
  Shop,
  ShopProduct,
  ShopEmployee,
  ShopShift,
  Debt
} from '../types';
import ModalHeader from './ModalHeader';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import CustomCheckbox from './CustomCheckbox';

const modalRoot = document.getElementById('modal-root')!;

interface TrustBinModalProps {
  onClose: () => void;
  trustBinItems: TrustBinItem[];
  onRestore: (itemIds: string[]) => void;
  onPermanentDelete: (itemIds: string[]) => void;
}

const TrustBinModal: React.FC<TrustBinModalProps> = ({ onClose, trustBinItems, onRestore, onPermanentDelete }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef<number | null>(null);
  const formatCurrency = useCurrencyFormatter();
  
  useEffect(() => {
    if (selectedIds.size > 0) {
      setCountdown(3);
      countdownRef.current = window.setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdown(3);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [selectedIds.size]);

  const handleSelect = (itemId: string, isChecked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      // Fix: Ensure trustBinItems is an array before calling map
      setSelectedIds(new Set((Array.isArray(trustBinItems) ? trustBinItems : []).map(item => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleRestoreSelected = () => {
    onRestore(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handlePermanentDeleteSelected = () => {
    onPermanentDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const getItemDescription = (item: TrustBinItem): string => {
    switch (item.itemType) {
      case 'transaction': {
        const tx = item.item as Transaction;
        return `${tx.description} (${formatCurrency(tx.amount)})`;
      }
      case 'recurringTransaction': {
        const rtx = item.item as RecurringTransaction;
        return `${rtx.description} (${formatCurrency(rtx.amount)})`;
      }
      case 'tripExpense': {
        const te = item.item as TripExpense;
        return `${te.description} (${formatCurrency(te.amount)})`;
      }
      case 'refund': {
        const refund = item.item as Refund;
        return `${refund.description} (${formatCurrency(refund.amount)})`;
      }
      case 'settlement': {
        const settlement = item.item as Settlement;
        return `Settlement (${formatCurrency(settlement.amount)})`;
      }
      case 'account':
        return (item.item as Account).name;
      case 'category':
        return (item.item as Category).name;
      case 'payee':
        return (item.item as Payee).name;
      case 'sender':
        return (item.item as Sender).name;
      case 'contact':
        return (item.item as Contact).name;
      case 'contactGroup':
        return (item.item as ContactGroup).name;
      case 'trip':
        return (item.item as Trip).name;
      case 'shop':
        return (item.item as Shop).name;
      case 'shopProduct':
        return (item.item as ShopProduct).name;
      case 'shopEmployee':
        return (item.item as ShopEmployee).name;
      case 'shopShift': {
        const shift = item.item as ShopShift;
        return `Shift from ${new Date(shift.startTime).toLocaleTimeString()} to ${new Date(shift.endTime).toLocaleTimeString()}`;
      }
      case 'goal': {
        const goal = item.item as Goal;
        return `${goal.name} (${formatCurrency(goal.targetAmount)})`;
      }
      case 'note':
        return (item.item as Note).title;
      case 'glossaryEntry':
        return (item.item as GlossaryEntry).term;
      case 'debt':
        return (item.item as Debt).name;
      default:
        const anyItem = item.item as any;
        return anyItem.name || anyItem.description || anyItem.title || anyItem.term || 'Untitled Item';
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const hours = Math.floor(seconds / 3600);
    if (hours >= 48) return 'Expired';
    if (hours > 0) return `${48 - hours}h left`;
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };
  
  // Fix: Ensure trustBinItems is an array before accessing length
  const allSelected = Array.isArray(trustBinItems) && trustBinItems.length > 0 && selectedIds.size === trustBinItems.length;
  
  const groupedItems = useMemo(() => {
    // Fix: Ensure trustBinItems is an array before calling reduce
    return (Array.isArray(trustBinItems) ? trustBinItems : []).reduce((acc, item) => {
        const type = item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1) + 's';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(item);
        return acc;
    }, {} as Record<string, TrustBinItem[]>);
  }, [trustBinItems]);

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Trust Bin" onClose={onClose} icon="🗑️" />

        <div className="p-4 border-b border-divider flex items-center justify-between">
            <CustomCheckbox
                id="select-all-bin"
                label="Select All"
                checked={allSelected}
                onChange={handleSelectAll}
            />
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {Object.keys(groupedItems).length === 0 ? (
            <p className="text-center text-secondary py-8">Trust Bin is empty.</p>
          ) : (
            Object.entries(groupedItems).map(([type, items]) => (
              <div key={type}>
                <h3 className="font-semibold text-primary mb-2">{type}</h3>
                {items.map(item => (
                  <div key={item.id} className="p-2 bg-subtle rounded-lg flex items-center gap-2">
                    <CustomCheckbox
                      id={`bin-${item.id}`}
                      label=""
                      checked={selectedIds.has(item.id)}
                      onChange={(isChecked) => handleSelect(item.id, isChecked)}
                    />
                    <div className="flex-grow">
                      <p className="text-sm text-primary truncate">{getItemDescription(item)}</p>
                      <p className="text-xs text-secondary">Deleted: {timeAgo(item.deletedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="p-4 border-t border-divider bg-subtle rounded-b-xl flex justify-between items-center animate-fadeInUp">
              <p className="text-sm text-secondary">{selectedIds.size} items selected</p>
              <div className="flex gap-2">
                  <button onClick={handleRestoreSelected} className="button-secondary px-4 py-2">Restore</button>
                  <button onClick={handlePermanentDeleteSelected} disabled={countdown > 0} className="button-primary bg-rose-600 hover:bg-rose-500 disabled:bg-slate-500 disabled:cursor-not-allowed px-4 py-2">
                    Delete {countdown > 0 ? `(${countdown})` : ''}
                  </button>
              </div>
          </div>
        )}
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default TrustBinModal;