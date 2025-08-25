import React, { useContext, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import { SettingsContext } from '../contexts/SettingsContext';
import { ActiveScreen } from '../types';

const modalRoot = document.getElementById('modal-root')!;

interface FooterSettingsModalProps {
  onClose: () => void;
}

const ALL_AVAILABLE_SCREENS: { screen: ActiveScreen, label: string, icon: string }[] = [
    { screen: 'dashboard', label: 'Dashboard', icon: '📊' },
    { screen: 'reports', label: 'Reports', icon: '📈' },
    { screen: 'budgets', label: 'Budgets', icon: '🎯' },
    { screen: 'goals', label: 'Goals', icon: '🏆' },
    { screen: 'investments', label: 'Investments', icon: '💹' },
    { screen: 'tripManagement', label: 'Trips', icon: '✈️' },
    { screen: 'more', label: 'More', icon: '•••' },
    { screen: 'scheduled', label: 'Scheduled', icon: '📅' },
    { screen: 'calculator', label: 'Calculator', icon: '🧮' },
    { screen: 'achievements', label: 'Achievements', icon: '🏅' },
    { screen: 'refunds', label: 'Refunds', icon: '↩️' },
    { screen: 'dataHub', label: 'Data Hub', icon: '🗄️'},
    { screen: 'shop', label: 'Shop', icon: '🏪' },
];

const FooterSettingsModal: React.FC<FooterSettingsModalProps> = ({ onClose }) => {
  const { settings, setSettings } = useContext(SettingsContext);
  const [items, setItems] = useState(settings.footerActions);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragItemNode = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItemNode.current = e.currentTarget;
    dragItemNode.current.addEventListener('dragend', handleDragEnd);
    setDraggedIndex(index);
    setTimeout(() => {
        if (dragItemNode.current) {
             dragItemNode.current.classList.add('dragging');
        }
    }, 0);
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const newItems = [...items];
    const draggedItem = newItems.splice(draggedIndex, 1)[0];
    newItems.splice(targetIndex, 0, draggedItem);
    setDraggedIndex(targetIndex);
    setItems(newItems);
  }

  const handleDragEnd = () => {
    if (dragItemNode.current) {
        dragItemNode.current.classList.remove('dragging');
        dragItemNode.current.removeEventListener('dragend', handleDragEnd);
    }
    setDraggedIndex(null);
    dragItemNode.current = null;
  }

  const handleSave = () => {
    setSettings(prev => ({ ...prev, footerActions: items }));
    onClose();
  };
  
  const handleSelectChange = (index: number, newScreen: ActiveScreen) => {
    const newItems = [...items];
    if (newItems.includes(newScreen)) {
        const oldIndex = newItems.indexOf(newScreen);
        newItems[oldIndex] = newItems[index];
    }
    newItems[index] = newScreen;
    setItems(newItems);
  }
  
  const getItemInfo = (screen: ActiveScreen) => {
      return ALL_AVAILABLE_SCREENS.find(s => s.screen === screen) || { label: '?', icon: '❓' };
  }

  const FooterPreview = ({ actions }: { actions: ActiveScreen[] }) => (
    <div className="relative h-[60px] grid grid-cols-5 items-center bg-subtle rounded-xl border border-divider">
        {actions.slice(0, 2).map(screen => {
            const info = getItemInfo(screen);
            return <div key={screen} className="flex flex-col items-center justify-center gap-1 text-secondary"><span className="text-xl">{info.icon}</span><span className="text-[10px]">{info.label}</span></div>
        })}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-emerald-500 border-4 border-subtle"></div>
        <div />
        {actions.slice(2).map(screen => {
            const info = getItemInfo(screen);
            return <div key={screen} className="flex flex-col items-center justify-center gap-1 text-secondary"><span className="text-xl">{info.icon}</span><span className="text-[10px]">{info.label}</span></div>
        })}
    </div>
  );

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Customize Footer" onClose={onClose} icon="⚓" />
        <div className="p-6 space-y-4 overflow-y-auto">
            <FooterPreview actions={items} />
            <p className="text-sm text-secondary pt-2">Select an item for each slot, or drag and drop to reorder.</p>
            <div className="space-y-3">
              {items.map((screen, index) => (
                  <div key={index} draggable onDragStart={e => handleDragStart(e, index)} onDragEnter={e => handleDragEnter(e, index)} onDragOver={e => e.preventDefault()} className="p-3 bg-subtle rounded-lg flex items-center justify-between group draggable-item">
                      <div className="flex items-center gap-3">
                          <div className="drag-handle text-tertiary">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                          </div>
                          <span className="text-2xl">{getItemInfo(screen).icon}</span>
                          <select 
                              value={screen} 
                              onChange={(e) => handleSelectChange(index, e.target.value as ActiveScreen)}
                              className="bg-transparent text-primary font-medium focus:outline-none"
                          >
                              {ALL_AVAILABLE_SCREENS.map(s => (
                                <option key={s.screen} value={s.screen} className="bg-slate-800 text-white">{s.label}</option>
                              ))}
                          </select>
                      </div>
                  </div>
              ))}
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

export default FooterSettingsModal;