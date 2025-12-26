export interface SvgGenerationResponse {
  svgCode: string;
  explanation: string;
}

export interface ColorMap {
  original: string;
  current: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface HistoryItem {
  id: string;
  prompt: string;
  svgCode: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  svgCode?: string;
}

