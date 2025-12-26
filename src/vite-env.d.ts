/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Type definitions for gifenc
declare module 'gifenc' {
  export class GIFEncoder {
    constructor();
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: {
        palette?: number[][];
        delay?: number;
        dispose?: number;
        transparent?: boolean;
        repeat?: number;
      }
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  }
  
  export function quantize(
    data: Uint8ClampedArray,
    maxColors: number
  ): number[][];
  
  export function applyPalette(
    data: Uint8ClampedArray,
    palette: number[][]
  ): Uint8Array;
}

// Extend Window for VideoEncoder API
interface Window {
  VideoEncoder: typeof VideoEncoder;
  VideoFrame: typeof VideoFrame;
}

