import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, actionText, onAction }) => {
  return (
    <div className="text-center py-12 px-4 flex flex-col items-center animate-fadeInUp">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-primary">{title}</h3>
      <p className="text-sm text-secondary max-w-xs mx-auto mt-2">{message}</p>
      {actionText && onAction && (
        <button onClick={onAction} className="button-primary mt-6 px-5 py-2">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
