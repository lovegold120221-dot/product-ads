import { GoogleGenAI } from '@google/genai';
import { ProductData, AdStrategy } from '../types';

// The AI Studio environment injects the API key via process.env.GEMINI_API_KEY
// in vite.config.ts.
const apiKey = process.env.GEMINI_API_KEY;
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateAdStrategy(product: ProductData): Promise<AdStrategy | null> {
  if (!ai) {
    console.error("Gemini API key is missing. Check your secrets.");
    return null;
  }

  const prompt = `
    You are an expert AI Ads Creation Engine. Based on the following product input, generate a creative ad strategy.
    
    PRODUCT DETAILS:
    Title: ${product.title}
    Brand: ${product.brand}
    Target Audience: ${product.targetAudience}
    Category: ${product.category}
    Short Description: ${product.description}
    Detailed Description: ${product.detailedDescription || 'N/A'}
    CTA: ${product.cta}
    Promo: ${product.promoText || 'N/A'}
    Price: ${product.price || 'N/A'}
    
    Please provide the output EXACTLY as a JSON object matching this schema:
    {
      "angles": [
        { "title": "string", "description": "string", "score": number }
      ],
      "selectedAngle": "string (one of the angle titles)",
      "posters": [
        {
          "format": "Square (1:1) | Portrait (9:16) | Landscape (16:9)",
          "headline": "string",
          "subheadline": "string",
          "cta": "string",
          "style": "string (e.g. Minimal, Lifestyle, Neon, etc)"
        }
      ],
      "storyboard": [
        {
          "scene": number,
          "visual": "string (detailed description of what happens visually)",
          "textOverlay": "string",
          "voiceover": "string",
          "duration": number (in seconds)
        }
      ],
      "voiceoverOptions": ["string", "string"]
    }
    
    Ensure the storyboard has exactly 6 scenes and adds up to exactly 30 seconds.
    Generate 3 distinct posters.
    Generate 3 distinct angles.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as AdStrategy;
  } catch (error) {
    console.error("Error generating ad strategy:", error);
    return null;
  }
}

export async function generatePosterImage(product: ProductData, poster: any): Promise<string | null> {
  if (!ai) return null;
  
  const aspect = poster.format.includes('16:9') ? '16:9' : poster.format.includes('9:16') ? '9:16' : '1:1';
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A high-quality advertising photograph for the product "${product.title}". Product description: ${product.description}. Make the style: ${poster.style}. It should look incredibly professional, cinematic lighting. DO NOT include any text.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspect as "1:1" | "16:9" | "9:16",
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/jpeg;base64,${part.inlineData.data}`;
      }
    }
  } catch (err) {
    console.error("Image generation failed", err);
    // Fallback to picsum for demo purposes if quota hit
    const [w, h] = aspect === '16:9' ? [1280, 720] : aspect === '9:16' ? [720, 1280] : [1024, 1024];
    return `https://picsum.photos/seed/${encodeURIComponent(product.title + poster.style)}/${w}/${h}`;
  }
  return null;
}

export async function generateVoiceover(text: string, voiceName: string = 'Kore'): Promise<string | null> {
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say with a professional advertorial tone: ${text}` }] }],
      config: {
        // We use Modality.AUDIO but as string because enum might not be available
        responseModalities: ["AUDIO"] as any,
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/mp3;base64,${base64Audio}`;
    }
  } catch(err) {
      console.error(err);
  }
  return null;
}