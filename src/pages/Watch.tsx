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
  Sparkles,
} from 'lucide-react';
import { getVideosByIds, getChannelDetails, getRelatedVideos } from '../lib/youtube';
import { Video, Channel } from '../types';
import { useAppStore } from '../store';
import { formatViews, formatTimeAgo } from '../lib/utils';
import { UTubePlayer } from '../components/player/UTubePlayer';
import { omsTransitionService } from '../services/omsTransitionService';

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
  const [livePlayerTime, setLivePlayerTime] = useState<number>(0);
  const [liveDuration, setLiveDuration] = useState<number>(0);

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

  const handleOMSTransition = async () => {
    if (!video) return;
    await omsTransitionService.executeUTubeToCineMorphHandoff(
      {
        video,
        currentTime: livePlayerTime,
        duration: liveDuration,
      },
      navigate
    );
  };

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 rounded-full border-2 border-utube-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1700px] mx-auto pb-12 font-sans select-none text-utube-text">
      <div className={`grid gap-6 ${theaterLayout ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>

        {/* ── Main: Player + Metadata ── */}
        <div className={`${theaterLayout ? 'w-full max-w-6xl mx-auto' : 'lg:col-span-2'} space-y-4`}>

          {/* U-Tube Dedicated Player (with Theater A & OMS Handoff) */}
          <UTubePlayer
            video={video}
            initialTime={initialStartTime}
            theaterMode={theaterLayout}
            onToggleTheaterMode={() => setTheaterLayout((t) => !t)}
            onTimeUpdate={(t, d) => {
              setLivePlayerTime(t);
              if (d > 0) setLiveDuration(d);
            }}
            onNext={() => related.length > 0 && navigate(`/watch/${related[0].id}`)}
          />

          {/* Title */}
          <h1 className="text-lg sm:text-xl font-bold text-utube-text leading-snug tracking-tight">
            {video.title}
          </h1>

          {/* Channel row + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-utube-border">

            {/* Channel info & Subscribe */}
            <div className="flex items-center gap-3">
              <Link
                to={video.channelId ? `/channel/${video.channelId}` : '#'}
                className="w-9 h-9 rounded-full overflow-hidden bg-utube-surface shrink-0 border border-utube-border hover:opacity-90 transition-opacity"
              >
                {channel?.thumbnails?.medium
                  ? <img src={channel.thumbnails.medium} alt={video.channelTitle} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-utube-surface flex items-center justify-center text-utube-text font-bold text-sm">
                      {video.channelTitle?.[0]?.toUpperCase() || 'C'}
                    </div>
                }
              </Link>

              <div>
                <Link
                  to={video.channelId ? `/channel/${video.channelId}` : '#'}
                  className="font-bold text-sm text-utube-text hover:underline block truncate max-w-[180px]"
                >
                  {video.channelTitle}
                </Link>
                {channel?.subscriberCount && (
                  <span className="text-xs text-utube-text-muted">{formatViews(channel.subscriberCount)} subscribers</span>
                )}
              </div>

              <button
                onClick={handleToggleSubscribe}
                className={`ml-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSubscribed
                    ? 'bg-utube-surface text-utube-text hover:bg-utube-border/60 border border-utube-border'
                    : 'bg-utube-primary text-white hover:opacity-90 shadow-sm'
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
                    ? 'bg-utube-primary/10 text-utube-primary border-utube-primary/30'
                    : 'bg-utube-surface text-utube-text-secondary border-utube-border hover:bg-utube-surface/80'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-utube-primary' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </button>

              {/* Share */}
              <button
                onClick={handleCopyShare}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-utube-surface hover:bg-utube-border/60 border border-utube-border text-xs font-semibold text-utube-text transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Share'}
              </button>

              {/* Watch Later */}
              <button
                onClick={() => { if (!inWatchLater) addToWatchLater(video); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                  inWatchLater
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    : 'bg-utube-surface hover:bg-utube-border/60 text-utube-text border-utube-border'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${inWatchLater ? 'fill-current text-amber-600' : ''}`} />
                <span className="hidden sm:inline">{inWatchLater ? 'Saved' : 'Watch Later'}</span>
              </button>

              {/* Save to Collection */}
              <div className="relative">
                <button
                  onClick={() => setShowSaveMenu(s => !s)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-utube-surface hover:bg-utube-border/60 border border-utube-border text-xs font-semibold text-utube-text transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </button>

                {showSaveMenu && (
                  <div className="absolute right-0 top-10 w-60 rounded-2xl bg-utube-card border border-utube-border shadow-xl p-3 z-50 text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="font-bold text-utube-text pb-1.5 border-b border-utube-border text-[11px] uppercase tracking-widest">Save to...</div>
                    <div className="max-h-44 overflow-y-auto space-y-0.5">
                      {collections.map(col => (
                        <button
                          key={col.id}
                          onClick={() => { addVideoToCollection(col.id, video); setShowSaveMenu(false); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-utube-surface flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="truncate text-utube-text">{col.name}</span>
                          <span className="text-[10px] text-utube-text-muted font-mono ml-2 shrink-0">{col.videos.length}</span>
                        </button>
                      ))}
                    </div>
                    {showCreateCol ? (
                      <form onSubmit={handleCreateCollection} className="pt-2 border-t border-utube-border space-y-1.5">
                        <input
                          type="text"
                          placeholder="Collection name"
                          value={newColName}
                          onChange={e => setNewColName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-utube-border bg-utube-surface text-utube-text text-xs focus:outline-none focus:border-utube-primary"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => setShowCreateCol(false)} className="px-2 py-1 text-utube-text-muted">Cancel</button>
                          <button type="submit" className="px-3 py-1 bg-utube-primary text-white font-bold rounded-lg cursor-pointer">Create</button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowCreateCol(true)}
                        className="w-full text-left px-2 py-1.5 text-utube-text font-bold hover:bg-utube-surface rounded-lg transition-colors cursor-pointer"
                      >
                        + New collection
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* OMS Experience Handoff */}
              <button
                onClick={handleOMSTransition}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black tracking-wide shadow-sm transition-all hover:scale-105 cursor-pointer font-cinematic"
                title="Transition active viewing context into CineMorph Virtual Theater"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>OMS Handoff</span>
              </button>
            </div>
          </div>

          {/* Description */}
          {video.description && (
            <div
              onClick={() => setDescExpanded(e => !e)}
              className="rounded-2xl bg-utube-surface/60 hover:bg-utube-surface border border-utube-border/60 p-4 transition-colors cursor-pointer text-xs text-utube-text space-y-1.5"
            >
              <div className="flex items-center gap-2 font-semibold text-utube-text-muted text-[11px]">
                <span>{video.publishedAt ? formatTimeAgo(video.publishedAt) : ''}</span>
              </div>
              <p className={`whitespace-pre-line leading-relaxed text-utube-text-secondary ${descExpanded ? '' : 'line-clamp-3'}`}>
                {video.description}
              </p>
              <button className="text-xs font-bold text-utube-primary flex items-center gap-1 pt-0.5">
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
            <h3 className="text-xs font-bold text-utube-text-muted uppercase tracking-widest pb-1">
              Related Streams
            </h3>
            {related.slice(0, 12).map(rel => (
              <Link
                key={rel.id}
                to={`/watch/${rel.id}`}
                className="flex gap-2.5 group hover:bg-utube-surface p-2 rounded-2xl transition-colors border border-transparent hover:border-utube-border"
              >
                <div className="relative w-36 aspect-video rounded-xl bg-utube-surface overflow-hidden shrink-0 border border-utube-border/60">
                  <img
                    src={rel.thumbnails.medium}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="flex flex-col min-w-0 justify-center gap-0.5">
                  <h4 className="text-xs font-bold text-utube-text line-clamp-2 leading-snug group-hover:text-utube-primary transition-colors">
                    {rel.title}
                  </h4>
                  <span className="text-[10px] text-utube-text-muted truncate">{rel.channelTitle}</span>
                  {rel.publishedAt && (
                    <span className="text-[10px] text-utube-text-muted">{formatTimeAgo(rel.publishedAt)}</span>
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
