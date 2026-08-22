import { Video } from '../../types';
import { useAppStore } from '../../store';

/**
 * Error Recovery Manager - Zero-human-intervention failure detection & candidate fallback switcher.
 * Handles YouTube iFrame player errors (150, 101, 100, 2, network drops) seamlessly.
 */

class ErrorRecoveryManager {
  private failedVideoIds = new Set<string>();

  public handlePlayerError(errorEvent: any): Video | null {
    const store = useAppStore.getState();
    const currentVideo = store.activeVideo;

    let errorCode = 'Unknown Error';
    if (typeof errorEvent === 'number') {
      errorCode = `Code ${errorEvent}`;
    } else if (errorEvent?.target?.data !== undefined) {
      errorCode = `Code ${errorEvent.target.data}`;
    }

    if (currentVideo) {
      this.failedVideoIds.add(currentVideo.id);
      console.warn(`[CineMorph Recovery] Video playback error (${errorCode}) for ID: ${currentVideo.id}`);
    }

    // Switch to next candidate in the ranked pipeline
    const nextVideo = store.switchToNextCandidate();

    if (nextVideo) {
      store.setRecoveryMessage(
        `⚠️ Playback error (${errorCode}). Auto-switched to candidate #${store.currentCandidateIndex + 1}: "${nextVideo.title.slice(0, 40)}..."`
      );

      // Auto-hide recovery toast message after 4 seconds
      setTimeout(() => {
        useAppStore.getState().setRecoveryMessage(null);
      }, 4000);

      return nextVideo;
    } else {
      store.setRecoveryMessage('❌ All candidates exhausted for this topic. Please try searching another term.');
      return null;
    }
  }

  public isFailed(videoId: string): boolean {
    return this.failedVideoIds.has(videoId);
  }

  public clearFailedList(): void {
    this.failedVideoIds.clear();
  }
}

export const errorRecoveryManager = new ErrorRecoveryManager();
