
export enum HashAlgorithm {
  ADDITIVE = 'Additive Checksum'
}

export interface AdditiveOptions {
  bitWidth: 8 | 16 | 32;
  initialValue: number;
}

export interface BatchItem {
  id: string;
  name: string;
  size: number;
  data: string;
  checksum?: string;
  status: 'pending' | 'processing' | 'completed';
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  algorithm: string;
  type: 'single' | 'batch' | 'correction';
  result: 'match' | 'mismatch' | 'corrected' | 'info';
  summary: string;
}

export interface HammingResult {
  original: string;
  encoded: string;
  received: string;
  corrected: string;
  errorPosition: number | null;
}
