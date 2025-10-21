

import { TripExpense, Trip, Settlement } from '../types';
import { USER_SELF_ID, TRIP_FUND_ID } from '../types';

interface Balance {
    contactId: string;
    name: string;
    balance: number;
}

export interface SettlementSuggestion {
    fromId: string;
    toId: string;
    fromName: string;
    toName: string;
    amount: number;
}

export function calculateTripSummary(
    expenses: TripExpense[],
    trips?: Trip[],
    settlements?: Settlement[]
): Record<string, SettlementSuggestion[]> {
    const expensesByCurrency: Record<string, TripExpense[]> = {};
    const settlementsByCurrency: Record<string, Settlement[]> = {};

    // Group expenses by currency
    expenses.forEach(expense => {
        const trip = trips?.find(t => t.id === expense.tripId);
        const currency = trip?.currency || 'default';
        if (!expensesByCurrency[currency]) expensesByCurrency[currency] = [];
        expensesByCurrency[currency].push(expense);
    });

    // Group settlements by currency
    (settlements || []).forEach(settlement => {
        const currency = settlement.currency;
        if (!settlementsByCurrency[currency]) settlementsByCurrency[currency] = [];
        settlementsByCurrency[currency].push(settlement);
    });
    
    const allCurrencies = new Set([...Object.keys(expensesByCurrency), ...Object.keys(settlementsByCurrency)]);
    const finalSettlements: Record<string, SettlementSuggestion[]> = {};

    for (const currency of allCurrencies) {
        const currencyExpenses = expensesByCurrency[currency] || [];
        const currencySettlements = settlementsByCurrency[currency] || [];
        const balances: Record<string, Balance> = {};

        const allParticipants = new Map<string, string>();
        allParticipants.set(USER_SELF_ID, 'You');
        (trips || []).forEach(trip => {
            if (trip.currency === currency) {
                trip.participants.forEach(p => allParticipants.set(p.contactId, p.name));
            }
        });

        const getParticipantName = (contactId: string) => allParticipants.get(contactId) || 'Unknown Contact';
        
        const ensureBalance = (contactId: string) => {
            if (!balances[contactId]) {
                balances[contactId] = { contactId, name: getParticipantName(contactId), balance: 0 };
            }
        };
        
        // Apply advances first
        (trips || []).forEach(trip => {
            if (trip.currency === currency) {
                (trip.advances || []).forEach(advance => {
                    ensureBalance(advance.contactId);
                    balances[advance.contactId].balance += advance.amount;
                });
            }
        });


        currencyExpenses.forEach(expense => {
            expense.payers.forEach(payer => {
                if (payer.contactId === TRIP_FUND_ID) return; // Money from the trip fund doesn't credit an individual
                ensureBalance(payer.contactId);
                balances[payer.contactId].balance += payer.amount;
            });
            expense.splitDetails.forEach(split => {
                ensureBalance(split.id);
                balances[split.id].balance -= split.amount;
            });
        });

        // Adjust balances based on recorded settlements
        currencySettlements.forEach(settlement => {
            ensureBalance(settlement.fromContactId);
            ensureBalance(settlement.toContactId);
            balances[settlement.fromContactId].balance += settlement.amount;
            balances[settlement.toContactId].balance -= settlement.amount;
        });

        const creditors: Balance[] = [];
        const debtors: Balance[] = [];

        Object.values(balances).forEach(b => {
            if (b.balance > 0.01) creditors.push({ ...b });
            else if (b.balance < -0.01) debtors.push({ ...b, balance: -b.balance });
        });
        
        creditors.sort((a,b) => b.balance - a.balance);
        debtors.sort((a,b) => b.balance - a.balance);

        const settlementSuggestions: SettlementSuggestion[] = [];
        while (debtors.length > 0 && creditors.length > 0) {
            const debtor = debtors[0];
            const creditor = creditors[0];
            const amount = Math.min(debtor.balance, creditor.balance);

            if (amount > 0.01) {
                settlementSuggestions.push({
                    fromId: debtor.contactId,
                    fromName: debtor.name,
                    toId: creditor.contactId,
                    toName: creditor.name,
                    amount
                });
            }

            debtor.balance -= amount;
            creditor.balance -= amount;

            if (debtor.balance < 0.01) debtors.shift();
            if (creditor.balance < 0.01) creditors.shift();
        }
        finalSettlements[currency] = settlementSuggestions;
    }

    return finalSettlements;
}