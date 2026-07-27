import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { getPopularVideos } from '../lib/youtube';
import { getRecommendedVideos } from '../lib/recommendations';
import { Video } from '../types';
import { VideoCard } from '../components/VideoCard';
import { VideoCardSkeleton } from '../components/Skeleton';
import { Sparkles, AlertCircle } from 'lucide-react';

export function Home() {
  const history = useAppStore(state => state.history);
  const subscriptions = useAppStore(state => state.subscriptions);
  const collections = useAppStore(state => state.collections);
  
  const [popular, setPopular] = useState<Video[]>([]);
  const [recommended, setRecommended] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHome() {
      try {
        setLoading(true);
        setError('');
        const vids = await getPopularVideos();
        setPopular(vids);
        const recs = getRecommendedVideos(vids, history, subscriptions, collections);
        setRecommended(recs.slice(0, 8));
      } catch (err: any) {
        setError(err.message || 'Application configuration is incomplete.');
      } finally {
        setLoading(false);
      }
    }
    fetchHome();
  }, [history, subscriptions, collections]);

  const historyItems = Object.values(history).sort((a, b) => b.watchedAt - a.watchedAt).slice(0, 4);

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-4">
      {/* Error state if network or configuration fails */}
      {error && (
        <div className="p-4 bg-amber-500/10 text-amber-300 rounded-2xl border border-amber-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Continue Watching */}
      {historyItems.length > 0 && (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99] mb-4">Continue Watching</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {historyItems.map(item => (
              <VideoCard key={item.video.id} video={item.video} progress={item.progress} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended For You */}
      {recommended.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#D0BCFF]" />
            <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99]">Recommended For You</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommended.map(video => (
              <VideoCard key={`rec-${video.id}`} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Now */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99]">Trending Now</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => <VideoCardSkeleton key={i} />)
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


