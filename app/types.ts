export type Product = {
  id: string;
  name: string;
  brand: string;
  category: "Cleanser" | "Moisturizer" | "Serum" | "Sunscreen" | "Makeup";
  price: number;
  imageEmoji: string;
  ingredients: string[];
  concerns: string[];
  vtoEnabled?: boolean;
  vtoSku?: string;
};

export type WellnessLog = {
  id: string;
  timestamp: string;
  hotFlashIntensity: "None" | "Mild" | "Moderate" | "Severe";
  sleepQuality: "Good" | "Restless" | "Poor";
  notes: string;
  skinSnapshot: SkinMetrics;
};

export type SkinMetrics = {
  moisture: number;
  redness: number;
  texture: number;
  wrinkles: number;
  radiance: number;
  skinAge: number;
};

export type ProductRisk = {
  product: Product;
  status: "recommended" | "caution" | "blocked";
  reasons: string[];
  matchScore: number;
};

export type MenoMorphConfig = {
  status: "ready" | "analyzing" | "error";
  engine: string;
  version: string;
  message: string;
  contraindicationFilter: string[];
};