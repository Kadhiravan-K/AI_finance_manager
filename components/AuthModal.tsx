
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import { auth } from '../services/supabaseService';
import LoadingSpinner from './LoadingSpinner';

const modalRoot = document.getElementById('modal-root')!;

interface AuthModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            if (isLogin) {
                const { error } = await auth.signIn(email, password);
                if (error) throw error;
            } else {
                const { error } = await auth.signUp(email, password);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Authentication failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
            <div className="glass-card rounded-2xl shadow-2xl w-full max-w-md border border-divider animate-scaleIn overflow-hidden">
                <ModalHeader title={isLogin ? "Welcome Back" : "Create Account"} onClose={onClose} />
                <div className="p-8">
                    <div className="text-center mb-6">
                        <div className="text-5xl mb-4">🔐</div>
                        <p className="text-secondary text-sm">
                            {isLogin 
                                ? "Sign in to sync your finances across devices securely." 
                                : "Join us to back up your data and unlock cloud features."}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/50 rounded-lg text-rose-400 text-xs text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-tertiary uppercase mb-1 ml-1">Email Address</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className="input-base w-full p-3 rounded-xl" 
                                placeholder="name@example.com"
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-tertiary uppercase mb-1 ml-1">Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="input-base w-full p-3 rounded-xl" 
                                placeholder="••••••••"
                                required 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="button-primary w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            {isLoading ? <LoadingSpinner /> : (isLogin ? "Sign In" : "Get Started")}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-sky-400 hover:text-sky-300 font-medium transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AuthModal;
