import { Link } from 'react-router-dom';
import { formatTimeAgo, formatViews, formatDuration } from '../lib/utils';
import { Video, SearchResult } from '../types';

interface VideoCardProps {
  video: Video | SearchResult;
  progress?: number;
}

export function VideoCard({ video, progress }: VideoCardProps) {
  const isVideo = 'duration' in video || ('type' in video && video.type === 'video');
  const duration = 'duration' in video ? video.duration : undefined;
  const views = 'viewCount' in video ? video.viewCount : undefined;
  
  return (
    <Link to={isVideo ? `/watch/${video.id}` : `/channel/${video.id}`} className="flex flex-col gap-2.5 group cursor-pointer">
      {/* Thumbnail Container */}
      <div className="aspect-video bg-[#272727] rounded-xl relative overflow-hidden">
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
        {progress && duration && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="h-full bg-[#ff0000]" style={{ width: `${Math.min(100, (progress / (parseInt(duration) || 1)) * 100)}%` }} />
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="flex gap-3 items-start px-0.5">
        <div className="w-9 h-9 rounded-full bg-[#272727] flex-shrink-0 overflow-hidden mt-0.5">
          <img src={video.thumbnails.medium} alt={video.channelTitle} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <h3 className="text-sm font-semibold line-clamp-2 text-[#f1f1f1] leading-snug group-hover:text-white transition-colors">
            {video.title}
          </h3>
          <span className="text-xs text-[#aaaaaa] hover:text-white mt-1 truncate transition-colors">
            {video.channelTitle}
          </span>
          <span className="text-xs text-[#aaaaaa] mt-0.5">
            {views ? `${formatViews(views)} views • ` : ''}{formatTimeAgo(video.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

