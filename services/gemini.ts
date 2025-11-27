import { GoogleGenAI, Modality } from "@google/genai";
import { ImageSize } from "../types";

const API_KEY = process.env.API_KEY || '';

// --- Helpers ---

const getAI = (apiKey?: string) => {
  return new GoogleGenAI({ apiKey: apiKey || API_KEY });
};

// --- Chat & Script Generation ---

export const chatWithGuide = async (history: { role: string, parts: { text: string }[] }[], message: string) => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history,
    config: {
      systemInstruction: "You are a calming, empathetic meditation guide. Keep your responses concise, soothing, and helpful. You help users find mindfulness.",
    }
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};

export const generateMeditationScript = async (topic: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Write a short, soothing guided meditation script about: ${topic}. 
    The script should be around 150-200 words. 
    Focus on sensory details and breathing. 
    Do not include instructions like [Pause] or *soft music*, just the spoken words.`,
  });
  return response.text || "Breathe in... Breathe out...";
};

// --- Image Generation ---

export const generateMeditationImage = async (prompt: string, size: ImageSize): Promise<string> => {
  // Check for User API Key for Veo/Pro Image models
  let apiKey = API_KEY;
  if (window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      throw new Error("Please select an API Key to generate high-quality images.");
    }
    // We assume the key is injected or available via process.env if selected, 
    // but the instruction says "You must append an API key...". 
    // Actually, for the SDK, we just instantiate a new client.
    // However, the rule says: "Users MUST select their own paid API key... Create a new GoogleGenAI instance right before making an API call"
    // The selected key is available via process.env.API_KEY *after* selection in some environments, 
    // but for safety in this specific "Pro" context, we rely on the environment being updated or just proceeding.
    // The key is injected automatically into process.env.API_KEY after selection in this specific web container environment.
  }

  // Re-instantiate to ensure we catch any newly selected key if the environment updates
  const ai = getAI(process.env.API_KEY);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: `A serene, artistic, calming meditation background image about: ${prompt}. Soft lighting, abstract or nature-focused, high quality, 8k.` }],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: size
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

  // Convert base64 to Blob URL for playback
  const binaryString = window.atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/pcm' }); 
  // Note: Browsers can't play raw PCM directly via <audio src>. 
  // We need to wrap it or decode it. 
  // The SDK returns raw PCM. 
  // For simplicity in the app, we will assume we need to decode it with AudioContext 
  // OR we can try to request MP3 if supported (it's not).
  // We will return the base64 and handle decoding in the component 
  // OR return a WAV blob if we add a header.
  
  // Let's add a simple WAV header so it plays in a standard <audio> element or Howler.
  // Or simpler: Just return the raw base64 and use the AudioContext in the component.
  return base64Audio;
};

// WAV Header helper (Optional, but makes <audio> tag work)
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

export const convertBase64ToWavBlob = (base64: string): string => {
   const binaryString = window.atob(base64);
   const len = binaryString.length;
   const bytes = new Uint8Array(len);
   for (let i = 0; i < len; i++) {
     bytes[i] = binaryString.charCodeAt(i);
   }
   return pcmToWav(bytes);
}
