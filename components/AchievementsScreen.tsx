import React from 'react';
import { UnlockedAchievement } from '../types';
import { ALL_ACHIEVEMENTS } from '../utils/achievements';

interface AchievementsScreenProps {
  unlockedAchievements: UnlockedAchievement[];
}

const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ unlockedAchievements }) => {
  
  const unlockedMap = new Map(unlockedAchievements.map(a => [a.achievementId, a.date]));

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0">
        <h2 className="text-xl font-bold text-primary text-center">Achievements</h2>
      </div>
      <div className="flex-grow overflow-y-auto p-6">
        <div className="achievements-grid">
          {ALL_ACHIEVEMENTS.map(achievement => {
            const unlockedDate = unlockedMap.get(achievement.id);
            const isUnlocked = !!unlockedDate;

            return (
              <div
                key={achievement.id}
                className={`achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="icon">{achievement.icon}</div>
                <div className="name">{achievement.name}</div>
                <div className="description">{achievement.description}</div>
                {isUnlocked && (
                  <div className="date">
                    Unlocked: {new Date(unlockedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AchievementsScreen;
