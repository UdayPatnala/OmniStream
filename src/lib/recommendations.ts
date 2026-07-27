import { Video, Channel, HistoryItem, Collection } from '../types';

export function getRecommendedVideos(
  popularVideos: Video[],
  history: Record<string, HistoryItem>,
  subscriptions: Channel[],
  collections: Collection[]
): Video[] {
  if (popularVideos.length === 0) return [];

  const historyItems = Object.values(history);
  const subscribedChannelIds = new Set(subscriptions.map(s => s.id));
  const watchedVideoIds = new Set(historyItems.map(h => h.video.id));
  
  // Extract top keywords from history and collection video titles
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

    // Slight boost for newer videos
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
