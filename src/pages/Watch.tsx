import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { getVideosByIds, getChannelDetails, getRelatedVideos } from '../lib/youtube';
import { Video, Channel } from '../types';
import { formatViews, formatTimeAgo } from '../lib/utils';
import { Check, Save, Plus } from 'lucide-react';
import { Skeleton, VideoCardSkeleton } from '../components/Skeleton';
import { VideoCard } from '../components/VideoCard';

export function Watch() {
  const { id } = useParams<{ id: string }>();
  const apiKey = useAppStore(state => state.apiKey);
  const { subscriptions, subscribe, unsubscribe, collections, createCollection, addVideoToCollection, setActiveVideo, activeVideo } = useAppStore();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [error, setError] = useState('');
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [showCreateCol, setShowCreateCol] = useState(false);

  useEffect(() => {
    async function fetchVideoData() {
      if (!id || !apiKey) return;
      try {
        setLoading(true);
        setError('');
        const videos = await getVideosByIds([id], apiKey);
        if (videos.length > 0) {
          const v = videos[0];
          setVideo(v);
          setActiveVideo(v);
          const chan = await getChannelDetails(v.channelId, apiKey);
          setChannel(chan);
        } else {
          setError('Video not found, region-restricted, or private.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchRelatedData() {
      if (!id || !apiKey) return;
      try {
        setLoadingRelated(true);
        const rels = await getRelatedVideos(id, apiKey);
        setRelated(rels.filter(r => r.id !== id));
      } catch (e) {
        // Silently handle related error
      } finally {
        setLoadingRelated(false);
      }
    }

    fetchVideoData();
    fetchRelatedData();
  }, [id, apiKey, setActiveVideo]);

  const isSubscribed = subscriptions.some(s => s.id === video?.channelId);

  const toggleSubscription = () => {
    if (!channel) return;
    if (isSubscribed) unsubscribe(channel.id);
    else subscribe(channel);
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColName.trim() && video) {
      createCollection(newColName.trim());
      // find newly created collection or add after timeout
      setTimeout(() => {
        const freshState = useAppStore.getState();
        const created = freshState.collections.find(c => c.name === newColName.trim());
        if (created) {
          freshState.addVideoToCollection(created.id, video);
        }
      }, 50);
      setNewColName('');
      setShowCreateCol(false);
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-red-900/20 text-red-400 rounded-3xl border border-red-500/20">
        <p className="font-semibold text-lg mb-2">Video Unavailable</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pb-12 pt-4">
      {/* Primary Content (Main Video Info) */}
      <div className="flex-1 space-y-6 min-w-0">
        {loading || !video ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-xl md:text-2xl font-semibold text-[#E6E1E5]">{video.title}</h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Channel Info */}
              <div className="flex items-center gap-4">
                <Link to={`/channel/${video.channelId}`} className="flex items-center gap-4 group">
                  {channel ? (
                    <img src={channel.thumbnails.default} alt={channel.title} className="w-12 h-12 rounded-full border border-white/5 object-cover group-hover:ring-2 group-hover:ring-[#D0BCFF] transition-all" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2B2930]" />
                  )}
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-sm md:text-base leading-tight text-[#E6E1E5] group-hover:text-[#D0BCFF] transition-colors">{video.channelTitle}</h3>
                    {channel && (
                      <p className="text-xs text-[#938F99]">
                        {parseInt(channel.subscriberCount || '0').toLocaleString()} subscribers
                      </p>
                    )}
                  </div>
                </Link>
                
                <button 
                  onClick={toggleSubscription}
                  className={`ml-4 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    isSubscribed 
                      ? 'bg-white/5 text-[#E6E1E5] hover:bg-white/10' 
                      : 'bg-[#D0BCFF] text-[#381E72] hover:bg-[#EADDFF]'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 relative">
                <button 
                  onClick={() => setShowSaveMenu(!showSaveMenu)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium transition-colors text-[#E6E1E5]"
                >
                  <Save className="w-4 h-4 text-[#D0BCFF]" />
                  Save
                </button>
                
                {/* Save Menu Dropdown */}
                {showSaveMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-[#1C1B1F] rounded-2xl shadow-2xl border border-white/5 overflow-hidden z-50 py-2">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                      <h4 className="text-xs font-medium text-[#938F99] uppercase tracking-[0.2em]">Save to...</h4>
                      <button 
                        onClick={() => setShowCreateCol(!showCreateCol)}
                        className="p-1 text-[#D0BCFF] hover:bg-white/5 rounded-full"
                        aria-label="New collection"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {showCreateCol && (
                      <form onSubmit={handleCreateCollection} className="p-3 flex gap-2 border-b border-white/5">
                        <input
                          type="text"
                          placeholder="New collection..."
                          value={newColName}
                          onChange={(e) => setNewColName(e.target.value)}
                          className="flex-1 bg-[#2B2930] text-xs px-3 py-1.5 rounded-lg text-[#E6E1E5] focus:outline-none border border-white/5"
                          autoFocus
                        />
                        <button type="submit" className="px-3 py-1.5 bg-[#D0BCFF] text-[#381E72] font-semibold text-xs rounded-lg">
                          Add
                        </button>
                      </form>
                    )}

                    <div className="max-h-64 overflow-y-auto">
                      {collections.map(col => {
                        const inCollection = col.videos.some(v => v.id === video.id);
                        return (
                          <button 
                            key={col.id}
                            onClick={() => {
                              if (!inCollection) addVideoToCollection(col.id, video);
                              setShowSaveMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left text-sm text-[#E6E1E5]"
                          >
                            <div className={`w-4 h-4 rounded-[4px] border ${inCollection ? 'bg-[#D0BCFF] border-[#D0BCFF] flex items-center justify-center' : 'border-[#938F99]'}`}>
                              {inCollection && <Check className="w-3 h-3 text-[#381E72]" />}
                            </div>
                            <span className="truncate">{col.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description Box */}
            <div className="bg-[#1C1B1F] rounded-[32px] p-6 text-sm border border-white/5">
              <div className="font-semibold mb-2 text-[#E6E1E5]">
                {formatViews(video.viewCount)} • {formatTimeAgo(video.publishedAt)}
              </div>
              <p className="whitespace-pre-wrap break-words text-[#CAC4D0] leading-relaxed">{video.description}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Sidebar for Related Videos */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99]">Related Videos</h2>
        <div className="flex flex-col gap-4">
          {loadingRelated ? (
            Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)
          ) : (
            related.map(relVideo => (
              <VideoCard key={relVideo.id} video={relVideo} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

