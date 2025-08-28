import React, { useState, useContext, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Header from './components/Header';
// FIX: Changed to a named import as MainContent is not a default export.
import { MainContent } from './components/StoryGenerator';
import { SettingsProvider, SettingsContext, AppDataProvider } from './contexts/SettingsContext';
import { ActiveScreen, ActiveModal, ModalState } from './types';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import useLocalStorage from './hooks/useLocalStorage';
import PrivacyConsentModal from './components/PrivacyConsentModal';
import OnboardingModal from './components/OnboardingModal';
import Footer from './components/Footer';
import HeaderMenuModal from './components/HeaderMenuModal';
import AICommandModal from './components/AICommandModal';

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
  const mainContentRef = useRef<HTMLElement>(null);
  const [isQuickAddDisabled, setIsQuickAddDisabled] = useState(false);
  
  const activeModal = modalStack[modalStack.length - 1] || null;
  const setActiveModal = (modal: ModalState | null) => {
      if (modal) {
          setModalStack(prev => [...prev, modal]);
      } else {
          setModalStack(prev => prev.slice(0, -1));
      }
  }

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
        setActiveModal({name: 'addTransaction'});
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
      if (screen) setActiveScreen(screen);
      if (modal) setActiveModal({name: modal, props: modalProps });
      // Close AI Command Center on navigation
      if(activeModal?.name === 'aiCommandCenter') {
        setActiveModal(null);
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
        <div className="h-full w-full max-w-md mx-auto flex flex-col font-sans glass-card rounded-none sm:rounded-3xl shadow-2xl relative app-container z-10">
          <div className="opacity-0 animate-fadeInUp flex-shrink-0" style={{animationDelay: '100ms'}}>
            <Header 
              onOpenTransfer={() => setActiveModal({name: 'transfer'})}
              onOpenMenu={() => setActiveModal({name: 'headerMenu'})}
              onOpenNotifications={() => setActiveModal({name: 'notifications'})}
              onOpenAICommandCenter={() => setActiveModal({name: 'aiCommandCenter'})}
              isOnline={isOnline}
              enabledTools={settings.enabledTools}
            />
          </div>
          <main ref={mainContentRef} className="flex-grow overflow-y-auto opacity-0 animate-fadeInUp pb-20" style={{animationDelay: '200ms'}}>
            <MainContent 
              activeScreen={activeScreen}
              setActiveScreen={setActiveScreen}
              modalStack={modalStack}
              setModalStack={setModalStack}
              isOnline={isOnline}
              mainContentRef={mainContentRef}
              initialText={sharedText}
              onSelectionChange={selectedIds => setIsQuickAddDisabled(selectedIds.length !== 1)}
              showOnboardingGuide={showOnboardingGuide}
              setShowOnboardingGuide={setShowOnboardingGuide}
              onNavigate={handleNavigation}
            />
          </main>
          <Footer activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
          
            <button 
              onClick={() => setActiveModal({name: 'addTransaction'})}
              className="fab"
              aria-label="Add Transaction"
              disabled={isQuickAddDisabled}
              title={isQuickAddDisabled ? "Select a single account to add a transaction" : "Add Transaction"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          
           {activeModal?.name === 'headerMenu' && ReactDOM.createPortal(
            <HeaderMenuModal 
              onClose={() => setActiveModal(null)}
              setActiveScreen={(screen) => {
                setActiveScreen(screen);
                setActiveModal(null);
              }}
              setActiveModal={(modal) => {
                setActiveModal({name: modal});
              }}
            />,
            modalRoot
          )}
        </div>
      </div>
    </>
  );
}


function App(): React.ReactNode {
  return (
    <SettingsProvider>
      <AppDataProvider>
        <AppContent />
      </AppDataProvider>
    </SettingsProvider>
  );
}

export default App;