import React, { useState, useContext, useCallback, Dispatch, SetStateAction } from 'react';
import { ActiveScreen, AppState, ModalState, ActiveModal, ProcessingStatus, DateRange, CustomDateRange, Transaction, RecurringTransaction, Account, AccountType, Goal, Budget, Trip, ShopSale, ShopProduct, TransactionType, Debt } from '../types';
import FinanceDisplay from './StoryDisplay';
import ReportsScreen from './ReportsScreen';
import BudgetsScreen from './BudgetsModal';
import GoalsScreen from './GoalsModal';
import InvestmentsScreen from './InvestmentsScreen';
import ScheduledPaymentsScreen from './ScheduledPaymentsScreen';
import MoreScreen from './More';
import TripManagementScreen from './TripManagementScreen';
import TripDetailsScreen from './TripDetailsScreen';
import CalculatorScreen from './CalculatorScreen';
import AchievementsScreen from './AchievementsScreen';
import RefundsScreen from './RefundsScreen';
import DataHubScreen from './DataHubScreen';
import { ShopScreen } from './ShopScreen';
import ChallengesScreen from './ChallengesScreen';
import LearnScreen from './LearnScreen';
import CalendarScreen from './CalendarScreen';
import { ShoppingListScreen } from './ShoppingListScreen';
import SubscriptionsScreen from './SubscriptionsScreen';
import GlossaryScreen from './GlossaryScreen';
import ManualScreen from './ManualScreen';
import { AppDataContext } from '../contexts/SettingsContext';
import { parseNaturalLanguageQuery } from '../services/geminiService';
import { calculateNextDueDate } from '../utils/date';
import DebtManagerScreen from './DebtManagerScreen';
import FaqScreen from './FaqScreen';


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
  // Fix: Add missing tripDetailsId prop to satisfy App.tsx
  tripDetailsId: string | null;
}

export const MainContent: React.FC<MainContentProps> = (props) => {
  // Fix: Destructure tripDetailsId to be used in the tripDetails case
  const { activeScreen, appState, mainContentRef, isLoading, onNavigate, setActiveScreen, setModalStack, onGoalComplete, tripDetailsId } = props;

  const dataContext = useContext(AppDataContext);

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


  const openModal = useCallback((name: ActiveModal, modalProps?: Record<string, any>) => {
    setModalStack(prev => [...prev, { name, props: modalProps }]);
  }, [setModalStack]);

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

  // A fully implemented router to pass correct props to each screen
  switch (activeScreen) {
    case 'dashboard':
      return <FinanceDisplay {...financeDisplayProps} />;
    case 'reports':
      return <ReportsScreen transactions={appState.transactions} categories={appState.categories} accounts={appState.accounts} selectedAccountIds={selectedAccountIds} baseCurrency={appState.settings.currency} />;
    case 'budgets':
      return <BudgetsScreen categories={appState.categories} transactions={appState.transactions} budgets={appState.budgets} onSaveBudget={(categoryId: string, amount: number) => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        dataContext.setBudgets(prev => {
            const existing = prev.find(b => b.categoryId === categoryId && b.month === currentMonth);
            if(existing) {
                return prev.map(b => b.id === existing.id ? {...b, amount} : b);
            }
            return [...prev, {id: self.crypto.randomUUID(), categoryId, amount, month: currentMonth}];
        })
      }} onAddBudget={() => {}} financialProfile={appState.financialProfile} findOrCreateCategory={findOrCreateCategory} />;
    case 'goals':
      return <GoalsScreen goals={appState.goals} onSaveGoal={(goal, id) => {
        if(id) {
            setGoals(prev => prev.map(g => g.id === id ? {...g, ...goal} : g));
        } else {
            setGoals(prev => [...prev, {...goal, id: self.crypto.randomUUID(), currentAmount: 0}]);
        }
      }} accounts={appState.accounts} onContribute={handleContributeToGoal} onDelete={(id) => deleteItem(id, 'goal')} onEditGoal={(goal) => openModal('editGoal', { goal })} onGoalComplete={onGoalComplete} onUpdateGoal={(goal) => setGoals(prev => prev.map(g => g.id === goal.id ? goal : g))} openModal={openModal} />;
    case 'investments':
      return <InvestmentsScreen accounts={appState.accounts} holdings={appState.investmentHoldings} onBuy={() => openModal('buyInvestment')} onSell={(holding) => openModal('sellInvestment', { holding })} onUpdateValue={(holding) => openModal('updateInvestment', { holding })} onRefresh={() => {}} />;
    case 'scheduled':
      return <ScheduledPaymentsScreen recurringTransactions={appState.recurringTransactions} categories={appState.categories} accounts={appState.accounts} onAdd={() => openModal('editRecurring')} onEdit={(item) => openModal('editRecurring', { recurringTransaction: item })} onDelete={(id) => deleteItem(id, 'recurringTransaction')} onUpdate={(item) => setRecurringTransactions(p => p.map(rt => rt.id === item.id ? item : rt))} openModal={openModal} />;
    case 'more':
      return <MoreScreen setActiveScreen={setActiveScreen} setActiveModal={(modal, props) => openModal(modal, props)} onResetApp={() => console.log('Reset App')} />;
    case 'tripManagement':
      return <TripManagementScreen trips={appState.trips} tripExpenses={appState.tripExpenses} onTripSelect={(tripId) => onNavigate('tripDetails', undefined, {tripId})} onAddTrip={() => openModal('editTrip')} onEditTrip={(trip) => openModal('editTrip', { trip })} onDeleteTrip={(id) => deleteItem(id, 'trip')} onShowSummary={() => openModal('tripSummary')} />;
    case 'achievements':
      return <AchievementsScreen unlockedAchievements={appState.achievements} />;
    case 'calculator':
        return <CalculatorScreen appState={appState} />;
    case 'calendar':
        return <CalendarScreen onNavigate={onNavigate} setActiveScreen={setActiveScreen} setTripDetailsId={(id) => onNavigate('tripDetails', undefined, {tripId: id})} openModal={openModal} />;
    case 'challenges':
        return <ChallengesScreen appState={appState} setChallenges={setChallenges} />;
    case 'dataHub':
        return <DataHubScreen {...appState} onAddTransaction={()=>openModal('addTransaction')} onEditTransaction={(t)=>openModal('editTransaction', {transaction: t})} onDeleteTransaction={(id)=>deleteItem(id, 'transaction')} onAddAccount={()=>openModal('editAccount')} onEditAccount={(a)=>openModal('editAccount', {account: a})} onDeleteAccount={(id)=>deleteItem(id, 'account')} onAddCategory={()=>openModal('editCategory')} onEditCategory={(c)=>openModal('editCategory', {category: c})} onDeleteCategory={(id)=>deleteItem(id, 'category')} onAddGoal={()=>openModal('editGoal')} onEditGoal={(g)=>openModal('editGoal', {goal: g})} onDeleteGoal={(id)=>deleteItem(id, 'goal')} onAddShop={()=>openModal('editShop')} onEditShop={(s)=>openModal('editShop', {shop: s})} onDeleteShop={(id)=>deleteItem(id, 'shop')} onAddTrip={()=>openModal('editTrip')} onEditTrip={(t)=>openModal('editTrip', {trip: t})} onDeleteTrip={(id)=>deleteItem(id, 'trip')} onAddContact={()=>openModal('editContact')} onEditContact={(c)=>openModal('editContact', {contact: c})} onDeleteContact={(id)=>deleteItem(id, 'contact')} />;
    case 'glossary':
        return <GlossaryScreen onAdd={() => openModal('editGlossaryEntry')} onEdit={(entry) => openModal('editGlossaryEntry', { entry })} />;
    case 'learn':
        return <LearnScreen onOpenChat={() => openModal('aiChat')} onOpenGlossary={() => setActiveScreen('glossary')} />;
    case 'manual':
        return <ManualScreen />;
    case 'faq':
        return <FaqScreen />;
    case 'refunds':
        return <RefundsScreen refunds={appState.refunds} contacts={appState.contacts} onAddRefund={() => openModal('refund')} onEditRefund={(refund) => openModal('refund', { refund })} onClaimRefund={(id) => setRefunds(p => p.map(r => r.id === id ? {...r, isClaimed: true, claimedDate: new Date().toISOString()} : r))} onDeleteRefund={(id) => deleteItem(id, 'refund')} openModal={openModal} />;
    case 'shop':
        // Fix: Pass the required 'openModal' prop to ShopScreen.
        return <ShopScreen shops={appState.shops} products={appState.shopProducts} sales={appState.shopSales} employees={appState.shopEmployees} shifts={appState.shopShifts} onSaveShop={(shop, id) => {
            if(id) setShops(p => p.map(s => s.id === id ? {...s, ...shop} : s)); else setShops(p => [...p, {id: self.crypto.randomUUID(), ...shop}]);
        }} onDeleteShop={(id)=>deleteItem(id, 'shop')} onSaveProduct={(shopId, prod, id) => {
            if(id) setShopProducts(p => p.map(s => s.id === id ? {...s, ...prod} : s)); else setShopProducts(p => [...p, {id: self.crypto.randomUUID(), shopId, ...prod}]);
        }} onDeleteProduct={(id)=>deleteItem(id, 'shopProduct')} onRecordSale={(shopId, sale) => setShopSales(p => [...p, {id: self.crypto.randomUUID(), shopId, ...sale}])} onSaveEmployee={(shopId, emp, id) => {
            if(id) setShopEmployees(p => p.map(e => e.id === id ? {...e, ...emp} : e)); else setShopEmployees(p => [...p, {id: self.crypto.randomUUID(), shopId, ...emp}]);
        }} onDeleteEmployee={(id)=>deleteItem(id, 'shopEmployee')} onSaveShift={(shopId, shift, id) => {
            if(id) setShopShifts(p => p.map(s => s.id === id ? {...s, ...shift} : s)); else setShopShifts(p => [...p, {id: self.crypto.randomUUID(), shopId, ...shift}]);
        }} onDeleteShift={(id)=>deleteItem(id, 'shopShift')} openModal={openModal} />;
    case 'shoppingLists':
        return <ShoppingListScreen onCreateExpense={() => {}} openModal={openModal} onDeleteItem={(id, type) => deleteItem(id, type)} />;
    case 'subscriptions':
      return <SubscriptionsScreen onAddRecurring={(data) => openModal('editRecurring', { recurringTransaction: data })} />;
    case 'debtManager':
      return <DebtManagerScreen debts={appState.debts} onAddDebt={() => openModal('editDebt')} onEditDebt={(debt) => openModal('editDebt', { debt })} onDeleteDebt={(id) => deleteItem(id, 'debt')} onSaveDebt={(debt, id) => {
          if (id) {
              setDebts((p: Debt[]) => p.map(d => d.id === id ? { ...d, ...debt } : d));
          } else {
              setDebts((p: Debt[]) => [...p, { ...debt, id: self.crypto.randomUUID(), currentBalance: debt.totalAmount }]);
          }
      }} />;
    case 'tripDetails':
      // Fix: Use the tripDetailsId prop directly instead of searching the modal stack.
      const trip = appState.trips.find(t => t.id === tripDetailsId);
      if(trip) {
          // Fix: Pass the required 'openModal' prop to TripDetailsScreen.
          return <TripDetailsScreen trip={trip} expenses={appState.tripExpenses.filter(e => e.tripId === trip.id)} onAddExpense={() => openModal('addTripExpense', {trip})} onEditExpense={(expense) => openModal('addTripExpense', {trip, expenseToEdit: expense})} onDeleteExpense={(id) => deleteItem(id, 'tripExpense')} onBack={() => setActiveScreen('tripManagement')} categories={appState.categories} onUpdateTrip={(updatedTrip) => setTrips(p => p.map(t => t.id === updatedTrip.id ? updatedTrip : t))} openModal={openModal} />;
      }
      return <div className="p-4">Trip not found. Go back to <button className="text-sky-400" onClick={() => setActiveScreen('tripManagement')}>Trip Management</button>.</div>;
    default:
      return <FinanceDisplay {...financeDisplayProps} />;
  }
};