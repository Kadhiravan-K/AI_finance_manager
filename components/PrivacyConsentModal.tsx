import React from 'react';

interface PrivacyConsentModalProps {
  onConsent: () => void;
}

const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({ onConsent }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md border border-slate-700/50 animate-scaleIn flex flex-col max-h-[90vh]">
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-500 rounded-xl shadow-lg shadow-sky-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Your Privacy Matters</h2>
          </div>
        </div>
        <div className="px-6 pb-6 text-sm text-slate-300 space-y-3 overflow-y-auto">
          <p>Welcome to your Personal Finance Hub! Before you begin, please review how your data is handled:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>
              <strong>Local-First & Encrypted:</strong> All your financial data (transactions, accounts, etc.) is stored securely and <strong className="text-emerald-400">encrypted on your device only</strong>. We never have access to it.
            </li>
            <li>
              <strong>AI-Powered Features:</strong> To automatically categorize your spending, the text you paste into the "Quick Add" form is sent to the <strong className="text-sky-400">Google Gemini API</strong> for analysis.
            </li>
            <li>
              <strong>Feedback:</strong> If you send feedback, your message will be shared with the developer to improve the app.
            </li>
          </ul>
          <p className="pt-2">By clicking "I Agree," you acknowledge and consent to this data handling. The app will not function without your consent.</p>
        </div>
        <div className="mt-auto flex-shrink-0 p-6 pt-0">
          <button
            onClick={onConsent}
            className="w-full bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold py-3 px-4 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 transform active:scale-[0.98]"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentModal;