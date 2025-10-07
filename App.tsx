





import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AppDataProvider, useAppContext } from './hooks/useAppContext';
import MainContent from './components/MainContent';
import Header from './components/Header';
import Footer from './components/Footer';
import { supabase } from './utils/supabase';
import type { Session } from '@supabase/supabase-js';
import { ActiveScreen, ModalState, ActiveModal, AppState, Transaction, RecurringTransaction, Account, Category, Goal, Budget, Trip, Contact, ContactGroup, Shop, ShopProduct, ShopSale, ShopEmployee, ShopShift, Refund, Debt, Note, GlossaryEntry } from './types';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import WelcomeScreen from './components/WelcomeScreen';
import OnboardingModal from './components/OnboardingModal';
import { ALL_ACHIEVEMENTS } from './utils/achievements';
import AchievementToast from './components/AchievementToast';
import Confetti from './components/Confetti';
import OnboardingGuide from './components/OnboardingGuide';

// MODALS - A central place to import and manage all modals
import AddTransactionModal from './components/AddTransactionModal';
import EditTransactionModal from './components/EditTransactionModal';
import TransferModal from './components/TransferModal';
import AccountsManagerModal from './components/AccountsManagerModal';
import EditAccountModal from './components/EditAccountModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import EditCategoryModal from './components/EditCategoryModal';
import SenderManagerModal from './components/SenderManagerModal';
import PayeesModal from './components/PayeesModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import PrivacyConsentModal from './components/PrivacyConsentModal';
import EditRecurringModal from './components/EditRecurringModal';
import EditGoalModal from './components/EditGoalModal';
import FinancialHealthModal from './components/FinancialHealthModal';
import ImportExportModal from './components/ExportModal';
import DashboardSettingsModal from './components/DashboardSettingsModal';
import FooterCustomizationModal from './components/FooterCustomizationModal';
import NotificationSettingsModal from './components/NotificationSettingsModal';
import AICommandModal from './components/AICommandModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { EditTripModal } from './components/EditTripModal';
import AddTripExpenseModal from './components/AddTripExpenseModal';
import GlobalTripSummaryModal from './components/GlobalTripSummaryModal';
import ManageTripMembersModal from './components/ManageTripMembersModal';
import EditShopModal from './components/EditShopModal';
import EditProductModal from './components/EditProductModal';
import EditEmployeeModal from './components/EditEmployeeModal';
import EditShiftModal from './components/EditShiftModal';
import RefundModal from './components/RefundModal';
import EditDebtModal from './components/EditDebtModal';
import ViewOptionsModal from './components/ViewOptionsModal';
import AddCalendarEventModal from './components/AddCalendarEventModal';
import TimePickerModal from './components/TimePickerModal';
import CameraModal from './components/CameraModal';
import AddNoteTypeModal from './components/AddNoteTypeModal';
import LinkNoteToTripModal from './components/LinkNoteToTripModal';
import EditInvoiceModal from './components/EditInvoiceModal';
import RecordPaymentModal from './components/RecordPaymentModal';
import AIChatModal from './components/AIChatModal';
import IntegrationsModal from './components/IntegrationsModal';
import MiniCalculatorModal from './components/MiniCalculatorModal';
import TrustBinModal from './components/TrustBinModal';
import ContactsManagerModal from './components/ContactsManagerModal';
import EditContactGroupModal from './components/EditContactGroupModal';
import EditContactModal from './components/EditContactModal';
import EditGlossaryEntryModal from './components/EditGlossaryEntryModal';
import ShareGuideModal from './components/ShareGuideModal';
import AIHubModal from './components/AIHubModal';
import BuyInvestmentModal from './components/BuyInvestmentModal';
import SellInvestmentModal from './components/SellInvestmentModal';
import UpdateInvestmentModal from './components/UpdateInvestmentModal';
import { SplitTransactionModal } from './components/SplitTransactionModal';
import FeedbackModal from './components/FeedbackModal';
import ManageToolsModal from './components/ManageToolsModal';


const AppContainer: React.FC = () => {
  const dataContext = useAppContext();
  const { 
      settings, isLoading, profile, transactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, contacts, contactGroups, trips, tripExpenses, shops, shopProducts, shopSales, shopEmployees, shopShifts, refunds, settlements, debts, notes, glossaryEntries, unlockedAchievements, challenges, streaks, financialProfile, invoices, payees, senders, trustBin 
  } = dataContext;

  const appState: AppState = { 
      settings, transactions, accounts, categories, budgets, recurringTransactions, goals, investmentHoldings, contacts, contactGroups, trips, tripExpenses, shops, shopProducts, shopSales, shopEmployees, shopShifts, refunds, settlements, debts, notes, glossaryEntries, unlockedAchievements, challenges, streaks, financialProfile, invoices, payees, senders, trustBin 
  };

  // UI State
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [modalStack, setModalStack] = useState<ModalState[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  
  // State for specific screen contexts
  const [tripDetailsId, setTripDetailsId] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);

  // State for transient UI effects
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastUnlockedAchievement, setLastUnlockedAchievement] = useState<string | null>(null);

  // Other hooks and refs
  const isOnline = useOnlineStatus();
  const mainContentRef = useRef<HTMLElement>(null);
  const [initialText, setInitialText] = useState<string | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.theme === 'dark' ? '#0f172a' : '#f8fafc');
  }, [settings.theme]);

  useEffect(() => {
    if (!isLoading && !settings.isSetupComplete) {
      setShowOnboarding(true);
    } else if (!isLoading && settings.isSetupComplete && !settings.hasSeenOnboarding) {
       setShowWelcomeGuide(true);
       dataContext.saveSettings({...settings, hasSeenOnboarding: true });
    }
  }, [isLoading, settings.isSetupComplete, settings.hasSeenOnboarding, dataContext, settings]);

  useEffect(() => {
    const handleSharedText = (event: MessageEvent) => {
      if (event.data && event.data.type === 'shared-text' && event.data.text) {
        setInitialText(event.data.text);
        openModal('addTransaction', { initialTab: 'auto' });
      }
    };
    navigator.serviceWorker.addEventListener('message', handleSharedText);
    return () => navigator.serviceWorker.removeEventListener('message', handleSharedText);
  }, []);

  const onNavigate = useCallback((screen: ActiveScreen, modal?: ActiveModal, props: Record<string, any> = {}) => {
    setActiveScreen(screen);
    if (props.tripId) setTripDetailsId(props.tripId);
    if (props.noteId) setNoteId(props.noteId);
    
    if (modal) {
      openModal(modal, props);
    } else {
      // Clear modals when navigating to a new screen without one
      // setModalStack([]);
    }
  }, []);
  
  const openModal = useCallback((name: ActiveModal, props: Record<string, any> = {}) => {
    setModalStack(stack => [...stack, { name, props }]);
  }, []);
  
  const closeModal = useCallback(() => {
    setModalStack(stack => stack.slice(0, -1));
  }, []);
  
  const onGoalComplete = useCallback(() => {
    setShowConfetti(true);
  }, []);
  
  const unlockedAchievement = useMemo(() => {
    if (!lastUnlockedAchievement) return null;
    return ALL_ACHIEVEMENTS.find(a => a.id === lastUnlockedAchievement);
  }, [lastUnlockedAchievement]);
  
  useEffect(() => {
    if (dataContext.newlyUnlockedAchievementId) {
        setLastUnlockedAchievement(dataContext.newlyUnlockedAchievementId);
        dataContext.setNewlyUnlockedAchievementId(null); // Consume it
    }
  }, [dataContext.newlyUnlockedAchievementId, dataContext]);

  const renderModal = () => {
    if (modalStack.length === 0) return null;
    const { name, props } = modalStack[modalStack.length - 1];
    
    // A giant switch to rule all modals
    switch (name) {
      case 'addTransaction': return <AddTransactionModal onClose={closeModal} {...props} {...dataContext} accounts={appState.accounts} contacts={appState.contacts} onOpenCalculator={(onResult) => openModal('miniCalculator', { onResult })} initialText={initialText} onInitialTextConsumed={() => setInitialText(null)} />;
      case 'editTransaction': return <EditTransactionModal onClose={closeModal} {...props} {...dataContext} accounts={appState.accounts} contacts={appState.contacts} onOpenCalculator={(onResult) => openModal('miniCalculator', { onResult })} openModal={openModal} />;
      case 'accounts': return <AccountsManagerModal onClose={closeModal} accounts={appState.accounts} onAddAccount={dataContext.onAddAccount} onEditAccount={(acc) => openModal('editAccount', { account: acc })} onDeleteAccount={(id) => dataContext.deleteItem(id, 'account')} />;
      case 'editAccount': return <EditAccountModal onClose={closeModal} {...props} onSave={(acc) => dataContext.setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a))} />;
      case 'categories': return <CategoryManagerModal onClose={closeModal} categories={appState.categories} onAddTopLevelCategory={() => openModal('editCategory')} onAddSubcategory={(p) => openModal('editCategory', { initialParentId: p.id, initialType: p.type })} onEditCategory={(cat) => openModal('editCategory', { category: cat })} onDeleteCategory={(id) => dataContext.deleteItem(id, 'category')} />;
      case 'editCategory': return <EditCategoryModal onClose={closeModal} {...props} categories={appState.categories} onSave={dataContext.onSaveCategory} />;
      case 'transfer': return <TransferModal onClose={closeModal} accounts={appState.accounts} onTransfer={dataContext.onTransfer} />;
      case 'senderManager': return <SenderManagerModal onClose={closeModal} onDelete={(id) => dataContext.deleteItem(id, 'sender')} />;
      case 'payees': return <PayeesModal onClose={closeModal} payees={appState.payees} setPayees={dataContext.setPayees} categories={appState.categories} onDelete={(id) => dataContext.deleteItem(id, 'payee')} />;
      case 'appSettings': return <AppSettingsModal onClose={closeModal} appState={appState} onRestore={() => {}} />;
      case 'privacyConsent': return <PrivacyConsentModal onConsent={() => dataContext.saveSettings({ ...settings, hasSeenPrivacy: true })} />;
      case 'editRecurring': return <EditRecurringModal onClose={closeModal} {...props} onSave={dataContext.onSaveRecurring} accounts={appState.accounts} categories={appState.categories} openModal={openModal} />;
      case 'editGoal': return <EditGoalModal onClose={closeModal} {...props} onSave={dataContext.onSaveGoal} />;
      case 'financialHealth': return <FinancialHealthModal onClose={closeModal} appState={appState} onSaveProfile={(p) => dataContext.saveSettings({...settings, financialProfile: p})} onSaveBudget={()=>{}} />;
      case 'importExport': return <ImportExportModal onClose={closeModal} appState={appState} />;
      case 'dashboardSettings': return <DashboardSettingsModal onClose={closeModal} />;
      case 'footerCustomization': return <FooterCustomizationModal onClose={closeModal} />;
      case 'notificationSettings': return <NotificationSettingsModal onClose={closeModal} budgets={appState.budgets} categories={appState.categories} />;
      case 'aiHub': return <AIHubModal onClose={closeModal} onExecuteCommand={() => Promise.resolve("")} onNavigate={onNavigate} appState={appState} />;
      case 'globalSearch': return <GlobalSearchModal onClose={closeModal} onNavigate={onNavigate} />;
      case 'editTrip': return <EditTripModal onClose={closeModal} onSave={dataContext.onSaveTrip} {...props} onSaveContact={dataContext.onSaveContact} onOpenContactsManager={() => openModal('contacts')} />;
      case 'addTripExpense': return <AddTripExpenseModal onClose={closeModal} onSave={dataContext.onSaveTripExpense} onUpdate={dataContext.onUpdateTripExpense} categories={appState.categories} findOrCreateCategory={dataContext.findOrCreateCategory} {...props} />;
      case 'tripSummary': return <GlobalTripSummaryModal onClose={closeModal} allExpenses={appState.tripExpenses} trips={appState.trips} settlements={appState.settlements} onSettle={dataContext.onSettle} />;
      case 'manageTripMembers': return <ManageTripMembersModal onClose={closeModal} {...props} />;
      case 'editShop': return <EditShopModal onCancel={closeModal} onSave={dataContext.onSaveShop} {...props} />;
      case 'editProduct': return <EditProductModal onClose={closeModal} onSave={(prod, id) => dataContext.onSaveProduct(props.shopId, prod, id)} {...props} />;
      case 'editEmployee': return <EditEmployeeModal onClose={closeModal} onSave={(emp, id) => dataContext.onSaveEmployee(props.shopId, emp, id)} {...props} />;
      case 'editShift': return <EditShiftModal onClose={closeModal} onSave={(shift, id) => dataContext.onSaveShift(props.shopId, shift, id)} openModal={openModal} {...props} />;
      case 'refund': return <RefundModal onClose={closeModal} onSave={dataContext.onSaveRefund} allTransactions={appState.transactions} accounts={appState.accounts} contacts={appState.contacts} refunds={appState.refunds} openModal={openModal} {...props} />;
      case 'editDebt': return <EditDebtModal onClose={closeModal} onSave={(debt, id) => dataContext.setDebts(p => id ? p.map(d=>d.id===id?{...d, ...debt}:d) : [...p, {id:self.crypto.randomUUID(), ...debt, currentBalance: debt.totalAmount}])} {...props} />;
      case 'viewOptions': return <ViewOptionsModal onClose={closeModal} {...props} />;
      case 'addCalendarEvent': return <AddCalendarEventModal onClose={closeModal} onNavigate={onNavigate} {...props} />;
      case 'timePicker': return <TimePickerModal onClose={closeModal} {...props} />;
      case 'camera': return <CameraModal onClose={closeModal} onCapture={props.onCapture || dataContext.onImageCapture} />;
      case 'addNoteType': return <AddNoteTypeModal onClose={closeModal} onSelect={(type, tripId) => { dataContext.onAddNote(type, tripId); closeModal(); }} {...props} />;
      case 'linkToTrip': return <LinkNoteToTripModal onClose={closeModal} trips={appState.trips} {...props} />;
      case 'editInvoice': return <EditInvoiceModal onCancel={closeModal} contacts={appState.contacts} products={appState.shopProducts} onSave={dataContext.onSaveInvoice} {...props} />;
      case 'recordPayment': return <RecordPaymentModal onClose={closeModal} accounts={appState.accounts} onSave={dataContext.onRecordInvoicePayment} {...props} />;
      case 'aiChat': return <AIChatModal onClose={closeModal} appState={appState} />;
      case 'integrations': return <IntegrationsModal onClose={closeModal} />;
      case 'miniCalculator': return <MiniCalculatorModal onClose={closeModal} {...props} />;
      case 'trustBin': return <TrustBinModal onClose={closeModal} trustBinItems={appState.trustBin} onRestore={dataContext.onRestoreItems} onPermanentDelete={dataContext.onPermanentDeleteItems} />;
      case 'contacts': return <ContactsManagerModal onClose={closeModal} onAddGroup={() => openModal('editContactGroup')} onEditGroup={(g) => openModal('editContactGroup', {group: g})} onDeleteGroup={(id) => dataContext.deleteItem(id, 'contactGroup')} onAddContact={(g) => openModal('editContact', {initialGroupId: g.id})} onEditContact={(c) => openModal('editContact', {contact: c})} onDeleteContact={(id) => dataContext.deleteItem(id, 'contact')} />;
      case 'editContactGroup': return <EditContactGroupModal onClose={closeModal} onSave={dataContext.onSaveContactGroup} {...props} />;
      case 'editContact': return <EditContactModal onClose={closeModal} onSave={dataContext.onSaveContact} {...props} />;
      case 'editGlossaryEntry': return <EditGlossaryEntryModal onClose={closeModal} onSave={dataContext.onSaveGlossaryEntry} {...props} />;
      case 'shareGuide': return <ShareGuideModal onClose={closeModal} />;
      case 'buyInvestment': return <BuyInvestmentModal onClose={closeModal} onSave={dataContext.onBuyInvestment} accounts={appState.accounts} />;
      case 'sellInvestment': return <SellInvestmentModal onClose={closeModal} onSave={dataContext.onSellInvestment} accounts={appState.accounts} {...props} />;
      case 'updateInvestment': return <UpdateInvestmentModal onClose={closeModal} onSave={dataContext.onUpdateInvestmentValue} {...props} />;
      case 'splitTransaction': return <SplitTransactionModal onCancel={closeModal} {...props} />;
      case 'feedback': return <FeedbackModal onClose={closeModal} onSend={async () => ({ queued: !isOnline })} isSending={false} />;
      case 'manageTools': return <ManageToolsModal onClose={closeModal} />;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-app"><p>Loading your financial hub...</p></div>;
  }
  
  if (!settings.hasSeenPrivacy) {
      return <PrivacyConsentModal onConsent={() => dataContext.saveSettings({...settings, hasSeenPrivacy: true})} />;
  }

  if (showOnboarding) {
    return <OnboardingModal onClose={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="app-container h-full w-full max-w-4xl mx-auto flex flex-col">
      {unlockedAchievement && <AchievementToast achievement={unlockedAchievement} onDismiss={() => setLastUnlockedAchievement(null)} />}
      {showConfetti && <Confetti onFinish={() => setShowConfetti(false)} />}
      {showWelcomeGuide && <OnboardingGuide onFinish={() => setShowWelcomeGuide(false)} />}

      <Header profile={profile} />
      <main ref={mainContentRef} className="flex-grow overflow-y-auto relative">
         <MainContent
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
            modalStack={modalStack}
            setModalStack={setModalStack}
            isOnline={isOnline}
            mainContentRef={mainContentRef}
            onNavigate={onNavigate}
            isLoading={isLoading}
            initialText={initialText}
            onSharedTextConsumed={() => setInitialText(null)}
            onGoalComplete={onGoalComplete}
            appState={appState}
            tripDetailsId={tripDetailsId}
            noteId={noteId}
            openModal={openModal}
        />
      </main>
      <Footer activeScreen={activeScreen} setActiveScreen={setActiveScreen} onAddClick={() => openModal('addTransaction')} />
      {renderModal()}
    </div>
  );
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuestSession, setIsGuestSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const handleSkipLogin = () => {
    setIsGuestSession(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-app">Loading...</div>;
  }

  if (!session && !isGuestSession) {
    return <WelcomeScreen onSkip={handleSkipLogin} />;
  }
  
  // Once logged in or skipped, the app is local-first.
  return (
      <AppDataProvider>
        <AppContainer />
      </AppDataProvider>
  );
}

export default App;