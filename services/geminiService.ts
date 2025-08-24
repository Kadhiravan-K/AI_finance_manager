import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType, AppState } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const transactionSchema = {
    type: Type.OBJECT,
    properties: {
        isTransaction: { type: Type.BOOLEAN, description: "Is this a legitimate financial transaction message?" },
        isSpam: { type: Type.BOOLEAN, description: "Is this message likely spam, a phishing attempt, or an advertisement? Analyze sender, language, and content." },
        spamConfidence: { type: Type.NUMBER, description: "A confidence score from 0.0 to 1.0 on whether the message is spam. 1.0 is definitely spam." },
        senderName: { type: Type.STRING, description: "The sender identifier from the message, often a short code like 'HDFCBK' or 'VK-AMZPAY'. If none, leave empty." },
        description: { type: Type.STRING, description: "A brief summary of the transaction (e.g., 'Payment to Merchant', 'Received from John')." },
        amount: { type: Type.NUMBER, description: "The numeric value of the transaction." },
        type: { type: Type.STRING, description: "The type of transaction. MUST be either 'income' for money received or 'expense' for money spent." },
        category: { type: Type.STRING, description: "Categorize the transaction using a hierarchical 'Parent / Child' format. E.g., 'Food & Beverages / Lunch', 'Personal Earnings / Company Salary', 'Shopping / Clothes'." },
        payeeIdentifier: { type: Type.STRING, description: "The unique identifier of the other party, like a UPI ID, account number, or phone number. E.g., 'user@bank', 'A/C XX1234'. If none, leave empty." },
        notes: { type: Type.STRING, description: "Any extra notes, details, or context about the transaction. Optional." },
        date: { type: Type.STRING, description: `The date of the transaction in YYYY-MM-DD format. If the text mentions a relative date like 'today', 'yesterday', or a specific day (e.g., 'June 15'), calculate and use that date based on the current date being ${new Date().toISOString().split('T')[0]}. If no date is mentioned, use the current date.` }
    },
    required: ["isTransaction", "isSpam", "spamConfidence", "description", "amount", "type", "category", "date"],
};

export async function parseTransactionText(text: string): Promise<{ 
    id: string; description: string; amount: number; type: TransactionType; categoryName: string; date: string; notes?: string; payeeIdentifier?: string; isSpam: boolean; spamConfidence: number; senderName?: string;
 } | null> {
  if (!text) throw new Error("Input text cannot be empty.");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following text to determine if it's a financial transaction notification. If it is, extract the details. Also, determine if the message is spam and extract the sender's short name. Use a hierarchical category in "Parent / Child" format. Extract any unique identifiers like UPI IDs or partial account numbers. Text: "${text}"`,
      config: { responseMimeType: "application/json", responseSchema: transactionSchema },
    });
    const result = JSON.parse(response.text);
    if (result && result.isTransaction && result.amount > 0) {
      const date = result.date && !isNaN(new Date(result.date).getTime()) ? new Date(result.date).toISOString() : new Date().toISOString();
      return {
        id: self.crypto.randomUUID(), description: result.description, amount: result.amount, type: result.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE, categoryName: result.category, date: date, notes: result.notes || undefined, payeeIdentifier: result.payeeIdentifier || undefined, isSpam: result.isSpam, spamConfidence: result.spamConfidence, senderName: result.senderName || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing transaction from Gemini API:", error);
    throw new Error(error instanceof Error ? `Failed to parse transaction: ${error.message}` : "An unknown error occurred during parsing.");
  }
}

const nlpQuerySchema = {
    type: Type.OBJECT,
    properties: {
        searchQuery: { type: Type.STRING, description: "The primary search term or description extracted from the query (e.g., 'Coffee', 'Rent')." },
        dateFilter: { type: Type.STRING, description: "A date filter if mentioned. Must be one of: 'today', 'week', 'month', or 'all'." },
        category: { type: Type.STRING, description: "A potential spending category if mentioned (e.g., 'Food', 'Shopping')." }
    },
    required: ["searchQuery", "dateFilter"]
};

export async function parseNaturalLanguageQuery(query: string): Promise<{ searchQuery: string; dateFilter?: 'month' | 'week' | 'today' | 'all', category?: string }> {
  try {
    const prompt = `You are an expert at parsing natural language into structured data. Analyze the user's query: "${query}". Extract the main search term, a date filter, and a potential category. Today's date is ${new Date().toISOString().split('T')[0]}. Return the result as JSON matching the provided schema.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: nlpQuerySchema }
    });
    const result = JSON.parse(response.text);
    return {
        searchQuery: result.searchQuery || result.category || query,
        dateFilter: result.dateFilter || 'all'
    };
  } catch (error) {
    console.error("Error parsing natural language query:", error);
    // Fallback to a simple search
    return { searchQuery: query, dateFilter: 'all' };
  }
}

const budgetSuggestionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            categoryName: { type: Type.STRING, description: "The name of the expense category." },
            amount: { type: Type.NUMBER, description: "The suggested monthly budget amount for this category." },
            reasoning: { type: Type.STRING, description: "A brief, one-sentence explanation for this budget suggestion." }
        },
        required: ["categoryName", "amount", "reasoning"]
    }
};

export async function getAIBudgetSuggestion(profile: AppState['financialProfile'], categories: AppState['categories']): Promise<{ categoryName: string; amount: number; reasoning: string }[]> {
    const expenseCategories = categories.filter(c => c.type === 'expense' && !c.parentId).map(c => c.name).join(', ');
    const prompt = `A user has a monthly salary of ${profile?.monthlySalary} and fixed monthly costs of ${profile?.monthlyRent} (rent) + ${profile?.monthlyEmi} (loans/EMIs). Suggest a sensible monthly budget for the following top-level expense categories: ${expenseCategories}. Provide amounts that allow for a reasonable savings rate. Return the result as a JSON array matching the provided schema.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: budgetSuggestionSchema }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error getting AI budget suggestion:", error);
        throw new Error("Could not generate an AI budget. Please try again.");
    }
}

export async function getAIFinancialTips(healthScore: number, scoreBreakdown: any): Promise<string> {
    const prompt = `A user's financial health score is ${healthScore}/100. The breakdown is: ${JSON.stringify(scoreBreakdown)}. Provide 2-3 short, actionable, and encouraging tips to help them improve their score, focusing on their weakest areas. Do not use markdown.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error getting AI financial tips:", error);
        return "Could not fetch tips at this moment. Please check your connection.";
    }
}

export async function getAIChatResponse(appState: AppState, question: string, history: { role: string, parts: string }[]): Promise<string> {
    const { financialProfile, transactions, budgets, goals } = appState;
    const context = `
      User's Financial Profile: ${JSON.stringify(financialProfile)}
      Recent Transactions (summary): ${transactions.length} transactions logged.
      Budgets: ${budgets.length} budgets set.
      Goals: ${goals.length} goals set.
    `;
    const prompt = `You are a helpful and knowledgeable Chartered Accountant (CA) providing financial advice. Use the provided financial context to answer the user's question. Be encouraging and provide clear, actionable advice. Here is the context:\n${context}\n\nUser's question: "${question}"`;
    try {
        const chat = ai.chats.create({ 
            model: 'gemini-2.5-flash', 
            history: history.map(({ role, parts }) => ({ role, parts: [{ text: parts }] }))
        });
        const response = await chat.sendMessage({message: prompt});
        return response.text;
    } catch (error) {
        console.error("Error getting AI chat response:", error);
        return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
    }
}