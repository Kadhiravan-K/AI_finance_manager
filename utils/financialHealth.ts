import { Transaction, Account, AccountType, InvestmentHolding, FinancialProfile, Budget, Goal } from '../types';

interface ScoreData {
    transactions: Transaction[];
    accounts: Account[];
    investmentHoldings: InvestmentHolding[];
    financialProfile: FinancialProfile;
    budgets: Budget[];
    goals: Goal[];
}

const getMonthlyTotals = (transactions: Transaction[], monthsAgo: number = 0): { income: number, expense: number, savings: number } => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const targetMonthString = targetMonth.toISOString().slice(0, 7);

    const monthlyTransactions = transactions.filter(t => t.date.startsWith(targetMonthString));
    
    const totals = monthlyTransactions.reduce((acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
    }, { income: 0, expense: 0 });

    return { ...totals, savings: totals.income - totals.expense };
};

// Pillar 1: Savings Rate (40 points)
const calculateSavingsRateScore = (monthlyIncome: number, monthlySavings: number): { score: number, rate: number } => {
    if (monthlyIncome <= 0) return { score: 0, rate: 0 };
    const rate = (monthlySavings / monthlyIncome) * 100;

    let score = 0;
    if (rate >= 20) score = 40;
    else if (rate >= 15) score = 30;
    else if (rate >= 10) score = 20;
    else if (rate >= 5) score = 10;
    else if (rate > 0) score = 5;

    return { score, rate: Math.round(rate) };
};

// Pillar 2: Debt-to-Income Ratio (25 points)
const calculateDtiScore = (monthlyIncome: number, monthlyEmi: number): { score: number, rate: number } => {
    if (monthlyIncome <= 0) return { score: 0, rate: 100 };
    const rate = (monthlyEmi / monthlyIncome) * 100;

    let score = 0;
    if (rate <= 10) score = 25;
    else if (rate <= 20) score = 20;
    else if (rate <= 30) score = 15;
    else if (rate <= 40) score = 10;
    else if (rate <= 50) score = 5;
    
    return { score, rate: Math.round(rate) };
};

// Pillar 3: Budget Adherence (20 points)
const calculateBudgetScore = (budgets: Budget[], transactions: Transaction[]): { score: number, adherence: number } => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentBudgets = budgets.filter(b => b.month === currentMonth);
    if (currentBudgets.length === 0) return { score: 5, adherence: 100 }; // Small score for having budgets, perfect adherence if none set

    const spending = getMonthlyTotals(transactions, 0).expense;
    const totalBudget = currentBudgets.reduce((sum, b) => sum + b.amount, 0);
    
    if (totalBudget === 0) return { score: 5, adherence: 100 };

    const adherence = (spending / totalBudget) * 100;
    
    let score = 0;
    if (adherence <= 90) score = 20;
    else if (adherence <= 100) score = 15;
    else if (adherence <= 110) score = 10;
    else if (adherence <= 120) score = 5;

    return { score, adherence: Math.round(adherence) };
};

// Pillar 4: Emergency Fund (15 points)
const calculateEmergencyFundScore = (accounts: Account[], allTransactions: Transaction[], investmentHoldings: InvestmentHolding[], goal: number): { score: number, status: number } => {
    if (goal <= 0) return { score: 0, status: 0 };

    const accountBalances = allTransactions.reduce((acc, t) => {
        acc[t.accountId] = (acc[t.accountId] || 0) + (t.type === 'income' ? t.amount : -t.amount);
        return acc;
    }, {} as Record<string, number>);

    const liquidAssets = accounts.filter(a => a.accountType === AccountType.DEPOSITORY)
        .reduce((sum, acc) => sum + (accountBalances[acc.id] || 0), 0);
    
    const status = (liquidAssets / goal) * 100;

    let score = 0;
    if (status >= 100) score = 15;
    else if (status >= 75) score = 12;
    else if (status >= 50) score = 8;
    else if (status >= 25) score = 4;

    return { score, status: Math.round(status) };
};

export const calculateFinancialHealthScore = (scoreData: ScoreData) => {
    const { transactions, accounts, investmentHoldings, financialProfile, budgets } = scoreData;

    const { income, savings } = getMonthlyTotals(transactions, 1); // Use last month's data for a complete picture
    const monthlyIncome = financialProfile.monthlySalary > 0 ? financialProfile.monthlySalary : income;
    
    const savingsPillar = calculateSavingsRateScore(monthlyIncome, savings);
    const dtiPillar = calculateDtiScore(monthlyIncome, financialProfile.monthlyEmi);
    const budgetPillar = calculateBudgetScore(budgets, transactions);
    const emergencyPillar = calculateEmergencyFundScore(accounts, transactions, investmentHoldings, financialProfile.emergencyFundGoal);

    const totalScore = Math.round(
        savingsPillar.score +
        dtiPillar.score +
        budgetPillar.score +
        emergencyPillar.score
    );

    return {
        totalScore,
        breakdown: {
            savings: savingsPillar,
            dti: dtiPillar,
            budget: budgetPillar,
            emergency: emergencyPillar,
        }
    };
};