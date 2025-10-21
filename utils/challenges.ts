
import { Challenge, ChallengeType, AppState, PersonalizedChallenge } from '../types';
import { generatePersonalizedChallenge } from '../services/geminiService';

const FALLBACK_CHALLENGES: { type: ChallengeType; description: string }[] = [
    { type: ChallengeType.LOG_TRANSACTION, description: 'Log at least one expense or income transaction today.' },
    { type: ChallengeType.CATEGORIZE_UNCATEGORIZED, description: 'Find and categorize one uncategorized transaction.' },
    { type: ChallengeType.SET_BUDGET, description: 'Set or update a budget for any category this month.' },
    { type: ChallengeType.REVIEW_GOALS, description: 'Review your financial goals and add a contribution.' },
];

export async function getDailyChallenge(
    appState: AppState,
    setChallenges: (value: Challenge[] | ((val: Challenge[]) => Challenge[])) => Promise<void>
): Promise<Challenge> {
    const today = new Date().toISOString().split('T')[0];
    const { challenges, transactions } = appState;

    const todaysChallenge = challenges.find(c => c.date === today);

    if (todaysChallenge) {
        return todaysChallenge;
    }

    let newChallenge: Challenge;

    try {
        if (transactions.length > 5) { // Require some data for personalization
            const aiChallenge: PersonalizedChallenge = await generatePersonalizedChallenge(transactions);
            newChallenge = {
                id: self.crypto.randomUUID(),
                date: today,
                isCompleted: false,
                type: 'custom_savings',
                description: aiChallenge.description,
            };
        } else {
            throw new Error("Not enough transactions for personalized challenge.");
        }
    } catch (error) {
        console.warn("AI challenge generation failed, falling back to generic.", error);
        const fallback = FALLBACK_CHALLENGES[Math.floor(Math.random() * FALLBACK_CHALLENGES.length)];
        newChallenge = {
            id: self.crypto.randomUUID(),
            date: today,
            isCompleted: false,
            ...fallback
        };
    }
    
    // Save the new challenge to state
    await setChallenges(prev => [...prev.slice(-20), newChallenge]); // Keep last 20

    return newChallenge;
}
