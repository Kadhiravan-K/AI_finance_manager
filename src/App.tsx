

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppDataProvider, useAppContext } from '@/hooks/useAppContext';
import MainContent from '@/components/layout/MainContent';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ActiveScreen, ModalState, ActiveModal, AppState } from '@/types';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import OnboardingModal from '@/components/settings/OnboardingModal';
import { ALL_ACHIEVEMENTS } from '@/utils/achievements';
import AchievementToast from '@/components/common/AchievementToast';
import Confetti from '@/components/common/Confetti';
import OnboardingGuide from '@/components/settings/OnboardingGuide';
import Sidebar from '@/components/layout/Sidebar';
import AuthModal from '@/components/modals/AuthModal';

// MODALS
import AddTransactionModal from '@/components/finance/AddTransactionModal';
import EditTransactionModal from '@/components/finance/EditTransactionModal';
import TransferModal from '@/components/finance/TransferModal';
import AccountsManagerModal from '@/components/finance/AccountsManagerModal';
import EditAccountModal from '@/components/finance/EditAccountModal';
import CategoryManagerModal from '@/components/finance/CategoryManagerModal';
import EditCategoryModal from '@/components/finance/EditCategoryModal';
import SenderManagerModal from '@/components/finance/SenderManagerModal';
import PayeesModal from '@/components/finance/PayeesModal';
import { AppSettingsModal } from '@/components/settings/AppSettingsModal';
import PrivacyConsentModal from '@/components/settings/PrivacyConsentModal';
import EditRecurringModal from '@/components/finance/EditRecurringModal';
import EditGoalModal from '@/components/finance/EditGoalModal';
import FinancialHealthModal from '@/components/finance/FinancialHealthModal';
import ImportExportModal from '@/components/finance/ImportExportModal';
import DashboardSettingsModal from '@/components/settings/DashboardSettingsModal';
import FooterCustomizationModal from '@/components/settings/FooterCustomizationModal';
import NotificationSettingsModal from '@/components/settings/NotificationSettingsModal';
import { GlobalSearchModal } from '@/components/modals/GlobalSearchModal';
import { EditTripModal } from '@/components/trip/EditTripModal';
import AddTripExpenseModal from '@/components/trip/AddTripExpenseModal';
import GlobalTripSummaryModal from '@/components/trip/GlobalTripSummaryModal';
import ManageTripMembersModal from '@/components/trip/ManageTripMembersModal';
import EditShopModal from '@/components/shop/EditShopModal';
import EditProductModal from '@/components/shop/EditProductModal';
import EditEmployeeModal from '@/components/shop/EditEmployeeModal';
import EditShiftModal from '@/components/shop/EditShiftModal';
import RefundModal from '@/components/finance/RefundModal';
import EditDebtModal from '@/components/finance/EditDebtModal';
import ViewOptionsModal from '@/components/modals/ViewOptionsModal';
import AddCalendarEventModal from '@/components/modals/AddCalendarEventModal';
import TimePickerModal from '@/components/modals/TimePickerModal';
import CameraModal from '@/components/modals/CameraModal';
import AddNoteTypeModal from '@/components/notes/AddNoteTypeModal';
import LinkNoteToTripModal from '@/components/trip/LinkNoteToTripModal';
import EditInvoiceModal from '@/components/shop/EditInvoiceModal';
import RecordPaymentModal from '@/components/finance/RecordPaymentModal';
import AIChatModal from '@/components/ai/AIChatModal';
import IntegrationsModal from '@/components/modals/IntegrationsModal';
import MiniCalculatorModal from '@/components/modals/MiniCalculatorModal';
import TrustBinModal from '@/components/modals/TrustBinModal';
import ContactsManagerModal from '@/components/modals/ContactsManagerModal';
import EditContactGroupModal from '@/components/modals/EditContactGroupModal';
import EditContactModal from '@/components/modals/EditContactModal';
import EditGlossaryEntryModal from '@/components/notes/EditGlossaryEntryModal';
import ShareGuideModal from '@/components/modals/ShareGuideModal';
import AIHubModal from '@/components/ai/AIHubModal';
import BuyInvestmentModal from '@/components/finance/BuyInvestmentModal';
import SellInvestmentModal from '@/components/finance/SellInvestmentModal';
import UpdateInvestmentModal from '@/components/finance/UpdateInvestmentModal';
import { SplitTransactionModal } from '@/components/finance/SplitTransactionModal';
import FeedbackModal from '@/components/modals/FeedbackModal';
import ManageToolsModal from '@/components/modals/ManageToolsModal';
import ManageAdvancesModal from '@/components/trip/ManageAdvancesModal';


const AppContainer: React.FC = () => {
  const dataContext = useAppContext();
  const { 
      settings, isLoading, profile, ...appData 
  } = dataContext;

  const appState: AppState = { settings, ...appData } as any;

  // UI State
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [modalStack, setModalStack] = useState<ModalState[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
       dataContext.setSettings({...settings, hasSeenOnboarding: true });
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
    setIsSidebarOpen(false);
  }, [openModal]);
  
  const handleGoalComplete = () => {
    setShowConfetti(true);
  };
  
  const onSharedTextConsumed = () => setInitialText(null);

  const renderModal = () => {
    const currentModal = modalStack[modalStack.length - 1];
    if (!currentModal) return null;

    // Fix: Explicitly type and cast modalProps to resolve missing property errors in the switch statement.
    const modalProps = {
        ...currentModal.props,
        onClose: closeModal,
        openModal,
    };
    
    switch (currentModal.name) {
        case 'auth': return <AuthModal {...modalProps} onSuccess={() => {}} />;
        case 'addTransaction': return <AddTransactionModal {...(modalProps as any)} {...dataContext} onOpenCalculator={openCalculator} initialText={initialText} onInitialTextConsumed={onSharedTextConsumed} />;
        case 'editTransaction': return <EditTransactionModal {...(modalProps as any)} {...dataContext} onOpenCalculator={openCalculator} />;
        case 'transfer': return <TransferModal {...(modalProps as any)} accounts={appState.accounts} onTransfer={dataContext.onTransfer} />;
        case 'accounts': return <AccountsManagerModal {...(modalProps as any)} accounts={appState.accounts} onAddAccount={dataContext.onAddAccount} onEditAccount={(acc) => openModal('editAccount', { account: acc })} onDeleteAccount={(id) => dataContext.deleteItem(id, 'account')} />;
        case 'editAccount': return <EditAccountModal {...(modalProps as any)} onSave={(acc) => dataContext.setAccounts(p => p.map(a => a.id === acc.id ? acc : a))} />;
        case 'categories': return <CategoryManagerModal {...(modalProps as any)} categories={appState.categories} onAddTopLevelCategory={() => openModal('editCategory')} onAddSubcategory={(parent) => openModal('editCategory', { initialParentId: parent.id, initialType: parent.type })} onEditCategory={(cat) => openModal('editCategory', { category: cat })} onDeleteCategory={(id) => dataContext.deleteItem(id, 'category')} />;
        case 'editCategory': return <EditCategoryModal {...(modalProps as any)} categories={appState.categories} onSave={dataContext.onSaveCategory} />;
        case 'senderManager': return <SenderManagerModal {...(modalProps as any)} onDelete={(id) => dataContext.deleteItem(id, 'sender')} />;
        case 'payees': return <PayeesModal {...(modalProps as any)} payees={appState.payees} setPayees={dataContext.setPayees} categories={appState.categories} onDelete={(id) => dataContext.deleteItem(id, 'payee')} />;
        case 'appSettings': return <AppSettingsModal {...(modalProps as any)} appState={appState} onRestore={() => {}} />;
        case 'privacyConsent': return <PrivacyConsentModal {...(modalProps as any)} onConsent={() => { dataContext.setSettings({...settings, hasSeenPrivacy: true }); setShowPrivacyConsent(false); }} />;
        case 'editRecurring': return <EditRecurringModal {...(modalProps as any)} onSave={dataContext.onSaveRecurring} accounts={appState.accounts} categories={appState.categories} openModal={openModal} />;
        case 'editGoal': return <EditGoalModal {...(modalProps as any)} onSave={dataContext.onSaveGoal} />;
        case 'financialHealth': return <FinancialHealthModal {...(modalProps as any)} appState={appState} onSaveProfile={dataContext.setFinancialProfile} onSaveBudget={(catId, amt) => dataContext.setBudgets(p => [...p, {id: self.crypto.randomUUID(), categoryId: catId, amount: amt, month: new Date().toISOString().slice(0, 7)}])} />;
        case 'importExport': return <ImportExportModal {...(modalProps as any)} appState={appState} />;
        case 'dashboardSettings': return <DashboardSettingsModal {...(modalProps as any)} />;
        case 'footerCustomization': return <FooterCustomizationModal {...(modalProps as any)} />;
        case 'notificationSettings': return <NotificationSettingsModal {...(modalProps as any)} budgets={appState.budgets} categories={appState.categories} />;
        case 'globalSearch': return <GlobalSearchModal {...(modalProps as any)} onNavigate={onNavigate} />;
        case 'editTrip': return <EditTripModal {...(modalProps as any)} onSave={dataContext.onSaveTrip} onSaveContact={dataContext.onSaveContact} onOpenContactsManager={() => openModal('contacts')} />;
        case 'addTripExpense': return <AddTripExpenseModal {...(modalProps as any)} onSave={(exp) => dataContext.onSaveTripExpense({...exp, tripId: (modalProps as any).trip.id})} onUpdate={dataContext.onUpdateTripExpense} {...dataContext} />;
        case 'tripSummary': return <GlobalTripSummaryModal {...(modalProps as any)} allExpenses={appState.tripExpenses} trips={appState.trips} settlements={appState.settlements} onSettle={dataContext.onSettle} />;
        case 'manageTripMembers': return <ManageTripMembersModal {...(modalProps as any)} onUpdateTrip={dataContext.setTrips} />;
        case 'editShop': return <EditShopModal {...(modalProps as any)} onSave={dataContext.onSaveShop} onCancel={closeModal} />;
        case 'editProduct': return <EditProductModal {...(modalProps as any)} onSave={(prod, id) => dataContext.onSaveProduct((modalProps as any).shopId, prod, id)} />;
        case 'editEmployee': return <EditEmployeeModal {...(modalProps as any)} onSave={(emp, id) => dataContext.onSaveEmployee((modalProps as any).shopId, emp, id)} />;
        case 'editShift': return <EditShiftModal {...(modalProps as any)} onSave={(shift, id) => dataContext.onSaveShift((modalProps as any).shopId, shift, id)} employees={appState.shopEmployees.filter(e => e.shopId === (modalProps as any).shopId)} />;
        case 'refund': return <RefundModal {...(modalProps as any)} {...dataContext} />;
        case 'editDebt': return <EditDebtModal {...(modalProps as any)} onSave={(debt, id) => id ? dataContext.setDebts(p => p.map(d => d.id === id ? {...d, ...debt} : d)) : dataContext.setDebts(p => [...p, {id:self.crypto.randomUUID(), currentBalance: debt.totalAmount, ...debt}])} />;
        case 'viewOptions': return <ViewOptionsModal {...(modalProps as any)} />;
        case 'addCalendarEvent': return <AddCalendarEventModal {...(modalProps as any)} onNavigate={onNavigate} onAddCustomEvent={(event) => dataContext.setCustomCalendarEvents(p => [...p, {id: self.crypto.randomUUID(), ...event}])} />;
        case 'timePicker': return <TimePickerModal {...(modalProps as any)} />;
        case 'camera': return <CameraModal {...(modalProps as any)} />;
        case 'addNoteType': return <AddNoteTypeModal {...(modalProps as any)} onSelect={dataContext.onAddNote} />;
        case 'linkToTrip': return <LinkNoteToTripModal {...(modalProps as any)} trips={appState.trips} onSave={(note) => dataContext.setNotes(p => p.map(n => n.id === note.id ? note : n))} />;
        case 'editInvoice': return <EditInvoiceModal {...(modalProps as any)} contacts={appState.contacts} products={appState.shopProducts} onSave={dataContext.onSaveInvoice} />;
        case 'recordPayment': return <RecordPaymentModal {...(modalProps as any)} accounts={appState.accounts} onSave={dataContext.onRecordInvoicePayment} />;
        case 'aiChat': return <AIChatModal {...(modalProps as any)} appState={appState} />;
        case 'integrations': return <IntegrationsModal {...(modalProps as any)} />;
        case 'miniCalculator': return <MiniCalculatorModal {...(modalProps as any)} />;
        case 'trustBin': return <TrustBinModal {...(modalProps as any)} trustBinItems={appState.trustBin} onRestore={dataContext.onRestoreItems} onPermanentDelete={dataContext.onPermanentDeleteItems} />;
        case 'contacts': return <ContactsManagerModal {...(modalProps as any)} onAddGroup={() => openModal('editContactGroup')} onEditGroup={(group) => openModal('editContactGroup', { group })} onDeleteGroup={(id) => dataContext.deleteItem(id, 'contactGroup')} onSaveContact={dataContext.onSaveContact} onEditContact={(contact) => openModal('editContact', { contact })} onDeleteContact={(id) => dataContext.deleteItem(id, 'contact')} />;
        case 'editContactGroup': return <EditContactGroupModal {...(modalProps as any)} onSave={dataContext.onSaveContactGroup} />;
        case 'editContact': return <EditContactModal {...(modalProps as any)} onSave={dataContext.onSaveContact} />;
        case 'editGlossaryEntry': return <EditGlossaryEntryModal {...(modalProps as any)} onSave={dataContext.onSaveGlossaryEntry} />;
        case 'shareGuide': return <ShareGuideModal {...(modalProps as any)} />;
        case 'aiHub': return <AIHubModal {...(modalProps as any)} onExecuteCommand={() => Promise.resolve("")} onNavigate={onNavigate} appState={appState} openModal={openModal} />;
        case 'buyInvestment': return <BuyInvestmentModal {...(modalProps as any)} accounts={appState.accounts} onSave={dataContext.onBuyInvestment} />;
        case 'sellInvestment': return <SellInvestmentModal {...(modalProps as any)} accounts={appState.accounts} onSave={dataContext.onSellInvestment} />;
        case 'updateInvestment': return <UpdateInvestmentModal {...(modalProps as any)} onSave={dataContext.onUpdateInvestmentValue} />;
        case 'splitTransaction': return <SplitTransactionModal {...(modalProps as any)} onCancel={closeModal} onSave={(modalProps as any).onSave} />;
        case 'feedback': return <FeedbackModal {...(modalProps as any)} onSend={() => Promise.resolve({queued: false})} isSending={false} />;
        case 'manageTools': return <ManageToolsModal {...(modalProps as any)} />;
        case 'manageAdvances': return <ManageAdvancesModal {...(modalProps as any)} onUpdateTrip={(trip) => dataContext.setTrips(p => p.map(t => t.id === trip.id ? trip : t))} />;
        default: return null;
    }
  };

  return (
    <div className={`theme-${settings.theme} ${isOnline ? 'online' : 'offline'} h-full w-full lg:flex`}>
      <Sidebar 
        onNavigate={onNavigate} 
        activeScreen={activeScreen}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="main-content-area app-container">
          <Header 
            profile={profile} 
            openModal={openModal} 
            onMenuClick={() => setIsSidebarOpen(true)}
          />
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
      {showPrivacyConsent && <PrivacyConsentModal onConsent={() => { dataContext.setSettings({...settings, hasSeenPrivacy: true }); setShowPrivacyConsent(false); }} />}
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
