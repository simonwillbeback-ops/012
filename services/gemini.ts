import { GoogleGenAI } from "@google/genai";
import { ImageSize } from "../types";

/**
 * Service to interact with Google Gemini API.
 * Uses process.env.API_KEY
 */

// --- Chat & Script Generation ---

export const chatWithGuide = async (history: { role: string, parts: { text: string }[] }[], message: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';
  
  // Construct content history
  const contents = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: h.parts.map(p => ({ text: p.text }))
  }));

  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: "You are a calming, empathetic meditation guide. Keep responses concise and soothing.",
      }
    });
    return response.text || "I am taking a moment of silence. Please try again shortly.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "I am having trouble connecting. Please try again.";
  }
};

export const generateMeditationScript = async (topic: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Write a short, soothing guided meditation script about: "${topic}". 
  The script should be around 150-200 words. 
  Focus on sensory details (sight, sound, feeling) and deep breathing. 
  Do not include instructions like [Pause] or *soft music*, just the spoken words. 
  Start directly with the meditation.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Take a deep breath. (Script generation failed).";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Take a deep breath. Focus on the present moment. Inhale peace, exhale tension. (Service unavailable, please retry).";
  }
};

// --- Image Generation ---

export const generateMeditationImage = async (topic: string, size: ImageSize): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `meditation background, ${topic}, serene, artistic, soft lighting, 8k, highly detailed, spiritual atmosphere, digital art, no text`;
  
  // Select model based on size requirements from guidelines
  let model = 'gemini-2.5-flash-image';
  const config: any = {};

  if (size === '2K' || size === '4K') {
      model = 'gemini-3-pro-image-preview';
      config.imageConfig = { imageSize: size };
  }

  try {
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
  }
};

// --- Audio Stubs (Unused) ---
export const generateMeditationAudio = async (text: string): Promise<string> => {
    return "";
};

export const convertBase64ToWavBlob = (base64: string): string => {
    return ""; 
};