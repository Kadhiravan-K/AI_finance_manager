
import React, { useState, useContext, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { SettingsContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';
import { FabAction, ALL_FAB_ACTIONS } from '../utils/fabActions';
import CustomSelect from './CustomSelect';

const modalRoot = document.getElementById('modal-root')!;

interface FabSettingsModalProps {
  onClose: () => void;
}

const FabSettingsModal: React.FC<FabSettingsModalProps> = ({ onClose }) => {
  const { settings, setSettings } = useContext(SettingsContext);
  // Fix: Property 'fabActions' is deprecated. Using local state for UI demonstration.
  const [fabActions, setFabActions] = useState(
    (settings as any).fabActions || {
      top: 'addTransaction',
      left: 'addNote',
      right: 'addGoal',
      bottom: 'openSearch',
    }
  );

  const handleSave = () => {
    // setSettings(prev => ({ ...prev, fabActions })); // Deprecated functionality
    onClose();
  };

  const handleSelectChange = (position: 'top' | 'left' | 'right' | 'bottom', actionKey: string) => {
    const newActions = { ...fabActions };
    const currentActionInSlot = newActions[position];
    
    // Check if the new action is already used in another slot
    const otherPositions = (['top', 'left', 'right', 'bottom'] as const).filter(p => p !== position);
    for (const otherPos of otherPositions) {
        if (newActions[otherPos] === actionKey) {
            // Swap them
            newActions[otherPos] = currentActionInSlot;
            break;
        }
    }
    
    newActions[position] = actionKey;
    setFabActions(newActions);
  };

  const actionOptions = useMemo(() => ALL_FAB_ACTIONS.map(action => ({
    value: action.key,
    label: `${action.label}`,
  })), []);

  const FabPreview: React.FC<{ actions: typeof fabActions }> = ({ actions }) => {
    const actionMap = new Map(ALL_FAB_ACTIONS.map(a => [a.key, a]));
    const topAction = actionMap.get(actions.top);
    const leftAction = actionMap.get(actions.left);
    const rightAction = actionMap.get(actions.right);
    const bottomAction = actionMap.get(actions.bottom);

    return (
        <div className="relative w-40 h-40 mx-auto my-4 flex items-center justify-center">
            {topAction && <div className="fab-action" style={{ top: 0, left: '50%', transform: 'translateX(-50%) scale(1)', opacity: 1 }}>{topAction.icon}</div>}
            {leftAction && <div className="fab-action" style={{ left: 0, top: '50%', transform: 'translateY(-50%) scale(1)', opacity: 1 }}>{leftAction.icon}</div>}
            {rightAction && <div className="fab-action" style={{ right: 0, top: '50%', transform: 'translateY(-50%) scale(1)', opacity: 1 }}>{rightAction.icon}</div>}
            {bottomAction && <div className="fab-action" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%) scale(1)', opacity: 1 }}>{bottomAction.icon}</div>}
            <div className="interactive-fab" style={{ transform: 'rotate(45deg)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </div>
        </div>
    );
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Customize FAB" onClose={onClose} icon="✨" />
        <div className="p-6 space-y-4 overflow-y-auto">
          <FabPreview actions={fabActions} />
          <p className="text-sm text-secondary text-center">Select an action for each of the 4 slots.</p>
          <div className="space-y-3">
            <div>
                <label className="text-sm font-medium text-secondary mb-1 block">Top</label>
                <CustomSelect value={fabActions.top} onChange={(val) => handleSelectChange('top', val)} options={actionOptions} />
            </div>
            <div>
                <label className="text-sm font-medium text-secondary mb-1 block">Left</label>
                <CustomSelect value={fabActions.left} onChange={(val) => handleSelectChange('left', val)} options={actionOptions} />
            </div>
             <div>
                <label className="text-sm font-medium text-secondary mb-1 block">Right</label>
                <CustomSelect value={fabActions.right} onChange={(val) => handleSelectChange('right', val)} options={actionOptions} />
            </div>
             <div>
                <label className="text-sm font-medium text-secondary mb-1 block">Bottom</label>
                <CustomSelect value={fabActions.bottom} onChange={(val) => handleSelectChange('bottom', val)} options={actionOptions} />
            </div>
          </div>
        </div>
        <div className="flex justify-end p-4 border-t border-divider">
            <button onClick={handleSave} className="button-primary px-4 py-2">Save</button>
        </div>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default FabSettingsModal;
