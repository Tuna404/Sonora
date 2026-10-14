/** True on macOS, where the app draws its own chrome under the native traffic lights. */
export function isMacOS(): boolean {
  return /mac/i.test(navigator.userAgent);
}

/**
 * Format a keyboard shortcut for tooltips. macOS uses the bare `⌘` convention
 * (`⌘N`); other platforms spell out the modifier (`Ctrl+N`).
 */
export function formatShortcut(key: string): string {
  return isMacOS() ? `⌘${key}` : `Ctrl+${key}`;
}
