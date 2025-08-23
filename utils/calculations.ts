import { TripExpense } from '../types';

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

export function calculateTripSummary(expenses: TripExpense[]): Settlement[] {
    const balances: Record<string, Balance> = {};

    // Calculate how much each person paid and how much they should have paid
    expenses.forEach(expense => {
        const totalPaid = expense.amount;
        const paidBy = expense.paidByContactId;

        // Credit the person who paid
        if (!balances[paidBy]) {
            const payerName = expense.splitDetails.find(s => s.id === paidBy)?.personName || 'Unknown';
            balances[paidBy] = { contactId: paidBy, name: payerName, balance: 0 };
        }
        balances[paidBy].balance += totalPaid;

        // Debit everyone in the split
        expense.splitDetails.forEach(split => {
            if (!balances[split.id]) {
                balances[split.id] = { contactId: split.id, name: split.personName, balance: 0 };
            }
            balances[split.id].balance -= split.amount;
        });
    });

    const creditors: Balance[] = [];
    const debtors: Balance[] = [];

    Object.values(balances).forEach(b => {
        // Use a small epsilon to handle floating point inaccuracies
        if (b.balance > 0.01) {
            creditors.push({ ...b });
        } else if (b.balance < -0.01) {
            debtors.push({ ...b, balance: -b.balance });
        }
    });

    const settlements: Settlement[] = [];

    // Simple greedy algorithm to settle debts
    while (debtors.length > 0 && creditors.length > 0) {
        const debtor = debtors[0];
        const creditor = creditors[0];
        
        const amount = Math.min(debtor.balance, creditor.balance);

        settlements.push({
            from: debtor.name,
            to: creditor.name,
            amount: amount,
        });

        debtor.balance -= amount;
        creditor.balance -= amount;

        if (debtor.balance < 0.01) {
            debtors.shift();
        }
        if (creditor.balance < 0.01) {
            creditors.shift();
        }
    }

    return settlements;
}
