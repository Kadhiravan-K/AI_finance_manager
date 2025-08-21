import React, { useState } from 'react';
import Header from './components/Header';
import FinanceTracker from './components/StoryGenerator';
import { SettingsProvider } from './contexts/SettingsContext';
import Footer from './components/Footer';
import { ActiveModal } from './types';

function App(): React.ReactNode {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const handleOpenModal = (modal: ActiveModal) => {
    setActiveModal(modal);
  };

  return (
    <SettingsProvider>
      <div className="aurora-container">
        <div className="aurora aurora-1"></div>
        <div className="aurora aurora-2"></div>
        <div className="aurora aurora-3"></div>
      </div>
      <div className="h-full w-full p-0 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="h-full w-full max-w-md mx-auto flex flex-col font-sans text-slate-100 glass-card rounded-none sm:rounded-3xl shadow-2xl shadow-slate-900/50 overflow-hidden relative">
          <div className="opacity-0 animate-fadeInUp flex-shrink-0" style={{animationDelay: '100ms'}}>
            <Header 
              onOpenTransfer={() => handleOpenModal('transfer')}
            />
          </div>
          <main className="flex-grow flex flex-col p-4 overflow-y-auto opacity-0 animate-fadeInUp pb-24" style={{animationDelay: '200ms'}}>
            <FinanceTracker 
              activeModal={activeModal}
              setActiveModal={setActiveModal}
            />
          </main>
          <Footer 
             activeModal={activeModal}
             setActiveModal={setActiveModal}
          />
        </div>
      </div>
    </SettingsProvider>
  );
}

export default App;