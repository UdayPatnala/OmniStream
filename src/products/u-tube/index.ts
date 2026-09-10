/**
 * U-Tube Product Capsule — Public API
 * =====================================
 * External code (shell, tests) imports from here.
 * Never import from internal product paths directly.
 *
 * Internal structure:
 *   pages/         — Home, Search, Watch, Subscriptions, Collections, History, Channel
 *   components/    — VideoCard, UTubePlayer
 *   state/         — useUTubeStore
 *   services/      — youtube, youtubeService, recommendations, search, playback, ...
 *   repositories/  — history, subscriptions, collections
 *   types/         — U-Tube types
 */

// Pages (lazy-loaded by shell)
export { Home } from './pages/Home';
export { Search } from './pages/Search';
export { Watch } from './pages/Watch';
export { Subscriptions } from './pages/Subscriptions';
export { Collections } from './pages/Collections';
export { History } from './pages/History';
export { ChannelPage } from './pages/Channel';

// Components
export { VideoCard } from './components/VideoCard';
export { UTubePlayer } from './components/UTubePlayer';

// State
export { useUTubeStore } from './state/useUTubeStore';
export type { UTubeVideo, ChannelSubscription, UTubeStoreState } from './state/useUTubeStore';

// Types (public surface only)
export type {
  Video, Channel, Playlist, SearchFilterType, SearchFilterOptions,
  HistoryItem, Collection, SearchResult, SearchResponse, QueueItem,
  BehaviorEvent, SearchHistoryMetaData, RankingProfile,
} from './types';
