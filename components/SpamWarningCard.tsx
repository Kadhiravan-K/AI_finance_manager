
import React from 'react';
import { SpamWarning } from '../types';

interface SpamWarningCardProps {
  warning: SpamWarning;
  onApprove: (trustSender: boolean) => void;
  onDiscard: () => void;
}

const SpamWarningCard: React.FC<SpamWarningCardProps> = ({ warning, onApprove, onDiscard }) => {
  const isForwarded = !!warning.parsedData.isForwarded;
  const title = isForwarded ? "Forwarded Message Detected" : "Suspicious Message Detected";
  const message = isForwarded
    ? "This message appears to be forwarded. Forwarded messages may not be legitimate transactions. Please review carefully."
    : "Our AI has flagged this message as potential spam. Please review it carefully.";

  return (
    <div className="p-4 mb-4 rounded-xl bg-yellow-900/50 border border-yellow-700/80 animate-fadeInUp">
      <div className="flex items-start gap-3">
        <div className="text-yellow-400 flex-shrink-0 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-yellow-300">{title}</h3>
          <p className="text-sm text-yellow-300/80 mt-1">{message}</p>
          <blockquote className="mt-2 p-2 text-xs bg-slate-800/50 rounded-md text-slate-300 italic border-l-2 border-yellow-500">
            {/* Fix: Corrected JSX interpolation to display the raw text of the warning. */}
            "{warning.rawText}"
          </blockquote>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-xs text-yellow-300/70">How would you like to proceed?</p>
        <div className="flex gap-3">
            <button onClick={onDiscard} className="button-secondary w-full py-2">Discard</button>
            <button onClick={() => onApprove(false)} className="button-primary w-full py-2">Approve Once</button>
            {warning.parsedData.senderName && (
                <button onClick={() => onApprove(true)} className="button-primary w-full py-2 bg-emerald-600 hover:bg-emerald-500">Always Trust Sender</button>
            )}
        </div>
      </div>
    </div>
  );
};

export { SpamWarningCard };
