import React, { useState, useMemo, useContext, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AppState, FinancialProfile, Budget, TransactionType } from '../types';
import ModalHeader from './ModalHeader';
import { calculateFinancialHealthScore } from '../utils/financialHealth';
import { SettingsContext } from '../contexts/SettingsContext';
import { getAIBudgetSuggestion, getAIFinancialTips, getAIChatResponse } from '../services/geminiService';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import LoadingSpinner from './LoadingSpinner';

const modalRoot = document.getElementById('modal-root')!;

interface FinancialHealthModalProps {
  onClose: () => void;
  appState: AppState;
  onSaveProfile: (profile: FinancialProfile) => void;
  onSaveBudget: (categoryId: string, amount: number) => void;
}

type ActiveTab = 'breakdown' | 'advisor';

const FinancialHealthModal: React.FC<FinancialHealthModalProps> = ({ onClose, appState, onSaveProfile, onSaveBudget }) => {
  const { financialProfile, categories } = appState;
  const { totalScore, breakdown } = useMemo(() => calculateFinancialHealthScore(appState), [appState]);
  const formatCurrency = useCurrencyFormatter();

  const [activeTab, setActiveTab] = useState<ActiveTab>('breakdown');
  const [formState, setFormState] = useState<FinancialProfile>(financialProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [budgetSuggestion, setBudgetSuggestion] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [tips, setTips] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string, parts: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const isProfileSetup = financialProfile.monthlySalary > 0;
  
  useEffect(() => {
    if (isProfileSetup && activeTab === 'advisor' && !tips) {
      setIsLoading(true);
      getAIFinancialTips(totalScore, breakdown).then(setTips).finally(() => setIsLoading(false));
    }
  }, [isProfileSetup, activeTab, tips, totalScore, breakdown]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formState);
    setIsEditingProfile(false);
    setIsLoading(true);
    try {
        const suggestion = await getAIBudgetSuggestion(formState, categories);
        setBudgetSuggestion(suggestion);
    } catch (err) {
        alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
        setIsLoading(false);
    }
  };

  const handleApplyBudget = () => {
    if (!budgetSuggestion) return;
    budgetSuggestion.forEach(item => {
        const category = categories.find(c => c.name === item.categoryName && c.type === TransactionType.EXPENSE);
        if (category) {
            onSaveBudget(category.id, item.amount);
        }
    });
    setBudgetSuggestion(null); // Clear suggestion after applying
    alert("AI Budget has been applied!");
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', parts: userMessage }]);
    setIsChatLoading(true);

    try {
        const response = await getAIChatResponse(appState, userMessage, chatHistory);
        setChatHistory(prev => [...prev, { role: 'model', parts: response }]);
    } catch (err) {
        setChatHistory(prev => [...prev, { role: 'model', parts: "Sorry, I encountered an error." }]);
    } finally {
        setIsChatLoading(false);
    }
  }

  const PillarCard = ({ title, value, unit, score, maxScore }: { title: string, value: number, unit: string, score: number, maxScore: number }) => {
    const percentage = (score / maxScore) * 100;
    return (
        <div className="p-3 bg-subtle rounded-lg">
            <p className="text-sm text-secondary">{title}</p>
            <p className="text-xl font-bold text-primary">{value}{unit}</p>
            <div className="w-full bg-subtle rounded-full h-2 mt-2 border border-divider">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Financial Health" onClose={onClose} icon="❤️‍🩹" />
        <div className="flex border-b border-divider flex-shrink-0">
            <button onClick={() => setActiveTab('breakdown')} className={`w-full py-3 text-sm font-semibold transition-colors ${activeTab === 'breakdown' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary'}`}>Score Breakdown</button>
            <button onClick={() => setActiveTab('advisor')} className={`w-full py-3 text-sm font-semibold transition-colors ${activeTab === 'advisor' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary'}`}>AI Advisor</button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6">
          {activeTab === 'breakdown' && (
            <div className="space-y-4 animate-fadeInUp">
              <p className="text-center text-secondary">Your score is calculated from these key financial areas.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PillarCard title="Savings Rate" value={breakdown.savings.rate} unit="%" score={breakdown.savings.score} maxScore={40} />
                <PillarCard title="Debt-to-Income" value={breakdown.dti.rate} unit="%" score={breakdown.dti.score} maxScore={25} />
                <PillarCard title="Budget Adherence" value={breakdown.budget.adherence} unit="%" score={breakdown.budget.score} maxScore={20} />
                <PillarCard title="Emergency Fund" value={breakdown.emergency.status} unit="%" score={breakdown.emergency.score} maxScore={15} />
              </div>
            </div>
          )}

          {activeTab === 'advisor' && (
            <div className="animate-fadeInUp">
              {!isProfileSetup || isEditingProfile ? (
                <form onSubmit={handleProfileSave} className="space-y-3">
                  <h3 className="font-semibold text-primary">{isEditingProfile ? "Update Your Profile" : "Let's set up your financial profile"}</h3>
                  <p className="text-sm text-secondary">This helps the AI give you personalized advice.</p>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Monthly Salary</label>
                    <input type="number" value={formState.monthlySalary || ''} onChange={e => setFormState(p => ({ ...p, monthlySalary: parseFloat(e.target.value) }))} className="w-full input-base p-2 rounded-md no-spinner" required />
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Monthly Rent/Mortgage</label>
                    <input type="number" value={formState.monthlyRent || ''} onChange={e => setFormState(p => ({ ...p, monthlyRent: parseFloat(e.target.value) }))} className="w-full input-base p-2 rounded-md no-spinner" />
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Total Monthly Loan/EMI Payments</label>
                    <input type="number" value={formState.monthlyEmi || ''} onChange={e => setFormState(p => ({ ...p, monthlyEmi: parseFloat(e.target.value) }))} className="w-full input-base p-2 rounded-md no-spinner" />
                  </div>
                  <div>
                    <label className="text-xs text-secondary mb-1 block">Emergency Fund Goal</label>
                    <input type="number" value={formState.emergencyFundGoal || ''} onChange={e => setFormState(p => ({ ...p, emergencyFundGoal: parseFloat(e.target.value) }))} className="w-full input-base p-2 rounded-md no-spinner" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    {isEditingProfile && <button type="button" onClick={() => setIsEditingProfile(false)} className="button-secondary px-4 py-2">Cancel</button>}
                    <button type="submit" className="button-primary px-4 py-2">Save & Get Advice</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {isLoading && <div className="text-center p-4"><LoadingSpinner /></div>}

                  {budgetSuggestion && (
                    <div className="p-4 bg-subtle rounded-lg border border-divider">
                      <h4 className="font-bold text-primary mb-2">AI Budget Suggestion</h4>
                      <p className="text-sm text-secondary mb-3">Based on your profile, here's a suggested starting budget:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {budgetSuggestion.map(item => (
                          <div key={item.categoryName} className="text-xs p-2 bg-subtle rounded">
                            <div className="flex justify-between font-semibold"><span className="text-primary">{item.categoryName}</span><span className="text-primary">{formatCurrency(item.amount)}</span></div>
                            <p className="text-tertiary">{item.reasoning}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button onClick={() => setBudgetSuggestion(null)} className="button-secondary text-xs px-3 py-1">Dismiss</button>
                        <button onClick={handleApplyBudget} className="button-primary text-xs px-3 py-1">Apply Budget</button>
                      </div>
                    </div>
                  )}

                  {tips && !budgetSuggestion && (
                     <div className="p-4 bg-subtle rounded-lg border border-divider">
                         <h4 className="font-bold text-primary mb-2">Personalized Tips</h4>
                         <p className="text-sm text-secondary whitespace-pre-wrap">{tips}</p>
                         <button onClick={() => setIsEditingProfile(true)} className="text-xs text-sky-400 mt-2 hover:text-sky-300">Update Profile</button>
                     </div>
                  )}

                  <div className="p-4 bg-subtle rounded-lg border border-divider">
                    <h4 className="font-bold text-primary mb-2">Ask the CA</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 flex flex-col-reverse">
                        {[...chatHistory].reverse().map((msg, i) => (
                          <div key={i} className={`p-2 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-sky-800/70 self-end' : 'bg-slate-700/70 self-start'}`}>
                            <p className="text-sm text-primary whitespace-pre-wrap">{msg.parts}</p>
                          </div>
                        ))}
                    </div>
                     <form onSubmit={handleChatSubmit} className="mt-3 flex gap-2">
                        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask a financial question..." className="flex-1 input-base rounded-full p-2" />
                        <button type="submit" disabled={isChatLoading} className="button-primary px-4 py-2">{isChatLoading ? <LoadingSpinner/> : 'Send'}</button>
                    </form>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default FinancialHealthModal;
