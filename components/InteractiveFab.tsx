import React, { useState, useContext, useMemo } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { ALL_FAB_ACTIONS } from '../utils/fabActions';
import { ActiveScreen, ActiveModal } from '../types';

interface InteractiveFabProps {
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>) => void;
}

const InteractiveFab: React.FC<InteractiveFabProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useContext(SettingsContext);

  const actions = useMemo(() => {
    const actionMap = new Map(ALL_FAB_ACTIONS.map(action => [action.key, action]));
    const fabSettings = settings.fabActions;
    return {
      top: actionMap.get(fabSettings.top),
      left: actionMap.get(fabSettings.left),
      right: actionMap.get(fabSettings.right),
      bottom: actionMap.get(fabSettings.bottom),
    };
  }, [settings.fabActions]);

  const handleActionClick = (action: typeof actions.top) => {
    if (action) {
      onNavigate(action.target.screen!, action.target.modal, {});
    }
    setIsOpen(false);
  };

  const FabActionButton: React.FC<{
    action: typeof actions.top;
    position: 'top' | 'left' | 'right' | 'bottom';
  }> = ({ action, position }) => {
    if (!action) return null;
    return (
      <button
        onClick={() => handleActionClick(action)}
        className={`fab-action fab-action-${position}`}
        aria-label={action.label}
        title={action.label}
      >
        {action.icon}
      </button>
    );
  };

  return (
    <>
      <div 
        className={`fab-backdrop ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      ></div>
      <div className={`interactive-fab-container ${isOpen ? 'open' : ''}`}>
        <FabActionButton action={actions.top} position="top" />
        <FabActionButton action={actions.left} position="left" />
        <FabActionButton action={actions.right} position="right" />
        <FabActionButton action={actions.bottom} position="bottom" />
        <div className="interactive-fab" onClick={() => setIsOpen(!isOpen)} aria-haspopup="true" aria-expanded={isOpen}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
        </div>
      </div>
    </>
  );
};

export default InteractiveFab;
