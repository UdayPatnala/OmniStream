import { HistoryItem, Video } from '../../types';
import { useAppStore } from '../../store';

/**
 * HistoryRepository - Encapsulates watch history persistence & query logic
 */
export class HistoryRepository {
  public static getAll(): Record<string, HistoryItem> {
    return useAppStore.getState().history;
  }

  public static getList(): HistoryItem[] {
    return Object.values(useAppStore.getState().history).sort((a, b) => b.watchedAt - a.watchedAt);
  }

  public static getById(videoId: string): HistoryItem | undefined {
    return useAppStore.getState().history[videoId];
  }

  public static getResumePosition(videoId: string): number {
    const entry = this.getById(videoId);
    return entry && entry.progress > 10 ? entry.progress : 0;
  }

  public static recordProgress(video: Video, progressSeconds: number, durationSeconds: number): void {
    useAppStore.getState().addToHistory(video, progressSeconds, durationSeconds);
  }

  public static remove(videoId: string): void {
    useAppStore.getState().removeFromHistory(videoId);
  }

  public static clear(): void {
    useAppStore.getState().clearHistory();
  }

  public static getUnfinished(): Video[] {
    return this.getList()
      .filter(h => h.progress > 10 && h.duration > 0 && h.progress < h.duration * 0.9)
      .map(h => h.video);
  }
}
