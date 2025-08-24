import React from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface Notification {
  id: string;
  type: 'bill' | 'budget' | 'goal';
  title: string;
  message: string;
  date: string;
  icon: string;
}

interface NotificationsModalProps {
  onClose: () => void;
  notifications: Notification[];
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose, notifications }) => {
  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Notifications" onClose={onClose} icon="🔔" />
        <div className="flex-grow overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <p className="text-center text-secondary py-8">You have no new notifications.</p>
          ) : (
            notifications.map(notification => (
              <div key={notification.id} className="p-3 bg-subtle rounded-lg flex items-start gap-4">
                <div className="text-2xl mt-1">{notification.icon}</div>
                <div>
                  <p className="font-semibold text-primary">{notification.title}</p>
                  <p className="text-sm text-secondary">{notification.message}</p>
                  <p className="text-xs text-tertiary mt-1">{new Date(notification.date).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default NotificationsModal;