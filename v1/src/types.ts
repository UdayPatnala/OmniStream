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


