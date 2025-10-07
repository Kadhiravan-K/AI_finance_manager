import React, { useState } from 'react';
import Auth from './Auth';

interface WelcomeScreenProps {
  onSkip: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSkip }) => {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-center p-4 text-center overflow-hidden">
      <div className="aurora-container">
        <div className="aurora aurora-1"></div>
        <div className="aurora aurora-2"></div>
        <div className="aurora aurora-3"></div>
      </div>
      
      {showAuth ? (
        <Auth onBack={() => setShowAuth(false)} />
      ) : (
        <div className="relative z-10 animate-fadeInUp">
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            Take Control of Your Finances.
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            The all-in-one, AI-powered hub to track, manage, and understand your money like never before.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowAuth(true)}
              className="button-primary px-8 py-3 text-lg font-semibold glow"
            >
              Sign In / Sign Up
            </button>
            <button
              onClick={onSkip}
              className="font-semibold text-slate-300 hover:text-white transition-colors px-8 py-3"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;
