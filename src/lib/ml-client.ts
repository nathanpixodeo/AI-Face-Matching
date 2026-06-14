import { env } from '../config/env';

const ML_URL = env.ML_SERVICE_URL;
const TIMEOUT = 30000;

interface MlDetectResponse {
  faces_count: number;
  faces: Array<{
    bbox: { x1: number; y1: number; x2: number; y2: number };
    confidence: number;
  }>;
}

interface MlEmbedFace {
  bbox: { x1: number; y1: number; x2: number; y2: number };
  embedding: number[];
  model_used: string;
}

interface MlEmbedResponse {
  faces_count: number;
  embeddings: number[][];
  model_used: string;
}

interface MlAnalyzeFace {
  bbox: { x1: number; y1: number; x2: number; y2: number };
  embedding: number[];
  model_used: string;
  age: number;
  gender: string;
  gender_probability: number;
  quality_score: number;
}

interface MlAnalyzeResponse {
  faces_count: number;
  faces: MlAnalyzeFace[];
  model_used: string;
}

interface MlBatchEmbedItem {
  index: number;
  faces_count: number;
  faces: MlEmbedFace[];
  error: string | null;
}

interface MlMatchResponse {
  distance: number;
  similarity_percent: number;
  is_match: boolean;
  threshold: number;
}

interface MlHealthResponse {
  status: string;
  models_loaded: boolean;
}

async function mlFetch<T>(path: string, options: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${ML_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(`ML service error ${res.status}: ${text}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function imageToFormData(imageBuffer: Buffer, filename = 'image.jpg'): FormData {
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  formData.append('file', blob, filename);
  return formData;
}

export async function detect(imageBuffer: Buffer): Promise<MlDetectResponse> {
  return mlFetch<MlDetectResponse>('/detect', {
    method: 'POST',
    body: imageToFormData(imageBuffer),
  });
}

export async function embed(imageBuffer: Buffer): Promise<MlEmbedResponse> {
  return mlFetch<MlEmbedResponse>('/embed', {
    method: 'POST',
    body: imageToFormData(imageBuffer),
  });
}

export async function analyze(imageBuffer: Buffer): Promise<MlAnalyzeResponse> {
  return mlFetch<MlAnalyzeResponse>('/analyze', {
    method: 'POST',
    body: imageToFormData(imageBuffer),
  });
}

export async function batchEmbed(
  images: Array<{ buffer: Buffer; filename: string }>,
): Promise<MlBatchEmbedItem[]> {
  const formData = new FormData();
  for (const img of images) {
    const blob = new Blob([img.buffer], { type: 'image/jpeg' });
    formData.append('files', blob, img.filename);
  }

  const result = await mlFetch<{ total: number; processed: number; failed: number; results: MlBatchEmbedItem[] }>('/batch-embed', {
    method: 'POST',
    body: formData,
  });

  return result.results;
}

export async function match(
  embedding1: number[],
  embedding2: number[],
): Promise<MlMatchResponse> {
  return mlFetch<MlMatchResponse>('/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embedding1, embedding2 }),
  });
}

export async function health(): Promise<MlHealthResponse> {
  return mlFetch<MlHealthResponse>('/health', { method: 'GET' });
}

export type {
  MlDetectResponse,
  MlEmbedResponse,
  MlAnalyzeResponse,
  MlAnalyzeFace,
  MlBatchEmbedItem,
  MlMatchResponse,
};
