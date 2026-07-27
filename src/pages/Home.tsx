import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { getPopularVideos, searchVideos } from '../lib/youtube';
import { getRecommendedVideos } from '../lib/recommendations';
import { Video } from '../types';
import { VideoCard } from '../components/VideoCard';
import { VideoCardSkeleton } from '../components/Skeleton';

const CATEGORIES = [
  'All', 'Music', 'Gaming', 'Podcasts', 'React.js', 'Live', 
  'Web Development', 'Gadgets', 'Lo-Fi', 'News', 'Coding', 
  'Pop Music', 'Recently uploaded', 'Watched'
];

export function Home() {
  const history = useAppStore(state => state.history);
  const subscriptions = useAppStore(state => state.subscriptions);
  const collections = useAppStore(state => state.collections);
  
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
          const recs = getRecommendedVideos(vids, history, subscriptions, collections);
          setRecommended(recs.slice(0, 8));
        } else {
          const res = await searchVideos(activeCategory);
          const vids: Video[] = res.results.map(r => ({
            id: r.id,
            title: r.title,
            description: '',
            channelId: r.channelId,
            channelTitle: r.channelTitle,
            publishedAt: r.publishedAt,
            thumbnails: r.thumbnails,
            viewCount: '124000',
            duration: 'PT12M30S'
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
  }, [activeCategory, history, subscriptions, collections]);

  const historyItems = Object.values(history).sort((a, b) => b.watchedAt - a.watchedAt).slice(0, 4);

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* YouTube Category Filter Chips Bar */}
      <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar py-1 pb-2 sticky top-14 bg-[#0f0f0f] z-30">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
              activeCategory === category
                ? 'bg-white text-black font-semibold'
                : 'bg-[#272727] text-[#f1f1f1] hover:bg-[#3f3f3f]'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Continue Watching */}
      {historyItems.length > 0 && activeCategory === 'All' && (
        <section className="pt-2">
          <h2 className="text-base font-bold text-[#f1f1f1] mb-3">Continue Watching</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
            {historyItems.map(item => (
              <VideoCard key={item.video.id} video={item.video} progress={item.progress} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended For You */}
      {recommended.length > 0 && activeCategory === 'All' && (
        <section className="pt-2">
          <h2 className="text-base font-bold text-[#f1f1f1] mb-3">Recommended For You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-8">
            {recommended.map(video => (
              <VideoCard key={`rec-${video.id}`} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Main Video Feed Grid */}
      <section className="pt-2">
        {activeCategory === 'All' && (
          <h2 className="text-base font-bold text-[#f1f1f1] mb-3">Trending Videos</h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 gap-y-8">
          {loading ? (
            Array.from({ length: 15 }).map((_, i) => <VideoCardSkeleton key={i} />)
          ) : (
            popular.map(video => (
              <VideoCard key={video.id} video={video} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}



