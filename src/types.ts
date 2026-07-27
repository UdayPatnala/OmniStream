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
}

export interface Collection {
  id: string;
  name: string;
  videos: Video[];
}

