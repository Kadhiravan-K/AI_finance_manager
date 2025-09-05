import React, { useState } from 'react';
import { ActiveScreen, ActiveModal } from '../types';

interface InteractiveFabProps {
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, modalProps?: Record<string, any>) => void;
}

const InteractiveFab: React.FC<InteractiveFabProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = {
    top: { 
      label: 'Add Transaction', 
      icon: '➕', 
      // Fix: 'addTransactionMode' is not a valid ActiveModal type. Corrected to 'addTransaction' which opens the modal with mode selection tabs.
      onClick: () => onNavigate('dashboard', 'addTransaction') 
    },
    left: { 
      label: 'Add Note', 
      icon: '📝', 
      // Fix: 'notes' is not a valid screen. Replaced with 'shoppingLists' which can serve a similar purpose.
      onClick: () => onNavigate('shoppingLists') 
    },
    right: { 
      label: 'Add Goal', 
      icon: '🏆', 
      onClick: () => onNavigate('goals', 'editGoal') 
    },
    bottom: { 
      label: 'Search', 
      icon: '🔍', 
      onClick: () => onNavigate('dashboard', 'globalSearch') 
    },
  };

  const handleActionClick = (action: { onClick: () => void }) => {
    action.onClick();
    setIsOpen(false);
  };

  const FabActionButton: React.FC<{
    action: typeof actions.top;
    position: 'top' | 'left' | 'right' | 'bottom';
  }> = ({ action, position }) => {
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
        </div>
      </div>
    </>
  );
};

export default InteractiveFab;