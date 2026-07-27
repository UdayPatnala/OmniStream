import { Video, Channel, SearchResult, SearchFilterType, SearchResponse } from '../types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// High quality fallback dataset of popular playable YouTube videos
const FALLBACK_VIDEOS: Video[] = [
  {
    id: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio 📚 - beats to relax/study to',
    description: 'Welcome to the Lofi Girl live stream! Relax, study, or chill with peaceful lofi hip hop beats.',
    channelId: 'UCZFpeerLhc59F5LhTaDNklw',
    channelTitle: 'Lofi Girl',
    publishedAt: '2023-01-12T00:00:00Z',
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
      high: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1200&auto=format&fit=crop&q=80'
    },
    duration: 'PT3H45M12S',
    viewCount: '6543210'
  },
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    description: 'The official music video for Never Gonna Give You Up by Rick Astley. Remastered in 4K!',
    channelId: 'UCuAXFkgptg575ATx1XAUpag',
    channelTitle: 'Rick Astley',
    publishedAt: '2009-10-25T00:00:00Z',
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      high: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80'
    },
    duration: 'PT3M33S',
    viewCount: '1542389100'
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
    description: 'REMASTERED IN HD! Official Music Video for Queen - Bohemian Rhapsody.',
    channelId: 'UCnUYZLuoy1my16ZSVOx-0',
    channelTitle: 'Queen Official',
    publishedAt: '2008-08-01T00:00:00Z',
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      high: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80'
    },
    duration: 'PT5M55S',
    viewCount: '1689201948'
  },
  {
    id: '5qap5aO4i9A',
    title: 'Lofi Hip Hop Radio 🎧 - Beats to Study / Chill to',
    description: 'Relaxing instrumental lofi beats for sleeping, working, and concentration.',
    channelId: 'UCChK9yX5TvyzLgYpA9c5BvQ',
    channelTitle: 'Chillhop Music',
    publishedAt: '2023-05-10T00:00:00Z',
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      high: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80'
    },
    duration: 'PT2H15M00S',
    viewCount: '891024'
  },
  {
    id: 'M576WGiDBdQ',
    title: 'Top 10 Web Development Trends for 2026',
    description: 'Explore the future of full-stack engineering, React 19, Server Actions, AI agents, and web assembly.',
    channelId: 'UC29ju8bIPH5as8OGnQzwJyA',
    channelTitle: 'Traversy Media',
    publishedAt: '2026-01-15T00:00:00Z',
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      high: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80'
    },
    duration: 'PT18M42S',
    viewCount: '450912'
  },
  {
    id: 'hT_nvWreIhg',
    title: 'One Hour of Relaxing Nature Sounds & Forest Stream',
    description: 'Peaceful running water and gentle birdsong recorded in high definition in Olympic National Park.',
    channelId: 'UC4qD94-V6w0X8V2yQ6jBq3g',
    channelTitle: 'Calm Nature HD',
    publishedAt: '2022-09-20T00:00:00Z',
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
      high: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80'
    },
    duration: 'PT1H00M00S',
    viewCount: '1240890'
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    description: 'Official music video for Despacito by Luis Fonsi ft. Daddy Yankee.',
    channelId: 'UC0C-w0YjGpqDXGB8IHb6y2g',
    channelTitle: 'Luis Fonsi',
    publishedAt: '2017-01-12T00:00:00Z',
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
      high: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&auto=format&fit=crop&q=80'
    },
    duration: 'PT4M42S',
    viewCount: '8120000000'
  },
  {
    id: '3JZ_D3ELwOQ',
    title: 'Building a Full Stack YouTube Clone with React & TypeScript',
    description: 'Comprehensive step-by-step masterclass building a modern video streaming application.',
    channelId: 'UCWv7vMbMWH4-V0ZXgLaw3gA',
    channelTitle: 'JavaScript Mastery',
    publishedAt: '2025-11-04T00:00:00Z',
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&auto=format&fit=crop&q=80',
      high: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1200&auto=format&fit=crop&q=80'
    },
    duration: 'PT45M18S',
    viewCount: '620194'
  }
];

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
    return null;
  }
  
  try {
    const query = new URLSearchParams({ ...params, key: apiKey }).toString();
    const res = await fetch(`${BASE_URL}${endpoint}?${query}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
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

  if (data && data.items) {
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

  // Fallback filtering if API unavailable
  const filtered = FALLBACK_VIDEOS.filter(v => 
    v.title.toLowerCase().includes(query.toLowerCase()) || 
    v.channelTitle.toLowerCase().includes(query.toLowerCase()) ||
    v.description.toLowerCase().includes(query.toLowerCase())
  );
  
  const searchResults: SearchResult[] = (filtered.length > 0 ? filtered : FALLBACK_VIDEOS).map(v => ({
    id: v.id,
    type: 'video',
    title: v.title,
    channelTitle: v.channelTitle,
    channelId: v.channelId,
    publishedAt: v.publishedAt,
    thumbnails: v.thumbnails,
  }));

  return { results: searchResults };
}

export async function getRelatedVideos(videoId: string): Promise<Video[]> {
  try {
    const data = await fetchAPI('/search', {
      part: 'snippet',
      relatedToVideoId: videoId,
      type: 'video',
      maxResults: '12',
    });

    if (data && data.items) {
      const videoIds = (data.items || []).map((item: any) => item.id.videoId).filter(Boolean);
      if (videoIds.length > 0) {
        const fetched = await getVideosByIds(videoIds);
        if (fetched.length > 0) return fetched;
      }
    }
  } catch (e) {}

  return FALLBACK_VIDEOS.filter(v => v.id !== videoId);
}

export async function fetchSearchSuggestions(query: string): Promise<string[]> {
  if (!query || query.trim().length < 2) return [];
  
  // 1. Try local server API endpoint
  try {
    const localRes = await fetch(`/api/suggest?q=${encodeURIComponent(query.trim())}`);
    if (localRes.ok) {
      const data = await localRes.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.slice(0, 8);
      }
    }
  } catch (e) {}

  // 2. Direct client fallback to suggestqueries.google.com
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1].slice(0, 8);
      }
    }
  } catch (e) {}

  // 3. Fallback to local offline dataset
  return FALLBACK_VIDEOS.map(v => v.title)
    .filter(t => t.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);
}

export async function getVideosByIds(ids: string[]): Promise<Video[]> {
  if (ids.length === 0) return [];
  const data = await fetchAPI('/videos', {
    part: 'snippet,contentDetails,statistics',
    id: ids.join(','),
  });

  if (data && data.items && data.items.length > 0) {
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

  return FALLBACK_VIDEOS.filter(v => ids.includes(v.id));
}

export async function getPopularVideos(): Promise<Video[]> {
  const data = await fetchAPI('/videos', {
    part: 'snippet,contentDetails,statistics',
    chart: 'mostPopular',
    maxResults: '24',
    regionCode: 'US',
  });

  if (data && data.items && data.items.length > 0) {
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

  return FALLBACK_VIDEOS;
}

export async function getChannelDetails(channelId: string): Promise<Channel> {
  const data = await fetchAPI('/channels', {
    part: 'snippet,statistics,brandingSettings',
    id: channelId,
  });

  if (data && data.items && data.items.length > 0) {
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

  const match = FALLBACK_VIDEOS.find(v => v.channelId === channelId);
  return {
    id: channelId,
    title: match ? match.channelTitle : 'YouTube Creator',
    description: 'Official YouTube Channel.',
    thumbnails: {
      default: match?.thumbnails.medium || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      medium: match?.thumbnails.medium || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
      high: match?.thumbnails.high || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600',
    },
    subscriberCount: '1250000',
    videoCount: '342'
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

  if (data && data.items && data.items.length > 0) {
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

  return FALLBACK_VIDEOS.filter(v => v.channelId === channelId || true).map(v => ({
    id: v.id,
    type: 'video',
    title: v.title,
    channelTitle: v.channelTitle,
    channelId: v.channelId,
    publishedAt: v.publishedAt,
    thumbnails: v.thumbnails
  }));
}



