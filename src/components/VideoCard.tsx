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
    <Link to={isVideo ? `/watch/${video.id}` : `/channel/${video.id}`} className="flex flex-col gap-3 group cursor-pointer">
      <div className="aspect-video bg-[#2B2930] rounded-3xl border border-white/5 relative overflow-hidden">
        <img 
          src={video.thumbnails.high || video.thumbnails.medium} 
          alt={video.title} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {duration && (
          <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded-md text-[10px] font-bold text-white">
            {formatDuration(duration)}
          </div>
        )}
        {progress && duration && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div className="h-full bg-[#D0BCFF]" style={{ width: `${Math.min(100, (progress / (parseInt(duration) || 1)) * 100)}%` }} />
          </div>
        )}
      </div>
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-full bg-[#2B2930] flex-shrink-0 overflow-hidden border border-white/5">
          <img src={video.thumbnails.medium} alt="channel" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold line-clamp-2 text-[#E6E1E5] group-hover:text-[#D0BCFF] transition-colors">
            {video.title}
          </h3>
          <span className="text-xs text-[#938F99] mt-1">
            {video.channelTitle} • {views ? `${formatViews(views)} • ` : ''}{formatTimeAgo(video.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
