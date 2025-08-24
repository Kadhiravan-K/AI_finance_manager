import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import { SettingsContext } from '../contexts/SettingsContext';
import { ToggleableTool } from '../types';
import ToggleSwitch from './ToggleSwitch';

const modalRoot = document.getElementById('modal-root')!;

interface ManageToolsModalProps {
  onClose: () => void;
}

const MANAGEABLE_TOOLS: { key: ToggleableTool; name: string; icon: string; }[] = [
    { key: 'calculator', name: 'Calculator', icon: '🧮' },
    { key: 'investments', name: 'Investments', icon: '💹' },
    { key: 'payees', name: 'Payees', icon: '🏢' },
    { key: 'senders', name: 'Senders', icon: '🛡️' },
    { key: 'tripManagement', name: 'Trip Management', icon: '✈️' },
];

const ManageToolsModal: React.FC<ManageToolsModalProps> = ({ onClose }) => {
  const { settings, setSettings } = useContext(SettingsContext);

  const handleToggle = (tool: ToggleableTool) => {
    setSettings(prev => ({
      ...prev,
      enabledTools: {
        ...prev.enabledTools,
        [tool]: !prev.enabledTools[tool]
      }
    }));
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-md p-0 border border-divider animate-scaleIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Manage Tools" onClose={onClose} icon="🛠️" />
        <div className="p-6 space-y-2 overflow-y-auto">
          <p className="text-sm text-secondary pb-2">Toggle the visibility of tools in the "All Tools" menu.</p>
          {MANAGEABLE_TOOLS.map((tool) => (
            <div 
              key={tool.key} 
              className="p-3 bg-subtle rounded-lg flex items-center justify-between group"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{tool.icon}</span>
                    <span className={`font-medium ${settings.enabledTools[tool.key] ? 'text-primary' : 'text-tertiary'}`}>{tool.name}</span>
                </div>
                <ToggleSwitch checked={settings.enabledTools[tool.key]} onChange={() => handleToggle(tool.key)} />
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

export default ManageToolsModal;