
import { HashAlgorithm, AdditiveOptions } from '../types';

function additiveChecksum(message: string, options: AdditiveOptions): string {
  const { bitWidth, initialValue } = options;
  let sum = initialValue;
  for (let i = 0; i < message.length; i++) sum += message.charCodeAt(i);
  
  let mask = 0xFFFF;
  let pad = 4;
  
  if (bitWidth === 8) {
    mask = 0xFF;
    pad = 2;
  } else if (bitWidth === 32) {
    mask = 0xFFFFFFFF;
    pad = 8;
  }
  
  return (sum & mask).toString(16).toUpperCase().padStart(pad, '0');
}

export async function calculateChecksum(
  data: string, 
  algorithm: HashAlgorithm, 
  additiveOptions?: AdditiveOptions
): Promise<string> {
  if (!data) return '';
  // Only handling Additive Checksum as requested
  return additiveChecksum(data, additiveOptions || { bitWidth: 16, initialValue: 0 });
}

/**
 * Hamming (7,4) implementation remains for error correction tab
 */
export const Hamming = {
  encode: (data4: string): string => {
    const d = data4.split('').map(Number);
    const p1 = (d[0] + d[1] + d[3]) % 2;
    const p2 = (d[0] + d[2] + d[3]) % 2;
    const p3 = (d[1] + d[2] + d[3]) % 2;
    return `${p1}${p2}${d[0]}${p3}${d[1]}${d[2]}${d[3]}`;
  },
  decode: (bits7: string): { corrected: string; errorPos: number | null } => {
    const b = bits7.split('').map(Number);
    const s1 = (b[0] + b[2] + b[4] + b[6]) % 2;
    const s2 = (b[1] + b[2] + b[5] + b[6]) % 2;
    const s3 = (b[3] + b[4] + b[5] + b[6]) % 2;
    const errorPos = s1 + (s2 * 2) + (s3 * 4);
    
    let corrected = [...b];
    if (errorPos !== 0) {
      corrected[errorPos - 1] = corrected[errorPos - 1] === 0 ? 1 : 0;
    }
    const dataBits = [corrected[2], corrected[4], corrected[5], corrected[6]];
    return { corrected: dataBits.join(''), errorPos: errorPos === 0 ? null : errorPos };
  }
};
