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
      <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-md mx-auto text-utube-text">
        <div className="w-20 h-20 bg-utube-surface rounded-full flex items-center justify-center mb-6 border border-utube-border">
          <Tv className="w-8 h-8 text-utube-text-muted" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-utube-text">No Subscriptions Yet</h2>
        <p className="text-utube-text-muted text-sm">
          Subscribe to channels to see their latest videos here. Search for your favorite creators to get started.
        </p>
      </div>
    );
  }

  const selectedChannel = subscriptions.find(s => s.id === selectedChannelId) || subscriptions[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4 font-sans text-utube-text select-none">
      <div>
        <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-utube-text-muted mb-6">Your Subscriptions</h1>
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
                    ? 'bg-utube-primary text-white ring-2 ring-offset-2 ring-utube-primary'
                    : 'bg-utube-card text-utube-text border border-utube-border group-hover:border-utube-primary/40 hover:bg-utube-surface'
                }`}>
                  {initial}
                </div>
                <span className={`text-[11px] text-center line-clamp-1 w-20 font-semibold transition-colors ${
                  isActive ? 'text-utube-primary' : 'text-utube-text-muted group-hover:text-utube-text'
                }`}>
                  {sub.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-utube-border pt-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-utube-text leading-none">{selectedChannel?.title}</h2>
            <p className="text-xs text-utube-text-muted mt-1">Latest uploads from this channel</p>
          </div>
          {selectedChannelId && (
            <Link
              to={`/channel/${selectedChannelId}`}
              className="flex items-center gap-1 text-xs font-bold text-utube-primary hover:underline"
            >
              <span>View Channel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : videos.length === 0 ? (
          <div className="p-8 text-center text-xs text-utube-text-muted bg-utube-surface/50 rounded-2xl border border-utube-border">
            No uploads found for this channel.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
            {videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
