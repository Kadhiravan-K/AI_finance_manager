

import React, { useState, useContext, useCallback, Dispatch, SetStateAction, useEffect } from 'react';
import { ActiveScreen, AppState, ModalState, ActiveModal, Transaction, RecurringTransaction, Account, AccountType, Goal, Budget, Trip, ShopSale, ShopProduct, TransactionType, Debt, Note, ItemizedDetail, TripExpense, DateRange, CustomDateRange } from './types';
import FinanceDisplay from './components/FinanceDisplay';
import { ReportsScreen } from './components/ReportsScreen';
import BudgetsScreen from './components/BudgetsModal';
import GoalsScreen from './components/GoalsModal';
import InvestmentsScreen from './components/InvestmentsScreen';
import ScheduledPaymentsScreen from './components/ScheduledPaymentsScreen';
import MoreScreen from './components/More';
import TripManagementScreen from './components/TripManagementScreen';
import TripDetailsScreen from './components/TripDetailsScreen';
import CalculatorScreen from './components/CalculatorScreen';
import AchievementsScreen from './components/AchievementsScreen';
import RefundsScreen from './components/RefundsScreen';
import DataHubScreen from './components/DataHubScreen';
import { ShopScreen } from './components/ShopScreen';
import ChallengesScreen from './components/ChallengesScreen';
import LearnScreen from './components/LearnScreen';
import CalendarScreen from './components/CalendarScreen';
import { NotesScreen } from './components/NotesScreen';
import SubscriptionsScreen from './components/SubscriptionsScreen';
import GlossaryScreen from './components/GlossaryScreen';
import ManualScreen from './components/ManualScreen';
import { AppDataContext } from './contexts/SettingsContext';
import { parseNaturalLanguageQuery } from './services/geminiService';
import { calculateNextDueDate } from './utils/date';
import DebtManagerScreen from './components/DebtManagerScreen';
import FaqScreen from './components/FaqScreen';
import LiveFeedScreen from './components/LiveFeedScreen';
import { USER_SELF_ID } from './types';


interface MainContentProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  modalStack: ModalState[];
  setModalStack: React.Dispatch<React.SetStateAction<ModalState[]>>;
  isOnline: boolean;
  mainContentRef: React.RefObject<HTMLElement>;
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => void;
  isLoading: boolean;
  initialText: string | null;
  onSharedTextConsumed: () => void;
  onGoalComplete: () => void;
  appState: AppState;
  tripDetailsId: string | null;
  noteId: string | null;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

const MainContent: React.FC<MainContentProps> = (props) => {
  const { activeScreen, appState, mainContentRef, isLoading, onNavigate, setActiveScreen, setModalStack, onGoalComplete, tripDetailsId, noteId, openModal } = props;

  const dataContext = useContext(AppDataContext);
  const [isResponsive, setIsResponsive] = useState(window.innerWidth >= 640 && window.matchMedia("(orientation: landscape)").matches);

  useEffect(() => {
    const checkResponsive = () => {
      setIsResponsive(window.innerWidth >= 640 && window.matchMedia("(orientation: landscape)").matches);
    };
    window.addEventListener('resize', checkResponsive);
    return () => window.removeEventListener('resize', checkResponsive);
  }, []);

  if (!dataContext) {
    return null; // Or a loading spinner
  }
  
  const { 
    selectedAccountIds, 
    setSelectedAccountIds, 
    deleteItem, 
    onAddAccount, 
    onDeleteAccount,
    setRecurringTransactions,
    setGoals,
    setInvestmentHoldings,
    setTrips,
    setShops,
    setShopProducts,
    setShopSales,
    setShopEmployees,
    setShopShifts,
    setChallenges,
    setRefunds,
    setTransactions,
    findOrCreateCategory,
    updateStreak,
    onUpdateTransaction,
    setDebts,
    setBudgets,
    onSaveProduct,
  } = dataContext;

  const handleContributeToGoal = (goalId: string, amount: number, accountId: string) => {
    const goal = appState.goals.find(g => g.id === goalId);
    if (!goal) return;

    const transaction: Transaction = {
        id: self.crypto.randomUUID(),
        accountId,
        description: `Contribution to goal: ${goal.name}`,
        amount,
        type: TransactionType.EXPENSE,
        categoryId: findOrCreateCategory('Savings & Investment / Goal Contributions', TransactionType.EXPENSE),
        date: new Date().toISOString(),
    };
    setTransactions(prev => [transaction, ...prev]);
    updateStreak();

    const newCurrentAmount = goal.currentAmount + amount;
    const updatedGoal = { ...goal, currentAmount: newCurrentAmount };
    setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));

    if (newCurrentAmount >= goal.targetAmount && goal.currentAmount < goal.targetAmount) { // only trigger on completion
        onGoalComplete();
    }
  };
  
  const handlePayRecurring = (item: RecurringTransaction) => {
    const transaction: Transaction = {
        id: self.crypto.randomUUID(),
        accountId: item.accountId,
        description: item.description,
        amount: item.amount,
        type: item.type,
        categoryId: item.categoryId,
        date: new Date().toISOString(),
        notes: `Recurring payment: ${item.description}`,
    };
    setTransactions(prev => [transaction, ...prev]);
    updateStreak();

    const nextDueDate = calculateNextDueDate(item.nextDueDate, item);
    const updatedItem = { ...item, nextDueDate: nextDueDate.toISOString() };
    setRecurringTransactions(prev => prev.map(rt => rt.id === item.id ? updatedItem : rt));
  };

  const financeDisplayProps = {
    ...props,
    transactions: appState.transactions.filter(t => selectedAccountIds.includes('all') || selectedAccountIds.includes(t.accountId)),
    allTransactions: appState.transactions,
    accounts: appState.accounts,
    categories: appState.categories,
    budgets: appState.budgets,
    recurringTransactions: appState.recurringTransactions,
    goals: appState.goals,
    investmentHoldings: appState.investmentHoldings,
    onPayRecurring: handlePayRecurring,
    onEdit: (transaction: Transaction) => openModal('editTransaction', { transaction }),
    onDelete: (id: string) => deleteItem(id, 'transaction'),
    onSettleDebt: (transactionId: string, splitDetailId: string, settlementAccountId: string, amount: number) => console.log('Settle debt', { transactionId, splitDetailId, settlementAccountId, amount }),
    dashboardWidgets: appState.settings.dashboardWidgets,
    financialProfile: appState.financialProfile,
    onOpenFinancialHealth: () => openModal('financialHealth'),
    selectedAccountIds,
    onAccountChange: setSelectedAccountIds,
    onAddAccount,
    onEditAccount: (account: Account) => openModal('editAccount', { account }),
    onDeleteAccount,
    baseCurrency: appState.settings.currency,
    onAddTransaction: () => openModal('addTransaction', { initialTab: 'auto' }),
    openModal,
    onUpdateTransaction,
  };

  const mainContentClasses = `flex-grow overflow-y-auto relative ${
    !isResponsive ? 'pb-[68px]' : ''
  }`;

  const handleCreateExpenseFromList = (list: Note) => {
    if (list.type !== 'checklist' || !Array.isArray(list.content)) return;

    const purchasedItems = list.content.filter(item => item.isPurchased && item.rate > 0);
    if (purchasedItems.length === 0) {
        alert("No purchased items found in the list.");
        return;
    }
    
    const itemizedDetails: ItemizedDetail[] = purchasedItems.map(item => ({
      description: item.name,
      amount: item.rate * (parseFloat(item.quantity) || 1),
      categoryId: findOrCreateCategory('Shopping / General', TransactionType.EXPENSE),
      splitDetails: [],
    }));
    
    const total = itemizedDetails.reduce((sum, item) => sum + item.amount, 0);

    if (list.tripId) {
        const trip = appState.trips.find(t => t.id === list.tripId);
        if (!trip) {
            alert("Could not find the associated trip. Creating a regular expense instead.");
        } else {
            const initialExpenseData: Partial<Omit<TripExpense, 'id'>> = {
                description: `Purchases from "${list.title}"`,
                amount: total,
                categoryId: itemizedDetails[0]?.categoryId,
                itemizedDetails: itemizedDetails,
                payers: [{ contactId: USER_SELF_ID, amount: total }],
                splitDetails: [],
            };
            openModal('addTripExpense', { trip, initialExpenseData });
            return;
        }
    }
    
    const partialTransaction: Partial<Transaction> = {
      description: `Purchases from "${list.title}"`,
      amount: total,
      type: TransactionType.EXPENSE,
      itemizedDetails: itemizedDetails,
      categoryId: itemizedDetails[0]?.categoryId,
    };

    openModal('addTransaction', { initialTransaction: partialTransaction, isItemized: true });
  };


  // A fully implemented router to pass correct props to each screen
  switch (activeScreen) {
    case 'dashboard':
      return <FinanceDisplay {...financeDisplayProps} />;
    case 'live':
      return <LiveFeedScreen appState={appState} openModal={openModal} />;
    case 'reports':
      return <ReportsScreen 
        appState={appState}
        openModal={openModal}
        transactions={appState.transactions} 
        categories={appState.categories} 
        accounts={appState.accounts} 
        selectedAccountIds={selectedAccountIds} 
        baseCurrency={appState.settings.currency} 
      />;
    case 'budgets':
      return <BudgetsScreen categories={appState.categories} transactions={appState.transactions} budgets={appState.budgets} onSaveBudget={(categoryId: string, amount: number) => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        setBudgets(prev => {
            const existing = prev.find(b => b.categoryId === categoryId && b.month === currentMonth);
            if(existing) {
                return prev.map(b => b.id === existing.id ? { ...b, amount } : b);
            }
            return [...prev, { id: self.crypto.randomUUID(), categoryId, amount, month: currentMonth }];
        });
      }} onAddBudget={() => {}} financialProfile={appState.financialProfile} findOrCreateCategory={findOrCreateCategory} />;
    case 'goals':
      return <GoalsScreen goals={appState.goals} onSaveGoal={(goal, id) => {
        if(id) setGoals(prev => prev.map(g => g.id === id ? {...g, ...goal} : g));
        else setGoals(prev => [...prev, {id: self.crypto.randomUUID(), currentAmount: 0, ...goal}]);
      }} accounts={appState.accounts} onContribute={handleContributeToGoal} onDelete={(id) => deleteItem(id, 'goal')} onEditGoal={(goal) => openModal('editGoal', { goal })} onGoalComplete={onGoalComplete} onUpdateGoal={(goal) => setGoals(p => p.map(g => g.id === goal.id ? goal : g))} openModal={openModal} />;
    case 'investments':
      return <InvestmentsScreen accounts={appState.accounts} holdings={appState.investmentHoldings} onBuy={() => openModal('buyInvestment')} onSell={(holding) => openModal('sellInvestment', { holding })} onUpdateValue={(holding) => openModal('updateInvestment', { holding })} onRefresh={() => {}} />;
    case 'scheduled':
        return <ScheduledPaymentsScreen recurringTransactions={appState.recurringTransactions} categories={appState.categories} accounts={appState.accounts} onAdd={() => openModal('editRecurring')} onEdit={(item) => openModal('editRecurring', { recurringTransaction: item })} onDelete={(id) => deleteItem(id, 'recurringTransaction')} onUpdate={(item) => setRecurringTransactions(p => p.map(rt => rt.id === item.id ? item : rt))} openModal={openModal} />;
    case 'more':
// FIX: The MoreScreen component expects an onNavigate prop, not setActiveScreen or setActiveModal.
      return <MoreScreen onNavigate={onNavigate} onResetApp={() => {}} />;
    case 'tripManagement':
        return <TripManagementScreen trips={appState.trips} tripExpenses={appState.tripExpenses} onTripSelect={(tripId) => onNavigate('tripDetails', undefined, { tripId })} onAddTrip={() => openModal('editTrip')} onEditTrip={(trip) => openModal('editTrip', { trip })} onDeleteTrip={(id) => deleteItem(id, 'trip')} onShowSummary={() => openModal('tripSummary')} />;
    case 'tripDetails':
      const trip = appState.trips.find(t => t.id === tripDetailsId);
      if (!trip) return <div>Trip not found.</div>;
      return <TripDetailsScreen trip={trip} expenses={appState.tripExpenses.filter(e => e.tripId === tripDetailsId)} categories={appState.categories} onAddExpense={() => openModal('addTripExpense', { trip })} onEditExpense={(expense) => openModal('addTripExpense', { trip, expenseToEdit: expense })} onDeleteExpense={(id) => deleteItem(id, 'tripExpense')} onBack={() => onNavigate('tripManagement')} onUpdateTrip={(updatedTrip) => setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t))} openModal={openModal} onNavigate={onNavigate} />;
    case 'calculator':
        return <CalculatorScreen appState={appState} />;
    case 'achievements':
        return <AchievementsScreen unlockedAchievements={appState.unlockedAchievements} />;
    case 'refunds':
        return <RefundsScreen refunds={appState.refunds} contacts={appState.contacts} onAddRefund={() => openModal('refund')} onEditRefund={(refund) => openModal('refund', { refund })} onClaimRefund={(id) => setRefunds(prev => prev.map(r => r.id === id ? {...r, isClaimed: true, claimedDate: new Date().toISOString()} : r))} onDeleteRefund={(id) => deleteItem(id, 'refund')} openModal={openModal} />;
    case 'dataHub':
        return <DataHubScreen {...appState} onAddTransaction={() => openModal('addTransaction')} onEditTransaction={(t) => openModal('editTransaction', {transaction:t})} onDeleteTransaction={(id) => deleteItem(id, 'transaction')} onAddAccount={()=>openModal('accounts')} onEditAccount={(a)=>openModal('editAccount',{account: a})} onDeleteAccount={(id)=>deleteItem(id,'account')} onAddCategory={()=>openModal('categories')} onEditCategory={(c)=>openModal('editCategory',{category:c})} onDeleteCategory={(id)=>deleteItem(id,'category')} onAddGoal={()=>openModal('editGoal')} onEditGoal={(g)=>openModal('editGoal',{goal:g})} onDeleteGoal={(id)=>deleteItem(id,'goal')} onAddShop={()=>openModal('editShop')} onEditShop={(s)=>openModal('editShop',{shop:s})} onDeleteShop={(id)=>deleteItem(id,'shop')} onAddTrip={()=>openModal('editTrip')} onEditTrip={(t)=>openModal('editTrip',{trip:t})} onDeleteTrip={(id)=>deleteItem(id,'trip')} onAddContact={()=>openModal('contacts')} onEditContact={(c)=>openModal('editContact',{contact:c})} onDeleteContact={(id)=>deleteItem(id,'contact')} />;
    case 'shop':
        return <ShopScreen shops={appState.shops} products={appState.shopProducts} sales={appState.shopSales} employees={appState.shopEmployees} shifts={appState.shopShifts} onSaveShop={(shop,id)=> id ? setShops(p=>p.map(s=>s.id===id ? {...s,...shop}:s)) : setShops(p=>[...p,{id:self.crypto.randomUUID(),...shop}])} onDeleteShop={(id)=>deleteItem(id,'shop')} onSaveProduct={onSaveProduct} onDeleteProduct={(id)=>deleteItem(id,'shopProduct')} onRecordSale={(shopId,sale)=>setShopSales(p=>[...p,{id:self.crypto.randomUUID(),shopId,...sale}])} onSaveEmployee={(shopId,emp,id)=>id?setShopEmployees(p=>p.map(e=>e.id===id?{...e,...emp}:e)):setShopEmployees(p=>[...p,{id:self.crypto.randomUUID(),shopId,...emp}])} onDeleteEmployee={(id)=>deleteItem(id,'shopEmployee')} onSaveShift={(shopId,shift,id)=>id?setShopShifts(p=>p.map(s=>s.id===id?{...s,...shift}:s)):setShopShifts(p=>[...p,{id:self.crypto.randomUUID(),shopId,...shift}])} onDeleteShift={(id)=>deleteItem(id,'shopShift')} openModal={openModal} />;
    case 'challenges':
        return <ChallengesScreen appState={appState} setChallenges={setChallenges} />;
    case 'learn':
        return <LearnScreen onOpenChat={() => openModal('aiChat')} onOpenGlossary={() => onNavigate('glossary')} />;
    case 'calendar':
        return <CalendarScreen onNavigate={onNavigate} setActiveScreen={setActiveScreen} setTripDetailsId={(id) => onNavigate('tripDetails', undefined, { tripId: id })} openModal={openModal} />;
    case 'notes':
        return <NotesScreen noteId={noteId} onCreateExpense={handleCreateExpenseFromList} openModal={openModal} onDeleteItem={deleteItem} onNavigate={onNavigate} />;
    case 'subscriptions':
        return <SubscriptionsScreen onAddRecurring={(data) => openModal('editRecurring', { recurringTransaction: data })} />;
    case 'glossary':
        return <GlossaryScreen onAdd={() => openModal('editGlossaryEntry')} onEdit={(entry) => openModal('editGlossaryEntry', { entry })} />;
    case 'manual':
        return <ManualScreen />;
    case 'debtManager':
        return <DebtManagerScreen debts={appState.debts} onAddDebt={() => openModal('editDebt')} onEditDebt={(debt) => openModal('editDebt', { debt })} onDeleteDebt={(id) => deleteItem(id, 'debt')} onSaveDebt={(debt, id) => {
            if(id) setDebts(p => p.map(d => d.id === id ? {...d, ...debt} : d));
            else setDebts(p => [...p, {id:self.crypto.randomUUID(), ...debt, currentBalance: debt.totalAmount}]);
        }} />;
    case 'faq':
        return <FaqScreen />;
    default:
      return <FinanceDisplay {...financeDisplayProps} />;
  }
};

export default MainContent;