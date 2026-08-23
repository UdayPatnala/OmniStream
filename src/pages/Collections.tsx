import { useState } from 'react';
import { useAppStore } from '../store';
import { VideoCard } from '../components/VideoCard';
import { FolderHeart, Plus, Trash2, ChevronRight, Clock, ThumbsUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Video } from '../types';

export function Collections() {
  const { collections, createCollection, deleteCollection, removeVideoFromCollection, watchLater, likedVideos, removeFromWatchLater } = useAppStore();
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string>('watch-later');

  interface DisplayPlaylist {
    id: string;
    name: string;
    videos: Video[];
    isSystem?: boolean;
  }

  const watchLaterCol: DisplayPlaylist = { id: 'watch-later', name: 'Watch Later', videos: watchLater, isSystem: true };
  const likedCol: DisplayPlaylist = { id: 'liked-videos', name: 'Liked Videos', videos: likedVideos, isSystem: true };

  const allPlaylists: DisplayPlaylist[] = [watchLaterCol, likedCol, ...collections];
  const activePlaylist = allPlaylists.find(p => p.id === activeTabId) || watchLaterCol;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      createCollection(newCollectionName.trim());
      setNewCollectionName('');
      setShowNewForm(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full max-w-[1700px] mx-auto py-2">
      {/* Sidebar Collections List */}
      <div className="w-full md:w-64 shrink-0 space-y-3">
        <div className="flex items-center justify-between border-b border-[#272727] pb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#aaaaaa]">Playlists & Collections</h2>
          <button 
            onClick={() => setShowNewForm(!showNewForm)}
            className="p-1 hover:bg-[#272727] rounded-full transition-colors text-white"
            title="Create new collection"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {showNewForm && (
          <form onSubmit={handleCreate} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Playlist name..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="flex-1 h-9 px-3 text-xs rounded-lg border border-[#383838] bg-[#121212] text-[#f1f1f1] focus:outline-none"
              autoFocus
            />
            <button type="submit" className="px-3 h-9 bg-white text-black text-xs font-bold rounded-lg hover:bg-[#d9d9d9]">
              Add
            </button>
          </form>
        )}

        <div className="space-y-1.5">
          {allPlaylists.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveTabId(col.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                activeTabId === col.id 
                  ? 'bg-[#272727] text-white font-semibold' 
                  : 'hover:bg-[#272727]/50 text-[#f1f1f1]'
              }`}
            >
              <div className="flex items-center gap-3">
                {col.id === 'watch-later' ? (
                  <Clock className="w-4 h-4 text-cyan-400" />
                ) : col.id === 'liked-videos' ? (
                  <ThumbsUp className="w-4 h-4 text-purple-400" />
                ) : (
                  <FolderHeart className="w-4 h-4 text-red-500" />
                )}
                <span className="truncate text-xs">{col.name}</span>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${activeTabId === col.id ? 'bg-[#383838]' : 'bg-[#1e1e1e]'}`}>
                {col.videos.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 bg-[#272727] rounded-2xl p-6 border border-[#383838]">
        {activePlaylist ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#383838] pb-4">
              <div>
                <h1 className="text-2xl font-bold text-[#f1f1f1]">{activePlaylist.name}</h1>
                <p className="text-[#aaaaaa] text-xs mt-1">
                  {activePlaylist.videos.length} saved videos
                </p>
              </div>
              
              {!activePlaylist.isSystem && (
                <button 
                  onClick={() => {
                    if (confirm(`Delete playlist "${activePlaylist.name}"?`)) {
                      deleteCollection(activePlaylist.id);
                      setActiveTabId('watch-later');
                    }
                  }}
                  className="p-2 text-[#aaaaaa] hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {activePlaylist.videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#aaaaaa]">
                <FolderHeart className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm font-medium">This playlist is empty.</p>
                <Link to="/" className="mt-4 text-white font-semibold hover:underline flex items-center text-xs">
                  Discover videos <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
                {activePlaylist.videos.map(video => (
                  <div key={video.id} className="relative group">
                    <VideoCard video={video} />
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (activePlaylist.id === 'watch-later') {
                          removeFromWatchLater(video.id);
                        } else if (!activePlaylist.isSystem) {
                          removeVideoFromCollection(activePlaylist.id, video.id);
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 text-white hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                      aria-label="Remove from collection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

