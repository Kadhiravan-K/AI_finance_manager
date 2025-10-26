import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AppDataProvider, useAppContext } from './hooks/useAppContext';
import MainContent from './components/MainContent';
import Header from './components/Header';
import Footer from './components/Footer';
import { supabase } from './utils/supabase';
import { ActiveScreen, ModalState, ActiveModal, AppState } from './types';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import OnboardingModal from './components/OnboardingModal';
import { ALL_ACHIEVEMENTS } from './utils/achievements';
import AchievementToast from './components/AchievementToast';
import Confetti from './components/Confetti';
import OnboardingGuide from './components/OnboardingGuide';
import Sidebar from './components/Sidebar';

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
import ManageAdvancesModal from './components/ManageAdvancesModal';


const AppContainer: React.FC = () => {
  const dataContext = useAppContext();
  const { 
      settings, isLoading, profile, ...appData 
  } = dataContext;

  const appState: AppState = { settings, ...appData };

  // UI State
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [modalStack, setModalStack] = useState<ModalState[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  
  // State for specific screen contexts
  const [tripDetailsId, setTripDetailsId] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);

  // State for transient UI effects
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastUnlockedAchievement, setLastUnlockedAchievement] = useState<string | null>(null);

  // Other hooks and refs
  const isOnline = useOnlineStatus();
  const [initialText, setInitialText] = useState<string | null>(null);

  const openModal = useCallback((name: ActiveModal, props?: Record<string, any>) => {
    setModalStack(stack => [...stack, { name, props }]);
  }, []);

  const closeModal = useCallback(() => {
    setModalStack(stack => stack.slice(0, -1));
  }, []);

  const openCalculator = useCallback((onResult: (result: number) => void) => {
    openModal('miniCalculator', { onResult });
  }, [openModal]);


  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.theme === 'dark' ? '#0f172a' : '#f8fafc');
  }, [settings.theme]);

  useEffect(() => {
    if (!isLoading && !settings.hasSeenPrivacy) {
      setShowPrivacyConsent(true);
    } else if (!isLoading && !settings.isSetupComplete) {
      setShowOnboarding(true);
    } else if (!isLoading && settings.isSetupComplete && !settings.hasSeenOnboarding) {
       setShowWelcomeGuide(true);
       dataContext.saveSettings({...settings, hasSeenOnboarding: true });
    }
  }, [isLoading, settings, dataContext]);

  useEffect(() => {
    const handleSharedText = (event: MessageEvent) => {
      if (event.data && event.data.type === 'shared-text' && event.data.text) {
        setInitialText(event.data.text);
        openModal('addTransaction', { initialTab: 'auto' });
      }
    };
    navigator.serviceWorker.addEventListener('message', handleSharedText);
    return () => navigator.serviceWorker.removeEventListener('message', handleSharedText);
  }, [openModal]);

  const onNavigate = useCallback((screen: ActiveScreen, modal?: ActiveModal, modalProps: Record<string, any> = {}) => {
    if (modalProps.tripId) setTripDetailsId(modalProps.tripId);
    if (modalProps.noteId) setNoteId(modalProps.noteId);
    
    setActiveScreen(screen);
    if (modal) {
        openModal(modal, modalProps);
    }
  }, [openModal]);
  
  const handleGoalComplete = () => {
    setShowConfetti(true);
  };
  
  const onSharedTextConsumed = () => setInitialText(null);

  const renderModal = () => {
    const currentModal = modalStack[modalStack.length - 1];
    if (!currentModal) return null;

    const modalProps = {
        ...currentModal.props,
        onClose: closeModal,
        openModal,
    };
    
    // Using a simplified switch case for brevity in this thought process. Actual code has all cases.
    switch (currentModal.name) {
        case 'addTransaction': return <AddTransactionModal {...modalProps} {...dataContext} onOpenCalculator={openCalculator} initialText={initialText} onInitialTextConsumed={onSharedTextConsumed} />;
        case 'editTransaction': return <EditTransactionModal {...modalProps} {...dataContext} onOpenCalculator={openCalculator} />;
        case 'transfer': return <TransferModal {...modalProps} accounts={appState.accounts} onTransfer={dataContext.onTransfer} />;
        case 'accounts': return <AccountsManagerModal {...modalProps} accounts={appState.accounts} onAddAccount={dataContext.onAddAccount} onEditAccount={(acc) => openModal('editAccount', { account: acc })} onDeleteAccount={(id) => dataContext.deleteItem(id, 'account')} />;
        case 'editAccount': return <EditAccountModal {...modalProps} onSave={(acc) => dataContext.setAccounts(p => p.map(a => a.id === acc.id ? acc : a))} />;
        case 'categories': return <CategoryManagerModal {...modalProps} categories={appState.categories} onAddTopLevelCategory={() => openModal('editCategory')} onAddSubcategory={(parent) => openModal('editCategory', { initialParentId: parent.id, initialType: parent.type })} onEditCategory={(cat) => openModal('editCategory', { category: cat })} onDeleteCategory={(id) => dataContext.deleteItem(id, 'category')} />;
        case 'editCategory': return <EditCategoryModal {...modalProps} categories={appState.categories} onSave={dataContext.onSaveCategory} />;
        case 'senderManager': return <SenderManagerModal {...modalProps} onDelete={(id) => dataContext.deleteItem(id, 'sender')} />;
        case 'payees': return <PayeesModal {...modalProps} payees={appState.payees} setPayees={dataContext.setPayees} categories={appState.categories} onDelete={(id) => dataContext.deleteItem(id, 'payee')} />;
        case 'appSettings': return <AppSettingsModal {...modalProps} appState={appState} onRestore={() => {}} />;
        case 'privacyConsent': return <PrivacyConsentModal {...modalProps} onConsent={() => { dataContext.saveSettings({...settings, hasSeenPrivacy: true }); setShowPrivacyConsent(false); }} />;
        case 'editRecurring': return <EditRecurringModal {...modalProps} onSave={dataContext.onSaveRecurring} accounts={appState.accounts} categories={appState.categories} openModal={openModal} />;
        case 'editGoal': return <EditGoalModal {...modalProps} onSave={dataContext.onSaveGoal} />;
        case 'financialHealth': return <FinancialHealthModal {...modalProps} appState={appState} onSaveProfile={dataContext.setFinancialProfile} onSaveBudget={(catId, amt) => dataContext.setBudgets(p => [...p, {id: self.crypto.randomUUID(), categoryId: catId, amount: amt, month: new Date().toISOString().slice(0, 7)}])} />;
        case 'importExport': return <ImportExportModal {...modalProps} appState={appState} />;
        case 'dashboardSettings': return <DashboardSettingsModal {...modalProps} />;
        case 'footerCustomization': return <FooterCustomizationModal {...modalProps} />;
        case 'notificationSettings': return <NotificationSettingsModal {...modalProps} budgets={appState.budgets} categories={appState.categories} />;
        case 'globalSearch': return <GlobalSearchModal {...modalProps} onNavigate={onNavigate} />;
        case 'editTrip': return <EditTripModal {...modalProps} onSave={dataContext.onSaveTrip} onSaveContact={dataContext.onSaveContact} onOpenContactsManager={() => openModal('contacts')} />;
        case 'addTripExpense': return <AddTripExpenseModal {...modalProps} onSave={(exp) => dataContext.onSaveTripExpense({...exp, tripId: modalProps.trip.id})} onUpdate={dataContext.onUpdateTripExpense} {...dataContext} />;
        case 'tripSummary': return <GlobalTripSummaryModal {...modalProps} allExpenses={appState.tripExpenses} trips={appState.trips} settlements={appState.settlements} onSettle={dataContext.onSettle} />;
        case 'manageTripMembers': return <ManageTripMembersModal {...modalProps} onUpdateTrip={dataContext.setTrips} />;
        case 'editShop': return <EditShopModal {...modalProps} onSave={dataContext.onSaveShop} onCancel={closeModal} />;
        case 'editProduct': return <EditProductModal {...modalProps} onSave={(prod, id) => dataContext.onSaveProduct(modalProps.shopId, prod, id)} />;
        case 'editEmployee': return <EditEmployeeModal {...modalProps} onSave={(emp, id) => dataContext.onSaveEmployee(modalProps.shopId, emp, id)} />;
        case 'editShift': return <EditShiftModal {...modalProps} onSave={(shift, id) => dataContext.onSaveShift(modalProps.shopId, shift, id)} employees={appState.shopEmployees.filter(e => e.shopId === modalProps.shopId)} />;
        case 'refund': return <RefundModal {...modalProps} {...dataContext} />;
        case 'editDebt': return <EditDebtModal {...modalProps} onSave={(debt, id) => id ? dataContext.setDebts(p => p.map(d => d.id === id ? {...d, ...debt} : d)) : dataContext.setDebts(p => [...p, {id:self.crypto.randomUUID(), currentBalance: debt.totalAmount, ...debt}])} />;
        case 'viewOptions': return <ViewOptionsModal {...modalProps} />;
        case 'addCalendarEvent': return <AddCalendarEventModal {...modalProps} onNavigate={onNavigate} onAddCustomEvent={(event) => dataContext.setCustomCalendarEvents(p => [...p, {id: self.crypto.randomUUID(), ...event}])} />;
        case 'timePicker': return <TimePickerModal {...modalProps} />;
        case 'camera': return <CameraModal {...modalProps} />;
        case 'addNoteType': return <AddNoteTypeModal {...modalProps} onSelect={dataContext.onAddNote} />;
        case 'linkToTrip': return <LinkNoteToTripModal {...modalProps} trips={appState.trips} onSave={(note) => dataContext.setNotes(p => p.map(n => n.id === note.id ? note : n))} />;
        case 'editInvoice': return <EditInvoiceModal {...modalProps} contacts={appState.contacts} products={appState.shopProducts} onSave={dataContext.onSaveInvoice} />;
        case 'recordPayment': return <RecordPaymentModal {...modalProps} accounts={appState.accounts} onSave={dataContext.onRecordInvoicePayment} />;
        case 'aiChat': return <AIChatModal {...modalProps} appState={appState} />;
        case 'integrations': return <IntegrationsModal {...modalProps} />;
        case 'miniCalculator': return <MiniCalculatorModal {...modalProps} />;
        case 'trustBin': return <TrustBinModal {...modalProps} trustBinItems={appState.trustBin} onRestore={dataContext.onRestoreItems} onPermanentDelete={dataContext.onPermanentDeleteItems} />;
        case 'contacts': return <ContactsManagerModal {...modalProps} onAddGroup={() => openModal('editContactGroup')} onEditGroup={(group) => openModal('editContactGroup', { group })} onDeleteGroup={(id) => dataContext.deleteItem(id, 'contactGroup')} onSaveContact={dataContext.onSaveContact} onEditContact={(contact) => openModal('editContact', { contact })} onDeleteContact={(id) => dataContext.deleteItem(id, 'contact')} />;
        case 'editContactGroup': return <EditContactGroupModal {...modalProps} onSave={dataContext.onSaveContactGroup} />;
        case 'editContact': return <EditContactModal {...modalProps} onSave={dataContext.onSaveContact} />;
        case 'editGlossaryEntry': return <EditGlossaryEntryModal {...modalProps} onSave={dataContext.onSaveGlossaryEntry} />;
        case 'shareGuide': return <ShareGuideModal {...modalProps} />;
        case 'aiHub': return <AIHubModal {...modalProps} onExecuteCommand={() => Promise.resolve("")} onNavigate={onNavigate} appState={appState} openModal={openModal} />;
        case 'buyInvestment': return <BuyInvestmentModal {...modalProps} accounts={appState.accounts} onSave={dataContext.onBuyInvestment} />;
        case 'sellInvestment': return <SellInvestmentModal {...modalProps} accounts={appState.accounts} onSave={dataContext.onSellInvestment} />;
        case 'updateInvestment': return <UpdateInvestmentModal {...modalProps} onSave={dataContext.onUpdateInvestmentValue} />;
        case 'splitTransaction': return <SplitTransactionModal {...modalProps} onCancel={closeModal} />;
        case 'feedback': return <FeedbackModal {...modalProps} onSend={() => Promise.resolve({queued: false})} isSending={false} />;
        case 'manageTools': return <ManageToolsModal {...modalProps} />;
        case 'manageAdvances': return <ManageAdvancesModal {...modalProps} onUpdateTrip={(trip) => dataContext.setTrips(p => p.map(t => t.id === trip.id ? trip : t))} />;
        default: return null;
    }
  };

  return (
    <div className={`theme-${settings.theme} ${isOnline ? 'online' : 'offline'} h-full w-full lg:flex`}>
      <Sidebar onNavigate={onNavigate} activeScreen={activeScreen} />
      <div className="main-content-area app-container">
          <Header profile={profile} openModal={openModal} />
          <main className="flex-grow overflow-y-auto">
            <MainContent 
              activeScreen={activeScreen}
              setActiveScreen={setActiveScreen}
              modalStack={modalStack}
              setModalStack={setModalStack}
              isOnline={isOnline}
              mainContentRef={useRef(null)}
              onNavigate={onNavigate}
              isLoading={isLoading}
              initialText={initialText}
              onSharedTextConsumed={onSharedTextConsumed}
              onGoalComplete={handleGoalComplete}
              appState={appState}
              tripDetailsId={tripDetailsId}
              noteId={noteId}
              openModal={openModal}
              onSaveProfile={dataContext.setFinancialProfile}
            />
          </main>
          <Footer activeScreen={activeScreen} setActiveScreen={setActiveScreen} onAddClick={() => openModal('addTransaction')} />
      </div>

      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      {showPrivacyConsent && <PrivacyConsentModal onConsent={() => { dataContext.saveSettings({...settings, hasSeenPrivacy: true }); setShowPrivacyConsent(false); }} />}
      {showWelcomeGuide && <OnboardingGuide onFinish={() => setShowWelcomeGuide(false)} />}
      {renderModal()}
      {lastUnlockedAchievement && (
        <AchievementToast
          achievement={ALL_ACHIEVEMENTS.find(a => a.id === lastUnlockedAchievement)!}
          onDismiss={() => setLastUnlockedAchievement(null)}
        />
      )}
      {showConfetti && <Confetti onFinish={() => setShowConfetti(false)} />}
    </div>
  );
};

const App: React.FC = () => (
  <AppDataProvider>
    <AppContainer />
  </AppDataProvider>
);

export default App;