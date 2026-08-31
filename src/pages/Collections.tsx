import { useState, type FormEvent } from 'react';
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

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      createCollection(newCollectionName.trim());
      setNewCollectionName('');
      setShowNewForm(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full max-w-[1700px] mx-auto py-2 text-utube-text select-none font-sans">
      {/* Sidebar Collections List */}
      <div className="w-full md:w-64 shrink-0 space-y-3">
        <div className="flex items-center justify-between border-b border-utube-border pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-utube-text-muted">Playlists & Collections</h2>
          <button 
            onClick={() => setShowNewForm(!showNewForm)}
            className="p-1.5 hover:bg-utube-surface rounded-xl transition-colors text-utube-text cursor-pointer"
            title="Create new collection"
          >
            <Plus className="w-4 h-4 text-utube-primary" />
          </button>
        </div>

        {showNewForm && (
          <form onSubmit={handleCreate} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Playlist name..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="flex-1 h-9 px-3 text-xs rounded-xl border border-utube-border bg-utube-surface text-utube-text focus:outline-none focus:border-utube-primary"
              autoFocus
            />
            <button type="submit" className="px-3 h-9 bg-utube-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer">
              Add
            </button>
          </form>
        )}

        <div className="space-y-1.5">
          {allPlaylists.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveTabId(col.id)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-colors cursor-pointer ${
                activeTabId === col.id 
                  ? 'bg-utube-card border border-utube-border shadow-sm text-utube-text font-bold ring-1 ring-utube-primary/30' 
                  : 'hover:bg-utube-surface text-utube-text-secondary border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                {col.id === 'watch-later' ? (
                  <Clock className="w-4 h-4 text-amber-500" />
                ) : col.id === 'liked-videos' ? (
                  <ThumbsUp className="w-4 h-4 text-utube-primary" />
                ) : (
                  <FolderHeart className="w-4 h-4 text-cinemorph-primary" />
                )}
                <span className="truncate text-xs">{col.name}</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${activeTabId === col.id ? 'bg-utube-surface text-utube-primary border border-utube-border' : 'bg-utube-surface text-utube-text-muted'}`}>
                {col.videos.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 bg-utube-card rounded-3xl p-6 sm:p-7 border border-utube-border shadow-sm">
        {activePlaylist ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-utube-border pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-utube-text font-cinematic-title uppercase tracking-tight">{activePlaylist.name}</h1>
                <p className="text-utube-text-muted text-xs mt-1">
                  {activePlaylist.videos.length} saved streams
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
                  className="p-2 text-utube-text-muted hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                  title="Delete Collection"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {activePlaylist.videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-utube-text-muted">
                <FolderHeart className="w-12 h-12 mb-3 opacity-30 text-utube-primary" />
                <p className="text-sm font-medium">This playlist is empty.</p>
                <Link to="/home" className="mt-4 text-utube-primary font-bold hover:underline flex items-center text-xs">
                  Discover streams <ChevronRight className="w-4 h-4 ml-1" />
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
                      className="absolute top-2 right-2 p-1.5 bg-black/80 text-white hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer shadow-md"
                      aria-label="Remove from collection"
                      title="Remove"
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
