import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVideosByIds, getChannelDetails, getRelatedVideos } from '../lib/youtube';
import { generateAISummary, extractVideoScript, askCineMorphAI } from '../lib/cinemorph';
import { Video, Channel, AISummary, VideoScriptChunk, AIChatMessage } from '../types';
import { useAppStore } from '../store';
import { formatViews, formatTimeAgo } from '../lib/utils';
import { ThumbsUp, ThumbsDown, Share2, FolderPlus, Plus, Check, Sparkles, Sun, Maximize2, Send, MessageSquare, FileText, Film, Copy, Gauge } from 'lucide-react';

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

    const aiReplyText = await askCineMorphAI(query, video, chatHistory => chatHistory);
    
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
    <div className="max-w-[1750px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 py-2 select-none">
      {/* Left Column: Player & Metadata (70% width) */}
      <div className="lg:col-span-2 space-y-4">
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

          {/* Action Pills & CineMorph Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Ambient Glow Toggle */}
            <button
              onClick={toggleAmbientGlow}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all border ${
                ambientGlow 
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-lg shadow-indigo-500/20' 
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
              }`}
              title="Toggle Dynamic Backlight Ambient Glow"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Glow {ambientGlow ? 'ON' : 'OFF'}</span>
            </button>

            {/* Cinema Mode Toggle */}
            <button
              onClick={() => setCinemaMode(!cinemaMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all border ${
                cinemaMode 
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500/50' 
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
              }`}
              title="Toggle Cinema Dimming Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Cinema</span>
            </button>

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
                        placeholder="Collection name" 
                        value={newColName} 
                        onChange={(e) => setNewColName(e.target.value)}
                        className="flex-1 bg-[#121218] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                      />
                      <button type="submit" className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold">
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
                          className="w-full flex items-center justify-between p-2 hover:bg-white/10 rounded-xl text-left text-xs text-[#f1f1f1]"
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
          className="bg-[#121218]/90 hover:bg-[#1a1a24] p-4 rounded-2xl cursor-pointer transition-colors text-sm text-[#f1f1f1] space-y-2 border border-white/5 shadow-lg"
        >
          <div className="flex items-center gap-3 font-semibold text-xs text-[#aaaaaa]">
            <span>{video?.viewCount ? `${formatViews(video.viewCount)} views` : '1.4M views'}</span>
            <span>{video?.publishedAt ? formatTimeAgo(video.publishedAt) : '3 days ago'}</span>
            {aiSummary && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                {aiSummary.sentiment}
              </span>
            )}
          </div>
          <p className={`whitespace-pre-wrap leading-relaxed text-xs text-gray-300 ${descExpanded ? '' : 'line-clamp-3'}`}>
            {video?.description || 'No description provided for this video.'}
          </p>
          <span className="text-xs font-bold text-indigo-400 hover:text-indigo-300 inline-block pt-1">
            {descExpanded ? 'Show less' : '...more'}
          </span>
        </div>
      </div>

      {/* Right Column: CineMorph AI Studio & Copilot Panel (30% width) */}
      <div className="space-y-4">
        {/* Studio Workspace Header Tabs */}
        <div className="flex items-center bg-[#121218] p-1 rounded-2xl border border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ai-copilot')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              activeTab === 'ai-copilot'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              activeTab === 'script'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Script</span>
          </button>
          <button
            onClick={() => setActiveTab('related')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              activeTab === 'related'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Up Next</span>
          </button>
        </div>

        {/* Tab 1: AI Copilot Assistant */}
        {activeTab === 'ai-copilot' && (
          <div className="space-y-4">
            {/* AI Executive Summary Card */}
            {aiSummary && (
              <div className="bg-gradient-to-br from-[#161624] to-[#12121a] border border-indigo-500/20 p-4 rounded-2xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <h3 className="font-bold text-sm text-white">AI Executive Summary</h3>
                  </div>
                  <button 
                    onClick={copySummary}
                    className="p-1 text-gray-400 hover:text-white rounded-md transition-colors"
                    title="Copy Summary"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  {aiSummary.executiveSummary}
                </p>
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Key Takeaways</span>
                  {aiSummary.keyTakeaways.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive AI Chat Assistant */}
            <div className="bg-[#121218] border border-white/10 rounded-2xl p-3 space-y-3 flex flex-col h-[340px]">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Ask CineMorph AI</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 hide-scrollbar">
                {chatMessages.map(msg => (
                  <div 
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[85%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-[#1c1c28] text-gray-200 border border-white/10 rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {aiThinking && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400 italic py-1">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" /> CineMorph AI is thinking...
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendAIChat} className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  placeholder="Ask a question about this video..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="flex-1 bg-[#1a1a24] text-xs text-white placeholder-gray-500 rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit" 
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Script & Transcript */}
        {activeTab === 'script' && (
          <div className="bg-[#121218] border border-white/10 rounded-2xl p-4 space-y-3 h-[450px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Interactive Transcript</span>
              <span className="text-[10px] text-indigo-400 font-semibold">Click timestamp to seek</span>
            </div>
            <div className="space-y-3">
              {scriptChunks.map(chunk => (
                <div 
                  key={chunk.id}
                  className="p-3 bg-[#181824] hover:bg-[#202030] rounded-xl border border-white/5 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 font-mono text-[11px] font-bold">
                      {chunk.timestampFormatted}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{chunk.topic}</span>
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed font-sans">{chunk.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Related Videos */}
        {activeTab === 'related' && (
          <div className="space-y-3">
            {related.map(item => (
              <Link 
                key={item.id} 
                to={`/watch/${item.id}`} 
                className="flex gap-3 group cursor-pointer hover:bg-white/5 p-1.5 rounded-xl transition-colors border border-transparent hover:border-white/10"
              >
                <div className="w-36 aspect-video bg-[#272727] rounded-lg overflow-hidden shrink-0 relative shadow-md">
                  <img src={item.thumbnails.medium} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="flex flex-col min-w-0 flex-1 justify-center">
                  <h4 className="text-xs font-semibold line-clamp-2 text-[#f1f1f1] leading-snug group-hover:text-indigo-300">
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
        )}
      </div>
    </div>
  );
}
