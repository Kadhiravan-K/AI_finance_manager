import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

interface AuthProps {
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    
    // Simulate API call for demo purposes as credentials are placeholders
    setTimeout(() => {
      setMessage("Magic link sent! (In a real app, you'd now check your email). For this demo, please use 'Continue as Guest' or go back.");
      setLoading(false);
      setIsSubmitted(true);
    }, 1000);
  };

  return (
    <div className="w-full max-w-sm p-8 space-y-4 glass-card rounded-2xl animate-scaleIn">
      <h2 className="text-2xl font-bold text-center text-primary">Sign In / Sign Up</h2>
      <p className="text-sm text-center text-secondary">
        Enter your email to receive a secure magic link. No password required.
      </p>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full input-base px-4 py-2 rounded-full"
            placeholder="your@email.com"
            required
            disabled={loading || isSubmitted}
          />
        </div>
        <button
          type="submit"
          disabled={loading || isSubmitted}
          className="w-full button-primary px-4 py-2 font-semibold"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>
      {message && <p className="text-center text-sm text-emerald-400 mt-4">{message}</p>}
      <div className="text-center pt-2">
        <button onClick={onBack} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
          &larr; Go Back
        </button>
      </div>
    </div>
  );
};

export default Auth;