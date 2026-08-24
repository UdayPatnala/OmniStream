import { describe, it, expect, beforeEach } from 'vitest';
import { extractYouTubeId } from '../../lib/utils';
import { createUTubeStore } from '../helpers/contracts';
import { useAppStore } from '../../store';

describe('Tier 1: Direct YouTube URL Playback (F06, F10)', () => {
  let store: ReturnType<typeof createUTubeStore>;

  beforeEach(() => {
    store = createUTubeStore();
    useAppStore.getState().setActiveVideo(null);
  });

  it('T1-DURL-01: extracts 11-char video ID from standard watch URL', () => {
    const id = extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('T1-DURL-02: extracts video ID from short URL format', () => {
    const id = extractYouTubeId('https://youtu.be/dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('T1-DURL-03: extracts video ID from youtu.be shortlink with query parameter', () => {
    const id = extractYouTubeId('https://youtu.be/5qap5aO4i9A?si=abc123xyz');
    expect(id).toBe('5qap5aO4i9A');
  });

  it('T1-DURL-04: extracts video ID from YouTube Embed format', () => {
    const id = extractYouTubeId('https://www.youtube.com/embed/LXb3EKWsInQ');
    expect(id).toBe('LXb3EKWsInQ');
  });

  it('T1-DURL-05: accepts bare 11-character alphanumeric video ID directly', () => {
    const id = extractYouTubeId('dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('T1-DURL-06: playing direct video ID updates currentVideo in UTubeStore', () => {
    expect(store.getState().currentVideo).toBeNull();
    store.getState().playVideo('dQw4w9WgXcQ');
    expect(store.getState().currentVideo).not.toBeNull();
    expect(store.getState().currentVideo?.id).toBe('dQw4w9WgXcQ');
  });

  it('T1-DURL-07: watch URL with extra tracking parameters extracts clean video ID', () => {
    const id = extractYouTubeId('https://www.youtube.com/watch?v=jfKfPfyJRdk&t=120s&feature=shared');
    expect(id).toBe('jfKfPfyJRdk');
  });
});
