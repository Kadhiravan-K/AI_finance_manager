import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface QuickAddFormProps {
  text: string;
  setText: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isDisabled: boolean;
  disabledReason?: string;
}

const QuickAddForm: React.FC<QuickAddFormProps> = ({ text, setText, onSubmit, isLoading, isDisabled, disabledReason }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Paste message or Quick Add: "Lunch 500"'
          className="w-full h-24 p-3 transition-all duration-200 resize-none shadow-inner themed-textarea"
          disabled={isDisabled}
          aria-label="Transaction message input"
          autoFocus
        />
        <button
          type="submit"
          disabled={isDisabled || !text.trim()}
          className="button-primary w-full flex items-center justify-center font-bold py-3 px-4"
        >
          {isLoading ? <LoadingSpinner /> : 'Quick Add'}
        </button>
      </form>
      {disabledReason && isDisabled && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-card)', opacity: 0.7, borderRadius: '9999px' }}>
          <p className="font-semibold text-secondary">{disabledReason}</p>
        </div>
      )}
    </div>
  );
};

export default QuickAddForm;