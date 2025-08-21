import React, { useState } from 'react';
import Header from './components/Header';
import FinanceTracker from './components/StoryGenerator';

function App(): React.ReactNode {
  const [isCategoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [isReportsModalOpen, setReportsModalOpen] = useState(false);
  const [isBudgetsModalOpen, setBudgetsModalOpen] = useState(false);

  return (
    <>
      <div className="aurora-container">
        <div className="aurora aurora-1"></div>
        <div className="aurora aurora-2"></div>
        <div className="aurora aurora-3"></div>
      </div>
      <div className="h-full w-full p-0 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="h-full w-full max-w-md mx-auto flex flex-col font-sans text-slate-100 glass-card rounded-none sm:rounded-3xl shadow-2xl shadow-slate-900/50 overflow-hidden">
          <div className="opacity-0 animate-fadeInUp" style={{animationDelay: '100ms'}}>
            <Header 
              onOpenSettings={() => setCategoryManagerOpen(true)} 
              onOpenTransfer={() => setTransferModalOpen(true)}
              onOpenReports={() => setReportsModalOpen(true)}
              onOpenBudgets={() => setBudgetsModalOpen(true)}
            />
          </div>
          <main className="flex-grow flex flex-col p-4 overflow-y-auto opacity-0 animate-fadeInUp" style={{animationDelay: '200ms'}}>
            <FinanceTracker 
              isCategoryManagerOpen={isCategoryManagerOpen}
              onCloseCategoryManager={() => setCategoryManagerOpen(false)}
              isTransferModalOpen={isTransferModalOpen}
              onCloseTransferModal={() => setTransferModalOpen(false)}
              isReportsModalOpen={isReportsModalOpen}
              onCloseReportsModal={() => setReportsModalOpen(false)}
              isBudgetsModalOpen={isBudgetsModalOpen}
              onCloseBudgetsModal={() => setBudgetsModalOpen(false)}
            />
          </main>
        </div>
      </div>
    </>
  );
}

export default App;