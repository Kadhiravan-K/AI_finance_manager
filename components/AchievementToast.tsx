import React, { useState, useEffect } from 'react';
import { Achievement } from '../types';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onDismiss }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
    }, 4000); // Wait 4 seconds

    const exitTimer = setTimeout(() => {
        onDismiss();
    }, 4500); // Dismiss after animation

    return () => {
        clearTimeout(timer);
        clearTimeout(exitTimer);
    };
  }, [onDismiss]);

  return (
    <div className={`achievement-toast ${exiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className="glass-card flex items-center gap-4 p-4 rounded-xl shadow-lg border border-emerald-500/50">
        <div className="text-4xl">{achievement.icon}</div>
        <div>
          <p className="font-bold text-emerald-400">Achievement Unlocked!</p>
          <p className="text-sm font-medium text-primary">{achievement.name}</p>
        </div>
      </div>
    </div>
  );
};

export default AchievementToast;
