import { GoogleGenAI } from "@google/genai";
import { ImageSize } from "../types";

/**
 * Service to interact with Google GenAI models.
 */

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Chat & Script Generation ---

export const chatWithGuide = async (history: { role: string, parts: { text: string }[] }[], message: string) => {
  try {
    const contents = [
      ...history.map(h => ({
        role: h.role,
        parts: h.parts
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: "You are a calming, empathetic meditation guide. Keep responses concise and soothing.",
      }
    });

    return response.text || "I'm listening...";
  } catch (error: any) {
    console.error("Chat Error:", error);
    return "I am sensing some interference. Let us take a breath and try again.";
  }
};

export const generateMeditationScript = async (topic: string): Promise<string> => {
  const prompt = `Write a short, soothing guided meditation script about: ${topic}. The script should be around 150-200 words. Focus on sensory details and breathing. Do not include instructions like [Pause] or *soft music*, just the spoken words.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Breathe in... Breathe out... Let your mind settle.";
  } catch (error) {
    console.error(error);
    throw new Error("Could not generate meditation script. Please try again.");
  }
};

// --- Image Generation ---

export const generateMeditationImage = async (prompt: string, size: ImageSize): Promise<string> => {
  const enhancedPrompt = `serene, artistic, calming meditation background, ${prompt}, soft lighting, high quality, 4k`;
  
  // Use gemini-3-pro-image-preview for high quality and size support
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: {
        imageConfig: {
          imageSize: size, // '1K', '2K', '4K'
          aspectRatio: '16:9'
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw new Error("Failed to generate image.");
  }
};

// --- Audio (Browser Native TTS) ---
// No server-side generation needed. We use window.speechSynthesis in App.tsx
export const generateMeditationAudio = async (text: string): Promise<string> => {
    return ""; // Placeholder
};

export const convertBase64ToWavBlob = (base64: string): string => {
    return ""; // Unused
};