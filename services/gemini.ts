
import { GoogleGenAI, Type } from "@google/genai";
import { InterviewFeedback, AIAnalysis } from "../types";

export const analyzeFeedback = async (feedbacks: InterviewFeedback[]): Promise<AIAnalysis> => {
  // Use API key directly from process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analyze the following interview feedback data for B and B Textile. 
  Each entry contains ratings (1-5) for various aspects and qualitative comments.
  
  Data:
  ${JSON.stringify(feedbacks, null, 2)}
  
  Provide a detailed analysis including a summary, key strengths, areas for improvement (weaknesses), and actionable recommendations for the HR team.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          sentimentScore: { type: Type.NUMBER, description: "Average sentiment from 0 to 100" }
        },
        required: ["summary", "strengths", "weaknesses", "recommendations", "sentimentScore"]
      }
    }
  });

  // Accessing the .text property directly (it's a getter, not a method)
  const text = response.text || '{}';
  return JSON.parse(text);
};
