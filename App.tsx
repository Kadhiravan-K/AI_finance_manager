import React, { useState, useContext, useEffect } from 'react';
import Header from './components/Header';
import FinanceTracker from './components/StoryGenerator';
import { SettingsProvider, SettingsContext } from './contexts/SettingsContext';
import Footer from './components/Footer';
import { ActiveModal } from './types';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import useLocalStorage from './hooks/useLocalStorage';
import PrivacyConsentModal from './components/PrivacyConsentModal';
import OnboardingModal from './components/OnboardingModal';

const AppContent: React.FC = () => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const isOnline = useOnlineStatus();
  const [hasConsented, setHasConsented] = useLocalStorage('finance-tracker-consent', false);
  const [onboardingComplete, setOnboardingComplete] = useLocalStorage('finance-tracker-onboarding-complete', false);
  const { settings } = useContext(SettingsContext);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [settings.theme]);

  const handleOpenModal = (modal: ActiveModal) => {
    setActiveModal(modal);
  };
  
  const handleConsent = () => {
    setHasConsented(true);
  }
  
  const handleOnboardingFinish = () => {
      setOnboardingComplete(true);
  }

  if (!hasConsented) {
    return <PrivacyConsentModal onConsent={handleConsent} />;
  }
  
  if (!onboardingComplete) {
      return <OnboardingModal onFinish={handleOnboardingFinish} />;
  }

  return (
    <>
      <div className="aurora-container">
        <div className="aurora aurora-1"></div>
        <div className="aurora aurora-2"></div>
        <div className="aurora aurora-3"></div>
      </div>
      <div className="h-full w-full p-0 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="h-full w-full max-w-md mx-auto flex flex-col font-sans glass-card rounded-none sm:rounded-3xl shadow-2xl overflow-hidden relative app-container z-10">
          <div className="opacity-0 animate-fadeInUp flex-shrink-0" style={{animationDelay: '100ms'}}>
            <Header 
              onOpenTransfer={() => handleOpenModal('transfer')}
              isOnline={isOnline}
            />
          </div>
          <main className="flex-grow overflow-y-auto opacity-0 animate-fadeInUp pb-28" style={{animationDelay: '200ms'}}>
            <FinanceTracker 
              activeModal={activeModal}
              setActiveModal={setActiveModal}
              isOnline={isOnline}
            />
          </main>
          <Footer 
             activeModal={activeModal}
             setActiveModal={setActiveModal}
          />
        </div>
      </div>
    </>
  );
}


function App(): React.ReactNode {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;