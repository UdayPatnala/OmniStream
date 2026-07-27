import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVideosByIds, getChannelDetails, getRelatedVideos } from '../lib/youtube';
import { Video, Channel } from '../types';
import { useAppStore } from '../store';
import { formatViews, formatTimeAgo } from '../lib/utils';
import { ThumbsUp, ThumbsDown, Share2, FolderPlus, Plus, Check } from 'lucide-react';

export function Watch() {
  const { id } = useParams<{ id: string }>();
  const { activeVideo, setActiveVideo, subscriptions, subscribe, unsubscribe, collections, createCollection, addVideoToCollection } = useAppStore();
  
  const [video, setVideo] = useState<Video | null>(activeVideo?.id === id ? activeVideo : null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [showCreateCol, setShowCreateCol] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    if (!activeVideo || activeVideo.id !== id) {
      setActiveVideo({
        id,
        title: 'Loading video title...',
        description: '',
        channelId: '',
        channelTitle: 'YouTube Creator',
        publishedAt: new Date().toISOString(),
        thumbnails: {
          medium: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
          high: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        }
      });
    }

    async function fetchVideoData() {
      try {
        const videos = await getVideosByIds([id!]);
        if (videos.length > 0) {
          const v = videos[0];
          setVideo(v);
          setActiveVideo(v);
          if (v.channelId) {
            const chan = await getChannelDetails(v.channelId);
            setChannel(chan);
          }
        }
      } catch (err: any) {
        // Safe silent fallback
      }
    }

    async function fetchRelatedData() {
      try {
        const rels = await getRelatedVideos(id!);
        setRelated(rels.filter(r => r.id !== id));
      } catch (e) {}
    }

    fetchVideoData();
    fetchRelatedData();
  }, [id]);

  const isSubscribed = subscriptions.some(s => s.id === video?.channelId);

  const handleToggleSubscribe = () => {
    if (!channel) return;
    if (isSubscribed) {
      unsubscribe(channel.id);
    } else {
      subscribe(channel);
    }
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColName.trim()) {
      createCollection(newColName.trim());
      setNewColName('');
      setShowCreateCol(false);
    }
  };

  return (
    <div className="max-w-[1750px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 py-2">
      {/* Left Column: Player & Metadata (70% width) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Video Title */}
        <h1 className="text-xl font-bold text-[#f1f1f1] leading-snug">
          {video?.title || activeVideo?.title || 'Loading video title...'}
        </h1>

        {/* Channel Row & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 pb-2 border-b border-[#272727]">
          {/* Channel Info */}
          <div className="flex items-center gap-3">
            {video?.channelId ? (
              <Link to={`/channel/${video.channelId}`} className="w-10 h-10 rounded-full overflow-hidden bg-[#272727] shrink-0">
                <img 
                  src={channel?.thumbnails?.medium || video?.thumbnails?.medium} 
                  alt={video?.channelTitle} 
                  className="w-full h-full object-cover" 
                />
              </Link>
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#272727] shrink-0" />
            )}
            
            <div className="flex flex-col">
              {video?.channelId ? (
                <Link to={`/channel/${video.channelId}`} className="font-bold text-sm text-[#f1f1f1] hover:underline truncate max-w-[200px]">
                  {video?.channelTitle}
                </Link>
              ) : (
                <span className="font-bold text-sm text-[#f1f1f1]">
                  {video?.channelTitle || 'YouTube Creator'}
                </span>
              )}
              <span className="text-xs text-[#aaaaaa]">
                {channel?.subscriberCount ? `${formatViews(channel.subscriberCount)} subscribers` : '1.2M subscribers'}
              </span>
            </div>

            {channel && (
              <button 
                onClick={handleToggleSubscribe}
                className={`ml-4 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  isSubscribed 
                    ? 'bg-[#272727] text-white hover:bg-[#3f3f3f]' 
                    : 'bg-white text-black hover:bg-[#d9d9d9]'
                }`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>

          {/* Action Pills: Like/Dislike, Share, Save */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#272727] rounded-full overflow-hidden">
              <button 
                onClick={() => setLiked(!liked)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-[#3f3f3f] transition-colors border-r border-[#383838] ${liked ? 'text-blue-400' : 'text-[#f1f1f1]'}`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{liked ? '125K' : '124K'}</span>
              </button>
              <button className="px-3 py-2 text-[#f1f1f1] hover:bg-[#3f3f3f] transition-colors">
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] text-[#f1f1f1] rounded-full text-sm font-medium transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>

            {/* Save to Collection Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowSaveMenu(!showSaveMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] text-[#f1f1f1] rounded-full text-sm font-medium transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Save</span>
              </button>

              {showSaveMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#212121] border border-[#383838] rounded-2xl shadow-2xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#383838]">
                    <span className="text-xs font-semibold uppercase text-[#aaaaaa]">Save to Collection</span>
                    <button 
                      onClick={() => setShowCreateCol(!showCreateCol)}
                      className="p-1 hover:bg-[#383838] rounded-full text-white"
                      title="New Collection"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {showCreateCol && (
                    <form onSubmit={handleCreateCollection} className="mb-3 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Collection name" 
                        value={newColName} 
                        onChange={(e) => setNewColName(e.target.value)}
                        className="flex-1 bg-[#121212] border border-[#383838] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                      />
                      <button type="submit" className="bg-white text-black px-2.5 py-1 rounded-lg text-xs font-semibold">
                        Add
                      </button>
                    </form>
                  )}

                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {collections.map(col => {
                      const inCol = video ? col.videos.some(v => v.id === video.id) : false;
                      return (
                        <button
                          key={col.id}
                          onClick={() => video && addVideoToCollection(col.id, video)}
                          className="w-full flex items-center justify-between p-2 hover:bg-[#383838] rounded-xl text-left text-sm text-[#f1f1f1]"
                        >
                          <span>{col.name}</span>
                          {inCol && <Check className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expandable YouTube Description Box */}
        <div 
          onClick={() => setDescExpanded(!descExpanded)}
          className="bg-[#272727] hover:bg-[#323232] p-4 rounded-2xl cursor-pointer transition-colors text-sm text-[#f1f1f1] space-y-2"
        >
          <div className="flex items-center gap-3 font-semibold text-xs text-[#aaaaaa]">
            <span>{video?.viewCount ? `${formatViews(video.viewCount)} views` : '1.4M views'}</span>
            <span>{video?.publishedAt ? formatTimeAgo(video.publishedAt) : '3 days ago'}</span>
          </div>
          <p className={`whitespace-pre-wrap leading-relaxed ${descExpanded ? '' : 'line-clamp-3'}`}>
            {video?.description || 'No description provided for this video.'}
          </p>
          <span className="text-xs font-bold text-[#aaaaaa] hover:text-white inline-block pt-1">
            {descExpanded ? 'Show less' : '...more'}
          </span>
        </div>
      </div>

      {/* Right Column: Related Videos List (30% width) */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-[#f1f1f1] mb-2">Related Videos</h3>
        <div className="space-y-3">
          {related.map(item => (
            <Link 
              key={item.id} 
              to={`/watch/${item.id}`} 
              className="flex gap-3 group cursor-pointer hover:bg-[#272727]/40 p-1.5 rounded-xl transition-colors"
            >
              <div className="w-40 aspect-video bg-[#272727] rounded-lg overflow-hidden shrink-0 relative">
                <img src={item.thumbnails.medium} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h4 className="text-xs font-semibold line-clamp-2 text-[#f1f1f1] leading-snug group-hover:text-white">
                  {item.title}
                </h4>
                <span className="text-[11px] text-[#aaaaaa] mt-1 truncate">
                  {item.channelTitle}
                </span>
                <span className="text-[11px] text-[#aaaaaa] mt-0.5">
                  {item.viewCount ? `${formatViews(item.viewCount)} views` : '245K views'} • {formatTimeAgo(item.publishedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
