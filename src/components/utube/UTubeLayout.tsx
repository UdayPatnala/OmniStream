import React from 'react';
import { SearchBar } from './SearchBar';
import { useUTubeStore, UTubeVideo } from '../../state/useUTubeStore';
import { Play, Loader2, RefreshCw, Flame, Tv } from 'lucide-react';

interface UTubeLayoutProps {
  children?: React.ReactNode;
  onVideoClick?: (video: UTubeVideo) => void;
}

export const UTubeLayout: React.FC<UTubeLayoutProps> = ({ children, onVideoClick }) => {
  const {
    searchResults,
    hasMore,
    isLoadingMore,
    loadMoreSearch,
    recommendedVideos,
    playVideo,
    currentQuery,
  } = useUTubeStore();

  const handleSelectVideo = (video: UTubeVideo) => {
    playVideo(video);
    onVideoClick?.(video);
  };

  return (
    <div className="min-h-screen bg-[#070608] text-white p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Search Bar */}
      <div className="flex flex-col items-center justify-center space-y-3">
        <SearchBar />
      </div>

      {/* Main Content Area */}
      {searchResults.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Tv className="h-5 w-5 text-red-500" />
              <span>Results for "{currentQuery}"</span>
              <span className="text-xs font-mono font-normal text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                {searchResults.length} videos
              </span>
            </h2>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {searchResults.map((vid) => (
              <div
                key={vid.id}
                onClick={() => handleSelectVideo(vid)}
                className="group relative cursor-pointer rounded-2xl bg-[#12111a] hover:bg-[#1a1926] border border-white/5 hover:border-red-500/40 p-3 transition-all duration-200 hover:scale-[1.02] shadow-lg flex flex-col justify-between"
              >
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/60 relative mb-3">
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-red-600/90 group-hover:bg-red-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-4 w-4 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                    {vid.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">{vid.channelTitle}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Pagination Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => loadMoreSearch()}
                disabled={isLoadingMore}
                className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                    <span>Loading more results...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 text-red-400" />
                    <span>Load More Results</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Discovery / Recommended Feed */
        <div className="space-y-6">
          {children}

          {recommendedVideos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Flame className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold text-white">Recommended for You</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recommendedVideos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => handleSelectVideo(vid)}
                    className="group relative cursor-pointer rounded-2xl bg-[#12111a] hover:bg-[#1a1926] border border-white/5 hover:border-amber-500/40 p-3 transition-all duration-200 hover:scale-[1.02] shadow-lg flex flex-col justify-between"
                  >
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/60 relative mb-3">
                      <img
                        src={vid.thumbnailUrl}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-amber-600/90 group-hover:bg-amber-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-4 w-4 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">
                        {vid.title}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">{vid.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
