import { createSignal, createMemo, onCleanup, For, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { confirm } from "@tauri-apps/plugin-dialog";
import { toWavBytes, createWavUrl } from "../lib/audio";
import { recordingNameFromSeconds, relativeTime } from "../lib/format";
import type { HistoryEntry, SynthResult } from "../lib/types";
import { IconPlay, IconPause, IconDownload, IconTrash } from "./icons";

interface Props {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onError?: (message: string) => void;
}

function HistoryPanel(props: Props) {
  const [playingId, setPlayingId] = createSignal<string | null>(null);
  const [audioUrl, setAudioUrl] = createSignal<string | null>(null);
  const [query, setQuery] = createSignal("");
  let audioRef: HTMLAudioElement | undefined;

  function revokeCurrent() {
    const url = audioUrl();
    if (url) URL.revokeObjectURL(url);
    setAudioUrl(null);
  }

  onCleanup(revokeCurrent);

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase();
    if (!q) return props.entries;
    return props.entries.filter(
      (e) =>
        e.text.toLowerCase().includes(q) || e.voice.toLowerCase().includes(q),
    );
  });

  async function handlePlay(entry: HistoryEntry) {
    if (playingId() === entry.id) {
      audioRef?.pause();
      setPlayingId(null);
      return;
    }
    try {
      const result = await invoke<SynthResult>("load_history_audio", {
        id: entry.id,
      });
      revokeCurrent();
      setAudioUrl(createWavUrl(toWavBytes(result)));
      setPlayingId(entry.id);
      setTimeout(() => audioRef?.play(), 0);
    } catch (e) {
      props.onError?.(String(e));
    }
  }

  function handleAudioEnded() {
    setPlayingId(null);
    revokeCurrent();
  }

  return (
    <div class="flex min-h-0 flex-1 flex-col p-3">
      <div class="mb-2 flex items-center gap-2">
        <input
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          placeholder="Filter by text or voice..."
          class="min-w-0 flex-1 rounded-md border border-separator bg-[var(--editor)] px-2 py-1 text-[12px] text-content placeholder:text-content-tertiary focus:border-accent focus:outline-none"
        />
        <Show when={props.entries.length > 0}>
          <button
            type="button"
            onClick={async () => {
              if (
                await confirm("Delete all history entries?", {
                  title: "Clear History",
                  kind: "warning",
                })
              ) {
                props.onClearAll();
              }
            }}
            class="shrink-0 rounded-md border border-[var(--control-border)] px-2 py-1 text-[12px] text-danger transition-colors hover:bg-[var(--control-hover)]"
          >
            Clear all
          </button>
        </Show>
      </div>
      <audio
        ref={audioRef}
        src={audioUrl() ?? undefined}
        onEnded={handleAudioEnded}
        class="hidden"
      />
      <Show
        when={filtered().length > 0}
        fallback={
          <div class="flex flex-1 items-center justify-center">
            <p class="text-[12px] text-content-tertiary">
              {props.entries.length === 0 ? "No generations yet" : "No matches"}
            </p>
          </div>
        }
      >
        <div class="flex flex-1 flex-col gap-1 overflow-y-auto">
          <For each={filtered()}>
            {(entry) => (
              <div
                title="Click to edit and regenerate"
                onClick={() => props.onSelect(entry)}
                class="flex cursor-pointer items-center gap-2 rounded-md border border-separator px-2 py-1.5 transition-colors hover:bg-[var(--control-hover)]"
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handlePlay(entry)}
                    aria-label={playingId() === entry.id ? "Stop" : "Play"}
                    title={playingId() === entry.id ? "Stop" : "Play"}
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-content-secondary transition-colors hover:bg-[var(--control-hover)] hover:text-content"
                  >
                    {playingId() === entry.id ? (
                      <IconPause class="h-3.5 w-3.5" />
                    ) : (
                      <IconPlay class="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <span class="shrink-0 rounded bg-[var(--control-hover)] px-1.5 py-0.5 text-[11px] text-accent">
                  {entry.voice}
                  <span class="ml-1 text-content-tertiary">
                    {relativeTime(entry.timestamp)}
                  </span>
                </span>
                <p class="min-w-0 flex-1 truncate text-[12px] text-content">
                  {entry.text}
                </p>
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      invoke("save_history_audio", {
                        id: entry.id,
                        defaultName: recordingNameFromSeconds(entry.timestamp),
                      }).catch((e) => {
                        if (e !== "Cancelled") console.error(e);
                      });
                    }}
                    aria-label="Download"
                    title="Download"
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-content-secondary transition-colors hover:bg-[var(--control-hover)] hover:text-content"
                  >
                    <IconDownload class="h-3.5 w-3.5" />
                  </button>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !(await confirm("Delete this entry?", {
                          title: "Delete Entry",
                          kind: "warning",
                        }))
                      )
                        return;
                      try {
                        await invoke("delete_history_entry", { id: entry.id });
                        if (playingId() === entry.id) {
                          setPlayingId(null);
                          revokeCurrent();
                        }
                        props.onDelete(entry.id);
                      } catch (e) {
                        props.onError?.(String(e));
                      }
                    }}
                    aria-label="Delete"
                    title="Delete"
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-danger transition-colors hover:bg-[var(--control-hover)]"
                  >
                    <IconTrash class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

export default HistoryPanel;
