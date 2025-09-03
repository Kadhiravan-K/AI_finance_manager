



// Fix: Import GoogleGenAI to initialize the client.
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType, AppState, ParsedTransactionData, ParsedTripExpense, ShopSale, ShopProduct } from "../types";

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
    const result = JSON.parse(response.text);
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
    
    const top3 = Object.entries(topSpendingCategories).sort(([,a],[,b]) => b-a).slice(0, 3).map(([name, amount]) => `${name} (${amount.toFixed(0)})`).join(', ');

    const prompt = `You are a helpful financial analyst. Based on this summary of a user's transactions for the period "${dateFilterLabel}", provide one short, actionable, and encouraging insight. 
    Data:
    - Total Spent: ${totalSpent.toFixed(2)}
    - Top Spending Categories: ${top3}
    - Total Transactions: ${transactions.length}
    
    Insight:`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error getting dashboard insights:", error);
        return "Could not fetch insights at this moment.";
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
        const response = await chat.sendMessage({ message: prompt });
        return response.text;
    } catch (error) {
        console.error("Error getting AI chat response:", error);
        return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
    }
}

const commandSchema = {
    type: Type.OBJECT,
    properties: {
        action: { type: Type.STRING, description: "The action to perform. Must be one of: 'create', 'update', 'delete', 'clarify', 'general_query'." },
        itemType: { type: Type.STRING, description: "The type of item to act upon. For 'general_query', this can be 'file_content'. Must be one of: 'account', 'category', 'expense', 'income', 'clarification_needed', 'file_content'." },
        name: { type: Type.STRING, description: "The name of the item (e.g., account name, category name, transaction description). For clarifications or queries, this is the question to ask the user or the query itself." },
        amount: { type: Type.NUMBER, description: "The numeric amount, for transactions or account opening balances." },
        category: { type: Type.STRING, description: "The category for a transaction, in 'Parent / Child' format. If not specified, infer a likely one." },
        accountName: { type: Type.STRING, description: "For transactions, the name of the account to use." },
        targetName: { type: Type.STRING, description: "For 'delete' or 'update' actions, the name of the item to target." }
    },
    required: ["action", "itemType", "name"]
};

export async function parseAICommand(command: string, categories: AppState['categories'], accounts: AppState['accounts'], file?: { mimeType: string, data: string }): Promise<any> {
    const accountList = accounts.map(a => a.name).join(', ') || 'none';
    
    let prompt = `
        You are an intelligent financial assistant. Parse the user's command into a structured JSON object based on the provided schema.
        The user wants to manage their finances. The command is: "${command}".
        
        Available top-level expense categories: ${categories.filter(c => c.type === 'expense' && !c.parentId).map(c => c.name).join(', ') || 'none'}
        Available top-level income categories: ${categories.filter(c => c.type === 'income' && !c.parentId).map(c => c.name).join(', ') || 'none'}
        Available accounts: ${accountList}.

        If a file is provided with the command, analyze its content to answer the user's question or perform an action. For general questions about the file, use the 'general_query' action and put your text answer in the 'name' field.
        For 'create expense' or 'create income', if an account is mentioned, use it. If not, and there are multiple accounts, you MUST ask for clarification by setting itemType to 'clarification_needed' and name to 'Which account should I use for that?'. If there is only one account, you can assume to use that one.
        If the command is ambiguous, ask for clarification.
        For amounts, extract only the number.
        For 'delete' or 'update', the 'targetName' field is crucial for identifying the item.
    `;
    
    let contents: any = { parts: [{ text: prompt }]};

    if (file) {
      // For multimodal input, send parts with inlineData
      contents.parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data,
        },
      });
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: { responseMimeType: "application/json", responseSchema: commandSchema }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error parsing AI command:", error);
        throw new Error("I had trouble understanding that command. Please try rephrasing.");
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
            type: Type.OBJECT,
            description: "If the user asks to 'plan' the trip, generate a plan. Otherwise, this can be null.",
            properties: {
                itinerary: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "A day-by-day itinerary. Each string is a plan for one day. E.g., 'Day 1: Arrive, check in, explore market.'" 
                },
                budgetSuggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of suggested budget items and estimated costs. E.g., 'Flights: $300', 'Accommodation: $400'."
                },
                packingChecklist: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of suggested items to pack for the trip."
                }
            },
        }
    },
    required: ["tripName", "participants"]
};

export async function parseTripCreationText(text: string): Promise<{ tripName: string; participants: string[]; plan?: { itinerary: string[]; budgetSuggestions: string[]; packingChecklist: string[] } } | null> {
  if (!text) throw new Error("Input text cannot be empty.");
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert at parsing trip details from text. Analyze the following text. 
1. Extract a trip name.
2. Extract a list of participants. The user who is inputting the text is also a participant, but do NOT include them in the list.
3. If the user uses words like "plan", "suggest", or "itinerary", generate a simple plan for the trip including a brief itinerary, budget suggestions, and a packing checklist.
Text: "${text}"`,
      config: { responseMimeType: "application/json", responseSchema: tripDetailsSchema },
    });
    const result = JSON.parse(response.text);
    if (result && result.tripName) {
      return {
        tripName: result.tripName,
        participants: result.participants || [],
        plan: result.plan || undefined
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing trip creation text from Gemini API:", error);
    throw new Error(error instanceof Error ? `Failed to parse trip text: ${error.message}` : "An unknown error occurred during parsing.");
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
    const bestsellers = Object.entries(productSales).sort(([,a],[,b]) => b - a).slice(0, 3).map(([name, q]) => `${name} (${q} sold)`);

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
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error with natural language calculation:", error);
        throw new Error("I couldn't calculate that. Please try rephrasing your question.");
    }
}
