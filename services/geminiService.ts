import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Clean base64 string to remove data header for API consumption if needed, 
// though inlineData usually handles standard base64 strings well.
const cleanBase64 = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};

export const removeWatermark = async (
  base64Image: string, 
  customInstruction: string = ''
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Clean the base64 string
  const rawBase64 = cleanBase64(base64Image);

  const model = 'gemini-2.5-flash-image';

  // Construct a prompt that guides the model to perform inpainting/removal
  const prompt = customInstruction.trim() 
    ? `Edit this image: ${customInstruction}. Output only the modified image.` 
    : "Remove all watermarks, logos, and text overlays from this image. Reconstruct the background naturally where the watermarks were removed. Output the clean image.";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: rawBase64,
            },
          },
        ],
      },
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new Error("No content returned from Gemini.");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        // Return fully qualified data URL
        return `data:image/jpeg;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in the response.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
