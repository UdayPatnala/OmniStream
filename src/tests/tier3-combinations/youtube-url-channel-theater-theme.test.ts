import { describe, it, expect, beforeEach } from 'vitest';
import { extractYouTubeId } from '../../lib/utils';
import { useAppStore } from '../../store';
import { THEME_CONFIGS } from '../../lib/cinemorph/visualEngine';
import { MOCK_CHANNELS, MOCK_VIDEOS } from '../helpers/fixtures';

describe('Tier 3: YouTube URL -> Channel Sub Match -> Theater -> Theme Switch (Cross-Feature)', () => {
  beforeEach(() => {
    useAppStore.setState({
      subscriptions: [MOCK_CHANNELS[0]],
      activeVideo: null,
      cinemorphTheme: 'cinematic-dark',
    });
  });

  it('T3-FLOW-04: resolves YouTube URL, matches channel subscription, sets theater theme', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const videoId = extractYouTubeId(url);
    expect(videoId).toBe('dQw4w9WgXcQ');

    const video = { ...MOCK_VIDEOS[0], id: 'dQw4w9WgXcQ' };
    useAppStore.getState().setActiveVideo(video);

    // Verify channel matches subscription
    const isSubscribed = useAppStore.getState().subscriptions.some(s => s.id === video.channelId);
    expect(isSubscribed).toBe(true);

    // Switch theme to cyberpunk-oled
    useAppStore.getState().setCinemorphTheme('cyberpunk-oled');
    expect(useAppStore.getState().cinemorphTheme).toBe('cyberpunk-oled');
    expect(THEME_CONFIGS['cyberpunk-oled'].accentColor).toBe('#EC4899');
  });
});
