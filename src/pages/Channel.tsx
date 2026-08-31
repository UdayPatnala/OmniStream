import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getChannelDetails, getChannelVideos } from '../lib/youtube';
import { Channel as ChannelType, SearchResult } from '../types';
import { useAppStore } from '../store';
import { VideoCard } from '../components/VideoCard';
import { VideoCardSkeleton, Skeleton } from '../components/Skeleton';
import { Users, Video as VideoIcon, Tv, AlertCircle } from 'lucide-react';
import { formatViews } from '../lib/utils';

export function ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const { subscriptions, subscribe, unsubscribe } = useAppStore();

  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [videos, setVideos] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadChannelData() {
      if (!id) return;
      try {
        setLoading(true);
        setError('');
        const details = await getChannelDetails(id);
        setChannel(details);
        const chanVideos = await getChannelVideos(id);
        setVideos(chanVideos);
      } catch (err: any) {
        setError(err.message || 'Failed to load channel details');
      } finally {
        setLoading(false);
      }
    }

    loadChannelData();
  }, [id]);

  const isSubscribed = subscriptions.some(s => s.id === id);

  const toggleSub = () => {
    if (!channel) return;
    if (isSubscribed) unsubscribe(channel.id);
    else subscribe(channel);
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 my-8 bg-red-900/20 text-red-400 rounded-3xl border border-red-500/20 flex items-center gap-3">
        <AlertCircle className="w-6 h-6" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 py-4">
      {/* Banner */}
      <div className="w-full h-48 md:h-64 rounded-3xl bg-utube-surface overflow-hidden relative border border-utube-border shadow-sm">
        {channel?.bannerUrl ? (
          <img src={channel.bannerUrl} alt="banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/10 flex items-center justify-center opacity-70" />
        )}
      </div>

      {/* Header Info */}
      <div className="bg-utube-card rounded-3xl p-6 md:p-8 border border-utube-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          {loading || !channel ? (
            <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full" />
          ) : (
            <img 
              src={channel.thumbnails.high || channel.thumbnails.medium || channel.thumbnails.default} 
              alt={channel.title} 
              className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-utube-border object-cover shadow-sm"
            />
          )}

          <div className="space-y-2">
            {loading || !channel ? (
              <>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-black text-utube-text tracking-tight">{channel.title}</h1>
                <div className="flex items-center gap-4 text-xs md:text-sm text-utube-text-secondary">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-4 h-4 text-utube-primary" />
                    {formatViews(channel.subscriberCount || '0')} subscribers
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <VideoIcon className="w-4 h-4 text-utube-primary" />
                    {formatViews(channel.videoCount || '0')} videos
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {channel && (
          <button
            onClick={toggleSub}
            className={`px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
              isSubscribed
                ? 'bg-utube-surface text-utube-text-secondary hover:bg-utube-border/60 border border-utube-border'
                : 'bg-utube-primary text-white hover:bg-utube-deep'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        )}
      </div>

      {/* Description */}
      {channel?.description && (
        <div className="bg-utube-card rounded-3xl p-6 text-sm border border-utube-border shadow-sm">
          <h3 className="font-bold text-utube-text-muted mb-2 uppercase tracking-widest text-xs">About Channel</h3>
          <p className="text-utube-text-secondary leading-relaxed whitespace-pre-wrap">{channel.description}</p>
        </div>
      )}

      {/* Uploads Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-utube-text-muted">Latest Uploads</h2>
        
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
