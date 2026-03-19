import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateFinancialInsights = async (data: any) => {
  const model = "gemini-3-flash-preview";
  const prompt = `Analyze this financial data and provide 3 key insights: ${JSON.stringify(data)}`;
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Unable to generate insights at this time.";
  }
};

export const parseReceipt = async (imageBase64: string) => {
  const model = "gemini-3-flash-preview";
  const prompt = "Extract transaction details from this receipt: merchant, date, total, and itemized list.";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });
    return response.text;
  } catch (error) {
    console.error("Error parsing receipt:", error);
    return null;
  }
};

export const getAIAssistance = async (query: string, context: any) => {
  const model = "gemini-3-flash-preview";
  const prompt = `User query: ${query}\nContext: ${JSON.stringify(context)}`;
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error("Error getting AI assistance:", error);
    return "I'm sorry, I'm having trouble processing your request.";
  }
};
