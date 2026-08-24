import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { getPopularVideos, searchVideos, getVideosByIds } from '../lib/youtube';
import { getRecommendedVideos } from '../lib/recommendations';
import { Video } from '../types';
import { VideoCard } from '../components/VideoCard';
import { VideoCardSkeleton } from '../components/Skeleton';
import { Flame, PlayCircle, Sparkles, History as HistoryIcon, Layers } from 'lucide-react';

const CATEGORIES = [
  'All', 'Music', 'Gaming', 'Podcasts', 'React.js', 'Live', 
  'Web Development', 'Gadgets', 'Lo-Fi', 'News', 'Coding', 
  'Pop Music', 'Recently uploaded', 'Watched'
];

export function Home() {
  const history = useAppStore(state => state.history);
  const subscriptions = useAppStore(state => state.subscriptions);
  const collections = useAppStore(state => state.collections);
  const searchHistory = useAppStore(state => state.searchHistory);
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [popular, setPopular] = useState<Video[]>([]);
  const [recommended, setRecommended] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHome() {
      try {
        setLoading(true);
        if (activeCategory === 'All') {
          const vids = await getPopularVideos();
          setPopular(vids);
          const recs = getRecommendedVideos(vids, history, subscriptions, collections, searchHistory);
          setRecommended(recs.slice(0, 10));
        } else {
          const res = await searchVideos(activeCategory);
          const videoIds = res.results.filter(r => r.type === 'video').map(r => r.id);
          if (videoIds.length > 0) {
            const richVideos = await getVideosByIds(videoIds);
            if (richVideos.length > 0) {
              setPopular(richVideos);
              setRecommended([]);
              return;
            }
          }
          const vids: Video[] = res.results.map(r => ({
            id: r.id,
            title: r.title,
            description: '',
            channelId: r.channelId,
            channelTitle: r.channelTitle,
            publishedAt: r.publishedAt,
            thumbnails: r.thumbnails,
          }));
          setPopular(vids);
          setRecommended([]);
        }
      } catch (err: any) {
        // Safe silent fallback handled by youtube.ts
      } finally {
        setLoading(false);
      }
    }
    fetchHome();
  }, [activeCategory, history, subscriptions, collections, searchHistory]);

  // Continue Watching: Progress between 5% and 95%
  const continueWatchingItems = Object.values(history)
    .filter(item => {
      if (!item.duration || item.duration === 0) return false;
      const ratio = item.progress / item.duration;
      return ratio >= 0.05 && ratio < 0.95;
    })
    .sort((a, b) => b.watchedAt - a.watchedAt)
    .slice(0, 5);

  // Most Watched / Frequently Opened
  const mostWatchedItems = Object.values(history)
    .filter(item => (item.openCount || 1) > 1)
    .sort((a, b) => (b.openCount || 1) - (a.openCount || 1))
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto pb-6">
      {/* YouTube Category Filter Chips Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar py-2.5 mb-2 sticky top-0 bg-gray-50 z-30 border-b border-gray-200">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeCategory === category
                ? 'bg-gray-900 text-white font-bold'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 1. Continue Watching Section */}
      {continueWatchingItems.length > 0 && activeCategory === 'All' && (
        <section className="pt-1">
          <div className="flex items-center gap-2 mb-3">
            <PlayCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-gray-900">Continue Watching</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-8">
            {continueWatchingItems.map(item => (
              <VideoCard key={`cw-${item.video.id}`} video={item.video} progress={item.progress} />
            ))}
          </div>
        </section>
      )}

      {/* 2. Recommended For You Section */}
      {recommended.length > 0 && activeCategory === 'All' && (
        <section className="pt-1">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-gray-900">Recommended For You</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-8">
            {recommended.map(video => (
              <VideoCard key={`rec-${video.id}`} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* 3. Most Watched Section */}
      {mostWatchedItems.length > 0 && activeCategory === 'All' && (
        <section className="pt-1">
          <div className="flex items-center gap-2 mb-3">
            <HistoryIcon className="w-5 h-5 text-red-400" />
            <h2 className="text-base font-bold text-gray-900">Most Rewatched</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-8">
            {mostWatchedItems.map(item => (
              <VideoCard key={`mw-${item.video.id}`} video={item.video} progress={item.progress} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Trending & Category Main Grid */}
      <section className="pt-1">
        <div className="flex items-center gap-2 mb-3">
          {activeCategory === 'All' ? (
            <>
              <Flame className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-bold text-gray-900">Trending Videos</h2>
            </>
          ) : (
            <>
              <Layers className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-bold text-gray-900">{activeCategory} Videos</h2>
            </>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-8">
          {loading ? (
            Array.from({ length: 15 }).map((_, i) => <VideoCardSkeleton key={i} />)
          ) : (
            popular.map(video => (
              <VideoCard key={`pop-${video.id}`} video={video} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}




