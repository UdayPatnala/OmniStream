import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ThumbsUp,
  Share2,
  FolderPlus,
  Check,
  Film,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Bell,
  BellOff,
} from 'lucide-react';
import { getVideosByIds, getChannelDetails, getRelatedVideos } from '../lib/youtube';
import { Video, Channel } from '../types';
import { useAppStore } from '../store';
import { useTicketStore } from '../state/useTicketStore';
import { formatViews, formatTimeAgo } from '../lib/utils';
import { UTubePlayer } from '../components/player/UTubePlayer';

export function Watch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    activeVideo,
    setActiveVideo,
    subscriptions,
    subscribe,
    unsubscribe,
    collections,
    createCollection,
    addVideoToCollection,
    toggleLikeVideo,
    isLikedVideo,
    addToWatchLater,
    isInWatchLater,
  } = useAppStore();

  const [video, setVideo] = useState<Video | null>(activeVideo?.id === id ? activeVideo : null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [showCreateCol, setShowCreateCol] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theaterLayout, setTheaterLayout] = useState(false);

  // Initial playback time transferred from CineMorph or history
  const initialStartTime = (location.state as any)?.startTime || 0;

  useEffect(() => {
    if (!id) return;

    // Set a minimal stub so the player can start immediately
    const stub: Video = {
      id,
      title: activeVideo?.id === id ? activeVideo.title : 'Loading...',
      description: activeVideo?.id === id ? activeVideo.description : '',
      channelId: activeVideo?.channelId || '',
      channelTitle: activeVideo?.channelTitle || '',
      publishedAt: activeVideo?.publishedAt || new Date().toISOString(),
      thumbnails: {
        medium: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        high: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      },
    };

    setVideo(stub);
    if (!activeVideo || activeVideo.id !== id) setActiveVideo(stub);

    // Fetch real metadata in background
    (async () => {
      try {
        const videos = await getVideosByIds([id]);
        if (videos.length > 0) {
          const v = videos[0];
          setVideo(v);
          setActiveVideo(v);
          if (v.channelId) {
            const chan = await getChannelDetails(v.channelId);
            setChannel(chan);
          }
        }
      } catch (_) {}
    })();

    // Fetch related videos
    (async () => {
      try {
        const rels = await getRelatedVideos(id);
        setRelated(rels.filter(r => r.id !== id));
      } catch (_) {}
    })();
  }, [id]);

  const isSubscribed = subscriptions.some(s => s.id === video?.channelId);
  const isLiked = video ? isLikedVideo(video.id) : false;
  const inWatchLater = video ? isInWatchLater(video.id) : false;

  const handleToggleSubscribe = () => {
    if (!video?.channelId) return;
    if (isSubscribed) {
      unsubscribe(video.channelId);
    } else {
      // Save channel — use real data from API if available, else minimal stub
      const chanToSub: Channel = channel || {
        id: video.channelId,
        title: video.channelTitle,
        description: '',
        thumbnails: {
          default: video.thumbnails.medium,
          medium: video.thumbnails.medium,
          high: video.thumbnails.high,
        },
      };
      subscribe(chanToSub);
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColName.trim()) {
      createCollection(newColName.trim());
      setNewColName('');
      setShowCreateCol(false);
    }
  };

  const handleOpenInCineMorph = () => {
    if (!video) return;
    useTicketStore.getState().saveTicketProgress({
      movieTitle: video.title,
      sourceUrl: video.id,
      isLocal: false,
      timestampSeconds: 0,
      durationSeconds: 600,
      aspectRatio: '1.90:1',
      framingRule: 'auto',
    });
    navigate(`/theater/${video.id}`);
  };

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1700px] mx-auto pb-12 font-sans select-none">
      <div className={`grid gap-6 ${theaterLayout ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>

        {/* ── Main: Player + Metadata ── */}
        <div className={`${theaterLayout ? 'w-full max-w-6xl mx-auto' : 'lg:col-span-2'} space-y-4`}>

          {/* U-Tube Dedicated Player */}
          <UTubePlayer
            video={video}
            initialTime={initialStartTime}
            theaterMode={theaterLayout}
            onToggleTheaterMode={() => setTheaterLayout(t => !t)}
            onNext={() => related.length > 0 && navigate(`/watch/${related[0].id}`)}
          />

          {/* Title */}
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug tracking-tight">
            {video.title}
          </h1>

          {/* Channel row + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">

            {/* Channel info & Subscribe */}
            <div className="flex items-center gap-3">
              <Link
                to={video.channelId ? `/channel/${video.channelId}` : '#'}
                className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200 hover:opacity-90 transition-opacity"
              >
                {channel?.thumbnails?.medium
                  ? <img src={channel.thumbnails.medium} alt={video.channelTitle} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold text-sm">
                      {video.channelTitle?.[0]?.toUpperCase() || 'C'}
                    </div>
                }
              </Link>

              <div>
                <Link
                  to={video.channelId ? `/channel/${video.channelId}` : '#'}
                  className="font-bold text-sm text-slate-900 hover:underline block truncate max-w-[180px]"
                >
                  {video.channelTitle}
                </Link>
                {channel?.subscriberCount && (
                  <span className="text-xs text-slate-500">{formatViews(channel.subscriberCount)} subscribers</span>
                )}
              </div>

              <button
                onClick={handleToggleSubscribe}
                className={`ml-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSubscribed
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-slate-900 text-white hover:bg-slate-700'
                }`}
              >
                {isSubscribed ? (
                  <span className="flex items-center gap-1.5">
                    <BellOff className="w-3.5 h-3.5" />Subscribed
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />Subscribe
                  </span>
                )}
              </button>
            </div>

            {/* Action pills */}
            <div className="flex items-center gap-2 flex-wrap">

              {/* Like */}
              <button
                onClick={() => toggleLikeVideo(video)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  isLiked
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-600 text-red-600' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </button>

              {/* Share */}
              <button
                onClick={handleCopyShare}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Share'}
              </button>

              {/* Watch Later */}
              <button
                onClick={() => { if (!inWatchLater) addToWatchLater(video); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                  inWatchLater
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${inWatchLater ? 'fill-amber-600 text-amber-600' : ''}`} />
                <span className="hidden sm:inline">{inWatchLater ? 'Saved' : 'Watch Later'}</span>
              </button>

              {/* Save to Collection */}
              <div className="relative">
                <button
                  onClick={() => setShowSaveMenu(s => !s)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </button>

                {showSaveMenu && (
                  <div className="absolute right-0 top-10 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="font-bold text-slate-900 pb-1.5 border-b border-slate-100 text-[11px] uppercase tracking-widest">Save to...</div>
                    <div className="max-h-44 overflow-y-auto space-y-0.5">
                      {collections.map(col => (
                        <button
                          key={col.id}
                          onClick={() => { addVideoToCollection(col.id, video); setShowSaveMenu(false); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="truncate text-slate-700">{col.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">{col.videos.length}</span>
                        </button>
                      ))}
                    </div>
                    {showCreateCol ? (
                      <form onSubmit={handleCreateCollection} className="pt-2 border-t border-slate-100 space-y-1.5">
                        <input
                          type="text"
                          placeholder="Collection name"
                          value={newColName}
                          onChange={e => setNewColName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-500"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => setShowCreateCol(false)} className="px-2 py-1 text-slate-500">Cancel</button>
                          <button type="submit" className="px-3 py-1 bg-slate-900 text-white font-bold rounded-lg">Create</button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowCreateCol(true)}
                        className="w-full text-left px-2 py-1.5 text-slate-900 font-bold hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        + New collection
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Open in CineMorph */}
              <button
                onClick={handleOpenInCineMorph}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black tracking-wide shadow-sm transition-all hover:scale-105 cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Open in CineMorph</span>
              </button>
            </div>
          </div>

          {/* Description */}
          {video.description && (
            <div
              onClick={() => setDescExpanded(e => !e)}
              className="rounded-xl bg-slate-100 hover:bg-slate-150 p-3.5 transition-colors cursor-pointer text-xs text-slate-700 space-y-1.5"
            >
              <div className="flex items-center gap-2 font-semibold text-slate-500 text-[11px]">
                <span>{video.publishedAt ? formatTimeAgo(video.publishedAt) : ''}</span>
              </div>
              <p className={`whitespace-pre-line leading-relaxed ${descExpanded ? '' : 'line-clamp-3'}`}>
                {video.description}
              </p>
              <button className="text-xs font-bold text-slate-600 flex items-center gap-1 pt-0.5">
                {descExpanded
                  ? <><span>Show less</span><ChevronUp className="w-3 h-3" /></>
                  : <><span>Show more</span><ChevronDown className="w-3 h-3" /></>
                }
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Related Videos ── */}
        {!theaterLayout && (
          <div className="space-y-2 pt-0.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pb-1">
              Related
            </h3>
            {related.slice(0, 12).map(rel => (
              <Link
                key={rel.id}
                to={`/watch/${rel.id}`}
                className="flex gap-2.5 group hover:bg-slate-100 p-1.5 rounded-xl transition-colors"
              >
                <div className="relative w-36 aspect-video rounded-lg bg-slate-200 overflow-hidden shrink-0">
                  <img
                    src={rel.thumbnails.medium}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="flex flex-col min-w-0 justify-center gap-0.5">
                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                    {rel.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 truncate">{rel.channelTitle}</span>
                  {rel.publishedAt && (
                    <span className="text-[10px] text-slate-400">{formatTimeAgo(rel.publishedAt)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
