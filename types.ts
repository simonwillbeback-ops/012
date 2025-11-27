export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type ImageSize = '1K' | '2K' | '4K';

export interface MeditationSession {
  topic: string;
  script: string;
  imageUrl: string;
  audioUrl: string; // Blob URL
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ProcessingError {
  message: string;
}
