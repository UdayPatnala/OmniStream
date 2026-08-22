import { Collection, Video } from '../../types';
import { useAppStore } from '../../store';

/**
 * CollectionRepository - Encapsulates custom user playlists and collection management
 */
export class CollectionRepository {
  public static getAll(): Collection[] {
    return useAppStore.getState().collections;
  }

  public static getById(id: string): Collection | undefined {
    return useAppStore.getState().collections.find(c => c.id === id);
  }

  public static create(name: string): void {
    useAppStore.getState().createCollection(name);
  }

  public static delete(id: string): void {
    useAppStore.getState().deleteCollection(id);
  }

  public static addVideo(collectionId: string, video: Video): void {
    useAppStore.getState().addVideoToCollection(collectionId, video);
  }

  public static removeVideo(collectionId: string, videoId: string): void {
    useAppStore.getState().removeVideoFromCollection(collectionId, videoId);
  }
}
