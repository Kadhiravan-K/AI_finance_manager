import React, { useMemo, useState } from 'react';
// Fix: Import ActiveModal to use in props.
import { Refund, Contact, ActiveModal, AppliedViewOptions, ViewOptions } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface RefundsScreenProps {
  refunds: Refund[];
  contacts: Contact[];
  onAddRefund: () => void;
  onEditRefund: (refund: Refund) => void;
  onClaimRefund: (refundId: string) => void;
  onDeleteRefund: (refundId: string) => void;
  // Fix: Add missing openModal prop to match usage in StoryGenerator.tsx.
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

const RefundsScreen: React.FC<RefundsScreenProps> = ({ refunds, contacts, onAddRefund, onEditRefund, onClaimRefund, onDeleteRefund, openModal }) => {
  const formatCurrency = useCurrencyFormatter();
  const contactMap = useMemo(() => new Map(contacts.map(c => [c.id, c.name])), [contacts]);
  
  const [viewOptions, setViewOptions] = useState<AppliedViewOptions>({
    sort: { key: 'expectedDate', direction: 'asc' },
    filters: { pending: true, claimed: true }
  });

  const sortedAndFilteredRefunds = useMemo(() => {
    let result = [...(refunds || [])];

    if (!viewOptions.filters.pending) result = result.filter(r => r.isClaimed);
    if (!viewOptions.filters.claimed) result = result.filter(r => !r.isClaimed);

    const { key, direction } = viewOptions.sort;
    result.sort((a, b) => {
        let comparison = 0;
        switch(key) {
            case 'expectedDate':
                const dateA = a.expectedDate ? new Date(a.expectedDate).getTime() : Infinity;
                const dateB = b.expectedDate ? new Date(b.expectedDate).getTime() : Infinity;
                comparison = dateA - dateB;
                break;
            case 'amount':
                comparison = b.amount - a.amount;
                break;
        }
        return direction === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [refunds, viewOptions]);
  
  const viewOptionsConfig: ViewOptions = {
    sortOptions: [
        { key: 'expectedDate', label: 'Expected Date' },
        { key: 'amount', label: 'Amount' },
    ],
    filterOptions: [
        { key: 'pending', label: 'Pending', type: 'toggle' },
        { key: 'claimed', label: 'Claimed', type: 'toggle' },
    ]
  };
  
  const isViewOptionsApplied = useMemo(() => {
    return viewOptions.sort.key !== 'expectedDate' || viewOptions.sort.direction !== 'asc' || !viewOptions.filters.pending || !viewOptions.filters.claimed;
  }, [viewOptions]);

  const pendingRefunds = sortedAndFilteredRefunds.filter(r => !r.isClaimed);
  const claimedRefunds = sortedAndFilteredRefunds.filter(r => r.isClaimed);

  const RefundItem: React.FC<{refund: Refund}> = ({ refund }) => (
      <div key={refund.id} className="p-3 bg-subtle rounded-lg group">
          <div className="flex justify-between items-start">
              <div>
                  <p className="font-medium text-primary">{refund.description}</p>
                  <p className="text-xs text-secondary">
                    Issued: {new Date(refund.date).toLocaleDateString()}
                    {refund.contactId && ` | From: ${contactMap.get(refund.contactId) || 'Unknown'}`}
                  </p>
                  {refund.expectedDate && !refund.isClaimed && (
                      <p className="text-xs text-yellow-400">Expected by: {new Date(refund.expectedDate).toLocaleDateString()}</p>
                  )}
              </div>
              <p className={`font-semibold flex-shrink-0 ml-2 ${refund.isClaimed ? 'text-secondary' : 'text-emerald-400'}`}>{formatCurrency(refund.amount)}</p>
          </div>
          <div className="flex justify-end gap-2 mt-1">
              {refund.isClaimed ? (
                  <span className="text-xs text-emerald-400">✓ Claimed on {new Date(refund.claimedDate!).toLocaleDateString()}</span>
              ) : (
                <>
                  <button onClick={() => onEditRefund(refund)} className="text-xs px-2 py-1 bg-sky-600/50 text-sky-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      Edit
                  </button>
                  <button onClick={() => onClaimRefund(refund.id)} className="button-primary px-3 py-1 text-sm">
                      Claim
                  </button>
                </>
              )}
              <button onClick={() => onDeleteRefund(refund.id)} className="text-xs px-2 py-1 bg-rose-600/50 text-rose-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  Delete
              </button>
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary text-center flex-grow">Refunds ↩️</h2>
        <div className="flex items-center gap-2">
            <button onClick={() => openModal('viewOptions', { options: viewOptionsConfig, currentValues: viewOptions, onApply: setViewOptions })} className="button-secondary text-sm p-2 flex items-center gap-2 relative rounded-full aspect-square">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 10h12M3 16h6" /></svg>
                {isViewOptionsApplied && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[var(--color-bg-app)]"></div>}
            </button>
            <button onClick={onAddRefund} className="button-secondary px-3 py-1.5 text-sm">
            Create Refund
            </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {(refunds || []).length === 0 ? (
            <div className="text-center py-12">
                <p className="text-lg font-medium text-secondary">Track your expected refunds.</p>
                <p className="text-sm text-tertiary mb-4">Never forget about money that's owed back to you.</p>
                <button onClick={onAddRefund} className="button-primary px-4 py-2">Create First Refund</button>
            </div>
        ) : (
            <>
                <div>
                    <h3 className="font-semibold text-lg text-primary mb-2">Pending Refunds</h3>
                    <div className="space-y-3">
                        {pendingRefunds.map(refund => <RefundItem key={refund.id} refund={refund} />)}
                        {pendingRefunds.length === 0 && <p className="text-center text-secondary py-4">No pending refunds.</p>}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-primary mb-2">Claimed History</h3>
                    <div className="space-y-3">
                        {claimedRefunds.map(refund => <RefundItem key={refund.id} refund={refund} />)}
                        {claimedRefunds.length === 0 && <p className="text-center text-secondary py-4">No claimed refunds yet.</p>}
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default RefundsScreen;