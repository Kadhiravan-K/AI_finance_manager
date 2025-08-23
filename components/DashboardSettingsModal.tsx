import React, { useContext, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import { SettingsContext } from '../contexts/SettingsContext';
import { DashboardWidget } from '../types';
import ToggleSwitch from './ToggleSwitch';

const modalRoot = document.getElementById('modal-root')!;

interface DashboardSettingsModalProps {
  onClose: () => void;
}

const DashboardSettingsModal: React.FC<DashboardSettingsModalProps> = ({ onClose }) => {
  const { settings, setSettings } = useContext(SettingsContext);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragItemNode = useRef<HTMLDivElement | null>(null);

  const handleToggleVisibility = (id: DashboardWidget['id']) => {
    setSettings(prev => ({
      ...prev,
      dashboardWidgets: prev.dashboardWidgets.map(w =>
        w.id === id ? { ...w, visible: !w.visible } : w
      ),
    }));
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItemNode.current = e.currentTarget;
    dragItemNode.current.addEventListener('dragend', handleDragEnd);
    setDraggedIndex(index);
    // Use a timeout to allow the browser to render the drag image before we modify the element
    setTimeout(() => {
        if (dragItemNode.current) {
             dragItemNode.current.classList.add('dragging');
        }
    }, 0);
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    
    const newWidgets = [...settings.dashboardWidgets];
    const draggedItem = newWidgets.splice(draggedIndex, 1)[0];
    newWidgets.splice(targetIndex, 0, draggedItem);
    
    setDraggedIndex(targetIndex);
    setSettings(prev => ({ ...prev, dashboardWidgets: newWidgets }));
  }

  const handleDragEnd = () => {
    if (dragItemNode.current) {
        dragItemNode.current.classList.remove('dragging');
        dragItemNode.current.removeEventListener('dragend', handleDragEnd);
    }
    setDraggedIndex(null);
    dragItemNode.current = null;
  }


  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Customize Dashboard" onClose={onClose} icon="🎨" />
        <div className="p-6 space-y-2 overflow-y-auto">
          <p className="text-sm text-secondary pb-2">Drag and drop to reorder. Toggle visibility of dashboard widgets.</p>
          {settings.dashboardWidgets.map((widget, index) => (
            <div 
              key={widget.id} 
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragEnter={e => handleDragEnter(e, index)}
              onDragOver={e => e.preventDefault()}
              className="p-3 bg-subtle rounded-lg flex items-center justify-between group draggable-item"
            >
                <div className="flex items-center gap-3">
                    <div className="drag-handle text-tertiary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                    </div>
                    <span className={`font-medium ${widget.visible ? 'text-primary' : 'text-tertiary'}`}>{widget.name}</span>
                </div>
                <ToggleSwitch checked={widget.visible} onChange={() => handleToggleVisibility(widget.id)} />
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

export default DashboardSettingsModal;