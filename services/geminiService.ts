// CRITICAL SECURITY WARNING:
// Do not expose your API key in client-side code. This is a major security vulnerability.
// An attacker could easily extract this key from your deployed web application and use it for their own purposes,
// potentially incurring significant costs on your behalf.
//
// FOR PRODUCTION: This key MUST be protected by a server-side proxy. The client application should make requests
// to your server, which then securely forwards the request to the Google GenAI API using a key stored in a
// secure server environment (e.g., environment variables, secrets manager).

import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType } from "../types";

// Ensure the API key is available from environment variables
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const transactionSchema = {
    type: Type.OBJECT,
    properties: {
        isTransaction: {
            type: Type.BOOLEAN,
            description: "Is this a legitimate financial transaction message?",
        },
        isSpam: {
            type: Type.BOOLEAN,
            description: "Is this message likely spam, a phishing attempt, or an advertisement? Analyze sender, language, and content.",
        },
        spamConfidence: {
            type: Type.NUMBER,
            description: "A confidence score from 0.0 to 1.0 on whether the message is spam. 1.0 is definitely spam.",
        },
        senderName: {
            type: Type.STRING,
            description: "The sender identifier from the message, often a short code like 'HDFCBK' or 'VK-AMZPAY'. If none, leave empty."
        },
        description: {
            type: Type.STRING,
            description: "A brief summary of the transaction (e.g., 'Payment to Merchant', 'Received from John').",
        },
        amount: {
            type: Type.NUMBER,
            description: "The numeric value of the transaction.",
        },
        type: {
            type: Type.STRING,
            description: "The type of transaction. MUST be either 'income' for money received or 'expense' for money spent.",
        },
        category: {
            type: Type.STRING,
            description: "Categorize the transaction using a hierarchical 'Parent / Child' format. E.g., 'Food & Beverages / Lunch', 'Personal Earnings / Company Salary', 'Shopping / Clothes'."
        },
        payeeIdentifier: {
            type: Type.STRING,
            description: "The unique identifier of the other party, like a UPI ID, account number, or phone number. E.g., 'user@bank', 'A/C XX1234'. If none, leave empty."
        },
        notes: {
            type: Type.STRING,
            description: "Any extra notes, details, or context about the transaction. Optional."
        },
        date: {
            type: Type.STRING,
            description: "The date of the transaction in YYYY-MM-DD format. If the text mentions a relative date like 'today', 'yesterday', or a specific day (e.g., 'June 15'), calculate and use that date based on the current date. If no date is mentioned, use the current date."
        }
    },
    required: ["isTransaction", "isSpam", "spamConfidence", "description", "amount", "type", "category", "date"],
};

export async function parseTransactionText(text: string): Promise<{ 
    id: string; 
    description: string; 
    amount: number; 
    type: TransactionType; 
    categoryName: string; 
    date: string; 
    notes?: string; 
    payeeIdentifier?: string;
    isSpam: boolean;
    spamConfidence: number;
    senderName?: string;
 } | null> {
  if (!text) {
    throw new Error("Input text cannot be empty.");
  }

  try {
    const prompt = `Analyze the following text to determine if it's a financial transaction notification. Ignore spam, ads, or non-financial messages. If it is a valid transaction, extract the details. Also, determine if the message is spam (e.g., an ad, phishing, scam) and extract the sender's short name (e.g., 'AXISBK'). Use a hierarchical category in "Parent / Child" format where appropriate. Extract any unique identifiers like UPI IDs or partial account numbers into 'payeeIdentifier'. Also, extract the date of the transaction. If it's a relative date like 'yesterday', calculate the actual date in YYYY-MM-DD format based on today being ${new Date().toISOString().split('T')[0]}. If no date is mentioned, use today's date. Text: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
      },
    });

    const result = JSON.parse(response.text);

    if (result && result.isTransaction && result.amount > 0) {
      // Validate the date format
      const date = result.date && !isNaN(new Date(result.date).getTime())
        ? new Date(result.date).toISOString()
        : new Date().toISOString();

      return {
        id: self.crypto.randomUUID(),
        description: result.description,
        amount: result.amount,
        type: result.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
        categoryName: result.category,
        date: date,
        notes: result.notes || undefined,
        payeeIdentifier: result.payeeIdentifier || undefined,
        isSpam: result.isSpam,
        spamConfidence: result.spamConfidence,
        senderName: result.senderName || undefined,
      };
    }

    return null; // Not a valid transaction or spam
  } catch (error) {
    console.error("Error parsing transaction from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to parse transaction: ${error.message}`);
    }
    throw new Error("An unknown error occurred during parsing.");
  }
}