
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getIntegrityInsight(data: string, algorithm: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Explain how the ${algorithm} algorithm works to ensure data integrity for this specific input: "${data}". Discuss collision resistance and use cases. Keep it concise and professional.`,
      config: {
        temperature: 0.7,
        topP: 0.8,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate AI insights at this time.";
  }
}
