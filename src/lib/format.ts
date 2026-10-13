function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Default file name for an exported recording, e.g. `Recording 2026-10-12 143005`. */
export function recordingName(date: Date = new Date()): string {
  return `Recording ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/** Same format as {@link recordingName}, from a Unix timestamp in seconds. */
export function recordingNameFromSeconds(ts: number): string {
  return recordingName(new Date(ts * 1000));
}

/** Compact relative age, e.g. `just now`, `5m ago`, `3d ago`. */
export function relativeTime(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString();
}
