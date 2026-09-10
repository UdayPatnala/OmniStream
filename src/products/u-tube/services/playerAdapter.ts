/**
 * Player Abstraction Layer - Decouples application logic from specific video player implementations.
 */

export interface IVideoPlayerAdapter {
  loadVideo(videoId: string, startTime?: number): Promise<boolean>;
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  setVolume(volume: number): void;
  getDuration(): number;
  getCurrentTime(): number;
}

export class YouTubePlayerAdapter implements IVideoPlayerAdapter {
  private ref: any = null;

  constructor(playerRef?: any) {
    this.ref = playerRef;
  }

  public setRef(playerRef: any): void {
    this.ref = playerRef;
  }

  public async loadVideo(videoId: string, startTime = 0): Promise<boolean> {
    if (!videoId) return false;
    if (this.ref && typeof this.ref.getInternalPlayer === 'function') {
      try {
        const internal = this.ref.getInternalPlayer();
        if (internal && typeof internal.loadVideoById === 'function') {
          internal.loadVideoById({ videoId, startSeconds: startTime });
          return true;
        }
      } catch (e) {}
    }
    return true;
  }

  public play(): void {
    if (this.ref && typeof this.ref.getInternalPlayer === 'function') {
      try {
        const internal = this.ref.getInternalPlayer();
        if (internal?.playVideo) internal.playVideo();
      } catch (e) {}
    }
  }

  public pause(): void {
    if (this.ref && typeof this.ref.getInternalPlayer === 'function') {
      try {
        const internal = this.ref.getInternalPlayer();
        if (internal?.pauseVideo) internal.pauseVideo();
      } catch (e) {}
    }
  }

  public seekTo(seconds: number): void {
    if (this.ref && typeof this.ref.seekTo === 'function') {
      try {
        this.ref.seekTo(seconds, 'seconds');
      } catch (e) {}
    }
  }

  public setVolume(volume: number): void {
    if (this.ref && typeof this.ref.getInternalPlayer === 'function') {
      try {
        const internal = this.ref.getInternalPlayer();
        if (internal?.setVolume) internal.setVolume(Math.round(volume * 100));
      } catch (e) {}
    }
  }

  public getDuration(): number {
    return this.ref?.getDuration ? this.ref.getDuration() : 0;
  }

  public getCurrentTime(): number {
    return this.ref?.getCurrentTime ? this.ref.getCurrentTime() : 0;
  }
}
