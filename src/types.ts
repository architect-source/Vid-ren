export type MetalStyle = 'SENTRY' | 'BLACK' | 'DEATH' | 'INDUSTRIAL' | 'DOOM' | 'THRASH' | 'RETRO_80S';

export interface ForgeArtifact {
  id: string;
  seed: string;
  style: MetalStyle;
  lyrics: string;
  manifesto: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  timestamp: number;
}

export interface PhilatelicStamp {
  id: string;
  name: string;
  country: string;
  year: number;
  color: string;
  shape: string;
  historicalProvenance: string;
  marketVelocity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  estimatedValue: number;
  imageUrl?: string;
  status: 'AUDITED' | 'STOLEN' | 'RECOVERED';
  ownerId?: string;
}

export interface StoryboardScene {
  id: string;
  prompt: string;
  style: string;
  lyrics?: string;
  visualAsset?: string;
  audioAsset?: string;
  duration: number;
  order: number;
}

export interface SentryTelemetry {
  jobId: string;
  state: string;
  batchSize: number;
  resourceExhaustedCount: number;
  cloudShellConnected: boolean;
  timestamp: number;
}

export interface VoidProject {
  project_name: string;
  resolution: [number, number]; // [width, height]
  tracks: {
    id: string;
    type: 'video' | 'audio' | 'text';
    clips: {
      id: string;
      file?: string;
      start: number;
      end: number;
      text?: string;
      volume?: number;
      filters?: string[];
    }[];
  }[];
}


