export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ProcessedImage {
  original: string; // Base64 data URL
  result: string;   // Base64 data URL
}

export interface ProcessingError {
  message: string;
}

export type ProcessingOptions = {
  promptOverride?: string;
};