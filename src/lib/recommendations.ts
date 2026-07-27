import { Video, Channel, HistoryItem, Collection } from '../types';

export interface UserStats {
  totalWatched: number;
  totalHours: number;
  completedCount: number;
  completionRate: number;
  subscriptionsCount: number;
  collectionsCount: number;
  topChannels: { channelTitle: string; count: number }[];
}

export function calculateUserStats(
  history: Record<string, HistoryItem>,
  subscriptions: Channel[],
  collections: Collection[]
): UserStats {
  const historyItems = Object.values(history);
  const totalWatched = historyItems.length;
  
  let totalSeconds = 0;
  let completedCount = 0;
  const channelCounts: Record<string, number> = {};

  historyItems.forEach(item => {
    totalSeconds += item.progress || 0;
    const isCompleted = item.duration && item.progress >= item.duration * 0.95;
    if (isCompleted) completedCount++;

    const chan = item.video.channelTitle || 'Unknown';
    channelCounts[chan] = (channelCounts[chan] || 0) + 1;
  });

  const topChannels = Object.entries(channelCounts)
    .map(([channelTitle, count]) => ({ channelTitle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalHours = parseFloat((totalSeconds / 3600).toFixed(1));
  const completionRate = totalWatched > 0 ? Math.round((completedCount / totalWatched) * 100) : 0;

  return {
    totalWatched,
    totalHours,
    completedCount,
    completionRate,
    subscriptionsCount: subscriptions.length,
    collectionsCount: collections.length,
    topChannels,
  };
}

export function getRecommendedVideos(
  popularVideos: Video[],
  history: Record<string, HistoryItem>,
  subscriptions: Channel[],
  collections: Collection[],
  searchHistory: string[] = []
): Video[] {
  if (popularVideos.length === 0) return [];

  const historyItems = Object.values(history);
  const subscribedChannelIds = new Set(subscriptions.map(s => s.id));
  const watchedVideoIds = new Set(historyItems.map(h => h.video.id));
  
  // Extract keywords from history, collections, and search history
  const keywordMap: Record<string, number> = {};
  const sampleVideos = [
    ...historyItems.map(h => h.video),
    ...collections.flatMap(c => c.videos)
  ];

  sampleVideos.forEach(v => {
    const words = (v.title || '').toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);
    words.forEach(w => {
      if (w.length > 3 && !['with', 'from', 'that', 'this', 'have', 'what', 'your', 'video'].includes(w)) {
        keywordMap[w] = (keywordMap[w] || 0) + 1;
      }
    });
  });

  // Include recent search history query terms in keyword map
  searchHistory.forEach(query => {
    const words = query.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);
    words.forEach(w => {
      if (w.length > 2) {
        keywordMap[w] = (keywordMap[w] || 0) + 3;
      }
    });
  });

  // Calculate score for each candidate video
  const scoredVideos = popularVideos.map(video => {
    let score = 0;

    // Penalty for videos already fully watched
    if (watchedVideoIds.has(video.id)) {
      score -= 100;
    }

    // Boost if from a subscribed channel
    if (subscribedChannelIds.has(video.channelId)) {
      score += 50;
    }

    // Boost based on title keyword relevance
    const videoWords = (video.title || '').toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);
    videoWords.forEach(w => {
      if (keywordMap[w]) {
        score += keywordMap[w] * 5;
      }
    });

    // Boost for newer videos
    const publishDate = new Date(video.publishedAt).getTime();
    const daysOld = (Date.now() - publishDate) / (1000 * 60 * 60 * 24);
    if (daysOld < 7) {
      score += 15;
    }

    return { video, score };
  });

  // Sort descending by recommendation score
  scoredVideos.sort((a, b) => b.score - a.score);

  return scoredVideos.map(item => item.video);
}

