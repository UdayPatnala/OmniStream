/**
 * OmniStream Universal Keyboard Shortcut Manager
 * Standardized across U-Tube Player, CineMorph Theater, and Workstation Shell.
 */

export type ShortcutAction =
  | 'togglePlay'
  | 'seekBackward'
  | 'seekForward'
  | 'volumeUp'
  | 'volumeDown'
  | 'toggleMute'
  | 'toggleFullscreen'
  | 'toggleSubtitles'
  | 'toggleTheater'
  | 'showShortcuts';

export interface ShortcutDefinition {
  id: ShortcutAction;
  label: string;
  description: string;
  category: 'Playback' | 'Audio' | 'Screen' | 'System';
  defaultKeys: string[];
}

export const SHORTCUT_DEFINITIONS: Record<ShortcutAction, ShortcutDefinition> = {
  togglePlay: {
    id: 'togglePlay',
    label: 'Play / Pause',
    description: 'Toggle video playback state',
    category: 'Playback',
    defaultKeys: [' ', 'k'],
  },
  seekBackward: {
    id: 'seekBackward',
    label: 'Seek Backward',
    description: 'Jump back 10 seconds',
    category: 'Playback',
    defaultKeys: ['j', 'arrowleft'],
  },
  seekForward: {
    id: 'seekForward',
    label: 'Seek Forward',
    description: 'Jump forward 10 seconds',
    category: 'Playback',
    defaultKeys: ['l', 'arrowright'],
  },
  volumeUp: {
    id: 'volumeUp',
    label: 'Volume Up',
    description: 'Increase volume by 5%',
    category: 'Audio',
    defaultKeys: ['arrowup'],
  },
  volumeDown: {
    id: 'volumeDown',
    label: 'Volume Down',
    description: 'Decrease volume by 5%',
    category: 'Audio',
    defaultKeys: ['arrowdown'],
  },
  toggleMute: {
    id: 'toggleMute',
    label: 'Mute / Unmute',
    description: 'Toggle audio output mute state',
    category: 'Audio',
    defaultKeys: ['m'],
  },
  toggleFullscreen: {
    id: 'toggleFullscreen',
    label: 'Toggle Fullscreen',
    description: 'Enter or exit full viewport projection',
    category: 'Screen',
    defaultKeys: ['f'],
  },
  toggleSubtitles: {
    id: 'toggleSubtitles',
    label: 'Toggle Subtitles',
    description: 'Turn captions on or off',
    category: 'Screen',
    defaultKeys: ['c'],
  },
  toggleTheater: {
    id: 'toggleTheater',
    label: 'Theater Mode',
    description: 'Switch presentation / theater aperture',
    category: 'Screen',
    defaultKeys: ['t'],
  },
  showShortcuts: {
    id: 'showShortcuts',
    label: 'Shortcuts Guide',
    description: 'Display keyboard shortcuts HUD overlay',
    category: 'System',
    defaultKeys: ['h', '?'],
  },
};

export const DEFAULT_SHORTCUTS: Record<ShortcutAction, string[]> = {
  togglePlay: [' ', 'k'],
  seekBackward: ['j', 'arrowleft'],
  seekForward: ['l', 'arrowright'],
  volumeUp: ['arrowup'],
  volumeDown: ['arrowdown'],
  toggleMute: ['m'],
  toggleFullscreen: ['f'],
  toggleSubtitles: ['c'],
  toggleTheater: ['t'],
  showShortcuts: ['h', '?'],
};

/**
 * Normalizes a raw key string to lowercase trimmed representation.
 */
export function normalizeKey(key: string): string {
  if (!key) return '';
  if (key === ' ' || key === 'Space' || key === 'Spacebar') return ' ';
  return key.trim().toLowerCase();
}

/**
 * Formats a key representation into an aesthetic badge label.
 */
export function formatKeyLabel(key: string): string {
  const norm = normalizeKey(key);
  switch (norm) {
    case ' ':
      return 'Space';
    case 'arrowleft':
      return '←';
    case 'arrowright':
      return '→';
    case 'arrowup':
      return '↑';
    case 'arrowdown':
      return '↓';
    case 'escape':
      return 'Esc';
    case 'enter':
      return 'Enter';
    case 'tab':
      return 'Tab';
    case 'backspace':
      return '⌫';
    default:
      return norm.toUpperCase();
  }
}

/**
 * Checks if a key represents an ignored modifier key.
 */
export function isModifierKey(key: string): boolean {
  const norm = normalizeKey(key);
  return ['shift', 'control', 'alt', 'meta', 'capslock'].includes(norm);
}

/**
 * Tests whether a keyboard event matches a configured action.
 */
export function matchesShortcut(
  event: KeyboardEvent,
  action: ShortcutAction,
  shortcutsMap?: Partial<Record<ShortcutAction, string[]>>
): boolean {
  if (!event || !event.key) return false;

  const currentKey = normalizeKey(event.key);
  const activeKeys = shortcutsMap?.[action] ?? DEFAULT_SHORTCUTS[action];

  if (!activeKeys || activeKeys.length === 0) return false;

  return activeKeys.some((k) => normalizeKey(k) === currentKey);
}

/**
 * Finds if a given key is already bound to an action other than the excluded one.
 */
export function findConflictingAction(
  key: string,
  excludeAction: ShortcutAction,
  shortcutsMap?: Partial<Record<ShortcutAction, string[]>>
): ShortcutAction | null {
  const norm = normalizeKey(key);
  if (!norm) return null;

  const active = { ...DEFAULT_SHORTCUTS, ...shortcutsMap };
  for (const [action, keys] of Object.entries(active)) {
    if (action === excludeAction) continue;
    if (keys.some((k) => normalizeKey(k) === norm)) {
      return action as ShortcutAction;
    }
  }
  return null;
}
