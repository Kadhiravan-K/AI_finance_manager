import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import { SettingsContext } from '../contexts/SettingsContext';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface IntegrationsModalProps {
  onClose: () => void;
}

const IntegrationsModal: React.FC<IntegrationsModalProps> = ({ onClose }) => {
  const { settings, setSettings } = useContext(SettingsContext);
  const isConnected = settings.googleCalendar?.connected || false;

  const handleToggleConnection = () => {
    setSettings(prev => ({
      ...prev,
      googleCalendar: {
        ...prev.googleCalendar,
        connected: !isConnected,
      }
    }));
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Integrations" onClose={onClose} icon="🔗" />
        <div className="p-6 space-y-4 overflow-y-auto">
            <div className="p-4 bg-subtle rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🗓️</span>
                        <div>
                            <h4 className="font-semibold text-primary">Google Calendar</h4>
                            <p className="text-xs text-secondary">
                                {isConnected ? 'Connected' : 'Not Connected'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleConnection}
                        className={`button-secondary px-4 py-2 text-sm ${isConnected ? 'bg-rose-500/80 hover:bg-rose-500 text-white' : ''}`}
                    >
                        {isConnected ? 'Disconnect' : 'Connect'}
                    </button>
                </div>
                 <p className="text-xs text-tertiary mt-3 pt-3 border-t border-divider">
                    Connect your Google Calendar to automatically add due dates for scheduled payments and expected refund dates as events. This is a demo and does not connect to a real Google account.
                </p>
            </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default IntegrationsModal;