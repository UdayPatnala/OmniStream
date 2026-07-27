import { Video, Channel, SearchResult, SearchFilterType, SearchResponse } from '../types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Secure developer configuration - loaded at build/runtime from environment
const getApiKey = (): string => {
  return (import.meta as any).env?.VITE_YOUTUBE_API_KEY || 
         (typeof process !== 'undefined' ? process.env.YOUTUBE_API_KEY : '') || 
         '';
};

export class YouTubeAPIError extends Error {
  isQuotaError?: boolean;
  constructor(message: string, isQuotaError = false) {
    super(message);
    this.name = 'YouTubeAPIError';
    this.isQuotaError = isQuotaError;
  }
}

async function fetchAPI(endpoint: string, params: Record<string, string>) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new YouTubeAPIError('Application configuration is incomplete.');
  }
  
  const query = new URLSearchParams({ ...params, key: apiKey }).toString();
  const res = await fetch(`${BASE_URL}${endpoint}?${query}`);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error?.message || 'Failed to fetch data from YouTube API';
    const isQuota = res.status === 403 || message.toLowerCase().includes('quota');
    throw new YouTubeAPIError(
      isQuota ? 'YouTube API Quota Limit Exceeded. Please try again later.' : 'Application configuration is incomplete.',
      isQuota
    );
  }
  
  return res.json();
}

export async function searchVideos(
  query: string, 
  filterType: SearchFilterType = 'all',
  pageToken?: string
): Promise<SearchResponse> {
  const params: Record<string, string> = {
    part: 'snippet',
    q: query,
    maxResults: '24',
  };

  if (filterType !== 'all') {
    params.type = filterType;
  } else {
    params.type = 'video,channel,playlist';
  }

  if (pageToken) {
    params.pageToken = pageToken;
  }

  const data = await fetchAPI('/search', params);

  const results: SearchResult[] = (data.items || []).map((item: any) => {
    let itemType: 'video' | 'channel' | 'playlist' = 'video';
    let id = item.id.videoId || item.id.channelId || item.id.playlistId || item.id;
    if (item.id.channelId) itemType = 'channel';
    if (item.id.playlistId) itemType = 'playlist';

    return {
      id,
      type: itemType,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      thumbnails: {
        medium: item.snippet.thumbnails?.medium?.url || '',
        high: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
      }
    };
  });

  return {
    results,
    nextPageToken: data.nextPageToken,
  };
}

export async function getRelatedVideos(videoId: string): Promise<Video[]> {
  try {
    const data = await fetchAPI('/search', {
      part: 'snippet',
      relatedToVideoId: videoId,
      type: 'video',
      maxResults: '12',
    });

    const videoIds = (data.items || []).map((item: any) => item.id.videoId).filter(Boolean);
    if (videoIds.length === 0) return [];
    return getVideosByIds(videoIds);
  } catch (e) {
    return getPopularVideos();
  }
}

export async function fetchSearchSuggestions(query: string): Promise<string[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1].slice(0, 6);
      }
    }
  } catch (e) {
    // Silently handle suggest errors
  }
  return [];
}

export async function getVideosByIds(ids: string[]): Promise<Video[]> {
  if (ids.length === 0) return [];
  const data = await fetchAPI('/videos', {
    part: 'snippet,contentDetails,statistics',
    id: ids.join(','),
  });

  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    thumbnails: {
      medium: item.snippet.thumbnails?.medium?.url || '',
      high: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
    },
    duration: item.contentDetails?.duration,
    viewCount: item.statistics?.viewCount,
  }));
}

export async function getPopularVideos(): Promise<Video[]> {
  const data = await fetchAPI('/videos', {
    part: 'snippet,contentDetails,statistics',
    chart: 'mostPopular',
    maxResults: '24',
    regionCode: 'US',
  });

  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    thumbnails: {
      medium: item.snippet.thumbnails?.medium?.url || '',
      high: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
    },
    duration: item.contentDetails?.duration,
    viewCount: item.statistics?.viewCount,
  }));
}

export async function getChannelDetails(channelId: string): Promise<Channel> {
  const data = await fetchAPI('/channels', {
    part: 'snippet,statistics,brandingSettings',
    id: channelId,
  });

  if (!data.items || data.items.length === 0) {
    throw new YouTubeAPIError('Channel not found');
  }

  const item = data.items[0];
  return {
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnails: {
      default: item.snippet.thumbnails?.default?.url || '',
      medium: item.snippet.thumbnails?.medium?.url || '',
      high: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
    },
    subscriberCount: item.statistics?.subscriberCount,
    videoCount: item.statistics?.videoCount,
    bannerUrl: item.brandingSettings?.image?.bannerExternalUrl,
  };
}

export async function getChannelVideos(channelId: string): Promise<SearchResult[]> {
  const data = await fetchAPI('/search', {
    part: 'snippet',
    channelId: channelId,
    maxResults: '24',
    order: 'date',
    type: 'video',
  });

  return (data.items || []).map((item: any) => ({
    id: item.id.videoId,
    type: 'video',
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    publishedAt: item.snippet.publishedAt,
    thumbnails: {
      medium: item.snippet.thumbnails?.medium?.url || '',
      high: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
    }
  }));
}


