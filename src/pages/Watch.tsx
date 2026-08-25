import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  FolderPlus,
  Check,
  Film,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  MoreHorizontal,
  Bookmark,
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
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<
    Array<{ id: string; author: string; avatar: string; text: string; time: string; likes: number }>
  >([
    {
      id: 'c1',
      author: 'Cinematic Explorer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      text: 'The color grading and direct sound mixing on this release are absolutely phenomenal.',
      time: '2 hours ago',
      likes: 42,
    },
    {
      id: 'c2',
      author: 'Studio Sound Lab',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
      text: 'Amazing visual presentation! The ad-free stream loaded instantly.',
      time: '5 hours ago',
      likes: 18,
    },
  ]);

  // Initial playback time if transferred from CineMorph or history
  const initialStartTime = (location.state as any)?.startTime || 0;

  useEffect(() => {
    if (!id) return;

    const initialVideoObj: Video = {
      id,
      title: activeVideo?.id === id ? activeVideo.title : 'Loading video...',
      description: activeVideo?.id === id ? activeVideo.description : 'Streaming ad-free on U-Tube.',
      channelId: activeVideo?.channelId || '',
      channelTitle: activeVideo?.channelTitle || 'YouTube Creator',
      publishedAt: activeVideo?.publishedAt || new Date().toISOString(),
      thumbnails: {
        medium: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        high: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      },
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
          if (v.channelId) {
            const chan = await getChannelDetails(v.channelId);
            setChannel(chan);
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    async function fetchRelatedData() {
      try {
        const rels = await getRelatedVideos(id!);
        setRelated(rels.filter((r) => r.id !== id));
      } catch (e) {}
    }

    fetchVideoData();
    fetchRelatedData();
  }, [id]);

  const isSubscribed = subscriptions.some((s) => s.id === video?.channelId);
  const isLiked = video ? isLikedVideo(video.id) : false;
  const inWatchLater = video ? isInWatchLater(video.id) : false;

  const handleToggleSubscribe = () => {
    if (!channel && !video) return;
    const chanToSub: Channel = channel || {
      id: video!.channelId,
      title: video!.channelTitle,
      description: '',
      thumbnails: {
        default: video!.thumbnails.medium,
        medium: video!.thumbnails.medium,
        high: video!.thumbnails.high,
      },
    };

    if (isSubscribed) {
      unsubscribe(chanToSub.id);
    } else {
      subscribe(chanToSub);
    }
  };

  const handleCopyShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setComments([
      {
        id: Date.now().toString(),
        author: 'You',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        text: commentInput.trim(),
        time: 'Just now',
        likes: 0,
      },
      ...comments,
    ]);
    setCommentInput('');
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
        <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-5 pb-12 font-sans select-none">
      {/* ── Main Watch Content (Player + Sidebar) ── */}
      <div
        className={`grid gap-6 ${
          theaterLayout ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'
        }`}
      >
        {/* Left / Main Column: Dedicated U-Tube Player & Metadata */}
        <div className={`${theaterLayout ? 'w-full max-w-6xl mx-auto' : 'lg:col-span-2'} space-y-4`}>
          {/* U-Tube Dedicated Web Video Player */}
          <UTubePlayer
            video={video}
            initialTime={initialStartTime}
            theaterMode={theaterLayout}
            onToggleTheaterMode={() => setTheaterLayout(!theaterLayout)}
            onNext={() => {
              if (related.length > 0) {
                navigate(`/watch/${related[0].id}`);
              }
            }}
          />

          {/* Video Title */}
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-snug tracking-tight">
            {video.title}
          </h1>

          {/* Channel Row & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1 pb-3 border-b border-slate-200/80">
            {/* Channel Info & Subscribe */}
            <div className="flex items-center gap-3">
              <Link
                to={video.channelId ? `/channel/${video.channelId}` : '#'}
                className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200 hover:opacity-90 transition-opacity"
              >
                <img
                  src={channel?.thumbnails?.medium || video.thumbnails.medium}
                  alt={video.channelTitle}
                  className="w-full h-full object-cover"
                />
              </Link>

              <div className="flex flex-col">
                <Link
                  to={video.channelId ? `/channel/${video.channelId}` : '#'}
                  className="font-bold text-sm text-slate-900 hover:underline truncate max-w-[200px]"
                >
                  {video.channelTitle}
                </Link>
                <span className="text-xs text-slate-500 font-medium">
                  {channel?.subscriberCount
                    ? `${formatViews(channel.subscriberCount)} subscribers`
                    : 'Verified Channel'}
                </span>
              </div>

              <button
                onClick={handleToggleSubscribe}
                className={`ml-2 sm:ml-4 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  isSubscribed
                    ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                }`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            {/* Action Pills (Like, Share, Watch Later, Save, CineMorph Handoff) */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Like / Dislike Pill */}
              <div className="flex items-center rounded-full bg-slate-100 border border-slate-200/80 overflow-hidden text-xs font-semibold text-slate-800">
                <button
                  onClick={() => toggleLikeVideo(video)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 hover:bg-slate-200 transition-colors cursor-pointer ${
                    isLiked ? 'text-red-600' : ''
                  }`}
                  title="Like video"
                >
                  <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-red-600' : ''}`} />
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>
                <div className="w-[1px] h-5 bg-slate-300" />
                <button
                  className="px-3 py-2 hover:bg-slate-200 transition-colors cursor-pointer text-slate-600"
                  title="Dislike"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>

              {/* Share */}
              <button
                onClick={handleCopyShare}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                title="Share link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>

              {/* Watch Later */}
              <button
                onClick={() => (inWatchLater ? {} : addToWatchLater(video))}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                  inWatchLater
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200/80'
                }`}
                title="Save to Watch Later"
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">{inWatchLater ? 'Saved' : 'Watch Later'}</span>
              </button>

              {/* Save to Collection */}
              <div className="relative">
                <button
                  onClick={() => setShowSaveMenu(!showSaveMenu)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                  title="Save to Playlist or Collection"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Save</span>
                </button>

                {showSaveMenu && (
                  <div className="absolute right-0 top-11 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
                    <div className="font-bold text-slate-900 pb-1.5 border-b border-slate-100">
                      Save video to...
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {collections.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => {
                            addVideoToCollection(col.id, video);
                            setShowSaveMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between transition-colors"
                        >
                          <span className="truncate">{col.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {col.videos.length} vids
                          </span>
                        </button>
                      ))}
                    </div>

                    {showCreateCol ? (
                      <form onSubmit={handleCreateCollection} className="pt-2 border-t border-slate-100 space-y-2">
                        <input
                          type="text"
                          placeholder="Collection name"
                          value={newColName}
                          onChange={(e) => setNewColName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-red-600"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowCreateCol(false)}
                            className="px-2 py-1 text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                          >
                            Create
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowCreateCol(true)}
                        className="w-full text-left px-2 py-1.5 text-red-600 font-bold hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <span>+ Create new collection</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Seamless CineMorph Theater Switcher */}
              <button
                onClick={handleOpenInCineMorph}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black tracking-wide shadow-md shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer"
                title="Transfer and watch inside CineMorph Virtual Cinema"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Open in CineMorph</span>
              </button>
            </div>
          </div>

          {/* Description Box */}
          <div
            onClick={() => setDescExpanded(!descExpanded)}
            className="rounded-2xl bg-slate-100 hover:bg-slate-150 p-4 transition-colors cursor-pointer text-xs text-slate-700 space-y-2"
          >
            <div className="flex items-center gap-3 font-bold text-slate-900 text-xs">
              <span>{video.publishedAt ? formatTimeAgo(video.publishedAt) : 'Recent upload'}</span>
              <span>•</span>
              <span className="text-red-600">#OMNISTREAM #UTUBE</span>
            </div>

            <p className={`whitespace-pre-line leading-relaxed ${descExpanded ? '' : 'line-clamp-3'}`}>
              {video.description || 'No description provided by creator.'}
            </p>

            <button className="text-xs font-bold text-slate-900 flex items-center gap-1 pt-1 hover:underline">
              {descExpanded ? (
                <>
                  <span>Show less</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Show more</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Comments Section */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-red-600" />
                <span>Comments ({comments.length})</span>
              </h3>
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-300 pb-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 transition-colors"
                />
                {commentInput.trim() && (
                  <div className="flex justify-end gap-2 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => setCommentInput('')}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full shadow-sm"
                    >
                      Comment
                    </button>
                  </div>
                )}
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4 pt-2">
              {comments.map((cmt) => (
                <div key={cmt.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                    <img src={cmt.avatar} alt={cmt.author} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1 flex-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{cmt.author}</span>
                      <span className="text-[11px] text-slate-400">{cmt.time}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{cmt.text}</p>
                    <div className="flex items-center gap-3 pt-1 text-slate-500 font-semibold">
                      <button className="flex items-center gap-1 hover:text-red-600 transition-colors">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{cmt.likes > 0 ? cmt.likes : ''}</span>
                      </button>
                      <button className="hover:text-slate-800">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Related Videos Sidebar */}
        {!theaterLayout && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Related Videos
            </h3>

            <div className="space-y-3">
              {related.slice(0, 10).map((rel) => (
                <Link
                  key={rel.id}
                  to={`/watch/${rel.id}`}
                  className="flex gap-3 group cursor-pointer hover:bg-slate-100 p-1.5 rounded-xl transition-colors"
                >
                  <div className="relative w-40 aspect-video rounded-xl bg-slate-200 overflow-hidden shrink-0">
                    <img
                      src={rel.thumbnails.medium}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 justify-center">
                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                      {rel.title}
                    </h4>
                    <span className="text-[11px] text-slate-500 mt-1 truncate">
                      {rel.channelTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {rel.publishedAt ? formatTimeAgo(rel.publishedAt) : 'Recently uploaded'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
