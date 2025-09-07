import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
  TrustBinItem,
  Transaction,
  RecurringTransaction,
  TripExpense,
  Refund,
  Settlement,
  Goal,
  ShoppingList,
  GlossaryEntry
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
  const formatCurrency = useCurrencyFormatter();

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
      setSelectedIds(new Set(trustBinItems.map(item => item.id)));
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
    // Fix: Use a type-safe switch to access properties correctly based on itemType.
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
      case 'category':
      case 'payee':
      case 'sender':
      case 'contact':
      case 'contactGroup':
      case 'trip':
      case 'shop':
      case 'shopProduct':
      case 'shopEmployee':
      case 'shopShift':
        // These all have a 'name' property
        return (item.item as { name: string }).name;

      case 'goal': {
        const goal = item.item as Goal;
        return `${goal.name} (${formatCurrency(goal.targetAmount)})`;
      }
      case 'shoppingList':
        return (item.item as ShoppingList).title;
      case 'glossaryEntry':
        return (item.item as GlossaryEntry).term;
      default:
        // Should not be reached if all ItemType are handled.
        // This is a safe fallback.
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
  
  const allSelected = trustBinItems.length > 0 && selectedIds.size === trustBinItems.length;
  
  const groupedItems = useMemo(() => {
    return trustBinItems.reduce((acc, item) => {
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
        
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {trustBinItems.length === 0 ? (
            <p className="text-center text-secondary py-8">The Trust Bin is empty.</p>
          ) : (
            Object.entries(groupedItems).map(([groupName, items]) => (
                <div key={groupName}>
                    <h3 className="font-semibold text-secondary text-sm mb-2">{groupName}</h3>
                    <div className="space-y-2">
                    {items.map(item => (
                        <div key={item.id} className={`p-2 bg-subtle rounded-lg flex items-center justify-between group ${selectedIds.has(item.id) ? 'ring-1 ring-emerald-500' : ''}`}>
                            <CustomCheckbox
                                id={`bin-item-${item.id}`}
                                label={getItemDescription(item)}
                                checked={selectedIds.has(item.id)}
                                onChange={(isChecked) => handleSelect(item.id, isChecked)}
                            />
                            <p className="text-xs text-tertiary">{timeAgo(item.deletedAt)}</p>
                        </div>
                    ))}
                    </div>
                </div>
            ))
          )}
        </div>
        
        {selectedIds.size > 0 && (
          <div className="flex-shrink-0 p-4 border-t border-divider flex justify-end gap-3 animate-fadeInUp">
            <button onClick={handleRestoreSelected} className="button-primary px-4 py-2 text-sm">
                Restore ({selectedIds.size})
            </button>
            <button onClick={handlePermanentDeleteSelected} className="button-primary px-4 py-2 text-sm bg-rose-600 hover:bg-rose-500">
                Delete ({selectedIds.size})
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default TrustBinModal;