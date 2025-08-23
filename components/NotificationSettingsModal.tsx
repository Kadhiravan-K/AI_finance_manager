import React, { useContext, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import { SettingsContext } from '../contexts/SettingsContext';
import ToggleSwitch from './ToggleSwitch';
import { Budget, Category } from '../types';

const modalRoot = document.getElementById('modal-root')!;

interface NotificationSettingsModalProps {
  onClose: () => void;
  budgets: Budget[];
  categories: Category[];
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ onClose, budgets, categories }) => {
  const { settings, setSettings } = useContext(SettingsContext);
  const [showBudgetDetails, setShowBudgetDetails] = useState(false);

  const handleToggle = (key1: 'bills' | 'budgets', key2: 'enabled') => {
    setSettings(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [key1]: { ...prev.notificationSettings[key1], [key2]: !prev.notificationSettings[key1][key2] }
      }
    }));
  };

  const handleBudgetCategoryToggle = (categoryId: string) => {
    setSettings(prev => {
        const currentSetting = prev.notificationSettings.budgets.categories[categoryId];
        const newCategories = { ...prev.notificationSettings.budgets.categories };
        // If undefined, it's considered enabled. So toggling sets it to false.
        newCategories[categoryId] = currentSetting === false; 
        return {
            ...prev,
            notificationSettings: {
                ...prev.notificationSettings,
                budgets: { ...prev.notificationSettings.budgets, categories: newCategories }
            }
        };
    });
  };
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const activeBudgets = useMemo(() => budgets.filter(b => b.month === currentMonth), [budgets, currentMonth]);

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Notification Settings" onClose={onClose} icon="🔔" />
        <div className="p-6 space-y-4 overflow-y-auto">
            <div className="p-3 bg-subtle rounded-lg flex items-center justify-between">
                <span className="font-medium text-primary">Upcoming/Due Bill Reminders</span>
                <ToggleSwitch checked={settings.notificationSettings.bills.enabled} onChange={() => handleToggle('bills', 'enabled')} />
            </div>
             <div className="p-3 bg-subtle rounded-lg">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-primary">Budget Alerts</span>
                    <ToggleSwitch checked={settings.notificationSettings.budgets.enabled} onChange={() => handleToggle('budgets', 'enabled')} />
                </div>
                 {settings.notificationSettings.budgets.enabled && (
                    <div className="mt-3 pt-3 border-t border-divider">
                        <button onClick={() => setShowBudgetDetails(!showBudgetDetails)} className="text-sm text-sky-400 hover:text-sky-300">
                           {showBudgetDetails ? 'Hide' : 'Show'} Per-Category Settings
                        </button>
                        {showBudgetDetails && (
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                                {activeBudgets.map(budget => {
                                    const category = categories.find(c => c.id === budget.categoryId);
                                    if (!category) return null;
                                    const isEnabled = settings.notificationSettings.budgets.categories[budget.categoryId] !== false; // Undefined means enabled
                                    return (
                                        <div key={budget.categoryId} className="flex items-center justify-between text-sm p-1">
                                            <span className="text-secondary">{category.name}</span>
                                            <ToggleSwitch checked={isEnabled} onChange={() => handleBudgetCategoryToggle(budget.categoryId)} />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        <div className="flex justify-end p-4 border-t border-divider">
            <button onClick={onClose} className="button-primary px-4 py-2">Done</button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default NotificationSettingsModal;