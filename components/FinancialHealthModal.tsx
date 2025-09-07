import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AppState, FinancialProfile, Budget, TransactionType } from '../types';
import ModalHeader from './ModalHeader';
import { calculateFinancialHealthScore } from '../utils/financialHealth';
import { SettingsContext } from '../contexts/SettingsContext';
import { getAIBudgetSuggestion, getAIFinancialTips } from '../services/geminiService';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import LoadingSpinner from './LoadingSpinner';

const modalRoot = document.getElementById('modal-root')!;

interface FinancialHealthModalProps {
  onClose: () => void;
  appState: AppState;
  onSaveProfile: (profile: FinancialProfile) => void;
  onSaveBudget: (categoryId: string, amount: number) => void;
}

const FinancialHealthModal: React.FC<FinancialHealthModalProps> = ({ onClose, appState, onSaveProfile, onSaveBudget }) => {
  const { financialProfile } = appState;
  const { totalScore, breakdown } = useMemo(() => calculateFinancialHealthScore(appState), [appState]);
  const [profile, setProfile] = useState(financialProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(!financialProfile.monthlySalary);
  const [aiTips, setAiTips] = useState<string>('');
  const [isLoadingTips, setIsLoadingTips] = useState(true);

  useEffect(() => {
    const fetchTips = async () => {
        setIsLoadingTips(true);
        try {
            const tips = await getAIFinancialTips(totalScore, breakdown);
            setAiTips(tips);
        } catch (error) {
            setAiTips("Could not load tips at this time. Please check your connection.");
        }
        setIsLoadingTips(false);
    }
    fetchTips();
  }, [totalScore, breakdown]);


  const handleProfileChange = (field: keyof FinancialProfile, value: string) => {
    setProfile(p => ({ ...p, [field]: parseFloat(value) || 0 }));
  };

  const handleProfileSave = () => {
    onSaveProfile(profile);
    setIsEditingProfile(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const BreakdownPillar: React.FC<{title: string, score: number, maxScore: number, children: React.ReactNode}> = ({ title, score, maxScore, children }) => (
      <div className="p-4 bg-subtle rounded-lg">
          <div className="flex justify-between items-baseline">
              <h4 className="font-semibold text-primary">{title}</h4>
              <p className={`font-bold text-lg ${getScoreColor(score/maxScore*100)}`}>{score}<span className="text-sm text-secondary">/{maxScore}</span></p>
          </div>
          <div className="text-sm text-secondary mt-1">{children}</div>
      </div>
  );
  
  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Financial Health" onClose={onClose} icon="❤️‍🩹" />
        <div className="p-6 space-y-4 overflow-y-auto">
            <div className="text-center">
                <p className="text-secondary">Your Financial Health Score</p>
                <p className={`text-6xl font-bold ${getScoreColor(totalScore)}`}>{totalScore}<span className="text-3xl text-secondary">/100</span></p>
            </div>

            <div className="p-4 bg-violet-900/50 border border-violet-700 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">✨ AI Coach Tips</h4>
                {isLoadingTips ? <div className="flex justify-center"><LoadingSpinner/></div> : <p className="text-sm text-violet-200 whitespace-pre-wrap">{aiTips}</p>}
            </div>

            <BreakdownPillar title="Savings Rate" score={breakdown.savings.score} maxScore={40}>Your savings rate last month was <strong>{breakdown.savings.rate}%</strong>. Higher is better.</BreakdownPillar>
            <BreakdownPillar title="Debt-to-Income" score={breakdown.dti.score} maxScore={25}>Your monthly loan payments are <strong>{breakdown.dti.rate}%</strong> of your income. Lower is better.</BreakdownPillar>
            <BreakdownPillar title="Budget Adherence" score={breakdown.budget.score} maxScore={20}>You spent <strong>{breakdown.budget.adherence}%</strong> of your total budget. Staying under 100% is key.</BreakdownPillar>
            <BreakdownPillar title="Emergency Fund" score={breakdown.emergency.score} maxScore={15}>You have funded <strong>{breakdown.emergency.status}%</strong> of your emergency goal.</BreakdownPillar>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default FinancialHealthModal;