import { Video, Channel, LocalMediaItem, HistoryItem, Collection } from '../../types';

export const MOCK_VIDEOS: Video[] = [
  {
    id: 'vid_cinematic_4k',
    title: 'Cinematic 4K Landscape Nature Documentary',
    description: 'Breathtaking 4K HDR nature and wildlife documentary showcasing wide format composition.',
    channelId: 'chan_nature',
    channelTitle: 'Nature Cinema Films',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400',
      high: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
    },
    duration: 'PT15M30S',
    viewCount: '2500000',
    category: 'Documentary',
  },
  {
    id: 'vid_react_tutorial',
    title: 'React 19 Advanced Performance & State Architecture',
    description: 'Deep dive into React 19 concurrent features, zero-latency state, and streaming architecture.',
    channelId: 'chan_tech',
    channelTitle: 'Modern Web Academy',
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
      high: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    },
    duration: 'PT22M10S',
    viewCount: '850000',
    category: 'Education',
  },
  {
    id: 'vid_lofi_beats',
    title: 'Lo-Fi Chill Beats for Deep Focus & Study',
    description: 'Relaxing ambient lofi beats to study, relax, and code to with soothing visual scenery.',
    channelId: 'chan_music',
    channelTitle: 'ChillVibes Lofi',
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400',
      high: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    },
    duration: 'PT1H00M00S',
    viewCount: '12000000',
    category: 'Music',
  },
  {
    id: 'vid_imax_trailer',
    title: 'Sci-Fi Odyssey 2026 Official IMAX 70mm Trailer',
    description: 'Official IMAX 1.43:1 expanded aspect ratio trailer featuring neural sound design.',
    channelId: 'chan_movies',
    channelTitle: 'IMAX Studios',
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400',
      high: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800',
    },
    duration: 'PT3M15S',
    viewCount: '4500000',
    category: 'Film',
  },
  {
    id: 'vid_cyberpunk_city',
    title: 'Cyberpunk 2077 Night City 4K 60FPS Ambient Drive',
    description: 'Neon-lit nighttime cinematic drive through Night City in 21:9 ultrawide format.',
    channelId: 'chan_gaming',
    channelTitle: 'CyberVision Media',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
      high: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    },
    duration: 'PT45M00S',
    viewCount: '920000',
    category: 'Gaming',
  },
  {
    id: 'vid_vintage_cinema',
    title: 'Golden Age of Cinema 1930s Film Archive Restoration',
    description: '4:3 Academy ratio archival 35mm film restoration with grain reproduction.',
    channelId: 'chan_archive',
    channelTitle: 'Film Preservation Vault',
    publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnails: {
      medium: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
      high: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
    },
    duration: 'PT18M40S',
    viewCount: '150000',
    category: 'History',
  }
];

export const MOCK_CHANNELS: Channel[] = [
  {
    id: 'chan_nature',
    title: 'Nature Cinema Films',
    description: 'Premier wildlife and high dynamic range 4K cinema.',
    thumbnails: {
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      medium: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
      high: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600',
    },
    subscriberCount: '1450000',
    videoCount: '124',
    pinned: true,
  },
  {
    id: 'chan_tech',
    title: 'Modern Web Academy',
    description: 'Modern front-end, WebGL, and distributed application tutorials.',
    thumbnails: {
      default: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      medium: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300',
      high: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600',
    },
    subscriberCount: '890000',
    videoCount: '312',
  },
  {
    id: 'chan_movies',
    title: 'IMAX Studios',
    description: 'Official IMAX 70mm trailers and behind-the-scenes engineering.',
    thumbnails: {
      default: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      medium: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      high: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
    },
    subscriberCount: '3200000',
    videoCount: '88',
  }
];

export const MOCK_LOCAL_MEDIA: LocalMediaItem = {
  id: 'local-test-movie-1',
  name: 'Interstellar_Sample_1080p',
  size: 154200000,
  type: 'video/mp4',
  url: 'blob:http://localhost/mock-video-stream',
  duration: 3600,
  progress: 1250,
  lastWatchedAt: Date.now() - 3600000,
  aspectRatio: '1.43:1',
  dominantColor: 'rgb(24, 32, 54)',
};
