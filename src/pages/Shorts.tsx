import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { Video } from '../types';
import { searchVideos, getVideosByIds } from '../lib/youtube';
import { ThumbsUp, MessageSquare, Share2, Volume2, VolumeX, Music, Flame, Sparkles, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';

export function Shorts() {
  const [shortsList, setShortsList] = useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchShorts() {
      try {
        setLoading(true);
        const res = await searchVideos('youtube shorts #shorts viral 4k 60fps', 'video');
        if (res.results.length > 0) {
          const fullVids = await getVideosByIds(res.results.map(r => r.id));
          setShortsList(fullVids.slice(0, 10));
          
          // Initial random like counts
          const initialLikes: Record<string, number> = {};
          fullVids.forEach(v => {
            initialLikes[v.id] = Math.floor(Math.random() * 85000) + 1200;
          });
          setLikeCountMap(initialLikes);
        }
      } catch (e) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchShorts();
  }, []);

  const toggleLike = (id: string) => {
    setLikedMap(prev => {
      const isLiked = !prev[id];
      setLikeCountMap(lc => ({
        ...lc,
        [id]: isLiked ? (lc[id] || 0) + 1 : Math.max(0, (lc[id] || 0) - 1)
      }));
      return { ...prev, [id]: isLiked };
    });
  };

  const handleNext = () => {
    if (activeIndex < shortsList.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[85vh] flex flex-col items-center justify-center space-y-4 text-cyan-400">
        <Flame className="w-12 h-12 animate-bounce text-red-500" />
        <span className="text-sm font-bold tracking-widest uppercase">Loading YouTube Shorts Reel...</span>
      </div>
    );
  }

  const activeShort = shortsList[activeIndex];

  return (
    <div className="w-full h-[88vh] flex items-center justify-center py-2 select-none relative overflow-hidden">
      {/* Navigation Controls Side Buttons */}
      <div className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30">
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all backdrop-blur-md border border-white/10 shadow-lg cursor-pointer"
          title="Previous Short"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          disabled={activeIndex === shortsList.length - 1}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all backdrop-blur-md border border-white/10 shadow-lg cursor-pointer"
          title="Next Short"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {activeShort && (
        <div 
          ref={containerRef}
          className="relative w-full max-w-[420px] h-full max-h-[820px] bg-black rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/10 flex flex-col justify-between"
        >
          {/* Main Short Video Stream Player */}
          <iframe
            key={activeShort.id}
            src={`https://www.youtube-nocookie.com/embed/${activeShort.id}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${activeShort.id}&playsinline=1&modestbranding=1`}
            title={activeShort.title}
            allow="autoplay; encrypted-media"
            className="absolute inset-0 w-full h-full object-cover border-0 scale-[1.05]"
          />

          {/* Top Bar Header Badge */}
          <div className="relative z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-black tracking-wider uppercase backdrop-blur-md">
              <Flame className="w-3.5 h-3.5 text-red-500 fill-current" />
              <span>Shorts Reel</span>
            </div>

            <button
              onClick={() => setMuted(m => !m)}
              className="p-2 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer"
              title={muted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>

          {/* Right Action Icons Column */}
          <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5 text-white">
            {/* Like Button */}
            <button
              onClick={() => toggleLike(activeShort.id)}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className={`p-3 rounded-full border backdrop-blur-md transition-all shadow-lg ${
                likedMap[activeShort.id]
                  ? 'bg-red-600 border-red-500 text-white scale-110'
                  : 'bg-black/60 border-white/20 text-gray-200 hover:text-white group-hover:scale-105'
              }`}>
                <ThumbsUp className={`w-5 h-5 ${likedMap[activeShort.id] ? 'fill-current' : ''}`} />
              </div>
              <span className="text-[11px] font-bold drop-shadow">
                {likeCountMap[activeShort.id] ? (likeCountMap[activeShort.id] > 1000 ? `${(likeCountMap[activeShort.id] / 1000).toFixed(1)}k` : likeCountMap[activeShort.id]) : '12.4k'}
              </span>
            </button>

            {/* Comment Button */}
            <div className="flex flex-col items-center gap-1">
              <div className="p-3 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-lg">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold drop-shadow">482</span>
            </div>

            {/* Share Button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/watch/${activeShort.id}`);
                alert('Shorts video link copied!');
              }}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="p-3 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-lg group-hover:scale-105 transition-all">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold drop-shadow">Share</span>
            </button>
          </div>

          {/* Bottom Creator Info & Title Overlay */}
          <div className="relative z-20 p-5 bg-gradient-to-t from-black via-black/80 to-transparent space-y-3">
            {/* Creator Row */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 border border-white/30 overflow-hidden shadow-lg">
                <img src={activeShort.thumbnails.medium} alt={activeShort.channelTitle} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white drop-shadow">{activeShort.channelTitle}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-950" />
              </div>
              <button className="ml-2 px-3 py-1 rounded-full bg-white text-black font-black text-[11px] hover:bg-gray-200 transition-all cursor-pointer">
                Subscribe
              </button>
            </div>

            {/* Title */}
            <p className="text-xs font-medium text-gray-200 line-clamp-2 leading-snug drop-shadow-md">
              {activeShort.title}
            </p>

            {/* Audio Track Tag */}
            <div className="flex items-center gap-2 text-[10px] font-semibold text-cyan-300 drop-shadow">
              <Music className="w-3 h-3 text-cyan-400 animate-spin" />
              <span className="truncate max-w-[200px]">Original Audio - {activeShort.channelTitle}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
