

import React, { useContext, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { SettingsContext } from '../contexts/SettingsContext';
import { ActiveScreen } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import Footer, { NAV_ITEM_DEFINITIONS } from './Footer';

const modalRoot = document.getElementById('modal-root')!;

interface FooterCustomizationModalProps {
  onClose: () => void;
}

const VALID_FOOTER_SCREENS: ActiveScreen[] = [
  'dashboard', 'reports', 'budgets', 'goals', 'investments', 
  'tripManagement', 'shop', 'calendar', 'notes', 'more'
];

const EMOJI_MAP: Partial<Record<ActiveScreen, string>> = {
  dashboard: '📊',
  reports: '📈',
  budgets: '🎯',
  goals: '🏆',
  investments: '💹',
  tripManagement: '✈️',
  shop: '🏪',
  calendar: '🗓️',
  notes: '📝',
  more: '•••'
};


const FooterCustomizationModal: React.FC<FooterCustomizationModalProps> = ({ onClose }) => {
  const { settings, setSettings } = useContext(SettingsContext);
  const [localFooterActions, setLocalFooterActions] = useState(settings.footerActions);

  const handleSelectChange = (index: number, screen: ActiveScreen) => {
    const newActions = [...localFooterActions];
    // Prevent duplicate shortcuts
    if (newActions.includes(screen)) {
        const oldIndex = newActions.indexOf(screen);
        if (oldIndex !== index) {
            // Swap them
            [newActions[index], newActions[oldIndex]] = [newActions[oldIndex], newActions[index]];
        }
    } else {
        newActions[index] = screen;
    }
    setLocalFooterActions(newActions);
  };
  
  const handleSave = () => {
      setSettings(prev => ({ ...prev, footerActions: localFooterActions }));
      onClose();
  }

  const screenOptions = VALID_FOOTER_SCREENS.map(screen => ({
    value: screen,
    label: `${EMOJI_MAP[screen] || '❓'} ${NAV_ITEM_DEFINITIONS[screen]?.label || 'Unknown'}`
  }));

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Customize Footer" onClose={onClose} icon="🐾" />
        <div className="p-6 space-y-4 overflow-y-auto">
          <p className="text-sm text-secondary">Choose the four shortcuts you use most often for quick access in the footer navigation.</p>
          <div className="grid grid-cols-2 gap-4">
            {localFooterActions.map((screen, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-secondary mb-1">Slot {index < 2 ? index + 1 : index + 2}</label>
                <CustomSelect 
                  value={screen}
                  onChange={(value) => handleSelectChange(index, value as ActiveScreen)}
                  options={screenOptions}
                />
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-divider">
             <h4 className="font-semibold text-primary mb-2">Live Preview</h4>
             <div className="relative h-[68px] bg-subtle rounded-xl overflow-hidden pointer-events-none">
                <Footer 
                    activeScreen={localFooterActions[0]}
                    setActiveScreen={() => {}}
                    onAddClick={() => {}}
                />
             </div>
          </div>
        </div>
        <div className="flex justify-end p-4 border-t border-divider">
            <button onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button onClick={handleSave} className="button-primary px-4 py-2">Save & Close</button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default FooterCustomizationModal;