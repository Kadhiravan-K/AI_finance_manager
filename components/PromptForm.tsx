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
          className="w-full h-24 p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all duration-200 resize-none shadow-inner shadow-slate-900/50"
          disabled={isDisabled}
          aria-label="Transaction message input"
        />
        <button
          type="submit"
          disabled={isDisabled || !text.trim()}
          className="w-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold py-3 px-4 rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed disabled:text-slate-400 transition-all duration-200 transform active:scale-[0.98] shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:shadow-none"
        >
          {isLoading ? <LoadingSpinner /> : 'Quick Add'}
        </button>
      </form>
      {disabledReason && isDisabled && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-xl">
          <p className="text-slate-400 font-semibold">{disabledReason}</p>
        </div>
      )}
    </div>
  );
};

export default QuickAddForm;