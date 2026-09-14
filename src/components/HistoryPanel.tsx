import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

interface HistoryEntry {
  id: string;
  text: string;
  voice: string;
  timestamp: number;
}

interface Props {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

function relTime(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

function HistoryPanel(props: Props) {
  const [playingId, setPlayingId] = createSignal<string | null>(null);
  const [audioUrl, setAudioUrl] = createSignal<string | null>(null);
  let audioRef: HTMLAudioElement | undefined;

  async function handlePlay(entry: HistoryEntry) {
    if (playingId() === entry.id) {
      audioRef?.pause();
      setPlayingId(null);
      return;
    }
    try {
      const result = await invoke<{ audio: string; format: string; sample_rate: number }>(
        "load_history_audio",
        { id: entry.id },
      );
      const binary = atob(result.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setPlayingId(entry.id);
      setTimeout(() => audioRef?.play(), 0);
    } catch (e) {
      console.error(e);
    }
  }

  function handleAudioEnded() {
    setPlayingId(null);
    if (audioUrl()) {
      URL.revokeObjectURL(audioUrl()!);
      setAudioUrl(null);
    }
  }

  return (
    <div class="flex flex-1 flex-col px-6 pt-4 pb-3">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-xs font-semibold tracking-widest text-gray-500 uppercase">
          History ({props.entries.length})
        </h2>
        {props.entries.length > 0 && (
          <p class="text-xs text-gray-700">Click an entry to edit and regenerate</p>
        )}
      </div>
      <audio ref={audioRef} src={audioUrl() ?? undefined} onEnded={handleAudioEnded} class="hidden" />
      {props.entries.length === 0 ? (
        <div class="flex flex-1 items-center justify-center">
          <p class="text-sm text-gray-600">No generations yet</p>
        </div>
      ) : (
        <div class="flex flex-1 flex-col gap-1 overflow-y-auto">
          {props.entries.map((entry) => (
            <div
              title="Click to edit and regenerate"
              onClick={() => props.onSelect(entry)}
              class="flex cursor-pointer flex-col gap-0.5 rounded-md border border-gray-800 px-3 py-2 transition-colors hover:border-gray-700 hover:bg-gray-900"
            >
              <div class="flex items-center gap-2">
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handlePlay(entry)}
                    class="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                    title={playingId() === entry.id ? "Stop" : "Play"}
                  >
                    {playingId() === entry.id ? (
                      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <span class="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 text-xs text-blue-400">
                  {entry.voice}
                </span>
                <p class="min-w-0 flex-1 truncate text-sm text-gray-100">{entry.text}</p>
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={async () => {
                      try {
                        await invoke("delete_history_entry", { id: entry.id });
                        props.onDelete(entry.id);
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    class="flex h-7 w-7 items-center justify-center rounded text-red-400 hover:bg-gray-800"
                    title="Delete"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <p class="pl-9 text-xs text-gray-600">{relTime(entry.timestamp)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;
