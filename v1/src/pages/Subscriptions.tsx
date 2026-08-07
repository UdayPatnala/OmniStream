import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { getChannelVideos } from '../lib/youtube';
import { SearchResult } from '../types';
import { VideoCard } from '../components/VideoCard';
import { VideoCardSkeleton } from '../components/Skeleton';
import { Tv, AlertCircle } from 'lucide-react';

export function Subscriptions() {
  const { subscriptions } = useAppStore();
  const [videos, setVideos] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLatestVideos() {
      if (subscriptions.length === 0) return;
      
      try {
        setLoading(true);
        setError('');
        
        const sampleSubs = subscriptions.slice(0, 8);
        const results = await Promise.allSettled(
          sampleSubs.map(sub => getChannelVideos(sub.id))
        );

        const allVids: SearchResult[] = [];
        results.forEach(res => {
          if (res.status === 'fulfilled') {
            allVids.push(...res.value);
          }
        });
        
        allVids.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        
        setVideos(allVids);
      } catch (err: any) {
        setError(err.message || 'Application configuration is incomplete.');
      } finally {
        setLoading(false);
      }
    }

    fetchLatestVideos();
  }, [subscriptions]);

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <Tv className="w-8 h-8 text-[#938F99]" />
        </div>
        <h2 className="text-xl font-medium mb-2 text-[#E6E1E5]">No Subscriptions Yet</h2>
        <p className="text-[#938F99]">
          Subscribe to channels to see their latest videos here. Search for your favorite creators to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto py-4">
      <div>
        <h1 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99] mb-6">Your Subscriptions</h1>
        <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
          {subscriptions.map(sub => (
            <Link key={sub.id} to={`/channel/${sub.id}`} className="flex flex-col items-center gap-3 min-w-[80px] group cursor-pointer">
              <div className="w-20 h-20 rounded-[24px] overflow-hidden border border-white/10 bg-[#2B2930] shadow-lg group-hover:ring-2 group-hover:ring-[#D0BCFF] transition-all">
                <img src={sub.thumbnails.medium || sub.thumbnails.default} alt={sub.title} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs text-center line-clamp-1 w-20 text-[#E6E1E5] font-medium group-hover:text-[#D0BCFF] transition-colors">{sub.title}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99] mb-6">Latest Uploads</h2>
        
        {error && (
          <div className="p-4 bg-red-900/20 text-red-400 rounded-2xl border border-red-500/20 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)
          ) : (
            videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
