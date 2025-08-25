import { TripExpense, TripPayer, Trip } from '../types';
import { USER_SELF_ID } from '../constants';

interface Balance {
    contactId: string;
    name: string;
    balance: number;
}

interface Settlement {
    from: string; // Name of person who pays
    to: string;   // Name of person who receives
    amount: number;
}

export function calculateTripSummary(expenses: TripExpense[], trips?: Trip[]): Record<string, Settlement[]> {
    const expensesByCurrency: Record<string, TripExpense[]> = {};

    // Group expenses by currency
    expenses.forEach(expense => {
        const trip = trips?.find(t => t.id === expense.tripId);
        // Default to a base currency if trip not found (should not happen in normal flow)
        const currency = trip?.currency || 'default';
        if (!expensesByCurrency[currency]) {
            expensesByCurrency[currency] = [];
        }
        expensesByCurrency[currency].push(expense);
    });

    const settlementsByCurrency: Record<string, Settlement[]> = {};

    for (const currency in expensesByCurrency) {
        const currencyExpenses = expensesByCurrency[currency];
        const balances: Record<string, Balance> = {};

        const getParticipantName = (contactId: string) => {
            if (contactId === USER_SELF_ID) return 'You';
            // This is a simplification. In a real app, you'd look up the name from a contacts list
            // based on the trip's participants. For now, we rely on names in splitDetails.
            for (const expense of currencyExpenses) {
                const participant = expense.splitDetails.find(p => p.id === contactId);
                if (participant) return participant.personName;
            }
            return 'Unknown';
        };

        const ensureBalance = (contactId: string, name: string) => {
            if (!balances[contactId]) {
                balances[contactId] = { contactId, name, balance: 0 };
            }
        };

        currencyExpenses.forEach(expense => {
            expense.payers.forEach(payer => {
                const payerName = getParticipantName(payer.contactId);
                ensureBalance(payer.contactId, payerName);
                balances[payer.contactId].balance += payer.amount;
            });
            expense.splitDetails.forEach(split => {
                ensureBalance(split.id, split.personName);
                balances[split.id].balance -= split.amount;
            });
        });

        const creditors: Balance[] = [];
        const debtors: Balance[] = [];

        Object.values(balances).forEach(b => {
            if (b.balance > 0.01) creditors.push({ ...b });
            else if (b.balance < -0.01) debtors.push({ ...b, balance: -b.balance });
        });
        
        // Sort for deterministic results
        creditors.sort((a,b) => b.balance - a.balance);
        debtors.sort((a,b) => b.balance - a.balance);

        const settlements: Settlement[] = [];
        while (debtors.length > 0 && creditors.length > 0) {
            const debtor = debtors[0];
            const creditor = creditors[0];
            const amount = Math.min(debtor.balance, creditor.balance);

            if (amount > 0.01) {
                settlements.push({ from: debtor.name, to: creditor.name, amount });
            }

            debtor.balance -= amount;
            creditor.balance -= amount;

            if (debtor.balance < 0.01) debtors.shift();
            if (creditor.balance < 0.01) creditors.shift();
        }
        settlementsByCurrency[currency] = settlements;
    }

    return settlementsByCurrency;
}