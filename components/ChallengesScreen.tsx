import React from 'react';
import { UserStreak, Challenge } from '../types';

interface ChallengesScreenProps {
  streak: UserStreak;
  challenge: Challenge;
}

const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ streak, challenge }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0">
        <h2 className="text-2xl font-bold text-primary text-center">Streaks & Challenges 🔥</h2>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {/* Streaks Section */}
        <div className="p-4 bg-subtle rounded-lg text-center">
          <p className="text-5xl mb-2">🔥</p>
          <p className="text-3xl font-bold text-primary">{streak.currentStreak} Day Streak</p>
          <p className="text-sm text-secondary">Your longest streak is {streak.longestStreak} days. Keep it up!</p>
          <div className="mt-4 p-2 bg-subtle border border-divider rounded-full inline-flex items-center gap-2">
            <span className="text-yellow-400">❄️</span>
            <span className="text-sm font-semibold text-primary">{streak.streakFreezes} Freezes Available</span>
          </div>
        </div>
        
        {/* Daily Challenge Section */}
        <div>
          <h3 className="font-semibold text-lg text-primary mb-2">Today's Challenge</h3>
          <div className={`p-4 rounded-lg flex items-center gap-4 ${challenge.isCompleted ? 'bg-emerald-900/50 border border-emerald-700' : 'bg-subtle'}`}>
            <div className="text-3xl">{challenge.isCompleted ? '✅' : '🎯'}</div>
            <div>
              <p className="font-semibold text-primary">{challenge.description}</p>
              {challenge.isCompleted ? (
                <p className="text-sm text-emerald-400">Completed! Great job!</p>
              ) : (
                <p className="text-sm text-secondary">Complete this to maintain your streak.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengesScreen;