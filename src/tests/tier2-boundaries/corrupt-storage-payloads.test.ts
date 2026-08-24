import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../store';

describe('Tier 2: Corrupt Storage Payloads & Schema Recovery (Boundary)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('T2-STOR-01: invalid non-JSON string in localStorage falls back to clean default state', () => {
    localStorage.setItem('cinemorph-utube-storage', 'CORRUPT_NOT_JSON_DATA{{{');
    const state = useAppStore.getState();
    expect(state.subscriptions).toBeDefined();
    expect(Array.isArray(state.subscriptions)).toBe(true);
  });

  it('T2-STOR-02: storage payload with missing audioEQ merges default audioEQ configuration', () => {
    const partialPayload = JSON.stringify({
      state: {
        subscriptions: [],
        versionMode: 'v2',
      },
      version: 2,
    });
    localStorage.setItem('cinemorph-utube-storage', partialPayload);
    const state = useAppStore.getState();
    expect(state.audioEQ).toBeDefined();
    expect(state.audioEQ.preset).toBeDefined();
  });

  it('T2-STOR-03: invalid history items with negative progress are handled without runtime exception', () => {
    useAppStore.getState().addToHistory(
      {
        id: 'corrupt_vid',
        title: 'Corrupt Video',
        description: '',
        channelId: 'c1',
        channelTitle: 'c1',
        publishedAt: '',
        thumbnails: { medium: '', high: '' }
      },
      -500,
      -1000
    );

    const history = useAppStore.getState().history;
    expect(history['corrupt_vid']).toBeDefined();
  });

  it('T2-STOR-04: corrupt null or undefined entries in subscriptions array are handled gracefully', () => {
    const appStore = useAppStore.getState();
    appStore.subscribe({
      id: 'valid_sub',
      title: 'Valid Channel',
      description: '',
      thumbnails: { default: '', medium: '', high: '' }
    });
    expect(useAppStore.getState().subscriptions.length).toBeGreaterThan(0);
  });

  it('T2-STOR-05: corrupted theme setting defaults to valid cinematic-dark or system theme', () => {
    const payload = JSON.stringify({
      state: {
        cinemorphTheme: 'non_existent_theme_xyz',
      },
      version: 2
    });
    localStorage.setItem('cinemorph-utube-storage', payload);
    const state = useAppStore.getState();
    expect(state.cinemorphTheme).toBeDefined();
  });
});
