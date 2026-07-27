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
      <div className="w-full h-48 md:h-64 rounded-[32px] bg-[#2B2930] overflow-hidden relative border border-white/5 shadow-2xl">
        {channel?.bannerUrl ? (
          <img src={channel.bannerUrl} alt="banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#1C1B1F] via-[#381E72]/40 to-[#1C1B1F] flex items-center justify-center opacity-70" />
        )}
      </div>

      {/* Header Info */}
      <div className="bg-[#1C1B1F] rounded-[32px] p-6 md:p-8 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div className="flex items-center gap-6">
          {loading || !channel ? (
            <Skeleton className="w-24 h-24 rounded-full" />
          ) : (
            <img 
              src={channel.thumbnails.high || channel.thumbnails.medium || channel.thumbnails.default} 
              alt={channel.title} 
              className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-[#D0BCFF] object-cover shadow-lg"
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
                <h1 className="text-2xl md:text-3xl font-bold text-[#E6E1E5] tracking-tight">{channel.title}</h1>
                <div className="flex items-center gap-4 text-xs md:text-sm text-[#938F99]">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#D0BCFF]" />
                    {formatViews(channel.subscriberCount || '0')} subscribers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <VideoIcon className="w-4 h-4 text-[#D0BCFF]" />
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
            className={`px-8 py-3.5 rounded-full font-semibold text-sm transition-all shadow-lg ${
              isSubscribed
                ? 'bg-white/5 text-[#E6E1E5] hover:bg-white/10'
                : 'bg-[#D0BCFF] text-[#381E72] hover:bg-[#EADDFF]'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        )}
      </div>

      {/* Description */}
      {channel?.description && (
        <div className="bg-[#1C1B1F] rounded-[32px] p-6 text-sm border border-white/5">
          <h3 className="font-semibold text-[#E6E1E5] mb-2 uppercase tracking-[0.2em] text-xs text-[#938F99]">About Channel</h3>
          <p className="text-[#CAC4D0] leading-relaxed whitespace-pre-wrap">{channel.description}</p>
        </div>
      )}

      {/* Uploads Grid */}
      <div className="space-y-6">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99]">Latest Uploads</h2>
        
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
