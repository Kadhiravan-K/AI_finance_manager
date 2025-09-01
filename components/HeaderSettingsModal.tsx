

import React, { useContext, useState } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import { SettingsContext } from '../contexts/SettingsContext';
import { HeaderAction } from '../types';
import ToggleSwitch from './ToggleSwitch';

const modalRoot = document.getElementById('modal-root')!;

interface HeaderSettingsModalProps {
  onClose: () => void;
}

const HEADER_ACTIONS: { key: HeaderAction; name: string; icon: string; }[] = [
    { key: 'transfer', name: 'Transfer', icon: '↔️' },
    { key: 'search', name: 'Search', icon: '🔍' },
    { key: 'aiCommandCenter', name: 'AI Hub', icon: '✨' },
    { key: 'notifications', name: 'Notifications', icon: '🔔' },
];

const HeaderSettingsModal: React.FC<HeaderSettingsModalProps> = ({ onClose }) => {
  const { settings, setSettings } = useContext(SettingsContext);
  // Fix: 'headerActions' is deprecated. Using local state for UI demonstration.
  const [headerActions, setHeaderActions] = useState<HeaderAction[]>(
      (settings as any).headerActions || ['transfer', 'search', 'aiCommandCenter', 'notifications']
  );

  // Fix: Updated handleToggle to work with local state instead of deprecated settings property.
  const handleToggle = (action: HeaderAction) => {
    let newActions: HeaderAction[];
    if (headerActions.includes(action)) {
      newActions = headerActions.filter(a => a !== action);
    } else {
      newActions = [...headerActions, action];
      // Sort to maintain original order
      newActions.sort((a, b) => HEADER_ACTIONS.findIndex(h => h.key === a) - HEADER_ACTIONS.findIndex(h => h.key === b));
    }
    setHeaderActions(newActions);
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Customize Header" onClose={onClose} icon="🔝" />
        <div className="p-6 space-y-2 overflow-y-auto">
          <p className="text-sm text-secondary pb-2">Toggle the visibility of quick-action icons in the header.</p>
          {HEADER_ACTIONS.map((action) => (
            <div 
              key={action.key} 
              className="p-3 bg-subtle rounded-lg flex items-center justify-between group"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{action.icon}</span>
                    {/* Fix: Check for inclusion in local state array for toggled state */}
                    <span className={`font-medium ${headerActions.includes(action.key) ? 'text-primary' : 'text-tertiary'}`}>{action.name}</span>
                </div>
                {/* Fix: Updated checked prop to work with local state array */}
                <ToggleSwitch checked={headerActions.includes(action.key)} onChange={() => handleToggle(action.key)} />
            </div>
          ))}
        </div>
        <div className="flex justify-end p-4 border-t border-divider">
            <button onClick={onClose} className="button-primary px-4 py-2">Done</button>
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default HeaderSettingsModal;
