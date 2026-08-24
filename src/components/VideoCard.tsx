import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatTimeAgo, formatViews, formatDuration } from '../lib/utils';
import { Video, SearchResult } from '../types';
import { MoreVertical, Clock, Ban, Flag, Share2, Check } from 'lucide-react';
import { useAppStore } from '../store';

interface VideoCardProps {
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
  const activeProgress = progress || (savedPos && savedPos.duration > 0 ? (savedPos.timestamp / savedPos.duration) * 100 : 0);
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
    <div className="relative flex flex-col gap-2.5 group">
      {/* Toast Feedback */}
      {savedToast && (
        <div className="absolute top-2 left-2 z-30 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-white text-xs font-bold shadow-xl animate-in fade-in zoom-in-95 duration-150">
          {savedToast}
        </div>
      )}

      <Link to={isVideo ? `/watch/${video.id}` : `/channel/${video.id}`} className="flex flex-col gap-2.5 cursor-pointer">
        {/* Thumbnail Container */}
        <div className="aspect-video bg-gray-200 rounded-xl relative overflow-hidden">
          <img 
            src={video.thumbnails.high || video.thumbnails.medium} 
            alt={video.title} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
          {duration && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[12px] font-semibold text-white tracking-wide">
              {formatDuration(duration)}
            </div>
          )}
          {activeProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
              <div className="h-full bg-red-600" style={{ width: `${Math.min(100, activeProgress)}%` }} />
            </div>
          )}
        </div>

        {/* Info Container */}
        <div className="flex gap-3 items-start px-0.5 relative">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mt-0.5 border border-gray-100">
            <img src={video.thumbnails.medium} alt={video.channelTitle} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col min-w-0 flex-1 pr-6">
            <h3 className="text-sm font-semibold line-clamp-2 text-gray-900 leading-snug group-hover:text-red-600 transition-colors">
              {video.title}
            </h3>
            <span className="text-xs text-gray-500 hover:text-gray-900 mt-1 truncate transition-colors">
              {video.channelTitle}
            </span>
            <span className="text-xs text-gray-500 mt-0.5">
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
          className="p-1.5 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          title="Video Options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div 
            className="absolute right-0 bottom-8 w-52 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-xl z-40 space-y-1 animate-in fade-in zoom-in-95 duration-150"
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
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{inWatchLater ? 'Remove Watch Later' : 'Save to Watch Later'}</span>
            </button>

            <button
              onClick={() => {
                markNotInterested(video.id);
                triggerToast('Marked as Not Interested');
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Ban className="w-3.5 h-3.5 text-gray-400" />
              <span>Not Interested</span>
            </button>

            <button
              onClick={() => {
                markChannelIgnored(video.channelId);
                triggerToast('Channel ignored from recommendations');
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Flag className="w-3.5 h-3.5 text-gray-400" />
              <span>Don't Recommend Channel</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/watch/${video.id}`);
                triggerToast('Video Link Copied!');
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-400" />
              <span>Share Video Link</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

