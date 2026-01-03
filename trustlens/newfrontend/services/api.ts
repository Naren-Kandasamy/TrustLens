import axios from 'axios';
import type { ScanResult } from '../types';

console.log("CHECK: TrustLens API URL is ->", import.meta.env.VITE_API_URL);

// 1. Use the Vite environment variable with a local fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Uploads an image for a diagnostic privacy scan.
 */
export const scanImage = async (file: File): Promise<ScanResult> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/api/scan', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

/**
 * Applies protection actions (Blur, Cloak, Redact, Sign).
 * Now supports comma-separated actions and session-based HMAC signing.
 */
export const protectImage = async (
  action: string, 
  indices: number[],
  sessionId: string,
  brushData: number[] = []
): Promise<Blob> => {
  const formData = new FormData();
  
  // The backend now parses comma-separated strings for sequential processing
  formData.append('action', action);
  formData.append('indices', indices.join(','));
  
  // session_id is now CRITICAL for generating the cryptographic signature
  formData.append('session_id', sessionId);
  formData.append('brush_data', brushData.join(','));
  
  const response = await apiClient.post('/api/protect', formData, {
    // responseType 'blob' is required to handle the lossless PNG returned by the server
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Verifies the integrity of a TrustLens-protected image using the HMAC signature.
 */
export const verifyImage = async (file: File): Promise<{ status: string; message: string; signature?: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/api/verify', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};