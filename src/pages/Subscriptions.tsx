import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { getChannelVideos } from '../lib/youtube';
import { SearchResult } from '../types';
import { VideoCard } from '../components/VideoCard';
import { VideoCardSkeleton } from '../components/Skeleton';
import { Tv, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Subscriptions() {
  const { subscriptions } = useAppStore();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [videos, setVideos] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-select first channel on load if none selected
  useEffect(() => {
    if (subscriptions.length > 0 && !selectedChannelId) {
      setSelectedChannelId(subscriptions[0].id);
    }
  }, [subscriptions, selectedChannelId]);

  // Fetch videos for the selected channel
  useEffect(() => {
    if (!selectedChannelId) return;

    async function fetchLatestVideos() {
      try {
        setLoading(true);
        setError('');
        const chanVideos = await getChannelVideos(selectedChannelId);
        // Ensure we only have valid videos with IDs
        setVideos(chanVideos.filter(v => v.id));
      } catch (err: any) {
        setError(err.message || 'Failed to load videos for this channel.');
      } finally {
        setLoading(false);
      }
    }

    fetchLatestVideos();
  }, [selectedChannelId]);

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 border border-slate-200">
          <Tv className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-slate-800">No Subscriptions Yet</h2>
        <p className="text-slate-500 text-sm">
          Subscribe to channels to see their latest videos here. Search for your favorite creators to get started.
        </p>
      </div>
    );
  }

  const selectedChannel = subscriptions.find(s => s.id === selectedChannelId) || subscriptions[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4 font-sans">
      <div>
        <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Your Subscriptions</h1>
        <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar">
          {subscriptions.map(sub => {
            const initial = sub.title ? sub.title.charAt(0).toUpperCase() : 'C';
            const isActive = selectedChannelId === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedChannelId(sub.id)}
                className="flex flex-col items-center gap-2.5 min-w-[76px] group cursor-pointer focus:outline-none"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold transition-all shadow-sm ${
                  isActive
                    ? 'bg-[#B83A4B] text-white ring-2 ring-offset-2 ring-[#B83A4B]'
                    : 'bg-white text-slate-700 border border-slate-200 group-hover:border-slate-350 hover:bg-slate-50'
                }`}>
                  {initial}
                </div>
                <span className={`text-[11px] text-center line-clamp-1 w-20 font-semibold transition-colors ${
                  isActive ? 'text-[#B83A4B]' : 'text-slate-500 group-hover:text-slate-800'
                }`}>
                  {sub.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200/80 pt-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-none">{selectedChannel?.title}</h2>
            <p className="text-xs text-slate-500 mt-1">Latest uploads from this channel</p>
          </div>
          {selectedChannelId && (
            <Link
              to={`/channel/${selectedChannelId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors border border-slate-200"
            >
              <span>View Channel Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)
          ) : videos.length > 0 ? (
            videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm font-medium">
              No videos found for this channel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
