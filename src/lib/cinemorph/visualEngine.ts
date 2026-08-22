import { CineMorphTheme, GlowIntensity } from '../../types';

/**
 * CineMorph AI - Visual Ambient Glow & Theme Shading Engine
 */

export interface ThemeStyleConfig {
  background: string;
  glowGradient: string;
  glowBlur: string;
  glowOpacity: number;
  vignette: boolean;
  reflection: boolean;
  accentColor: string;
}

export const THEME_CONFIGS: Record<CineMorphTheme, ThemeStyleConfig> = {
  'cinematic-dark': {
    background: '#07060A',
    glowGradient: 'radial-gradient(ellipse at center, rgba(147, 51, 234, 0.45) 0%, rgba(59, 130, 246, 0.25) 50%, transparent 80%)',
    glowBlur: 'blur(70px)',
    glowOpacity: 0.85,
    vignette: true,
    reflection: true,
    accentColor: '#A855F7',
  },
  'cyberpunk-oled': {
    background: '#000000',
    glowGradient: 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.55) 0%, rgba(6, 182, 212, 0.35) 60%, transparent 85%)',
    glowBlur: 'blur(85px)',
    glowOpacity: 0.95,
    vignette: true,
    reflection: true,
    accentColor: '#EC4899',
  },
  'glassmorphic-neon': {
    background: '#0F172A',
    glowGradient: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.5) 0%, rgba(168, 85, 247, 0.3) 50%, transparent 75%)',
    glowBlur: 'blur(60px)',
    glowOpacity: 0.8,
    vignette: false,
    reflection: true,
    accentColor: '#818CF8',
  },
  'ambient-minimal': {
    background: '#121212',
    glowGradient: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(200, 200, 200, 0.05) 50%, transparent 70%)',
    glowBlur: 'blur(50px)',
    glowOpacity: 0.5,
    vignette: false,
    reflection: false,
    accentColor: '#E2E8F0',
  },
  'imax-ultra': {
    background: '#020204',
    glowGradient: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.5) 0%, rgba(30, 58, 138, 0.3) 55%, transparent 80%)',
    glowBlur: 'blur(90px)',
    glowOpacity: 0.9,
    vignette: true,
    reflection: true,
    accentColor: '#38BDF8',
  },
  'golden-hour': {
    background: '#0C0A09',
    glowGradient: 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.5) 0%, rgba(225, 29, 72, 0.25) 50%, transparent 80%)',
    glowBlur: 'blur(75px)',
    glowOpacity: 0.85,
    vignette: true,
    reflection: true,
    accentColor: '#F59E0B',
  },
};

export function getGlowScale(intensity: GlowIntensity): number {
  switch (intensity) {
    case 'off': return 0;
    case 'low': return 0.35;
    case 'medium': return 0.65;
    case 'ultra': return 1.0;
    default: return 0.85;
  }
}
