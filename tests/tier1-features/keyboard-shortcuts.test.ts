import { describe, it, expect, beforeEach } from 'vitest';
import {
  SHORTCUT_DEFINITIONS,
  DEFAULT_SHORTCUTS,
  normalizeKey,
  formatKeyLabel,
  isModifierKey,
  matchesShortcut,
  findConflictingAction,
  ShortcutAction
} from '@omnistream/core';
import { useAppStore } from '@/src/store';

describe('Tier 1 Feature: Customizable Keyboard Shortcuts System', () => {
  beforeEach(() => {
    useAppStore.getState().resetShortcuts();
  });

  it('T1-SHORTCUT-01: provides complete definitions and defaults for all 10 core theater actions', () => {
    const requiredActions: ShortcutAction[] = [
      'togglePlay',
      'seekBackward',
      'seekForward',
      'volumeUp',
      'volumeDown',
      'toggleMute',
      'toggleFullscreen',
      'toggleSubtitles',
      'toggleTheater',
      'showShortcuts',
    ];

    expect(Object.keys(SHORTCUT_DEFINITIONS)).toHaveLength(10);
    for (const action of requiredActions) {
      expect(SHORTCUT_DEFINITIONS[action]).toBeDefined();
      expect(SHORTCUT_DEFINITIONS[action].label).toBeTruthy();
      expect(SHORTCUT_DEFINITIONS[action].defaultKeys.length).toBeGreaterThan(0);
      expect(DEFAULT_SHORTCUTS[action]).toBeDefined();
    }
  });

  it('T1-SHORTCUT-02: formats key badges accurately for display in settings and HUD', () => {
    expect(formatKeyLabel(' ')).toBe('Space');
    expect(formatKeyLabel('Space')).toBe('Space');
    expect(formatKeyLabel('arrowleft')).toBe('←');
    expect(formatKeyLabel('arrowright')).toBe('→');
    expect(formatKeyLabel('arrowup')).toBe('↑');
    expect(formatKeyLabel('arrowdown')).toBe('↓');
    expect(formatKeyLabel('escape')).toBe('Esc');
    expect(formatKeyLabel('k')).toBe('K');
    expect(formatKeyLabel('m')).toBe('M');
  });

  it('T1-SHORTCUT-03: identifies modifier keys to prevent accidental bare binding', () => {
    expect(isModifierKey('Shift')).toBe(true);
    expect(isModifierKey('Control')).toBe(true);
    expect(isModifierKey('Alt')).toBe(true);
    expect(isModifierKey('Meta')).toBe(true);
    expect(isModifierKey('k')).toBe(false);
    expect(isModifierKey(' ')).toBe(false);
  });

  it('T1-SHORTCUT-04: matches default shortcuts case-insensitively with primary and secondary keys', () => {
    const spaceEvent = { key: ' ' } as KeyboardEvent;
    const kEvent = { key: 'K' } as KeyboardEvent;
    const arrowLeftEvent = { key: 'ArrowLeft' } as KeyboardEvent;
    const jEvent = { key: 'j' } as KeyboardEvent;
    const zEvent = { key: 'z' } as KeyboardEvent;

    expect(matchesShortcut(spaceEvent, 'togglePlay')).toBe(true);
    expect(matchesShortcut(kEvent, 'togglePlay')).toBe(true);
    expect(matchesShortcut(arrowLeftEvent, 'seekBackward')).toBe(true);
    expect(matchesShortcut(jEvent, 'seekBackward')).toBe(true);
    expect(matchesShortcut(zEvent, 'togglePlay')).toBe(false);
  });

  it('T1-SHORTCUT-05: detects conflicting keybindings across actions', () => {
    // 'm' is bound to toggleMute by default
    const conflict = findConflictingAction('m', 'togglePlay');
    expect(conflict).toBe('toggleMute');

    // 'z' is unbound by default
    const noConflict = findConflictingAction('z', 'togglePlay');
    expect(noConflict).toBeNull();
  });

  it('T1-SHORTCUT-06: modifies, persists, and resets shortcuts via useAppStore', () => {
    const store = useAppStore.getState();

    // Verify initial state
    expect(store.customShortcuts.togglePlay).toEqual([' ', 'k']);

    // Reassign Play/Pause to 'p'
    store.updateShortcut('togglePlay', ['p']);
    const updated = useAppStore.getState().customShortcuts;
    expect(updated.togglePlay).toEqual(['p']);

    // Test matchesShortcut with overridden shortcut
    const pEvent = { key: 'P' } as KeyboardEvent;
    const spaceEvent = { key: ' ' } as KeyboardEvent;
    expect(matchesShortcut(pEvent, 'togglePlay', updated)).toBe(true);
    expect(matchesShortcut(spaceEvent, 'togglePlay', updated)).toBe(false);

    // Reset shortcuts to default
    store.resetShortcuts();
    const reset = useAppStore.getState().customShortcuts;
    expect(reset.togglePlay).toEqual([' ', 'k']);
    expect(matchesShortcut(spaceEvent, 'togglePlay', reset)).toBe(true);
  });
});
