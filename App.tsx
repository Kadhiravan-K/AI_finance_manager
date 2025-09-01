

import React, { useState, useContext, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Header from './components/Header';
import { MainContent } from './components/StoryGenerator';
import { SettingsProvider, SettingsContext, AppDataProvider, AppDataContext } from './contexts/SettingsContext';
import { ActiveScreen, ActiveModal, ModalState } from './types';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import useLocalStorage from './hooks/useLocalStorage';
import PrivacyConsentModal from './components/PrivacyConsentModal';
import OnboardingModal from './components/OnboardingModal';
import Footer from './components/Footer';
import SideDrawerMenu from './components/HeaderMenuModal';
import InteractiveFab from './components/InteractiveFab';

const modalRoot = document.getElementById('modal-root')!;

const AppContent: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [modalStack, setModalStack] = useState<ModalState[]>([]);
  const isOnline = useOnlineStatus();
  const [hasConsented, setHasConsented] = useLocalStorage('finance-tracker-consent', false);
  const [onboardingComplete, setOnboardingComplete] = useLocalStorage('finance-tracker-onboarding-complete', false);
  const [showOnboardingGuide, setShowOnboardingGuide] = useLocalStorage('finance-tracker-show-guide', true);
  const [sharedText, setSharedText] = useState<string | null>(null);
  const { settings } = useContext(SettingsContext);
  const dataContext = useContext(AppDataContext);
  const mainContentRef = useRef<HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data loading to show skeletons and improve perceived performance
    const timer = setTimeout(() => setIsLoading(false), 1200); 
    return () => clearTimeout(timer);
  }, []);
  
  if (!dataContext) {
    return null; 
  }

  const activeModal = modalStack[modalStack.length - 1] || null;
  const openModal = (name: ActiveModal, props?: Record<string, any>) => setModalStack(prev => [...prev, { name, props }]);
  const closeActiveModal = () => setModalStack(prev => prev.slice(0, -1));

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [settings.theme]);

  useEffect(() => {
    // Listen for shared text from the service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'shared-text') {
        setSharedText(event.data.text);
        openModal('addTransaction', { initialTab: 'auto' });
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);
  
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
  
  const handleNavigation = (screen: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>) => {
      if (modal === 'addTransaction') {
        openModal('addTransactionMode');
        return;
      }
      if (screen) setActiveScreen(screen);
      if (modal) openModal(modal, modalProps);
      if(activeModal?.name === 'aiCommandCenter') {
        closeActiveModal();
      }
  }

  return (
    <>
      <div className="aurora-container">
        <div className="aurora aurora-1"></div>
        <div className="aurora aurora-2"></div>
        <div className="aurora aurora-3"></div>
      </div>
      <div className="h-full w-full p-0 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="h-full w-full max-w-md mx-auto flex flex-col font-sans glass-card rounded-none sm:rounded-3xl shadow-2xl relative app-container z-10 no-hover">
          {!isOnline && (
            <div className="offline-indicator">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m12.728 0L5.636 18.364m12.728 0L5.636 5.636" /></svg>
              Offline Mode
            </div>
          )}
          <div className="flex-shrink-0 animate-fadeInUp" style={{animationDelay: '100ms'}}>
            <Header 
              onOpenMenu={() => openModal('headerMenu')}
              onOpenAccounts={() => openModal('accountSelector')}
              onOpenSearch={() => openModal('globalSearch')}
            />
          </div>
          <main ref={mainContentRef} className="flex-grow overflow-y-auto pb-20 animate-fadeInUp" style={{animationDelay: '200ms'}}>
            <MainContent 
              activeScreen={activeScreen}
              setActiveScreen={setActiveScreen}
              modalStack={modalStack}
              setModalStack={setModalStack}
              isOnline={isOnline}
              mainContentRef={mainContentRef}
              initialText={sharedText}
              showOnboardingGuide={showOnboardingGuide}
              setShowOnboardingGuide={setShowOnboardingGuide}
              onNavigate={handleNavigation}
              isLoading={isLoading}
            />
          </main>
          <Footer activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
          {ReactDOM.createPortal(<SideDrawerMenu isOpen={activeModal?.name === 'headerMenu'} onClose={closeActiveModal} setActiveScreen={setActiveScreen} setActiveModal={openModal} />, modalRoot)}
          <InteractiveFab onNavigate={handleNavigation} />
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => (
  <SettingsProvider>
    <AppDataProvider>
      <AppContent />
    </AppDataProvider>
  </SettingsProvider>
);

export default App;