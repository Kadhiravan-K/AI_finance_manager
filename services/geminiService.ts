
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { TransactionType, Transaction, AppState, ParsedTransactionData, ParsedTripExpense, ShopSale, ShopProduct, ParsedReceiptData, FinancialScenarioResult, IdentifiedSubscription, Category, PersonalizedChallenge, ProactiveInsight, TripDayPlan, GlossaryEntry } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- 1. Fast AI Responses (gemini-flash-lite-latest) ---

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
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: [{ parts: [{ text: `Extract search term, date filter, and category from: "${query}". Today is ${new Date().toISOString().split('T')[0]}.` }] }],
        config: { responseMimeType: "application/json", responseSchema: nlpQuerySchema }
    });
    
    return JSON.parse(response.text!);
  } catch (error) {
    console.error("Error parsing natural language query:", error);
    return { searchQuery: query, dateFilter: 'all' };
  }
}

const aiCoachActionSchema = {
    type: Type.OBJECT,
    properties: {
        action: { type: Type.STRING, description: "One of: 'chat', 'create_transaction', 'navigate', 'run_simulation'." },
        payload: {
            type: Type.OBJECT,
            properties: {
                response: { type: Type.STRING },
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                type: { type: Type.STRING },
                category: { type: Type.STRING },
                accountName: { type: Type.STRING },
                screen: { type: Type.STRING },
                query: { type: Type.STRING }
            }
        },
        clarification: { type: Type.STRING, nullable: true }
    },
    required: ["action"]
};

export async function getAICoachAction(command: string, appState: AppState, chatHistory: { role: 'user' | 'model', text: string }[]): Promise<any> {
    const context = `Accounts: ${appState.accounts.map(a => a.name).join(', ')}.`;
    const prompt = `You are a financial app assistant. Analyze the user's intent.
    Context: ${context}
    History: ${JSON.stringify(chatHistory.slice(-2))}
    Request: "${command}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: aiCoachActionSchema }
        });
        return JSON.parse(response.text!);
    } catch (error) {
        console.error("Error parsing AI Coach action:", error);
        return { action: 'chat', payload: { response: "I couldn't process that command." } };
    }
}

// --- 2. Image Analysis (gemini-3-pro-preview) ---

const receiptSchema = {
  type: Type.OBJECT,
  properties: {
    merchantName: { type: Type.STRING },
    transactionDate: { type: Type.STRING },
    totalAmount: { type: Type.NUMBER },
    lineItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER }
        },
        required: ["description", "amount"]
      }
    }
  },
  required: ["merchantName", "transactionDate", "totalAmount", "lineItems"]
};

export async function parseReceiptImage(base64Image: string, mimeType: string): Promise<ParsedReceiptData | null> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { text: "Extract merchant, date (YYYY-MM-DD), total, and line items from this receipt." },
                    { inlineData: { mimeType, data: base64Image } }
                ]
            },
            config: { responseMimeType: "application/json", responseSchema: receiptSchema },
        });

        const result = JSON.parse(response.text!);
        if (result && result.totalAmount > 0) {
             const date = result.transactionDate && !isNaN(new Date(result.transactionDate).getTime()) ? new Date(result.transactionDate).toISOString() : new Date().toISOString();
             return { ...result, transactionDate: date, lineItems: result.lineItems || [] };
        }
        return null;
    } catch (error) {
        console.error("Error parsing receipt:", error);
        throw new Error("Failed to analyze receipt image.");
    }
}

// --- 3. Complex Thinking (gemini-3-pro-preview with Thinking Budget) ---

const scenarioSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING },
        keyMetrics: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    metric: { type: Type.STRING },
                    oldValue: { type: Type.STRING },
                    newValue: { type: Type.STRING },
                    changeDescription: { type: Type.STRING }
                },
                required: ["metric", "oldValue", "newValue", "changeDescription"]
            }
        },
        goalImpacts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    goalName: { type: Type.STRING },
                    impact: { type: Type.STRING }
                },
                required: ["goalName", "impact"]
            }
        },
        conclusion: { type: Type.STRING }
    },
    required: ["summary", "keyMetrics", "conclusion"]
};

export async function runFinancialScenario(appState: AppState, query: string): Promise<FinancialScenarioResult> {
    const context = `Monthly Salary: ${appState.financialProfile.monthlySalary}. Goals: ${appState.goals.map(g => g.name).join(', ')}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: [{ parts: [{ text: `Run this financial simulation: "${query}". Context: ${context}. Return structured data.` }] }],
            config: { 
                responseMimeType: "application/json", 
                responseSchema: scenarioSchema,
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return JSON.parse(response.text!);
    } catch (error) {
        console.error("Error running scenario:", error);
        throw new Error("Simulation failed.");
    }
}

// --- 4. Audio Transcription (gemini-3-flash-preview) ---

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { text: "Transcribe this audio exactly as spoken." },
                    { inlineData: { mimeType, data: base64Audio } }
                ]
            }
        });
        return response.text || "";
    } catch (error) {
        console.error("Transcription error:", error);
        return "";
    }
}

// --- 5. Text-to-Speech (gemini-2.5-flash-preview-tts) ---

export async function generateSpeech(text: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }
                    }
                }
            }
        });
        
        const audioPart = response.candidates?.[0]?.content?.parts?.[0];
        if (audioPart && audioPart.inlineData && audioPart.inlineData.data) {
            return audioPart.inlineData.data;
        }
        throw new Error("No audio data returned");
    } catch (error) {
        console.error("TTS error:", error);
        throw error;
    }
}

// --- 6. Search Grounding (gemini-3-flash-preview) ---

export async function searchFinancialInfo(query: string): Promise<{ text: string, sources: any[] }> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Answer this financial question using Google Search: "${query}"`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        
        return {
            text: response.text || "No results found.",
            sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        };
    } catch (error) {
        console.error("Search error:", error);
        return { text: "Search currently unavailable.", sources: [] };
    }
}

// --- 7. Maps Grounding (gemini-2.5-flash) ---

export async function findNearbyPlaces(query: string, location: string): Promise<{ text: string, places: any[] }> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find ${query} near ${location}.`,
            config: {
                tools: [{ googleMaps: {} }]
            }
        });
        
        return {
            text: response.text || "No places found.",
            places: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        };
    } catch (error) {
        console.error("Maps error:", error);
        return { text: "Maps search unavailable.", places: [] };
    }
}

// --- 8. AI Chatbot (gemini-3-pro-preview) ---

export async function getAIChatResponse(appState: AppState, message: string, chatHistory: { role: 'user' | 'model', text: string }[]): Promise<string> {
    const context = `User Currency: ${appState.settings.currency}. Monthly Income: ${appState.financialProfile.monthlySalary}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: [
                { role: 'user', parts: [{ text: `System: You are a helpful financial assistant. Context: ${context}` }] },
                ...chatHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
                { role: 'user', parts: [{ text: message }] }
            ]
        });
        return response.text || "I couldn't generate a response.";
    } catch (error) {
        console.error("Chat error:", error);
        return "I'm having trouble connecting to Gemini 3 Pro right now.";
    }
}

// --- Legacy / Standard Functions (gemini-3-flash-preview) ---

const transactionSchema = {
    type: Type.OBJECT,
    properties: {
        isTransaction: { type: Type.BOOLEAN },
        isForwarded: { type: Type.BOOLEAN },
        isSpam: { type: Type.BOOLEAN },
        spamConfidence: { type: Type.NUMBER },
        senderName: { type: Type.STRING },
        description: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        type: { type: Type.STRING },
        category: { type: Type.STRING },
        payeeIdentifier: { type: Type.STRING },
        notes: { type: Type.STRING },
        date: { type: Type.STRING }
    },
    required: ["isTransaction", "isForwarded", "isSpam", "spamConfidence", "description", "amount", "type", "category", "date"],
};

export async function parseTransactionText(text: string): Promise<ParsedTransactionData | null> {
  const securityKeywords = /\b(otp|one time password|passkey|password|verification code|security code|login code|auth code|passcode)\b/i;
  if (securityKeywords.test(text)) throw new Error("Security risk detected: Input contains sensitive keywords.");
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Analyze financial text: "${text}". Is it spam? Extract details.` }] }],
      config: { responseMimeType: "application/json", responseSchema: transactionSchema },
    });
    
    const result = JSON.parse(response.text!);
    if (result && result.isTransaction && result.amount > 0) {
      const date = result.date && !isNaN(new Date(result.date).getTime()) ? new Date(result.date).toISOString() : new Date().toISOString();
      return {
        id: self.crypto.randomUUID(), description: result.description, amount: result.amount, type: result.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE, categoryName: result.category, date: date, notes: result.notes || undefined, payeeIdentifier: result.payeeIdentifier || undefined, isSpam: result.isSpam, spamConfidence: result.spamConfidence, senderName: result.senderName || undefined, isForwarded: result.isForwarded || false,
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing transaction:", error);
    throw new Error("Failed to parse transaction.");
  }
}

export async function getCurrencyConversionRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return 1;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Exchange rate 1 ${fromCurrency} to ${toCurrency}. Return JSON { "rate": number }.` }] }],
      config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { rate: { type: Type.NUMBER } }, required: ["rate"] } },
    });
    return JSON.parse(response.text!).rate;
  } catch (error) {
    return 1;
  }
}

export async function parseTripCreationText(text: string): Promise<{ tripName: string; location?: string; participants: string[]; plan?: TripDayPlan[] } | null> {
  const schema = {
      type: Type.OBJECT,
      properties: {
          tripName: { type: Type.STRING },
          location: { type: Type.STRING },
          participants: { type: Type.ARRAY, items: { type: Type.STRING } },
          plan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { date: { type: Type.STRING }, title: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: {type: Type.STRING}, activity: {type: Type.STRING}, type: {type: Type.STRING} } } } } } }
      },
      required: ["tripName", "participants"]
  };
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Extract trip details from: "${text}".` }] }],
      config: { responseMimeType: "application/json", responseSchema: schema },
    });
    const result = JSON.parse(response.text!);
    if(result.tripName) {
        const plan = result.plan ? result.plan.map((day: any) => ({ ...day, id: self.crypto.randomUUID(), items: day.items.map((item: any) => ({...item, id: self.crypto.randomUUID()})) })) : undefined;
        return { tripName: result.tripName, location: result.location, participants: result.participants || [], plan };
    }
    return null;
  } catch(e) { return null; }
}

export async function generateAITripPlan(prompt: string, existingPlan?: TripDayPlan[]): Promise<TripDayPlan[]> {
    return []; // Placeholder
}

export async function identifySubscriptions(transactions: Transaction[], categories: Category[]): Promise<IdentifiedSubscription[]> {
    return [];
}

export async function getAIBudgetSuggestion(profile: AppState['financialProfile'], categories: AppState['categories']): Promise<any> {
    return [];
}

export async function getAIFinancialTips(healthScore: number, scoreBreakdown: any): Promise<string> {
    try {
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ parts: [{ text: `Give tips for score ${healthScore}. Breakdown: ${JSON.stringify(scoreBreakdown)}` }] }] });
        return response.text || "";
    } catch { return ""; }
}

export async function getProactiveInsights(appState: AppState): Promise<ProactiveInsight> {
    return { insightType: 'generic', title: 'Tip', message: 'Save more.' };
}

export async function generateGlossaryEntry(term: string): Promise<Omit<GlossaryEntry, 'id'>> {
    const schema = { type: Type.OBJECT, properties: { term: { type: Type.STRING }, emoji: { type: Type.STRING }, definition: { type: Type.STRING }, usageLogic: { type: Type.STRING }, example: { type: Type.STRING }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } } };
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ parts: [{ text: `Define ${term}` }] }], config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text!);
}

export async function getShopInsights(sales: ShopSale[], products: ShopProduct[]): Promise<string[]> {
    return [];
}

export async function getAIGoalSuggestion(transactions: any, profile: any): Promise<any> {
    return null;
}

export async function processNoteWithAI(text: string, prompt: string): Promise<string> {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ parts: [{ text: `Text: ${text}. Instruction: ${prompt}` }] }] });
    return response.text || text;
}

export async function parseTripExpenseText(text: string): Promise<ParsedTripExpense | null> {
  const schema = {
      type: Type.OBJECT,
      properties: {
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          categoryName: { type: Type.STRING },
          payerName: { type: Type.STRING, nullable: true }
      },
      required: ["description", "amount", "categoryName"]
  };
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Extract trip expense details from: "${text}".` }] }],
      config: { responseMimeType: "application/json", responseSchema: schema },
    });
    return JSON.parse(response.text!) as ParsedTripExpense;
  } catch (error) {
    console.error("Error parsing trip expense:", error);
    return null;
  }
}

export async function generatePersonalizedChallenge(transactions: Transaction[]): Promise<PersonalizedChallenge> {
    const context = transactions.slice(0, 10).map(t => `${t.description}: ${t.amount}`).join(', ');
    const schema = {
        type: Type.OBJECT,
        properties: {
            description: { type: Type.STRING },
            estimatedSavings: { type: Type.NUMBER }
        },
        required: ["description", "estimatedSavings"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: `Generate a personalized financial savings challenge based on: ${context}` }] }],
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return JSON.parse(response.text!);
    } catch (e) {
        throw new Error("Failed to generate challenge");
    }
}

export async function getFinancialTopicExplanation(topic: string): Promise<{ explanation: string; actionableTips: string[] }> {
    const schema = {
        type: Type.OBJECT,
        properties: {
            explanation: { type: Type.STRING },
            actionableTips: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["explanation", "actionableTips"]
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: `Explain the financial topic: "${topic}" clearly and provide actionable tips.` }] }],
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return JSON.parse(response.text!);
    } catch (e) {
        throw new Error("Failed to explain topic");
    }
}

export async function parseNaturalLanguageCalculation(appState: AppState, query: string): Promise<{ answer: number; explanation: string }> {
    const context = `Currency: ${appState.settings.currency}.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            answer: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
        },
        required: ["answer", "explanation"]
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: `Perform this calculation: "${query}". Context: ${context}. Return answer and brief explanation.` }] }],
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return JSON.parse(response.text!);
    } catch (e) {
        throw new Error("Calculation failed");
    }
}
