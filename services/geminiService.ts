// Fix: Add necessary imports from @google/genai.
import { GoogleGenAI, Type } from "@google/genai";
// Fix: Import types from the correct types file.
// Fix: 'TransactionType' is an enum used as a value, so it must be imported directly, not as a type.
import { TransactionType } from "../types";
import type { Transaction, AppState, ParsedTransactionData, ParsedTripExpense, ShopSale, ShopProduct, ParsedReceiptData, FinancialScenarioResult, IdentifiedSubscription, Category, PersonalizedChallenge, ProactiveInsight, TripDayPlan, GlossaryEntry } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const transactionSchema = {
    type: Type.OBJECT,
    properties: {
        isTransaction: { type: Type.BOOLEAN, description: "Is this a legitimate financial transaction message?" },
        isForwarded: { type: Type.BOOLEAN, description: "Does the message appear to be a forwarded message (e.g., starts with 'Fwd:', contains multiple headers, or indicates it was sent from someone else)?" },
        isSpam: { type: Type.BOOLEAN, description: "Is this message likely spam, a phishing attempt, or an advertisement? Analyze sender, language, and content. A forwarded message is a strong indicator of spam." },
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
    required: ["isTransaction", "isForwarded", "isSpam", "spamConfidence", "description", "amount", "type", "category", "date"],
};

export async function parseTransactionText(text: string): Promise<ParsedTransactionData | null> {
  // Security Pre-Check: Scan for sensitive keywords locally before sending to any API.
  const securityKeywords = /\b(otp|one time password|passkey|password|verification code|security code|login code|auth code|passcode)\b/i;
  if (securityKeywords.test(text)) {
    // If a sensitive keyword is found, block the request and throw a specific security error.
    throw new Error("Security risk detected: Input contains sensitive keywords and was not sent for processing.");
  }
  
  if (!text) throw new Error("Input text cannot be empty.");
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a financial transaction analysis expert with a specialization in spam and fraud detection. Analyze the following text.
1. Determine if it is a legitimate financial transaction notification.
2. Critically assess if the message is spam, a phishing attempt, an advertisement, or a forwarded message. Look for indicators like "Fwd:", unusual links, urgent language, or generic greetings. A forwarded message should be treated with high suspicion.
3. If it is a transaction, extract all details according to the schema.
4. Use a hierarchical category in "Parent / Child" format. Extract any unique identifiers like UPI IDs or partial account numbers.
Text: "${text}"`,
      config: { responseMimeType: "application/json", responseSchema: transactionSchema },
    });
    // Fix: Access the .text property directly to get the string output.
    const result = JSON.parse(response.text);
    if (result && result.isTransaction && result.amount > 0) {
      const date = result.date && !isNaN(new Date(result.date).getTime()) ? new Date(result.date).toISOString() : new Date().toISOString();
      return {
        id: self.crypto.randomUUID(), description: result.description, amount: result.amount, type: result.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE, categoryName: result.category, date: date, notes: result.notes || undefined, payeeIdentifier: result.payeeIdentifier || undefined, isSpam: result.isSpam, spamConfidence: result.spamConfidence, senderName: result.senderName || undefined, isForwarded: result.isForwarded || false,
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing transaction from Gemini API:", error);
    throw new Error(error instanceof Error ? `Failed to parse transaction: ${error.message}` : "An unknown error occurred during parsing.");
  }
}

const receiptSchema = {
  type: Type.OBJECT,
  properties: {
    merchantName: { type: Type.STRING, description: "The name of the merchant or store." },
    transactionDate: { type: Type.STRING, description: `The date of the transaction in YYYY-MM-DD format. If no date is found, use the current date: ${new Date().toISOString().split('T')[0]}.` },
    totalAmount: { type: Type.NUMBER, description: "The final total amount of the transaction." },
    lineItems: {
      type: Type.ARRAY,
      description: "A list of all individual items purchased.",
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "The name or description of the line item." },
          amount: { type: Type.NUMBER, description: "The price of the line item." }
        },
        required: ["description", "amount"]
      }
    }
  },
  required: ["merchantName", "transactionDate", "totalAmount", "lineItems"]
};

export async function parseReceiptImage(base64Image: string, mimeType: string): Promise<ParsedReceiptData | null> {
    if (!base64Image) throw new Error("Image data cannot be empty.");

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: "Analyze this receipt image. Extract the merchant name, date, total amount, and all individual line items with their prices. Adhere strictly to the provided JSON schema." },
                    { inlineData: { mimeType, data: base64Image } }
                ]
            },
            config: { responseMimeType: "application/json", responseSchema: receiptSchema },
        });

        // Fix: Access the .text property directly to get the string output.
        const result = JSON.parse(response.text);
        if (result && result.totalAmount > 0) {
            const date = result.transactionDate && !isNaN(new Date(result.transactionDate).getTime()) ? new Date(result.transactionDate).toISOString() : new Date().toISOString();
            return {
                merchantName: result.merchantName,
                transactionDate: date,
                totalAmount: result.totalAmount,
                lineItems: result.lineItems || []
            };
        }
        return null;
    } catch (error) {
        console.error("Error parsing receipt from Gemini API:", error);
        throw new Error(error instanceof Error ? `Failed to parse receipt: ${error.message}` : "An unknown error occurred during receipt parsing.");
    }
}


const currencyConversionSchema = {
    type: Type.OBJECT,
    properties: {
        rate: { type: Type.NUMBER, description: "The numeric exchange rate. e.g., if 1 USD = 83.5 INR, the value should be 83.5." }
    },
    required: ["rate"]
};

export async function getCurrencyConversionRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (!fromCurrency || !toCurrency) throw new Error("Both 'from' and 'to' currencies must be provided.");
  if (fromCurrency === toCurrency) return 1;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide the current exchange rate for converting 1 ${fromCurrency} into ${toCurrency}. Return only the numeric value.`,
      config: { responseMimeType: "application/json", responseSchema: currencyConversionSchema },
    });
    // Fix: Access the .text property directly to get the string output.
    const result = JSON.parse(response.text);
    // Fix: Ensure rate is greater than 0 to avoid division by zero issues.
    if (result && typeof result.rate === 'number' && result.rate > 0) {
      return result.rate;
    }
    throw new Error("Could not determine a valid conversion rate from the AI response.");
  } catch (error) {
    console.error("Error getting currency conversion rate from Gemini API:", error);
    throw new Error(error instanceof Error ? `Failed to get conversion rate: ${error.message}` : "An unknown error occurred during conversion rate lookup.");
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
    // Fix: Access the .text property directly to get the string output.
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
        // Fix: Access the .text property directly to get the string output.
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
        // Fix: Access the .text property directly to get the string output.
        return response.text;
    } catch (error) {
        console.error("Error getting AI financial tips:", error);
        return "Could not fetch tips at this moment. Please check your connection.";
    }
}

export async function getDashboardInsights(transactions: Transaction[], categories: AppState['categories'], dateFilterLabel: string): Promise<string> {
    if (transactions.length < 3) return "Log a few more transactions to start getting personalized insights.";
    
    // Summarize data to keep the prompt concise
    const totalSpent = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const topSpendingCategories = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const category = categories.find(c => c.id === t.categoryId);
            const parent = category?.parentId ? categories.find(c => c.id === category.parentId) : category;
            if (parent) {
                acc[parent.name] = (acc[parent.name] || 0) + t.amount;
            }
            return acc;
        }, {} as Record<string, number>);
    
    const top3 = Object.entries(topSpendingCategories).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 3).map(([name, amount]) => `${name} (${(amount as number).toFixed(0)})`).join(', ');

    const prompt = `You are a helpful financial analyst. Based on this summary of a user's transactions for the period "${dateFilterLabel}", provide one short, actionable, and encouraging insight. 
    Data:
    - Total Spent: ${totalSpent.toFixed(2)}
    - Top Spending Categories: ${top3}
    - Total Transactions: ${transactions.length}
    
    Insight:`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        // Fix: Access the .text property directly to get the string output.
        return response.text;
    } catch (error) {
        console.error("Error getting dashboard insights:", error);
        return "Could not fetch insights at this moment.";
    }
}

const aiCoachActionSchema = {
    type: Type.OBJECT,
    properties: {
        action: { 
            type: Type.STRING, 
            description: "The user's intent. Must be one of: 'chat', 'create_transaction', 'navigate', 'run_simulation'." 
        },
        payload: {
            type: Type.OBJECT,
            properties: {
                // For 'chat'
                response: { type: Type.STRING, description: "The conversational response to the user." },
                // For 'create_transaction'
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                type: { type: Type.STRING, description: "MUST be 'income' or 'expense'."},
                category: { type: Type.STRING, description: "A suitable category in 'Parent / Child' format."},
                accountName: { type: Type.STRING, description: "The name of the account to use."},
                // For 'navigate'
                screen: { type: Type.STRING, description: "The name of the screen to navigate to. e.g., 'reports', 'goals', 'investments'." },
                // For 'run_simulation'
                query: { type: Type.STRING, description: "The user's core simulation question." }
            }
        },
        clarification: {
            type: Type.STRING,
            description: "If you need more information to fulfill the request, ask the user a clear question here. If not, this MUST be null."
        }
    },
    required: ["action", "payload"]
};

export async function getAICoachAction(command: string, appState: AppState, chatHistory: { role: 'user' | 'model', text: string }[]): Promise<any> {
    const { categories, accounts, financialProfile } = appState;
    const accountList = accounts.map(a => a.name).join(', ') || 'none';
    
    // Condensed context
    const context = `
      User's Financial Profile: ${JSON.stringify(financialProfile)}
      Available Accounts: ${accountList}
      Top-level Expense Categories: ${categories.filter(c => c.type === 'expense' && !c.parentId).map(c => c.name).join(', ')}
      Top-level Income Categories: ${categories.filter(c => c.type === 'income' && !c.parentId).map(c => c.name).join(', ')}
    `;

    const prompt = `You are a powerful, friendly AI Financial Coach inside a personal finance app.
    Your job is to understand the user's request and respond with a structured JSON object describing the action to take.
    
    Analyze the user's LATEST request based on the chat history and financial context.

    ACTIONS:
    1. 'chat': If the user is asking a general question or just chatting. The 'response' in the payload should be your answer.
    2. 'create_transaction': If the user asks to add an expense or income. You MUST extract description, amount, type, and infer a category. If the account isn't specified and there are multiple, you MUST ask for clarification.
    3. 'navigate': If the user asks to go to a specific screen (e.g., "show me my reports", "open goals").
    4. 'run_simulation': If the user asks a "what-if" question (e.g., "what if I save 500 more per month?").
    
    CLARIFICATION:
    If you lack any crucial information (e.g., which account to use for a transaction when multiple exist), set the 'clarification' field with a question for the user. In this case, the action should be 'chat' and the payload.response should be your clarification question.

    CONTEXT: ${context}
    CHAT HISTORY: ${JSON.stringify(chatHistory.slice(-4))}
    USER'S LATEST REQUEST: "${command}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: aiCoachActionSchema }
        });
        // Fix: Access the .text property directly to get the string output.
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error parsing AI Coach action:", error);
        return { action: 'chat', payload: { response: "I had trouble understanding that. Please try rephrasing." } };
    }
}

export async function getAIChatResponse(appState: AppState, message: string, chatHistory: { role: 'user' | 'model', text: string }[]): Promise<string> {
    const { financialProfile, accounts, categories } = appState;
    const accountList = accounts.map(a => a.name).join(', ') || 'none';
    
    // Condensed context
    const context = `
      User's Financial Profile: ${JSON.stringify(financialProfile)}
      Available Accounts: ${accountList}
      Top-level Expense Categories: ${categories.filter(c => c.type === 'expense' && !c.parentId).map(c => c.name).join(', ')}
      Top-level Income Categories: ${categories.filter(c => c.type === 'income' && !c.parentId).map(c => c.name).join(', ')}
    `;

    const prompt = `You are a friendly AI Financial Coach. Your role is to provide helpful insights and answer questions based on the user's financial data. Keep your responses conversational and easy to understand. Avoid suggesting actions like creating transactions or navigating, just answer the question.
    CONTEXT: ${context}
    CHAT HISTORY: ${JSON.stringify(chatHistory.slice(-4))}
    USER'S LATEST REQUEST: "${message}"
    
    Your Response:`;
    
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        // Fix: Access the .text property directly to get the string output.
        return response.text;
    } catch (error) {
        console.error("Error getting AI chat response:", error);
        return "I'm having trouble connecting right now. Please try again in a moment.";
    }
}


const tripExpenseSchema = {
    type: Type.OBJECT,
    properties: {
        isValid: { type: Type.BOOLEAN, description: "Is this a valid expense that can be parsed?" },
        description: { type: Type.STRING, description: "A brief summary of the expense (e.g., 'Dinner at a restaurant', 'Groceries')." },
        amount: { type: Type.NUMBER, description: "The total numeric value of the expense." },
        category: { type: Type.STRING, description: "Categorize the expense using a 'Parent / Child' format. E.g., 'Food & Groceries / Restaurant', 'Travel & Transport / Taxi'. Be specific and create new sub-categories if it makes sense." },
        payerName: { type: Type.STRING, description: "The name of the person who paid for this expense, if mentioned. Must be one of the provided participant names. If not mentioned, leave empty." }
    },
    required: ["isValid", "description", "amount", "category"],
};

export async function parseTripExpenseText(text: string, participants: string[]): Promise<ParsedTripExpense | null> {
  if (!text) throw new Error("Input text cannot be empty.");
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert at parsing expense details for group trips. Analyze the following text and extract the details. The trip participants are: ${participants.join(', ')}.
Text: "${text}"`,
      config: { responseMimeType: "application/json", responseSchema: tripExpenseSchema },
    });
    // Fix: Access the .text property directly to get the string output.
    const result = JSON.parse(response.text);
    if (result && result.isValid && result.amount > 0) {
      return {
        description: result.description, amount: result.amount, categoryName: result.category, payerName: result.payerName || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing trip expense from Gemini API:", error);
    throw new Error(error instanceof Error ? `Failed to parse trip expense: ${error.message}` : "An unknown error occurred during parsing.");
  }
}

const structuredPlanSchema = {
    type: Type.ARRAY,
    description: "An array of day plans for the trip.",
    items: {
        type: Type.OBJECT,
        properties: {
            date: { type: Type.STRING, description: `The date for this day's plan in YYYY-MM-DD format. Base the start date on today's date: ${new Date().toISOString().split('T')[0]}.` },
            title: { type: Type.STRING, description: "A catchy title for the day, e.g., 'Day 1: Arrival and Beach Exploration'." },
            items: {
                type: Type.ARRAY,
                description: "A list of activities for the day, ordered chronologically. Include items for breakfast, lunch, and dinner.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        time: { type: Type.STRING, description: "The time for the activity in HH:MM format." },
                        activity: { type: Type.STRING, description: "A short description of the activity." },
                        type: { type: Type.STRING, description: "The type of activity. Must be one of: 'travel', 'food', 'activity', 'lodging', 'other'. Specifically use 'food' for meals like breakfast, lunch, snacks, and dinner." },
                        notes: { type: Type.STRING, description: "Optional extra details or notes for the activity." },
                    },
                    required: ["time", "activity", "type"]
                }
            }
        },
        required: ["date", "title", "items"]
    }
};

const tripDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        tripName: { type: Type.STRING, description: "A concise and descriptive name for the trip, like 'Goa Vacation' or 'Team Offsite'." },
        participants: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "A list of participant names mentioned in the text. Exclude any mention of the user themselves (e.g., 'me', 'I', 'myself')." 
        },
        plan: {
            ...structuredPlanSchema,
            description: "If the user asks to 'plan' the trip, generate a structured, day-by-day plan. Otherwise, this MUST be null.",
        }
    },
    required: ["tripName", "participants"]
};

export async function parseTripCreationText(text: string): Promise<{ tripName: string; participants: string[]; plan?: TripDayPlan[] } | null> {
  if (!text) throw new Error("Input text cannot be empty.");
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert at parsing trip details and creating itineraries. Analyze the following text. 
1. Extract a trip name.
2. Extract a list of participants. The user inputting the text is also a participant but should NOT be included in this list.
3. If the user uses words like "plan", "suggest", or "itinerary", generate a detailed, structured plan for the trip, including specific times and meals like breakfast, lunch, and dinner.
Text: "${text}"`,
      config: { responseMimeType: "application/json", responseSchema: tripDetailsSchema },
    });
    // Fix: Access the .text property directly to get the string output.
    const result = JSON.parse(response.text);
    if (result && result.tripName) {
        const plan = result.plan ? result.plan.map((day: any) => ({
            ...day,
            id: self.crypto.randomUUID(),
            items: day.items.map((item: any) => ({...item, id: self.crypto.randomUUID()}))
        })) : undefined;
      return {
        tripName: result.tripName,
        participants: result.participants || [],
        plan
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing trip creation text from Gemini API:", error);
    throw new Error(error instanceof Error ? `Failed to parse trip text: ${error.message}` : "An unknown error occurred during parsing.");
  }
}

export async function generateAITripPlan(prompt: string, existingPlan?: TripDayPlan[]): Promise<TripDayPlan[]> {
    if (!prompt) throw new Error("Prompt cannot be empty.");

    const fullPrompt = `You are an expert travel agent. A user needs a trip plan. 
    Analyze their request and generate a structured plan with a day-by-day itinerary. Include specific times and meals (breakfast, lunch, dinner).
    ${existingPlan ? `They have an existing plan they might want to modify. Existing Plan:\n${JSON.stringify(existingPlan)}` : ''}
    User's Request: "${prompt}"`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: { responseMimeType: "application/json", responseSchema: structuredPlanSchema },
        });
        // Fix: Access the .text property directly to get the string output.
        const result = JSON.parse(response.text);
        
        // Add unique IDs to the generated plan
        return result.map((day: any) => ({
            ...day,
            id: self.crypto.randomUUID(),
            items: day.items.map((item: any) => ({
                ...item,
                id: self.crypto.randomUUID()
            }))
        }));
    } catch (error) {
        console.error("Error generating trip plan from Gemini API:", error);
        throw new Error(error instanceof Error ? `Failed to generate trip plan: ${error.message}` : "An unknown error occurred.");
    }
}

const financialTopicSchema = {
    type: Type.OBJECT,
    properties: {
        explanation: { 
            type: Type.STRING, 
            description: "A clear, simple, and easy-to-understand explanation of the financial topic. Avoid jargon or explain it clearly. Use paragraphs for readability." 
        },
        actionableTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2-4 short, practical, and actionable tips a user can take related to this topic."
        }
    },
    required: ["explanation", "actionableTips"]
};

export async function getFinancialTopicExplanation(topic: string): Promise<{ explanation: string; actionableTips: string[] }> {
    if (!topic) throw new Error("Topic cannot be empty.");
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a friendly and knowledgeable financial educator. Explain the topic "${topic}" in a simple and easy-to-understand way for a beginner. Provide a main explanation and a few actionable tips.`,
            config: { responseMimeType: "application/json", responseSchema: financialTopicSchema },
        });
        // Fix: Access the .text property directly to get the string output.
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error getting financial topic explanation from Gemini API:", error);
        throw new Error(error instanceof Error ? `Failed to get explanation: ${error.message}` : "An unknown error occurred.");
    }
}

const shopInsightsSchema = {
    type: Type.OBJECT,
    properties: {
        insights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2-3 short, actionable insights based on the sales data."
        }
    },
    required: ["insights"]
};

export async function getShopInsights(sales: ShopSale[] | undefined, products: ShopProduct[] | undefined): Promise<string[]> {
    if (!sales || sales.length === 0) return ["No sales data available to analyze yet."];
    
    // Summarize data to avoid hitting token limits
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
    const productSales = sales.flatMap(s => s.items).reduce((acc, item) => {
        const name = products?.find(p => p.id === item.productId)?.name || 'Unknown Product';
        acc[name] = (acc[name] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>);
    const bestsellers = Object.entries(productSales).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 3).map(([name, q]) => `${name} (${q} sold)`);

    const summary = {
        totalRevenue: totalRevenue.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        totalSalesCount: sales.length,
        bestsellingProducts: bestsellers,
    };

    const prompt = `You are a business analyst for a small shop. Analyze this sales summary and provide 2-3 concise, actionable insights. Focus on bestsellers, profit, and potential opportunities. Data: ${JSON.stringify(summary)}`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: shopInsightsSchema },
        });
        // Fix: Access the .text property directly to get the string output.
        const result = JSON.parse(response.text);
        return result.insights || ["Could not generate insights at this time."];
    } catch (error) {
        console.error("Error getting shop insights:", error);
        throw new Error("Could not generate AI insights for the shop.");
    }
}

const goalSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "A short, engaging name for the savings goal." },
        targetAmount: { type: Type.NUMBER, description: "A realistic target amount for the goal, as a round number." },
        reasoning: { type: Type.STRING, description: "A brief, one-sentence explanation for why this goal is suggested." }
    },
    required: ["name", "targetAmount", "reasoning"]
};

export async function getAIGoalSuggestion(transactions: AppState['transactions'], profile: AppState['financialProfile']): Promise<{ name: string; targetAmount: number; reasoning: string }> {
    const recentExpenses = transactions
        ?.filter(t => t.type === 'expense')
        .slice(0, 50) // Limit to last 50 for brevity
        .map(t => ({ d: t.description, a: t.amount }));

    const context = {
        monthlySalary: profile.monthlySalary,
        recentExpenses,
    };

    const prompt = `You are a financial coach. Based on this user's financial context, suggest one specific, realistic, and motivating savings goal (e.g., "Weekend Trip Fund", "New Gadget"). Provide a goal name, a sensible target amount as a round number, and a brief reason. Context: ${JSON.stringify(context)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: goalSuggestionSchema }
        });
        // Fix: Access the .text property directly to get the string output.
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error getting AI goal suggestion:", error);
        throw new Error("Could not generate an AI goal suggestion.");
    }
}

const nlpCalcSchema = {
    type: Type.OBJECT,
    properties: {
        answer: { type: Type.NUMBER, description: "The final numerical answer to the user's query." },
        explanation: { type: Type.STRING, description: "A brief, one-sentence explanation of how the answer was derived." }
    },
    required: ["answer", "explanation"]
};

export async function parseNaturalLanguageCalculation(appState: AppState, query: string): Promise<{ answer: number; explanation: string }> {
    const { transactions, financialProfile } = appState;
    // Create a simplified summary to send to the AI to save tokens
    const context = {
        monthlySalary: financialProfile.monthlySalary,
        transactionCount: transactions.length,
        firstTransactionDate: transactions[transactions.length - 1]?.date,
        lastTransactionDate: transactions[0]?.date
    };

    const prompt = `You are a financial calculation expert. Analyze the user's query based on their financial data and provide a numerical answer and a brief explanation.
    Here is a summary of the user's data: ${JSON.stringify(context)}.
    
    To answer the query, I will provide you with the full list of transactions. Analyze them to calculate the answer.
    User's query: "${query}"
    
    Full transaction list: ${JSON.stringify(transactions.map(t => ({ desc: t.description, amt: t.amount, type: t.type, date: t.date, cat: t.categoryId })))}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: nlpCalcSchema }
        });
        // Fix: Access the .text property directly to get the string output.
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error with natural language calculation:", error);
        throw new Error("I couldn't calculate that. Please try rephrasing your question.");
    }
}

const scenarioSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A one-sentence summary of the scenario being simulated." },
        keyMetrics: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    metric: { type: Type.STRING, description: "The name of the financial metric being impacted, e.g., 'Monthly Savings'." },
                    oldValue: { type: Type.STRING, description: "The value of the metric before the change, formatted with currency." },
                    newValue: { type: Type.STRING, description: "The simulated new value of the metric, formatted with currency." },
                    changeDescription: { type: Type.STRING, description: "A brief text description of the change, e.g., 'a decrease of ₹2,000'." }
                },
                required: ["metric", "oldValue", "newValue", "changeDescription"]
            }
        },
        goalImpacts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    goalName: { type: Type.STRING, description: "The name of the savings goal being impacted." },
                    impact: { type: Type.STRING, description: "The summary of the impact on the goal's timeline, e.g., 'Delayed by approx. 2 months'." }
                },
                required: ["goalName", "impact"]
            }
        },
        conclusion: { type: Type.STRING, description: "A concluding remark or piece of advice based on the simulation." }
    },
    required: ["summary", "keyMetrics", "conclusion"]
};


export async function runFinancialScenario(appState: AppState, query: string): Promise<FinancialScenarioResult> {
    const { transactions, budgets, goals, financialProfile, settings, categories } = appState;

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);

    const lastMonthTx = transactions.filter(t => t.date.startsWith(lastMonthStr));
    const lastMonthIncome = lastMonthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const lastMonthExpense = lastMonthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const lastMonthSavings = lastMonthIncome - lastMonthExpense;

    const context = `
      User's Financial Context (Currency: ${settings.currency}):
      - Stated Monthly Salary: ${financialProfile.monthlySalary || 'Not set'}
      - Last full month's calculated income: ${lastMonthIncome.toFixed(2)}
      - Last full month's calculated expenses: ${lastMonthExpense.toFixed(2)}
      - Last full month's calculated savings: ${lastMonthSavings.toFixed(2)}
      - Budgets: ${budgets.length > 0 ? budgets.map(b => `${categories.find(c => c.id === b.categoryId)?.name}: ${b.amount}`).join(', ') : 'None set'}
      - Goals: ${goals.length > 0 ? goals.map(g => `${g.name} (Target: ${g.targetAmount}, Current: ${g.currentAmount})`).join(', ') : 'None set'}
    `;

    const prompt = `
      You are an expert financial analyst. A user wants to explore a 'what-if' scenario.
      Analyze their query based on their provided financial context.
      Run a simulation and determine the impact.
      Provide a structured JSON response detailing the outcome. Be quantitative and clear.
      
      FINANCIAL CONTEXT:
      ${context}
      
      USER'S SCENARIO QUERY:
      "${query}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: scenarioSchema }
        });
        
        // Fix: Access the .text property directly to get the string output.
        const result: FinancialScenarioResult = JSON.parse(response.text);

        return result;

    } catch (error) {
        console.error("Error running financial scenario from Gemini API:", error);
        throw new Error("I had trouble running that simulation. Please try rephrasing your question or check the data you've provided.");
    }
}

const subscriptionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      vendorName: { type: Type.STRING, description: "The normalized name of the vendor (e.g., 'Netflix', 'Starbucks')." },
      averageAmount: { type: Type.NUMBER, description: "The average transaction amount for this vendor." },
      frequency: { type: Type.STRING, description: "The estimated payment frequency. Must be one of: 'monthly', 'yearly', 'weekly', 'irregular'." },
      transactionCount: { type: Type.NUMBER, description: "The total number of transactions identified for this vendor." },
      category: { type: Type.STRING, description: "The most common category for this vendor's transactions." },
    },
    required: ["vendorName", "averageAmount", "frequency", "transactionCount", "category"]
  }
};

export async function identifySubscriptions(transactions: Transaction[], categories: Category[]): Promise<IdentifiedSubscription[]> {
  if (transactions.length < 5) {
    throw new Error("Not enough transaction data to analyze for subscriptions.");
  }
  
  // Create a simplified summary for the AI to process, saving tokens.
  const transactionSummary = transactions.map(t => {
    const category = categories.find(c => c.id === t.categoryId);
    return {
      d: t.description,
      a: t.amount,
      dt: t.date.split('T')[0], // Just the date part
      c: category?.name || 'Uncategorized'
    };
  });

  const prompt = `
    You are an expert financial analyst. Your task is to identify recurring payments, subscriptions, and frequently paid vendors from the provided list of transactions.
    Analyze the transaction descriptions, amounts, and dates to find patterns.
    - Group transactions by the likely vendor (e.g., all "Zomato", "ZOMATO ONLINE" should be grouped under "Zomato").
    - Calculate the average amount for each vendor.
    - Determine the frequency of payments (weekly, monthly, yearly). If payments are frequent but not on a fixed schedule (like a coffee shop), label them as 'irregular'.
    - Count the total number of transactions for each identified vendor.
    - Identify the most common category for each vendor.
    - Return the result as a JSON array matching the provided schema. Only include vendors with 2 or more transactions.
    
    Transaction data: ${JSON.stringify(transactionSummary)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: subscriptionSchema },
    });
    // Fix: Access the .text property directly to get the string output.
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error identifying subscriptions from Gemini API:", error);
    throw new Error(error instanceof Error ? `Failed to identify subscriptions: ${error.message}` : "An unknown error occurred during subscription analysis.");
  }
}

const personalizedChallengeSchema = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING, description: "A short, actionable, and personalized savings challenge for the user. e.g., 'Try to reduce your 'Dining Out' spending by 10% this week.' or 'Skip buying coffee for 3 days and save the money.'" },
        estimatedSavings: { type: Type.NUMBER, description: "A realistic estimate of how much the user could save by completing this challenge." }
    },
    required: ["description", "estimatedSavings"]
};

export async function generatePersonalizedChallenge(transactions: Transaction[]): Promise<PersonalizedChallenge> {
    const transactionSummary = transactions.slice(0, 20).map(t => `${t.description}: ${t.amount}`).join(', ');
    const prompt = `
      You are a financial coach. Analyze the user's recent transaction summary to create a personalized, actionable savings challenge.
      The challenge should be specific and achievable. Provide a brief description and an estimated savings amount.
      Recent Transactions: ${transactionSummary}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: personalizedChallengeSchema }
        });
        // Fix: Access the .text property directly to get the string output.
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating personalized challenge:", error);
        throw new Error("Could not generate a personalized challenge.");
    }
}

const proactiveInsightSchema = {
    type: Type.OBJECT,
    properties: {
        insightType: { type: Type.STRING, description: "The type of insight. One of: 'anomaly', 'forecast', 'subscription_suggestion', 'generic'." },
        title: { type: Type.STRING, description: "A short, catchy title for the insight." },
        message: { type: Type.STRING, description: "The main message of the insight. Should be actionable and encouraging." },
    },
    required: ["insightType", "title", "message"]
};

export async function getProactiveInsights(appState: AppState): Promise<ProactiveInsight> {
    // Summarize app state to be concise for the prompt
    const { transactions, budgets, goals, financialProfile } = appState;
    const context = {
        transactionCount: transactions.length,
        budgetCount: budgets.length,
        goalCount: goals.length,
        monthlySalary: financialProfile?.monthlySalary || 0,
        recentExpenses: transactions.filter(t => t.type === 'expense').slice(0, 10).map(t => t.description.substring(0, 50)),
    };

    const prompt = `
      You are an expert financial analyst. Analyze the user's financial context to provide one proactive, insightful, and helpful tip.
      The insight could be an anomaly detection (e.g., unusually high spending), a forecast, a suggestion to review a potential subscription, or a generic financial tip.
      Keep it concise and actionable.
      
      User's financial context: ${JSON.stringify(context)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: proactiveInsightSchema }
        });
        // Fix: Access the .text property directly to get the string output.
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error getting proactive insights:", error);
        throw new Error("Could not generate AI insights at this time.");
    }
}

const glossaryEntrySchema = {
    type: Type.OBJECT,
    properties: {
        term: { type: Type.STRING, description: "The financial term being defined." },
        emoji: { type: Type.STRING, description: "A single, relevant emoji for the term." },
        definition: { type: Type.STRING, description: "A clear, simple, and easy-to-understand definition of the term for a beginner." },
        usageLogic: { type: Type.STRING, description: "A brief explanation of how this concept is used within this specific finance app." },
        example: { type: Type.STRING, description: "A simple, practical example of the term in use." },
        tags: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "A list of 2-4 relevant lowercase tags."
        }
    },
    required: ["term", "emoji", "definition", "usageLogic", "example", "tags"]
};

export async function generateGlossaryEntry(term: string): Promise<Omit<GlossaryEntry, 'id'>> {
    if (!term) throw new Error("Term cannot be empty.");
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a financial educator. A user is searching for the term "${term}" in their personal finance app's glossary. 
            Generate a complete glossary entry for this term. The definition should be simple for a beginner. 
            The 'usageLogic' should explain how the concept applies specifically within the context of this app.
            Provide a relevant emoji, a simple example, and a few tags.`,
            config: { responseMimeType: "application/json", responseSchema: glossaryEntrySchema },
        });
        // Fix: Access the .text property directly to get the string output.
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating glossary entry from Gemini API:", error);
        throw new Error(error instanceof Error ? `Failed to generate definition: ${error.message}` : "An unknown error occurred.");
    }
}
