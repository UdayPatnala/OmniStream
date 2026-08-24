import { describe, it, expect, beforeEach } from 'vitest';
import { THEME_CONFIGS, getGlowScale } from '../../lib/cinemorph/visualEngine';
import { useAppStore } from '../../store';

describe('Tier 1: Three.js 3D Theater Scaling & Geometry (F12, F13, F14, F15, F20)', () => {
  beforeEach(() => {
    useAppStore.setState({
      theaterSeatingEnabled: true,
      curtainAnimationEnabled: false,
      cinemorphTheme: 'cinematic-dark',
      glowIntensity: 'ultra',
    });
  });

  it('T1-THET-01: theater seating geometry toggle updates store state', () => {
    expect(useAppStore.getState().theaterSeatingEnabled).toBe(true);
    useAppStore.getState().setTheaterSeatingEnabled(false);
    expect(useAppStore.getState().theaterSeatingEnabled).toBe(false);
  });

  it('T1-THET-02: curtain opening animation toggle updates state correctly', () => {
    expect(useAppStore.getState().curtainAnimationEnabled).toBe(false);
    useAppStore.getState().setCurtainAnimationEnabled(true);
    expect(useAppStore.getState().curtainAnimationEnabled).toBe(true);
  });

  it('T1-THET-03: THEME_CONFIGS provides valid styling definitions for all 6 themes', () => {
    const themes = [
      'cinematic-dark',
      'cyberpunk-oled',
      'glassmorphic-neon',
      'ambient-minimal',
      'imax-ultra',
      'golden-hour'
    ] as const;

    themes.forEach(theme => {
      const config = THEME_CONFIGS[theme];
      expect(config).toBeDefined();
      expect(config.background).toMatch(/^#/);
      expect(config.glowGradient).toContain('radial-gradient');
    });
  });

  it('T1-THET-04: getGlowScale accurately scales ambilight intensity levels', () => {
    expect(getGlowScale('off')).toBe(0);
    expect(getGlowScale('low')).toBe(0.35);
    expect(getGlowScale('medium')).toBe(0.65);
    expect(getGlowScale('ultra')).toBe(1.0);
  });

  it('T1-THET-05: theme selection in store updates active theme configuration', () => {
    useAppStore.getState().setCinemorphTheme('imax-ultra');
    expect(useAppStore.getState().cinemorphTheme).toBe('imax-ultra');
    expect(THEME_CONFIGS[useAppStore.getState().cinemorphTheme].accentColor).toBe('#38BDF8');
  });

  it('T1-THET-06: ambient glow toggle inverts current glow state', () => {
    expect(useAppStore.getState().ambientGlow).toBe(true);
    useAppStore.getState().toggleAmbientGlow();
    expect(useAppStore.getState().ambientGlow).toBe(false);
  });
});
