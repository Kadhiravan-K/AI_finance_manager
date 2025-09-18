
import React, { useState, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import Header from './components/Header';
import { MainContent } from './components/MainContent';
import { SettingsProvider, SettingsContext, AppDataProvider, AppDataContext, DEFAULT_SETTINGS } from './contexts/SettingsContext';
import { ActiveScreen, ActiveModal, ModalState, AppState, TrustBinItem, Category, TransactionType, ContactGroup, Contact, Account, UndoToastState, Transaction, Debt } from './types';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import useLocalStorage from './hooks/useLocalStorage';
import PrivacyConsentModal from './components/PrivacyConsentModal';
import OnboardingModal from './components/OnboardingModal';
import Footer from './components/Footer';
import Confetti from './components/Confetti';
import { calculateFinancialHealthScore } from './utils/financialHealth';
import OnboardingGuide from './components/OnboardingGuide';
import UndoToast from './components/UndoToast';
import TimePickerModal from './components/TimePickerModal';
import AccountsManagerModal from './components/AccountsManagerModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import EditCategoryModal from './components/EditCategoryModal';
import PayeesModal from './components/PayeesModal';
import SenderManagerModal from './components/SenderManagerModal';
import AppSettingsModal from './components/AppSettingsModal';
import ExportModal from './components/ExportModal';
import FeedbackModal from './components/FeedbackModal';
import TransferModal from './components/TransferModal';
import SplitTransactionModal from './components/SplitTransactionModal';
import ViewOptionsModal from './components/ViewOptionsModal';
import GlobalSearchModal from './components/GlobalSearchModal';
import AIHubModal from './components/AIHubModal';
import TrustBinModal from './components/TrustBinModal';
import DashboardSettingsModal from './components/DashboardSettingsModal';
import NotificationSettingsModal from './components/NotificationSettingsModal';
import ManageToolsModal from './components/ManageToolsModal';
import EditTripModal from './components/EditTripModal';
import AddTripExpenseModal from './components/AddTripExpenseModal';
import GlobalTripSummaryModal from './components/GlobalTripSummaryModal';
import EditGoalModal from './components/EditGoalModal';
import FinancialHealthModal from './components/FinancialHealthModal';
import AddCalendarEventModal from './components/AddCalendarEventModal';
import EditNoteModal from './components/EditNoteModal';
import AIChatModal from './components/AIChatModal';
import RefundModal from './components/RefundModal';
import EditContactModal from './components/EditContactModal';
import EditContactGroupModal from './components/EditContactGroupModal';
import ContactsManagerModal from './components/ContactsManagerModal';
import IntegrationsModal from './components/IntegrationsModal';
import FooterCustomizationModal from './components/FooterCustomizationModal';
import EditGlossaryEntryModal from './components/EditGlossaryEntryModal';
import BuyInvestmentModal from './components/BuyInvestmentModal';
import EditRecurringModal from './components/EditRecurringModal';
import ShareGuideModal from './components/ShareGuideModal';
import EditShopModal from './components/EditShopModal';
import AddTransactionModal from './components/AddTransactionModal';
import EditTransactionModal from './components/EditTransactionModal';
import EditAccountModal from './components/EditAccountModal';
import SellInvestmentModal from './components/SellInvestmentModal';
import UpdateInvestmentModal from './components/UpdateInvestmentModal';
import EditDebtModal from './components/EditDebtModal';
import CameraModal from './components/CameraModal';
import MiniCalculatorModal from './components/MiniCalculatorModal';

const modalRoot = document.getElementById('modal-root')!;

const AppContent: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [modalStack, setModalStack] = useState<ModalState[]>([]);
  const isOnline = useOnlineStatus();
  const [hasConsented, setHasConsented] = useLocalStorage('finance-tracker-consent', false);
  const [onboardingComplete, setOnboardingComplete] = useLocalStorage('finance-tracker-onboarding-complete', false);
  const [guideComplete, setGuideComplete] = useLocalStorage('finance-tracker-guide-complete', false);
  const [sharedText, setSharedText] = useState<string | null>(null);
  const { settings } = useContext(SettingsContext);
  const dataContext = useContext(AppDataContext);
  const settingsContext = useContext(SettingsContext);
  const mainContentRef = useRef<HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timePickerState, setTimePickerState] = useState<{ initialTime: string; onSave: (time: string) => void; } | null>(null);
  const [tripDetailsId, setTripDetailsId] = useState<string | null>(null);
  const [shoppingListId, setShoppingListId] = useState<string | null>(null);
  const [calculatorState, setCalculatorState] = useState<{ onResult: (result: number) => void } | null>(null);

  // For screen transitions
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [screenToRender, setScreenToRender] = useState(activeScreen);
  const animationTimeoutRef = useRef<number | undefined>(undefined);


  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 6000); // Let it animate for 6 seconds
  }, []);

  useEffect(() => {
    // Simulate initial data loading to show skeletons and improve perceived performance
    const timer = setTimeout(() => setIsLoading(false), 1200); 
    return () => clearTimeout(timer);
  }, []);
  
  if (!dataContext || !settingsContext) {
    return null; 
  }

  const { undoToast, setUndoToast } = dataContext;

  // Destructure all the state here for score calculation and to pass down
  const {
      transactions, accounts, budgets, recurringTransactions,
      goals, investmentHoldings, trips, tripExpenses,
      shops, shopProducts, shopSales,
      shopEmployees, shopShifts, unlockedAchievements,
      streaks, challenges, refunds, settlements, shoppingLists, glossaryEntries,
      trustBin, debts
  } = dataContext;
  const { categories, payees, senders, contactGroups, contacts, financialProfile } = settingsContext;

  const appState: AppState = useMemo(() => ({
      transactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, payees, senders, contactGroups, contacts, settings, achievements: unlockedAchievements, streaks, challenges, trips: trips || [], tripExpenses: tripExpenses || [], financialProfile, shops, shopProducts, shopSales, shopEmployees, shopShifts, refunds, settlements, shoppingLists, glossaryEntries, debts
  }), [transactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, payees, senders, contactGroups, contacts, settings, unlockedAchievements, streaks, challenges, trips, tripExpenses, financialProfile, shops, shopProducts, shopSales, shopEmployees, shopShifts, refunds, settlements, shoppingLists, glossaryEntries, debts]);

  const { totalScore } = useMemo(() => calculateFinancialHealthScore(appState), [appState]);

  useEffect(() => {
    const root = document.documentElement;
    if (totalScore >= 80) { // High Score: Energetic & Positive
        root.style.setProperty('--aurora-1', 'var(--color-accent-emerald)');
        root.style.setProperty('--aurora-2', '#eab308'); // Gold/Yellow
        root.style.setProperty('--aurora-3', 'var(--color-accent-sky)');
        root.style.setProperty('--aurora-speed-1', '20s');
        root.style.setProperty('--aurora-speed-2', '25s');
        root.style.setProperty('--aurora-speed-3', '22s');
    } else if (totalScore >= 50) { // Medium Score: Balanced & Calm
        root.style.setProperty('--aurora-1', 'var(--color-accent-violet)');
        root.style.setProperty('--aurora-2', 'var(--color-accent-sky)');
        root.style.setProperty('--aurora-3', '#ec4899'); // Pink
        root.style.setProperty('--aurora-speed-1', '30s');
        root.style.setProperty('--aurora-speed-2', '35s');
        root.style.setProperty('--aurora-speed-3', '28s');
    } else { // Low Score: Cool & Muted
        root.style.setProperty('--aurora-1', '#1e3a8a'); // Dark Blue
        root.style.setProperty('--aurora-2', 'var(--color-accent-rose)');
        root.style.setProperty('--aurora-3', '#4c1d95'); // Deeper Violet
        root.style.setProperty('--aurora-speed-1', '45s');
        root.style.setProperty('--aurora-speed-2', '50s');
        root.style.setProperty('--aurora-speed-3', '40s');
    }
  }, [totalScore]);

  const activeModal = modalStack[modalStack.length - 1] || null;
  
  const onOpenCalculator = useCallback((onResult: (result: number) => void) => {
    setCalculatorState({ onResult });
  }, []);

  const openModal = useCallback((name: ActiveModal, props?: Record<string, any>) => {
    if (name === 'timePicker' && props) {
        setTimePickerState({ initialTime: props.initialTime, onSave: props.onSave });
    } else {
        setModalStack(prev => [...prev, { name, props }]);
    }
  }, []);

  const handleScreenChange = useCallback((screen: ActiveScreen) => {
    if (screen === activeScreen) return;
    clearTimeout(animationTimeoutRef.current);
    setIsAnimatingOut(true);
    animationTimeoutRef.current = window.setTimeout(() => {
        setActiveScreen(screen);
        setScreenToRender(screen);
        setIsAnimatingOut(false);
    }, 300); // Match animation duration
  }, [activeScreen]);
  
  const onNavigate = useCallback((screen: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => {
      if (screen === 'tripDetails' && props?.tripId) {
          setTripDetailsId(props.tripId);
      }
       if (screen === 'shoppingLists' && props?.shoppingListId) {
          setShoppingListId(props.shoppingListId);
      }
      handleScreenChange(screen);
      if (modal) openModal(modal, props);
  }, [openModal, handleScreenChange]);


  const closeActiveModal = useCallback(() => setModalStack(prev => prev.slice(0, -1)), []);

  const onSharedTextConsumed = useCallback(() => {
    setSharedText(null);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', settings.theme === 'light');
    root.classList.toggle('fab-glow-enabled', settings.fabGlowEffect ?? false);
    root.classList.toggle('hub-cursor-glow-enabled', settings.hubCursorGlowEffect ?? false);
  }, [settings.theme, settings.fabGlowEffect, settings.hubCursorGlowEffect]);
  
  useEffect(() => {
    // Event listener for the mouse-following glow effect
    const handleMouseMove = (e: MouseEvent) => {
      const card = (e.target as HTMLElement).closest('.interactive-card');
      if (card) {
        const glow = card.querySelector('.glow-effect') as HTMLElement;
        if (glow) {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          glow.style.transform = `translate(${x - glow.offsetWidth / 2}px, ${y - glow.offsetHeight / 2}px)`;
        }
      }
    };
    document.body.addEventListener('mousemove', handleMouseMove);
    return () => document.body.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
  }, [openModal]);
  
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
  
  const renderActiveModal = () => {
    if (!activeModal) return null;
    
    switch (activeModal.name) {
        case 'camera':
            return <CameraModal onClose={closeActiveModal} onCapture={activeModal.props?.onCapture} />;
        case 'accountsManager':
            return <AccountsManagerModal onClose={closeActiveModal} accounts={accounts} onAddAccount={dataContext.onAddAccount} onEditAccount={(acc) => openModal('editAccount', { account: acc })} onDeleteAccount={dataContext.onDeleteAccount} />;
        case 'categories':
            return <CategoryManagerModal onClose={closeActiveModal} categories={categories} onAddTopLevelCategory={() => openModal('editCategory')} onAddSubcategory={(parent) => openModal('editCategory', { initialParentId: parent.id, initialType: parent.type })} onEditCategory={(cat) => openModal('editCategory', { category: cat })} onDeleteCategory={(id) => dataContext.deleteItem(id, 'category')} />;
        case 'payees':
            return <PayeesModal onClose={closeActiveModal} payees={payees} setPayees={settingsContext.setPayees} categories={categories} onDelete={(id) => dataContext.deleteItem(id, 'payee')} />;
        case 'senderManager':
            return <SenderManagerModal onClose={closeActiveModal} onDelete={(id) => dataContext.deleteItem(id, 'sender')} />;
        case 'appSettings':
            return <AppSettingsModal onClose={closeActiveModal} appState={appState} onRestore={() => {}} />;
        case 'importExport':
            return <ExportModal onClose={closeActiveModal} appState={appState} />;
        case 'feedback':
            return <FeedbackModal onClose={closeActiveModal} onSend={async () => ({ queued: false })} isSending={false} />;
        case 'transfer':
            return <TransferModal onClose={closeActiveModal} accounts={accounts} onTransfer={dataContext.onTransfer} />;
        case 'globalSearch':
            return <GlobalSearchModal onClose={closeActiveModal} onNavigate={onNavigate} />;
        case 'aiHub':
            return <AIHubModal onClose={closeActiveModal} appState={appState} onExecuteCommand={dataContext.onExecuteAICommand} onNavigate={onNavigate} />;
        case 'trustBin':
            return <TrustBinModal onClose={closeActiveModal} trustBinItems={trustBin} onRestore={() => {}} onPermanentDelete={() => {}} />;
        case 'dashboardSettings':
            return <DashboardSettingsModal onClose={closeActiveModal} />;
        case 'notificationSettings':
            return <NotificationSettingsModal onClose={closeActiveModal} budgets={budgets} categories={categories} />;
        case 'manageTools':
            return <ManageToolsModal onClose={closeActiveModal} />;
        case 'editTrip':
            return <EditTripModal trip={activeModal.props?.trip} onClose={closeActiveModal} onSave={(tripData, id) => { if(id) dataContext.setTrips(p => p.map(t => t.id === id ? {...t, ...tripData} : t)); else dataContext.setTrips(p => [...p, {id: self.crypto.randomUUID(), date: new Date().toISOString(), ...tripData}]) }} onSaveContact={(contact) => { const newContact = {...contact, id: self.crypto.randomUUID()}; settingsContext.setContacts(p => [...p, newContact]); return newContact; }} onOpenContactsManager={() => openModal('contacts')} />;
        case 'addTripExpense':
            // Fix: Corrected the onSave handler to process a single expense object instead of an array, and removed invalid props 'onOpenCalculator' and 'onSaveContact'.
            return <AddTripExpenseModal trip={activeModal.props?.trip} expenseToEdit={activeModal.props?.expenseToEdit} onClose={closeActiveModal} onSave={(expenseData) => { const now = new Date().toISOString(); dataContext.setTripExpenses(p => [...p, {...expenseData, id: self.crypto.randomUUID(), tripId: activeModal.props?.trip.id, date: now}]); }} onUpdate={(expense) => dataContext.setTripExpenses(p => p.map(e => e.id === expense.id ? {...e, ...expense} : e))} categories={categories} findOrCreateCategory={dataContext.findOrCreateCategory} />;
        case 'tripSummary':
            return <GlobalTripSummaryModal allExpenses={tripExpenses} trips={trips} settlements={settlements} onClose={closeActiveModal} onSettle={dataContext.handleRecordSettlement} />;
        case 'editGoal':
            return <EditGoalModal goal={activeModal.props?.goal} onClose={closeActiveModal} onSave={(goal, id) => { if(id) dataContext.setGoals(p => p.map(g => g.id === id ? {...g, ...goal} : g)); else dataContext.setGoals(p => [...p, {...goal, id: self.crypto.randomUUID(), currentAmount: 0}]); }} />;
        case 'financialHealth':
            return <FinancialHealthModal appState={appState} onClose={closeActiveModal} onSaveProfile={settingsContext.setFinancialProfile} onSaveBudget={(catId, amt) => {}} />;
        case 'aiChat':
            return <AIChatModal onClose={closeActiveModal} appState={appState} />;
        case 'refund':
            return <RefundModal refund={activeModal.props?.refund} allTransactions={transactions} accounts={accounts} contacts={contacts} refunds={refunds} onClose={closeActiveModal} onSave={(refundData, id) => { if(id) dataContext.setRefunds(p => p.map(r => r.id === id ? {...r, ...refundData} : r)); else dataContext.setRefunds(p => [...p, {...refundData, id: self.crypto.randomUUID(), isClaimed: false}]); }} openModal={openModal} />;
        case 'editContact':
            return <EditContactModal contact={activeModal.props?.contact} initialGroupId={activeModal.props?.initialGroupId} onClose={closeActiveModal} onSave={(contact, id) => { if(id) settingsContext.setContacts(p => p.map(c => c.id === id ? {...c, ...contact} : c)); else settingsContext.setContacts(p => [...p, {...contact, id: self.crypto.randomUUID()}]); }} />;
        case 'editContactGroup':
            return <EditContactGroupModal group={activeModal.props?.group} onClose={closeActiveModal} onSave={(group, id) => { if(id) settingsContext.setContactGroups(p => p.map(g => g.id === id ? {...g, ...group} : g)); else settingsContext.setContactGroups(p => [...p, {...group, id: self.crypto.randomUUID()}]); }} />;
        case 'contacts':
            return <ContactsManagerModal onClose={closeActiveModal} onAddGroup={() => openModal('editContactGroup')} onEditGroup={(g) => openModal('editContactGroup', {group: g})} onDeleteGroup={(id) => dataContext.deleteItem(id, 'contactGroup')} onAddContact={(g) => openModal('editContact', {initialGroupId: g.id})} onEditContact={(c) => openModal('editContact', {contact: c})} onDeleteContact={(id) => dataContext.deleteItem(id, 'contact')} />;
        case 'integrations':
            return <IntegrationsModal onClose={closeActiveModal} />;
        case 'footerCustomization':
            return <FooterCustomizationModal onClose={closeActiveModal} />;
        case 'editGlossaryEntry':
            return <EditGlossaryEntryModal entry={activeModal.props?.entry} onClose={closeActiveModal} onSave={(entry, id) => { if(id) dataContext.setGlossaryEntries(p => p.map(e => e.id === id ? {...e, ...entry} : e)); else dataContext.setGlossaryEntries(p => [...p, {...entry, id: self.crypto.randomUUID()}]); }} />;
        case 'editShop':
            return <EditShopModal shop={activeModal.props?.shop} onCancel={closeActiveModal} onSave={(shop, id) => { if(id) dataContext.setShops(p => p.map(s => s.id === id ? {...s, ...shop} : s)); else dataContext.setShops(p => [...p, {...shop, id: self.crypto.randomUUID()}]); }} />;
        case 'addTransaction':
             return <AddTransactionModal onCancel={closeActiveModal} onSaveAuto={dataContext.onSaveAutoTransaction} onSaveManual={dataContext.onSaveManualTransaction} accounts={accounts} contacts={contacts} openModal={openModal} onOpenCalculator={onOpenCalculator} initialText={sharedText} onInitialTextConsumed={onSharedTextConsumed} initialTab={activeModal.props?.initialTab} />;
        case 'editTransaction':
            return <EditTransactionModal transaction={activeModal.props?.transaction} onCancel={closeActiveModal} onSave={dataContext.onUpdateTransaction} accounts={accounts} contacts={contacts} openModal={openModal} onOpenCalculator={onOpenCalculator} />;
        case 'editAccount':
            return <EditAccountModal account={activeModal.props?.account} onClose={closeActiveModal} onSave={(acc) => dataContext.setAccounts(p => p.map(a => a.id === acc.id ? acc : a))} />;
        case 'editCategory':
            return <EditCategoryModal category={activeModal.props?.category} initialParentId={activeModal.props?.initialParentId} initialType={activeModal.props?.initialType} categories={categories} onSave={(cat, id) => { if(id) settingsContext.setCategories(p => p.map(c => c.id === id ? {...c, ...cat} : c)); else settingsContext.setCategories(p => [...p, {...cat, id: self.crypto.randomUUID()}]); }} onCancel={closeActiveModal} />;
        case 'editRecurring':
             return <EditRecurringModal onClose={closeActiveModal} onSave={(data, id) => { if(id) dataContext.setRecurringTransactions(p => p.map(rt => rt.id === id ? {...rt, ...data} : rt)); else dataContext.setRecurringTransactions(p => [...p, {id: self.crypto.randomUUID(), ...data}]); }} recurringTransaction={activeModal.props?.recurringTransaction} accounts={accounts} categories={categories} openModal={openModal} />;
        case 'addCalendarEvent':
            return <AddCalendarEventModal onClose={closeActiveModal} onNavigate={onNavigate} initialDate={activeModal.props?.initialDate} />;
        case 'editNote':
            return <EditNoteModal transaction={activeModal.props?.transaction} onSave={dataContext.onUpdateTransaction} onClose={closeActiveModal} />;
        case 'buyInvestment':
            return <BuyInvestmentModal onClose={closeActiveModal} accounts={accounts} onSave={dataContext.onBuyInvestment} />;
        case 'sellInvestment':
            return <SellInvestmentModal onClose={closeActiveModal} accounts={accounts} onSave={dataContext.onSellInvestment} holding={activeModal.props?.holding} />;
        case 'updateInvestment':
            return <UpdateInvestmentModal onClose={closeActiveModal} onSave={dataContext.onUpdateInvestmentValue} holding={activeModal.props?.holding} />;
        case 'splitTransaction':
             return <SplitTransactionModal
                transaction={activeModal.props?.transaction}
                onSave={activeModal.props?.onSave || dataContext.onSplitTransaction}
                onCancel={closeActiveModal}
                items={activeModal.props?.items} />;
        case 'shareGuide':
            return <ShareGuideModal onClose={closeActiveModal} />;
        case 'viewOptions':
            return <ViewOptionsModal onClose={closeActiveModal} options={activeModal.props?.options} currentValues={activeModal.props?.currentValues} onApply={activeModal.props?.onApply} />;
        case 'editDebt':
            return <EditDebtModal debt={activeModal.props?.debt} onSave={(debtData, id) => {
                 if (id) {
                    dataContext.setDebts((p: Debt[]) => p.map(d => d.id === id ? { ...d, ...debtData } : d));
                } else {
                    dataContext.setDebts((p: Debt[]) => [...p, { ...debtData, id: self.crypto.randomUUID(), currentBalance: debtData.totalAmount }]);
                }
            }} onClose={closeActiveModal} />
        default:
            return null;
    }
  }

  const mainApp = (
    <>
      {showConfetti && <Confetti />}
      {undoToast && (
          <UndoToast
            message={undoToast.message}
            onUndo={undoToast.onUndo}
            onConfirm={undoToast.onConfirm}
            onClose={() => setUndoToast(null)}
          />
      )}
       {timePickerState && (
          <TimePickerModal
            initialTime={timePickerState.initialTime}
            onSave={timePickerState.onSave}
            onClose={() => setTimePickerState(null)}
          />
      )}
       {calculatorState && (
          <MiniCalculatorModal
            onClose={() => setCalculatorState(null)}
            onResult={(result) => {
              calculatorState.onResult(result);
              setCalculatorState(null);
            }}
          />
       )}
      <div className="aurora-container">
        <div className="aurora aurora-1"></div>
        <div className="aurora aurora-2"></div>
        <div className="aurora aurora-3"></div>
      </div>
      <div className="h-full w-full p-0 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="h-full w-full max-w-md mx-auto flex flex-col font-sans glass-card rounded-none sm:rounded-3xl sm:overflow-hidden shadow-2xl relative app-container z-10 no-hover">
          {!isOnline && (
            <div className="offline-indicator">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m5.09 5.09a1.5 1.5 0 11-2.122 2.122m-5.09-5.09a9 9 0 000 12.728m12.728 0a9 9 0 000-12.728" /></svg>
              <span>Offline Mode</span>
            </div>
          )}
          {screenToRender !== 'more' && (
            <Header 
              onOpenAccounts={() => openModal('accountsManager')}
              onOpenSearch={() => openModal('globalSearch')}
              onOpenAIHub={() => openModal('aiHub')}
            />
          )}
          <main ref={mainContentRef} className={`flex-grow overflow-y-auto relative pb-[68px] ${isAnimatingOut ? 'screen-transition-exit' : 'screen-transition-enter'}`}>
             <MainContent 
                activeScreen={screenToRender}
                setActiveScreen={handleScreenChange}
                modalStack={modalStack}
                setModalStack={setModalStack}
                isOnline={isOnline}
                mainContentRef={mainContentRef}
                onNavigate={onNavigate}
                isLoading={isLoading}
                initialText={sharedText}
                onSharedTextConsumed={onSharedTextConsumed}
                onGoalComplete={triggerConfetti}
                appState={appState}
                tripDetailsId={tripDetailsId}
                shoppingListId={shoppingListId}
             />
          </main>
          <Footer 
            activeScreen={activeScreen} 
            setActiveScreen={handleScreenChange} 
            onAddClick={() => openModal('addTransaction', { initialTab: 'manual' })}
          />
           {renderActiveModal()}
        </div>
      </div>
    </>
  );

  if (!guideComplete) {
      return <>
          {mainApp}
          <OnboardingGuide onFinish={() => setGuideComplete(true)} />
      </>;
  }

  return mainApp;
};


const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppDataProvider>
        <AppContent />
      </AppDataProvider>
    </SettingsProvider>
  );
};

export default App;
