export interface Detection {
  type: 'FACE' | 'BARCODE' | 'PII'; 
  box: [number, number, number, number]; // [x, y, w, h]
  content?: string; // Optional content for PII
}

export interface Metadata {
  gps_found: boolean;
  device_info: string;
  is_stripped: boolean;
  lat: number | null;
  lon: number | null;
}

export interface ScanResult {
  session_id: string;
  score: number;
  status: 'SAFE' | 'HIGH RISK';
  threats: string[];
  detections: Detection[];
  meta: Metadata;
  report: string;
}