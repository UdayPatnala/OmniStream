export interface Video {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    medium: string;
    high: string;
  };
  duration?: string;
  viewCount?: string;
  category?: string;
}

export interface Channel {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  subscriberCount?: string;
  videoCount?: string;
  bannerUrl?: string;
  pinned?: boolean;
  isFavorite?: boolean;
  unreadCount?: number;
  lastWatchedAt?: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  itemCount?: number;
  thumbnails: {
    medium: string;
    high: string;
  };
}

export type SearchFilterType = 'all' | 'video' | 'channel' | 'playlist';

export interface SearchResult {
  id: string;
  type: 'video' | 'channel' | 'playlist';
  title: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnails: {
    medium: string;
    high: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  nextPageToken?: string;
}

export interface HistoryItem {
  video: Video;
  watchedAt: number;
  progress: number; // seconds
  duration: number; // seconds
  openCount?: number;
  completedCount?: number;
  completionRatio?: number; // 0 to 1
  category?: string;
  lastSpeed?: number;
}

export interface Collection {
  id: string;
  name: string;
  videos: Video[];
  pinned?: boolean;
  updatedAt?: number;
  description?: string;
}

export interface SearchHistoryMetaData {
  query: string;
  frequency: number;
  lastUsed: number;
  firstUsed: number;
  searchScore: number;
  pinned?: boolean;
}

export interface BehaviorEvent {
  id: string;
  type: 'search' | 'open' | 'complete' | 'skip' | 'favorite' | 'subscribe';
  videoId?: string;
  query?: string;
  timestamp: number;
  durationSpent?: number;
}

export interface QueueItem {
  video: Video;
  addedAt: number;
}

// CineMorphAI Engine Types
export type CineMorphTheme = 
  | 'cinematic-dark' 
  | 'cyberpunk-oled' 
  | 'glassmorphic-neon' 
  | 'ambient-minimal' 
  | 'imax-ultra' 
  | 'golden-hour';

export type GlowIntensity = 'off' | 'low' | 'medium' | 'ultra';

export type FrameAspectRatio = '16:9' | '21:9' | '4:3' | '1:1' | '4.3:1';

export type FrameReframeMode = 'center' | 'face-priority' | 'smart-pan-zoom';

export type AudioPreset = 'original' | 'dialogue-boost' | 'bass-heavy' | 'spatial-3d' | 'night-compression';

export interface AudioEQConfig {
  preset: AudioPreset;
  bassBoost: number; // 0-12 dB
  dialogueClarity: number; // 0-12 dB
  trebleShine: number; // 0-12 dB
  surround3D: boolean;
  drcLoudness: boolean;
}

export interface SceneHighlight {
  id: string;
  timestamp: number;
  title: string;
  importanceScore: number;
  category: 'intro' | 'key-point' | 'demo' | 'climax' | 'summary';
}

export interface TelemetryStats {
  fps: number;
  cpuLoadPercent: number;
  memoryMb: number;
  webglActive: boolean;
  audioDspLatencyMs: number;
}

export interface AISummary {
  executiveSummary: string;
  keyTakeaways: string[];
  sentiment: 'inspiring' | 'technical' | 'educational' | 'dramatic' | 'entertaining';
  readingTimeMinutes: number;
  tags: string[];
  aiScore: number;
}

export interface VideoScriptChunk {
  id: string;
  timestamp: number; // in seconds
  timestampFormatted: string;
  speaker: string;
  text: string;
  topic?: string;
  highlighted?: boolean;
}

export interface VideoClip {
  id: string;
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  thumbnail: string;
  startTime: number;
  endTime: number;
  startTimeFormatted: string;
  endTimeFormatted: string;
  note: string;
  createdAt: number;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface SearchPipelineCandidate {
  video: Video;
  relevanceScore: number;
  embeddable: boolean;
  validated: boolean;
}

export interface PlayerRecoveryState {
  isRecovering: boolean;
  currentCandidateIndex: number;
  candidates: Video[];
  lastError?: string;
  recoveryToastMessage?: string;
}

export type RankingProfile = 'balanced' | 'recency' | 'tutorials' | 'authority';

export interface LocalMediaItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  duration: number;
  progress: number;
  lastWatchedAt: number;
  thumbnail?: string;
  aspectRatio?: string;
  dominantColor?: string;
}

export interface LocalVideoAnalysis {
  avgBrightness: number;
  dominantColor: string;
  secondaryColor: string;
  sceneChangeDetected: boolean;
  saliencyCenterX: number;
  contrastScore: number;
  timestamp: number;
}
