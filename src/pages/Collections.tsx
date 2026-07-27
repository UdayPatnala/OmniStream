import { useState } from 'react';
import { useAppStore } from '../store';
import { VideoCard } from '../components/VideoCard';
import { FolderHeart, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Collections() {
  const { collections, createCollection, deleteCollection, removeVideoFromCollection } = useAppStore();
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(collections[0]?.id || null);

  const activeCollection = collections.find(c => c.id === activeCollectionId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      createCollection(newCollectionName.trim());
      setNewCollectionName('');
      setShowNewForm(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 h-full max-w-7xl mx-auto py-4">
      {/* Sidebar Collections List */}
      <div className="w-full md:w-72 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99]">Collections</h2>
          <button 
            onClick={() => setShowNewForm(!showNewForm)}
            className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-[#D0BCFF]"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {showNewForm && (
          <form onSubmit={handleCreate} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Name..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="flex-1 h-10 px-4 text-sm rounded-xl border border-white/5 bg-[#2B2930] text-[#E6E1E5] focus:outline-none focus:border-[#D0BCFF]"
              autoFocus
            />
            <button type="submit" className="px-4 h-10 bg-[#D0BCFF] text-[#381E72] text-sm font-semibold rounded-xl hover:bg-[#EADDFF]">
              Add
            </button>
          </form>
        )}

        <div className="space-y-2">
          {collections.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveCollectionId(col.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-colors ${
                activeCollectionId === col.id 
                  ? 'bg-[#4F378B] text-[#EADDFF] font-medium' 
                  : 'hover:bg-white/5 text-[#CAC4D0]'
              }`}
            >
              <div className="flex items-center gap-4">
                <FolderHeart className="w-5 h-5" />
                <span className="truncate">{col.name}</span>
              </div>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${activeCollectionId === col.id ? 'bg-[#381E72]/50' : 'bg-[#2B2930]'}`}>
                {col.videos.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 bg-[#1C1B1F] rounded-[32px] p-8 border border-white/5 shadow-2xl">
        {activeCollection ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div>
                <h1 className="text-3xl font-semibold text-[#E6E1E5]">{activeCollection.name}</h1>
                <p className="text-[#938F99] text-sm mt-1">
                  {activeCollection.videos.length} videos saved
                </p>
              </div>
              
              {!['watch-later', 'favorites'].includes(activeCollection.id) && (
                <button 
                  onClick={() => {
                    if (confirm(`Delete collection "${activeCollection.name}"?`)) {
                      deleteCollection(activeCollection.id);
                      setActiveCollectionId(collections[0]?.id || null);
                    }
                  }}
                  className="p-3 text-[#938F99] hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {activeCollection.videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#938F99]">
                <FolderHeart className="w-16 h-16 mb-4 opacity-20" />
                <p>This collection is empty.</p>
                <Link to="/" className="mt-4 text-[#D0BCFF] font-medium hover:underline flex items-center">
                  Discover videos <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCollection.videos.map(video => (
                  <div key={video.id} className="relative group">
                    <VideoCard video={video} />
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeVideoFromCollection(activeCollection.id, video.id);
                      }}
                      className="absolute top-3 right-3 p-2 bg-black/60 text-white hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                      aria-label="Remove from collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#938F99]">
            <p>Select a collection from the sidebar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
