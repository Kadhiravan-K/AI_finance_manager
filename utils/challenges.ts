import { Challenge, ChallengeType } from '../types';

const ALL_CHALLENGES: { type: ChallengeType; description: string }[] = [
    { type: 'log_transaction', description: 'Log at least one expense or income transaction today.' },
    { type: 'categorize_uncategorized', description: 'Find and categorize one uncategorized transaction.' },
    { type: 'set_budget', description: 'Set or update a budget for any category this month.' },
    { type: 'review_goals', description: 'Review your financial goals and add a contribution.' },
];

export function getDailyChallenge(existingChallenges: Challenge[]): Challenge {
    const today = new Date().toISOString().split('T')[0];
    const todaysChallenge = existingChallenges.find(c => c.date === today);

    if (todaysChallenge) {
        return todaysChallenge;
    }

    // Simple logic: pick a random challenge that wasn't yesterday's
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayChallenge = existingChallenges.find(c => c.date === yesterdayStr);

    let possibleChallenges = ALL_CHALLENGES;
    if (yesterdayChallenge) {
        possibleChallenges = ALL_CHALLENGES.filter(c => c.type !== yesterdayChallenge.type);
    }
    
    const newChallengeTemplate = possibleChallenges[Math.floor(Math.random() * possibleChallenges.length)];
    
    const newChallenge: Challenge = {
        id: self.crypto.randomUUID(),
        date: today,
        isCompleted: false,
        ...newChallengeTemplate
    };
    
    return newChallenge;
}

// TODO: Implement logic to check if a challenge is completed by analyzing appState.