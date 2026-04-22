export interface ProductData {
  title: string;
  description: string;
  detailedDescription?: string;
  targetAudience: string;
  category: string;
  brand: string;
  cta: string;
  promoText?: string;
  price?: string;
  discount?: string;
  website?: string;
  language: string;
  videoAspectRatio: "16:9" | "9:16" | "1:1";
  // File placeholders
  images: File[];
  imageUrls: string[];
}

export interface AdStrategy {
  angles: { title: string; description: string; score: number }[];
  selectedAngle: string;
  posters: {
    format: string;
    headline: string;
    subheadline: string;
    cta: string;
    style: string;
    generatedImageUrl?: string;
  }[];
  storyboard: {
    scene: number;
    visual: string;
    textOverlay: string;
    voiceover: string;
    duration: number;
  }[];
  voiceoverOptions: string[];
  generatedAudio?: { title: string; data: string }[];
}

export interface ProjectState {
  step: number;
  productKey: string | null;
  productData: ProductData | null;
  strategyKey: string | null;
  strategy: AdStrategy | null;
  isGenerating: boolean;
}
