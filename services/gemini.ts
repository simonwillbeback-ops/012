import { GoogleGenAI, Modality } from "@google/genai";
import { ImageSize } from "../types";

const API_KEY = process.env.API_KEY || '';

// --- Helpers ---

const getAI = (apiKey?: string) => {
  const key = apiKey || API_KEY;
  if (!key) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable in your deployment settings.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// --- Chat & Script Generation ---

export const chatWithGuide = async (history: { role: string, parts: { text: string }[] }[], message: string) => {
  try {
    const ai = getAI();
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
      config: {
        systemInstruction: "You are a calming, empathetic meditation guide. Keep your responses concise, soothing, and helpful. You help users find mindfulness.",
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error: any) {
    console.error("Chat Error:", error);
    throw error;
  }
};

export const generateMeditationScript = async (topic: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Write a short, soothing guided meditation script about: ${topic}. 
    The script should be around 150-200 words. 
    Focus on sensory details and breathing. 
    Do not include instructions like [Pause] or *soft music*, just the spoken words.`,
  });
  return response.text || "Breathe in... Breathe out...";
};

// --- Image Generation ---

export const generateMeditationImage = async (prompt: string, size: ImageSize): Promise<string> => {
  // Use the standard Flash Image model which is available in the free tier
  const ai = getAI();

  // Flash model does not support 'imageSize' in config, so we add it to the prompt for stylistic guidance
  const resolutionPrompt = size === '4K' ? 'highly detailed, 4k resolution, masterpiece' : 'high quality';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A serene, artistic, calming meditation background image about: ${prompt}. Soft lighting, abstract or nature-focused, ${resolutionPrompt}.` }],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate image");
};

// --- Text to Speech ---

export const generateMeditationAudio = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore is usually good for calm/neutral
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate speech");

  return base64Audio;
};

export const convertBase64ToWavBlob = (base64: string): string => {
   const binaryString = window.atob(base64);
   const len = binaryString.length;
   const bytes = new Uint8Array(len);
   for (let i = 0; i < len; i++) {
     bytes[i] = binaryString.charCodeAt(i);
   }
   return pcmToWav(bytes);
}

// WAV Header helper
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const channels = 1;
  const dataSize = pcmData.length;
  const fileSize = 36 + dataSize;

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  // data chunk identifier
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const blob = new Blob([header, pcmData], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}