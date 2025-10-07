import React, { useState, useEffect } from 'react';
import { Achievement } from '../types';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 100); // Animate in after mount

    const exitTimer = setTimeout(() => {
      setVisible(false); // Animate out
    }, 4000); // Wait 4 seconds

    const dismissTimer = setTimeout(() => {
        onDismiss();
    }, 4500); // Dismiss after animation

    return () => {
        clearTimeout(enterTimer);
        clearTimeout(exitTimer);
        clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div className={`achievement-toast ${visible ? 'visible' : ''}`}>
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