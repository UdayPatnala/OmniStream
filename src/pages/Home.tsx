import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { getPopularVideos } from '../lib/youtube';
import { getRecommendedVideos } from '../lib/recommendations';
import { Video } from '../types';
import { VideoCard } from '../components/VideoCard';
import { VideoCardSkeleton } from '../components/Skeleton';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Home() {
  const apiKey = useAppStore(state => state.apiKey);
  const history = useAppStore(state => state.history);
  const subscriptions = useAppStore(state => state.subscriptions);
  const collections = useAppStore(state => state.collections);
  
  const [popular, setPopular] = useState<Video[]>([]);
  const [recommended, setRecommended] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHome() {
      if (!apiKey) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const vids = await getPopularVideos(apiKey);
        setPopular(vids);
        const recs = getRecommendedVideos(vids, history, subscriptions, collections);
        setRecommended(recs.slice(0, 8));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHome();
  }, [apiKey, history, subscriptions, collections]);

  const historyItems = Object.values(history).sort((a, b) => b.watchedAt - a.watchedAt).slice(0, 4);

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-gradient-to-br from-[#D0BCFF] to-[#4F378B] rounded-[2rem] flex items-center justify-center shadow-2xl mb-8">
          <span className="text-[#381E72] font-black text-6xl italic tracking-tighter pr-2">U</span>
        </div>
        <h2 className="text-3xl font-bold mb-4 tracking-tight">Welcome to U Tube</h2>
        <p className="text-[#938F99] mb-8 text-lg">
          Your clean, distraction-free personal YouTube video client. Provide your YouTube Data API v3 key in Settings to get started.
        </p>
        <Link to="/settings" className="px-8 py-3.5 bg-[#D0BCFF] hover:bg-[#EADDFF] text-[#381E72] font-semibold rounded-full transition-colors shadow-lg">
          Configure API Key
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-4">
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
        {error ? (
          <div className="p-4 bg-red-900/20 text-red-400 rounded-2xl border border-red-500/20">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 12 }).map((_, i) => <VideoCardSkeleton key={i} />)
            ) : (
              popular.map(video => (
                <VideoCard key={video.id} video={video} />
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

