import { AnalysisResult } from "@shared/schema";
import { apiRequest } from "./queryClient";

export async function analyzeImage(imageFile: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getAnalysisHistory(): Promise<any[]> {
  const response = await apiRequest('GET', '/api/analyses');
  return response.json();
}

export async function getAnalysis(id: string): Promise<any> {
  const response = await apiRequest('GET', `/api/analyses/${id}`);
  return response.json();
}
