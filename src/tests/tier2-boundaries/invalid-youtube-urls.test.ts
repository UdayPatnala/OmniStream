import { describe, it, expect, beforeEach } from 'vitest';
import { extractYouTubeId } from '../../lib/utils';
import { errorRecoveryManager } from '../../lib/services/errorRecoveryManager';
import { useAppStore } from '../../store';
import { MOCK_VIDEOS } from '../helpers/fixtures';

describe('Tier 2: Invalid YouTube URLs & Error Recovery (Boundary)', () => {
  beforeEach(() => {
    errorRecoveryManager.clearFailedList();
    useAppStore.setState({
      pipelineCandidates: [],
      currentCandidateIndex: 0,
      activeVideo: null,
      recoveryMessage: null,
    });
  });

  it('T2-IURL-01: non-YouTube URL returns null from extractYouTubeId', () => {
    expect(extractYouTubeId('https://vimeo.com/123456789')).toBeNull();
    expect(extractYouTubeId('https://example.com/video.mp4')).toBeNull();
  });

  it('T2-IURL-02: malformed URL parameter returns null', () => {
    expect(extractYouTubeId('https://youtube.com/watch?invalid=abc')).toBeNull();
    expect(extractYouTubeId('')).toBeNull();
  });

  it('T2-IURL-03: invalid URL parameter format (missing v=) returns null safely', () => {
    const invalidUrl = 'https://youtube.com/watch?other=dQw4w9WgXcQ';
    const id = extractYouTubeId(invalidUrl);
    expect(id).toBeNull();
  });


  it('T2-IURL-04: player error code 150 (not embeddable) triggers auto-switch to next candidate', () => {
    useAppStore.setState({
      pipelineCandidates: [MOCK_VIDEOS[0], MOCK_VIDEOS[1]],
      currentCandidateIndex: 0,
      activeVideo: MOCK_VIDEOS[0],
    });

    const nextVideo = errorRecoveryManager.handlePlayerError(150);
    expect(nextVideo).not.toBeNull();
    expect(nextVideo?.id).toBe(MOCK_VIDEOS[1].id);
    expect(useAppStore.getState().activeVideo?.id).toBe(MOCK_VIDEOS[1].id);
    expect(useAppStore.getState().recoveryMessage).toContain('Auto-switched');
  });

  it('T2-IURL-05: exhausting all candidate videos informs user with fallback toast', () => {
    useAppStore.setState({
      pipelineCandidates: [MOCK_VIDEOS[0]],
      currentCandidateIndex: 0,
      activeVideo: MOCK_VIDEOS[0],
    });

    const nextVideo = errorRecoveryManager.handlePlayerError(101);
    expect(nextVideo).toBeNull();
    expect(useAppStore.getState().recoveryMessage).toContain('exhausted');
  });
});
