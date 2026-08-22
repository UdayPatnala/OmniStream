import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVideosByIds, getChannelDetails, getRelatedVideos } from '../lib/youtube';
import { generateAISummary, extractVideoScript, askCineMorphAI } from '../lib/cinemorph';
import { Video, Channel, AISummary, VideoScriptChunk, AIChatMessage } from '../types';
import { useAppStore } from '../store';
import { formatViews, formatTimeAgo } from '../lib/utils';
import { ThumbsUp, ThumbsDown, Share2, FolderPlus, Plus, Check, Sparkles, Sun, Maximize2, Send, MessageSquare, FileText, Film, Copy, Gauge } from 'lucide-react';
import { CineMorphTopBar } from '../components/CineMorphTopBar';
import { CineMorphAudioStudioModal } from '../components/CineMorphAudioStudioModal';
import { CineMorphAIStudio } from '../components/CineMorphAIStudio';

export function Watch() {
  const { id } = useParams<{ id: string }>();
  const { 
    activeVideo, 
    setActiveVideo, 
    subscriptions, 
    subscribe, 
    unsubscribe, 
    collections, 
    createCollection, 
    addVideoToCollection,
    ambientGlow,
    toggleAmbientGlow,
    cinemaMode,
    setCinemaMode,
    playbackSpeed,
    setPlaybackSpeed
  } = useAppStore();
  
  const [video, setVideo] = useState<Video | null>(activeVideo?.id === id ? activeVideo : null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [showCreateCol, setShowCreateCol] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  // CineMorph AI Studio States
  const [activeTab, setActiveTab] = useState<'ai-copilot' | 'script' | 'related'>('ai-copilot');
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [scriptChunks, setScriptChunks] = useState<VideoScriptChunk[]>([]);
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [aiThinking, setAiThinking] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const initialVideoObj: Video = {
      id,
      title: activeVideo?.id === id ? activeVideo.title : 'Loading video...',
      description: activeVideo?.id === id ? activeVideo.description : 'Streaming live in CineMorph AI.',
      channelId: activeVideo?.channelId || '',
      channelTitle: activeVideo?.channelTitle || 'YouTube Creator',
      publishedAt: activeVideo?.publishedAt || new Date().toISOString(),
      thumbnails: {
        medium: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        high: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      }
    };

    setVideo(initialVideoObj);
    if (!activeVideo || activeVideo.id !== id) {
      setActiveVideo(initialVideoObj);
    }

    async function fetchVideoData() {
      try {
        const videos = await getVideosByIds([id!]);
        if (videos.length > 0) {
          const v = videos[0];
          setVideo(v);
          setActiveVideo(v);
          setAiSummary(generateAISummary(v));
          setScriptChunks(extractVideoScript(v));
          setChatMessages([
            {
              id: 'init-1',
              sender: 'assistant',
              text: `✨ Hello! I am **CineMorph AI**. Ask me anything about "${v.title}" or click any transcript timestamp to jump to that moment!`,
              timestamp: Date.now()
            }
          ]);
          if (v.channelId) {
            const chan = await getChannelDetails(v.channelId);
            setChannel(chan);
          }
        }
      } catch (err: any) {
        // Silent fallback
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

  const handleSendAIChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || !video) return;

    const query = userQuery.trim();
    setUserQuery('');
    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setAiThinking(true);

    const aiReplyText = await askCineMorphAI(query, video, chatMessages);
    
    setAiThinking(false);
    setChatMessages(prev => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: aiReplyText,
        timestamp: Date.now()
      }
    ]);
  };
  const copySummary = () => {
    if (!aiSummary) return;
    navigator.clipboard.writeText(`${aiSummary.executiveSummary}\n\nKey Takeaways:\n${aiSummary.keyTakeaways.join('\n')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[1750px] mx-auto space-y-4 py-2 select-none">
      {/* CineMorph Top Control Toolbar */}
      <CineMorphTopBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Player Metadata & Details (70% width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Video Player Container */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl group">
            {ambientGlow && (
              <div 
                className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl pointer-events-none -z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-500" 
              />
            )}
            <iframe
              id="watch-youtube-player"
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&rel=0&playsinline=1`}
              title={video?.title || 'YouTube Video Player'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>

          {/* Video Title */}
          <h1 className="text-xl md:text-2xl font-black text-[#f1f1f1] leading-snug tracking-tight">
            {video?.title || activeVideo?.title || 'Loading video title...'}
          </h1>

          {/* Channel Row & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1 pb-3 border-b border-white/10">
            {/* Channel Info */}
            <div className="flex items-center gap-3">
              {video?.channelId ? (
                <Link to={`/channel/${video.channelId}`} className="w-10 h-10 rounded-full overflow-hidden bg-[#272727] shrink-0 ring-2 ring-indigo-500/40">
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
                  className={`ml-4 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md ${
                    isSubscribed 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              )}
            </div>

            {/* Action Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Playback Speed Selector */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-indigo-300 gap-1">
                <Gauge className="w-3.5 h-3.5" />
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="bg-transparent focus:outline-none cursor-pointer font-semibold"
                >
                  <option value={0.5} className="bg-[#121218]">0.5x</option>
                  <option value={0.75} className="bg-[#121218]">0.75x</option>
                  <option value={1.0} className="bg-[#121218]">1.0x (Normal)</option>
                  <option value={1.25} className="bg-[#121218]">1.25x</option>
                  <option value={1.5} className="bg-[#121218]">1.5x</option>
                  <option value={2.0} className="bg-[#121218]">2.0x</option>
                </select>
              </div>

              {/* Like/Dislike */}
              <div className="flex items-center bg-white/5 rounded-full overflow-hidden border border-white/10">
                <button 
                  onClick={() => setLiked(!liked)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium hover:bg-white/10 transition-colors border-r border-white/10 ${liked ? 'text-indigo-400' : 'text-[#f1f1f1]'}`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{liked ? '125K' : '124K'}</span>
                </button>
                <button className="px-3 py-1.5 text-[#f1f1f1] hover:bg-white/10 transition-colors">
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Save to Collection */}
              <div className="relative">
                <button 
                  onClick={() => setShowSaveMenu(!showSaveMenu)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[#f1f1f1] rounded-full text-xs font-medium transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>

                {showSaveMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#161622] border border-white/10 rounded-2xl shadow-2xl p-3 z-50">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                      <span className="text-xs font-semibold uppercase text-gray-400">Save to Collection</span>
                      <button 
                        onClick={() => setShowCreateCol(!showCreateCol)}
                        className="p-1 hover:bg-white/10 rounded-full text-white"
                        title="New Collection"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {showCreateCol && (
                      <form onSubmit={handleCreateCollection} className="mb-3 flex gap-2">
                        <input 
                          type="text"
                          placeholder="Collection name..."
                          value={newColName}
                          onChange={(e) => setNewColName(e.target.value)}
                          className="flex-1 bg-[#0f0d14] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none"
                        />
                        <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
                          Add
                        </button>
                      </form>
                    )}

                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {collections.map(col => {
                        const inCol = col.videos.some(v => v.id === video?.id);
                        return (
                          <button
                            key={col.id}
                            onClick={() => video && addVideoToCollection(col.id, video)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs flex items-center justify-between text-gray-200"
                          >
                            <span>{col.name}</span>
                            {inCol && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Box */}
          <div 
            onClick={() => setDescExpanded(!descExpanded)}
            className="bg-[#181824] hover:bg-[#1f1f2e] p-4 rounded-2xl border border-white/10 transition-colors cursor-pointer space-y-2"
          >
            <div className="flex items-center gap-3 text-xs font-bold text-gray-300">
              <span>{video?.viewCount ? `${formatViews(video.viewCount)} views` : '1.4M views'}</span>
              <span>{formatTimeAgo(video?.publishedAt)}</span>
            </div>
            <p className={`whitespace-pre-wrap leading-relaxed text-xs text-gray-300 ${descExpanded ? '' : 'line-clamp-3'}`}>
              {video?.description || 'No description provided for this video.'}
            </p>
            <span className="text-xs font-bold text-indigo-400 hover:text-indigo-300 inline-block pt-1">
              {descExpanded ? 'Show less' : '...more'}
            </span>
          </div>
        </div>

        {/* Right Column: CineMorph AI Studio */}
        <div className="h-full">
          {video && (
            <CineMorphAIStudio
              video={video}
              aiSummary={aiSummary}
              scriptChunks={scriptChunks}
              onSeekTo={(sec) => {
                const iframe = document.querySelector('iframe');
                if (iframe) {
                  iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [sec, true] }), '*');
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Audio Studio Equalizer Modal */}
      <CineMorphAudioStudioModal />
    </div>
  );
}
