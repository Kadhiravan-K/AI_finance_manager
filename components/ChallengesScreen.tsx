import React, { useState, useEffect } from 'react';
import { UserStreak, Challenge, AppState, ChallengeType } from '../types';
import { getDailyChallenge } from '../utils/challenges';
import LoadingSpinner from './LoadingSpinner';

interface ChallengesScreenProps {
  appState: AppState;
  setChallenges: (value: Challenge[] | ((val: Challenge[]) => Challenge[])) => Promise<void>;
}

const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ appState, setChallenges }) => {
  const { streaks, challenges } = appState;
  const [dailyChallenge, setDailyChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeChallenge = async () => {
      setIsLoading(true);
      const challenge = await getDailyChallenge(appState, setChallenges);
      setDailyChallenge(challenge);
      setIsLoading(false);
    };
    initializeChallenge();
  }, [appState, setChallenges]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0">
        <h2 className="text-2xl font-bold text-primary text-center">Streaks & Challenges 🔥</h2>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {/* Streaks Section */}
        <div className="p-4 bg-subtle rounded-lg text-center">
          <p className="text-5xl mb-2">🔥</p>
          <p className="text-3xl font-bold text-primary">{streaks.currentStreak} Day Streak</p>
          <p className="text-sm text-secondary">Your longest streak is {streaks.longestStreak} days. Keep it up!</p>
          <div className="mt-4 p-2 bg-subtle border border-divider rounded-full inline-flex items-center gap-2">
            <span className="text-yellow-400">❄️</span>
            <span className="text-sm font-semibold text-primary">{streaks.streakFreezes} Freezes Available</span>
          </div>
        </div>
        
        {/* Daily Challenge Section */}
        <div>
          <h3 className="font-semibold text-lg text-primary mb-2">Today's Challenge</h3>
          {isLoading ? (
            <div className="p-4 rounded-lg bg-subtle flex items-center justify-center h-24">
                <LoadingSpinner />
            </div>
          ) : dailyChallenge ? (
            <div className={`p-4 rounded-lg flex items-center gap-4 ${dailyChallenge.isCompleted ? 'bg-emerald-900/50 border border-emerald-700' : 'bg-subtle'}`}>
              <div className="text-3xl">{dailyChallenge.isCompleted ? '✅' : '🎯'}</div>
              <div>
                <p className="font-semibold text-primary">{dailyChallenge.description}</p>
                {dailyChallenge.isCompleted ? (
                  <p className="text-sm text-emerald-400">Completed! Great job!</p>
                ) : (
                  <p className="text-sm text-secondary">Complete this to maintain your streak.</p>
                )}
              </div>
            </div>
          ) : (
             <div className="p-4 rounded-lg bg-subtle text-center">
                <p className="text-secondary">Could not load today's challenge.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengesScreen;