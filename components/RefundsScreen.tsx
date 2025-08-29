import React, { useMemo } from 'react';
import { Refund, Contact } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface RefundsScreenProps {
  refunds: Refund[];
  contacts: Contact[];
  onAddRefund: () => void;
  onEditRefund: (refund: Refund) => void;
  onClaimRefund: (refundId: string) => void;
  onDeleteRefund: (refundId: string) => void;
}

const RefundsScreen: React.FC<RefundsScreenProps> = ({ refunds, contacts, onAddRefund, onEditRefund, onClaimRefund, onDeleteRefund }) => {
  const formatCurrency = useCurrencyFormatter();
  const contactMap = useMemo(() => new Map(contacts.map(c => [c.id, c.name])), [contacts]);
  
  const pendingRefunds = refunds.filter(r => !r.isClaimed);
  const claimedRefunds = refunds.filter(r => r.isClaimed);

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
        <button onClick={onAddRefund} className="button-secondary px-3 py-1.5 text-sm">
          Create Refund
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
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
      </div>
    </div>
  );
};

export default RefundsScreen;