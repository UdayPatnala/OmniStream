import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatTimeAgo, formatViews, formatDuration } from '../lib/utils';
import { Video, SearchResult } from '../types';
import { MoreVertical, Clock, Ban, Flag, Share2, Check } from 'lucide-react';
import { useAppStore } from '../store';

interface VideoCardProps {
  key?: any;
  video: Video | SearchResult;
  progress?: number;
}

export function VideoCard({ video, progress }: VideoCardProps) {
  const isVideo = 'duration' in video || ('type' in video && video.type === 'video');
  const duration = 'duration' in video ? video.duration : undefined;
  const views = 'viewCount' in video ? video.viewCount : undefined;
  
  const [showMenu, setShowMenu] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const { 
    watchPositions, 
    addToWatchLater, 
    removeFromWatchLater, 
    isInWatchLater,
    markNotInterested,
    markChannelIgnored,
    notInterestedIds
  } = useAppStore();

  // If video is marked not interested, hide card
  if (notInterestedIds.includes(video.id)) {
    return null;
  }

  const savedPos = watchPositions[video.id];
  let activeProgress = 0;
  if (progress !== undefined) {
    if (savedPos && savedPos.duration > 0 && progress > 100) {
      activeProgress = (progress / savedPos.duration) * 100;
    } else {
      activeProgress = progress;
    }
  } else if (savedPos && savedPos.duration > 0) {
    activeProgress = (savedPos.timestamp / savedPos.duration) * 100;
  }
  const inWatchLater = isInWatchLater(video.id);

  const videoObj: Video = {
    id: video.id,
    title: video.title,
    description: 'description' in video ? (video as any).description : '',
    channelId: video.channelId,
    channelTitle: video.channelTitle,
    publishedAt: video.publishedAt,
    thumbnails: video.thumbnails,
  };

  const triggerToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2000);
  };

  return (
    <div className="relative flex flex-col gap-2.5 group select-none font-sans">
      {/* Toast Feedback */}
      {savedToast && (
        <div className="absolute top-2 left-2 z-30 px-3 py-1.5 rounded-xl bg-utube-card border border-utube-border text-utube-text text-xs font-bold shadow-xl animate-in fade-in zoom-in-95 duration-150">
          {savedToast}
        </div>
      )}

      <Link to={isVideo ? `/watch/${video.id}` : `/channel/${video.id}`} className="flex flex-col gap-2.5 cursor-pointer">
        {/* Thumbnail Container */}
        <div className="aspect-video bg-utube-surface rounded-2xl relative overflow-hidden border border-utube-border/40">
          <img 
            src={video.thumbnails.high || video.thumbnails.medium} 
            alt={video.title} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold text-white tracking-wide shadow-md">
              {formatDuration(duration)}
            </div>
          )}
          {activeProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-utube-surface">
              <div className="h-full bg-utube-primary" style={{ width: `${Math.min(100, activeProgress)}%` }} />
            </div>
          )}
        </div>

        {/* Info Container */}
        <div className="flex gap-3 items-start px-0.5 relative">
          <div className="w-8 h-8 rounded-full bg-utube-surface flex-shrink-0 overflow-hidden mt-0.5 border border-utube-border">
            <img src={video.thumbnails.medium} alt={video.channelTitle} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col min-w-0 flex-1 pr-6">
            <h3 className="text-sm font-semibold line-clamp-2 text-utube-text leading-snug group-hover:text-utube-primary transition-colors">
              {video.title}
            </h3>
            <span className="text-xs text-utube-text-secondary hover:text-utube-text mt-1 truncate transition-colors">
              {video.channelTitle}
            </span>
            <span className="text-[11px] text-utube-text-muted mt-0.5">
              {views ? `${formatViews(views)} views • ` : ''}{formatTimeAgo(video.publishedAt)}
            </span>
          </div>
        </div>
      </Link>

      {/* Overflow 3-Dots Menu Toggle Button */}
      <div className="absolute bottom-2 right-0 z-20">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(s => !s);
          }}
          className="p-1.5 text-utube-text-muted hover:text-utube-text rounded-full hover:bg-utube-surface transition-colors cursor-pointer"
          title="Video Options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div 
            className="absolute right-0 bottom-8 w-52 bg-utube-card border border-utube-border rounded-2xl p-1.5 shadow-2xl z-40 space-y-1 animate-in fade-in zoom-in-95 duration-150 text-utube-text"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                if (inWatchLater) {
                  removeFromWatchLater(video.id);
                  triggerToast('Removed from Watch Later');
                } else {
                  addToWatchLater(videoObj);
                  triggerToast('Saved to Watch Later');
                }
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-utube-text hover:bg-utube-surface transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-utube-text-muted" />
              <span>{inWatchLater ? 'Remove Watch Later' : 'Save to Watch Later'}</span>
            </button>

            <button
              onClick={() => {
                markNotInterested(video.id);
                triggerToast('Marked as Not Interested');
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-utube-text hover:bg-utube-surface transition-colors cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5 text-utube-text-muted" />
              <span>Not Interested</span>
            </button>

            <button
              onClick={() => {
                markChannelIgnored(video.channelId);
                triggerToast('Channel ignored from recommendations');
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-utube-text hover:bg-utube-surface transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5 text-utube-text-muted" />
              <span>Don&apos;t Recommend Channel</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/watch/${video.id}`);
                triggerToast('Video Link Copied!');
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-utube-text hover:bg-utube-surface transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-utube-text-muted" />
              <span>Share Video Link</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
