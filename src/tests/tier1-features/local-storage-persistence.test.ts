import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../store';
import { MOCK_CHANNELS, MOCK_LOCAL_MEDIA, MOCK_VIDEOS } from '../helpers/fixtures';

describe('Tier 1: Local Storage Persistence (F11)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('T1-STOR-01: subscriptions persist to localStorage under cinemorph-utube-storage key', () => {
    useAppStore.getState().subscribe(MOCK_CHANNELS[0]);
    
    const stored = localStorage.getItem('cinemorph-utube-storage');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored || '{}');
    expect(parsed.state?.subscriptions).toBeDefined();
    expect(parsed.state.subscriptions.some((s: any) => s.id === MOCK_CHANNELS[0].id)).toBe(true);
  });

  it('T1-STOR-02: search history records and updates survive in localStorage', () => {
    useAppStore.getState().addSearchHistory('imax 70mm 4k');
    useAppStore.getState().addSearchHistory('react state management');

    const stored = localStorage.getItem('cinemorph-utube-storage');
    const parsed = JSON.parse(stored || '{}');
    expect(parsed.state.searchHistory).toContain('imax 70mm 4k');
    expect(parsed.state.searchHistory).toContain('react state management');
  });

  it('T1-STOR-03: video watch history progress persists to localStorage', () => {
    useAppStore.getState().addToHistory(MOCK_VIDEOS[0], 450, 900);

    const stored = localStorage.getItem('cinemorph-utube-storage');
    const parsed = JSON.parse(stored || '{}');
    const historyItem = parsed.state.history?.[MOCK_VIDEOS[0].id];
    expect(historyItem).toBeDefined();
    expect(historyItem.progress).toBe(450);
  });

  it('T1-STOR-04: local media history items persist across storage serialization', () => {
    useAppStore.getState().addLocalMediaToHistory(MOCK_LOCAL_MEDIA);

    const stored = localStorage.getItem('cinemorph-utube-storage');
    const parsed = JSON.parse(stored || '{}');
    const localItem = parsed.state.localMediaHistory?.[MOCK_LOCAL_MEDIA.id];
    expect(localItem).toBeDefined();
    expect(localItem.name).toBe(MOCK_LOCAL_MEDIA.name);
  });

  it('T1-STOR-05: audio EQ configuration persists across storage serialization', () => {
    useAppStore.getState().setAudioEQ({
      preset: 'bass-heavy',
      bassBoost: 10,
      dialogueClarity: 5,
      surround3D: true,
    });

    const stored = localStorage.getItem('cinemorph-utube-storage');
    const parsed = JSON.parse(stored || '{}');
    expect(parsed.state.audioEQ?.preset).toBe('bass-heavy');
    expect(parsed.state.audioEQ?.bassBoost).toBe(10);
  });

  it('T1-STOR-06: clearing history cleans localStorage representation', () => {
    useAppStore.getState().addToHistory(MOCK_VIDEOS[1], 100, 500);
    useAppStore.getState().clearHistory();

    const stored = localStorage.getItem('cinemorph-utube-storage');
    const parsed = JSON.parse(stored || '{}');
    expect(Object.keys(parsed.state?.history || {})).toHaveLength(0);
  });
});
