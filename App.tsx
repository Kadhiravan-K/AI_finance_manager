
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { AppProvider, SettingsContext, AppDataContext } from './contexts/SettingsContext';
import { ActiveScreen, ModalState, ActiveModal, Transaction, Category, Account, Payee, Sender, Contact, ContactGroup, Goal, RecurringTransaction, InvestmentHolding, AppState, UnlockedAchievement, Challenge, Trip, TripExpense, Refund, Settlement, Shop, ShopProduct, ShopSale, ShopEmployee, ShopShift, Note, GlossaryEntry, Debt, Invoice, TransactionType, ItemizedDetail } from './types';
import { checkAchievements, ALL_ACHIEVEMENTS } from './utils/achievements';
import { checkAndSendNotifications, requestNotificationPermission } from './utils/notifications';

// Dynamically import components
const Header = lazy(() => import('./components/Header'));
const Footer = lazy(() => import('./components/Footer'));
const MainContent = lazy(() => import('./components/MainContent'));
const AddTransactionModal = lazy(() => import('./components/AddTransactionModal'));
const EditTransactionModal = lazy(() => import('./components/EditTransactionModal'));
const AccountsManagerModal = lazy(() => import('./components/AccountsManagerModal'));
const EditAccountModal = lazy(() => import('./components/EditAccountModal'));
const CategoryManagerModal = lazy(() => import('./components/CategoryManagerModal'));
const EditCategoryModal = lazy(() => import('./components/EditCategoryModal'));
const TransferModal = lazy(() => import('./components/TransferModal'));
const AppSettingsModal = lazy(() => import('./components/AppSettingsModal'));
const SenderManagerModal = lazy(() => import('./components/SenderManagerModal'));
const PayeesModal = lazy(() => import('./components/PayeesModal'));
const EditGoalModal = lazy(() => import('./components/EditGoalModal'));
const EditRecurringModal = lazy(() => import('./components/EditRecurringModal'));
const BuyInvestmentModal = lazy(() => import('./components/BuyInvestmentModal'));
const SellInvestmentModal = lazy(() => import('./components/SellInvestmentModal'));
const UpdateInvestmentModal = lazy(() => import('./components/UpdateInvestmentModal'));
const PrivacyConsentModal = lazy(() => import('./components/PrivacyConsentModal'));
const OnboardingModal = lazy(() => import('./components/OnboardingModal'));
const FinancialHealthModal = lazy(() => import('./components/FinancialHealthModal'));
const DashboardSettingsModal = lazy(() => import('./components/DashboardSettingsModal'));
const NotificationSettingsModal = lazy(() => import('./components/NotificationSettingsModal'));
const ExportModal = lazy(() => import('./components/ExportModal'));
const GlobalSearchModal = lazy(() => import('./components/GlobalSearchModal'));
const AIHubModal = lazy(() => import('./components/AIHubModal'));
const AIChatModal = lazy(() => import('./components/AIChatModal'));
const EditTripModal = lazy(() => import('./components/EditTripModal'));
const AddTripExpenseModal = lazy(() => import('./components/AddTripExpenseModal'));
const GlobalTripSummaryModal = lazy(() => import('./components/GlobalTripSummaryModal'));
const SplitTransactionModal = lazy(() => import('./components/SplitTransactionModal'));
const ContactsManagerModal = lazy(() => import('./components/ContactsManagerModal'));
const EditContactModal = lazy(() => import('./components/EditContactModal'));
const EditContactGroupModal = lazy(() => import('./components/EditContactGroupModal'));
const EditShopModal = lazy(() => import('./components/EditShopModal'));
const EditNoteModal = lazy(() => import('./components/EditNoteModal'));
const RefundModal = lazy(() => import('./components/RefundModal'));
const AddCalendarEventModal = lazy(() => import('./components/AddCalendarEventModal'));
const TimePickerModal = lazy(() => import('./components/TimePickerModal'));
const CameraModal = lazy(() => import('./components/CameraModal'));
const EditDebtModal = lazy(() => import('./components/EditDebtModal'));
const ViewOptionsModal = lazy(() => import('./components/ViewOptionsModal'));
const FooterCustomizationModal = lazy(() => import('./components/FooterCustomizationModal'));
const ManageToolsModal = lazy(() => import('./components/ManageToolsModal'));
const ShareGuideModal = lazy(() => import('./components/ShareGuideModal'));
const IntegrationsModal = lazy(() => import('./components/IntegrationsModal'));
const TrustBinModal = lazy(() => import('./components/TrustBinModal'));
const FeedbackModal = lazy(() => import('./components/FeedbackModal'));
const EditGlossaryEntryModal = lazy(() => import('./components/EditGlossaryEntryModal'));
const SplitItemModal = lazy(() => import('./components/SplitItemModal'));
const AICommandModal = lazy(() => import('./components/AICommandModal'));
const MiniCalculatorModal = lazy(() => import('./components/MiniCalculatorModal'));
const AchievementToast = lazy(() => import('./components/AchievementToast'));
const OnboardingGuide = lazy(() => import('./components/OnboardingGuide'));
const UndoToast = lazy(() => import('./components/UndoToast'));
const EditInvoiceModal = lazy(() => import('./components/EditInvoiceModal'));
const RecordPaymentModal = lazy(() => import('./components/RecordPaymentModal'));
const EditProductModal = lazy(() => import('./components/EditProductModal'));
const AddNoteTypeModal = lazy(() => import('./components/AddNoteTypeModal'));
const LinkNoteToTripModal = lazy(() => import('./components/LinkNoteToTripModal'));


import { parseTransactionText, parseReceiptImage } from './services/geminiService';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import Confetti from './components/Confetti';
import { USER_SELF_ID } from './constants';

const AppContent: React.FC = () => {
    const settingsContext = React.useContext(SettingsContext);
    const dataContext = React.useContext(AppDataContext);
    
    // UI State
    const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
    const [modalStack, setModalStack] = useState<ModalState[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const [tripDetailsId, setTripDetailsId] = useState<string | null>(null);
    const [noteId, setNoteId] = useState<string | null>(null);
    const [lastUnlockedAchievement, setLastUnlockedAchievement] = useState<UnlockedAchievement | null>(null);
    const [undoState, setUndoState] = useState<{ message: string, onUndo: () => void, onConfirm: () => void } | null>(null);
    const [sharedText, setSharedText] = useState<string | null>(null);
    const mainContentRef = useRef<HTMLElement>(null);
    const isOnline = useOnlineStatus();

    // App State Check
    const [hasConsented, setHasConsented] = useState<boolean | null>(null);
    const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

    useEffect(() => {
        const consent = localStorage.getItem('privacyConsent');
        setHasConsented(consent === 'true');
        const onboarded = localStorage.getItem('isOnboarded');
        setIsOnboarded(onboarded === 'true');
        setIsLoading(false);
    }, []);
    
    const handleConsent = () => {
        localStorage.setItem('privacyConsent', 'true');
        setHasConsented(true);
    };

    const handleOnboardingFinish = () => {
        localStorage.setItem('isOnboarded', 'true');
        setIsOnboarded(true);
    };
    
    const openModal = useCallback((name: ActiveModal, props: Record<string, any> = {}) => {
        setModalStack(stack => [...stack, { name, props }]);
    }, []);

    const closeModal = useCallback(() => {
        setModalStack(stack => stack.slice(0, -1));
    }, []);

    const onNavigate = useCallback((screen: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>) => {
        if (modal) {
            openModal(modal, modalProps);
        }
        if (screen === 'tripDetails' && modalProps?.tripId) setTripDetailsId(modalProps.tripId);
        else if (screen === 'notes' && modalProps?.noteId) setNoteId(modalProps.noteId);
        setActiveScreen(screen);
    }, [openModal]);


    // Data Handling & Logic
    const handleSaveTransactionAuto = async (text: string, accountId?: string) => {
        const data = await parseTransactionText(text);
        if (data) {
            // ... (rest of the logic)
        }
    };
    
    // ... many more handlers for saving, updating, deleting data
    // These will call functions from the dataContext
    
    const appState = { 
        ...(dataContext || {}), 
        ...(settingsContext || {}),
    } as AppState;

    if (isLoading || hasConsented === null || isOnboarded === null || !dataContext || !settingsContext) {
        return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Loading...</div>;
    }

    if (!hasConsented) return <Suspense fallback=""><PrivacyConsentModal onConsent={handleConsent} /></Suspense>;
    if (!isOnboarded) return <Suspense fallback=""><OnboardingModal onFinish={handleOnboardingFinish} /></Suspense>;

    const currentModal = modalStack[modalStack.length - 1];

    const renderModal = () => {
        if (!currentModal || !settingsContext || !dataContext) return null;
        switch(currentModal.name) {
            // Add cases for all modals here...
            case 'addTransaction': return <AddTransactionModal onCancel={closeModal} onSaveAuto={handleSaveTransactionAuto} onSaveManual={(t) => dataContext.setTransactions(p => [t, ...p])} accounts={dataContext.accounts} contacts={settingsContext.contacts} openModal={openModal} onOpenCalculator={(cb) => openModal('miniCalculator', {onResult: cb})} initialText={sharedText} onInitialTextConsumed={() => setSharedText(null)} {...currentModal.props} />;
            case 'editTransaction': return currentModal.props?.transaction ? <EditTransactionModal transaction={currentModal.props.transaction} onClose={closeModal} onSave={(t) => dataContext.onUpdateTransaction(t)} accounts={dataContext.accounts} contacts={settingsContext.contacts} openModal={openModal} onOpenCalculator={(cb) => openModal('miniCalculator', { onResult: cb })} {...currentModal.props} /> : null;
            case 'editInvoice': return currentModal.props?.shop ? <EditInvoiceModal shop={currentModal.props.shop} onCancel={closeModal} onSave={dataContext.saveInvoice} contacts={settingsContext.contacts} products={dataContext.shopProducts} {...currentModal.props} /> : null;
            case 'recordPayment': return currentModal.props?.invoice ? <RecordPaymentModal invoice={currentModal.props.invoice} onClose={closeModal} onSave={dataContext.recordPaymentForInvoice} accounts={dataContext.accounts} {...currentModal.props} /> : null;
            case 'editTrip': return <EditTripModal onClose={closeModal} onSave={(tripData, id) => {
                if(id) {
                    dataContext.setTrips(p => p.map(t => t.id === id ? {...t, ...tripData, date: tripData.plan && tripData.plan.length > 0 ? tripData.plan[0].date : t.date } : t));
                } else {
                    const newTrip: Trip = {id: self.crypto.randomUUID(), date: new Date().toISOString(), ...tripData};
                    dataContext.setTrips(p => [newTrip, ...p]);
                    // Navigate to the new trip's details page
                    onNavigate('tripDetails', undefined, {tripId: newTrip.id});
                }
            }} onSaveContact={(contactData, id) => {
                let newContact: Contact;
                if(id) {
                    let updatedContact: Contact | undefined;
                    settingsContext.setContacts(p => p.map(c => {
                        if (c.id === id) {
                            updatedContact = {...c, ...contactData};
                            return updatedContact;
                        }
                        return c;
                    }));
                    newContact = updatedContact!;
                } else {
                    newContact = {id: self.crypto.randomUUID(), ...contactData};
                    settingsContext.setContacts(p => [...p, newContact]);
                }
                return newContact;
            }} onOpenContactsManager={() => openModal('contacts')} {...currentModal.props} />;
            case 'editProduct': return currentModal.props?.shopId ? <EditProductModal onClose={closeModal} onSave={(productData, id) => {
                 dataContext.onSaveProduct(currentModal.props.shopId, productData, id);
            }} {...currentModal.props} /> : null;

            case 'addNoteType': return <AddNoteTypeModal onClose={closeModal} onSelect={(type, tripId) => {
                closeModal();
                currentModal.props.onAdd(type, tripId);
            }} {...currentModal.props} />;

            case 'linkToTrip': return <LinkNoteToTripModal onClose={closeModal} note={currentModal.props.note} trips={dataContext.trips} onSave={(note) => {
                closeModal();
                currentModal.props.onSave(note);
            }} {...currentModal.props} />;

            // ... other modals
            default: return null;
        }
    }

    return (
        <div className={`h-full w-full max-w-2xl mx-auto flex flex-col relative app-container ${settingsContext.settings.theme}`}>
            <div className="aurora-container">
                <div className="aurora aurora-1"></div>
                <div className="aurora aurora-2"></div>
                <div className="aurora aurora-3"></div>
            </div>
            <Suspense fallback={<div className="h-[69px]" />}>
                <Header onOpenAccounts={() => openModal('accountsManager')} onOpenSearch={() => openModal('globalSearch')} onOpenAIHub={() => openModal('aiHub')} />
            </Suspense>
            <main ref={mainContentRef} className="flex-grow overflow-y-auto relative">
                <Suspense fallback={<div className="p-4"><div className="h-28 mb-6 skeleton-loader"></div></div>}>
                    <MainContent 
                        activeScreen={activeScreen} 
                        setActiveScreen={setActiveScreen} 
                        modalStack={modalStack} 
                        setModalStack={setModalStack} 
                        isOnline={isOnline} 
                        mainContentRef={mainContentRef} 
                        onNavigate={onNavigate} 
                        isLoading={isLoading} 
                        initialText={sharedText} 
                        onSharedTextConsumed={() => setSharedText(null)}
                        onGoalComplete={() => setShowConfetti(true)}
                        appState={appState}
                        tripDetailsId={tripDetailsId}
                        noteId={noteId}
                        openModal={openModal}
                    />
                </Suspense>
            </main>
            <Suspense fallback={<div className="h-[68px]" />}>
                <Footer activeScreen={activeScreen} setActiveScreen={setActiveScreen} onAddClick={() => openModal('addTransaction')} />
            </Suspense>
            <Suspense fallback="">
                {renderModal()}
            </Suspense>
             {showConfetti && <Confetti />}
        </div>
    );
};

const App: React.FC = () => (
    <AppProvider>
        <AppContent />
    </AppProvider>
);

export default App;
