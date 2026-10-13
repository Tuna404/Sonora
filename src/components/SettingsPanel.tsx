import { createSignal, createEffect, onCleanup, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Settings } from "../lib/types";
import { IconClose } from "./icons";

interface Props {
  voices: string[];
  settings: Settings | null;
  onSettingsChange: (s: Settings) => void;
  onClose: () => void;
  onError?: (message: string) => void;
}

const DEFAULTS: Settings = {
  default_voice: null,
  default_speed: 1.0,
  audio_format: "wav",
  default_directory: null,
};

const FORMATS = [{ value: "wav", label: "WAV" }];

const fieldClass =
  "rounded-md border border-[var(--control-border)] bg-[var(--control)] px-2 py-1 text-[13px] text-content";

function SettingsPanel(props: Props) {
  const [draft, setDraft] = createSignal<Settings>(DEFAULTS);
  const [busy, setBusy] = createSignal<null | "save" | "reset">(null);
  const [notice, setNotice] = createSignal<string | null>(null);
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;

  onCleanup(() => {
    clearTimeout(closeTimer);
    clearTimeout(noticeTimer);
  });

  // Seed the editable draft from the app-owned settings (loaded once on startup).
  createEffect(() => {
    const s = props.settings;
    if (s) setDraft(s);
  });

  function update(partial: Partial<Settings>) {
    setDraft((s) => ({ ...s, ...partial }));
  }

  async function save() {
    clearTimeout(closeTimer);
    setBusy("save");
    try {
      await invoke("save_settings", { settings: draft() });
      props.onSettingsChange(draft());
      setNotice("Saved");
      closeTimer = setTimeout(() => props.onClose(), 700);
    } catch (e) {
      props.onError?.(String(e));
    } finally {
      setBusy(null);
    }
  }

  async function reset() {
    clearTimeout(closeTimer);
    setDraft(DEFAULTS);
    setBusy("reset");
    try {
      await invoke("save_settings", { settings: DEFAULTS });
      props.onSettingsChange(DEFAULTS);
      setNotice("Reset");
      noticeTimer = setTimeout(() => setNotice(null), 1200);
    } catch (e) {
      props.onError?.(String(e));
    } finally {
      setBusy(null);
    }
  }

  async function pickDirectory() {
    const dir = await open({
      directory: true,
      multiple: false,
      title: "Choose default save location",
    });
    if (dir) update({ default_directory: dir });
  }

  return (
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3">
        <label class="text-[12px] font-medium text-content-secondary">
          Default voice
        </label>
        <select
          value={draft().default_voice ?? ""}
          onChange={(e) => update({ default_voice: e.currentTarget.value || null })}
          class={fieldClass}
        >
          <option value="">None (first)</option>
          {props.voices.map((v) => (
            <option value={v}>{v}</option>
          ))}
        </select>

        <label class="text-[12px] font-medium text-content-secondary">Speed</label>
        <div class="flex items-center gap-2">
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={draft().default_speed}
            onInput={(e) => update({ default_speed: parseFloat(e.currentTarget.value) })}
            class="h-1 w-28 cursor-pointer appearance-none rounded-full bg-[var(--control-border)] accent-[var(--accent)]"
          />
          <span class="w-8 text-[12px] tabular-nums text-content-secondary">
            {draft().default_speed.toFixed(1)}×
          </span>
        </div>

        <label class="text-[12px] font-medium text-content-secondary">Format</label>
        <select
          value={draft().audio_format}
          onChange={(e) => update({ audio_format: e.currentTarget.value })}
          class={`w-20 ${fieldClass}`}
        >
          {FORMATS.map((f) => (
            <option value={f.value}>{f.label}</option>
          ))}
        </select>

        <label class="text-[12px] font-medium text-content-secondary">Save to</label>
        <div class="flex min-w-0 items-center gap-1.5">
          <span class="flex-1 truncate rounded-md border border-separator bg-[var(--editor)] px-2 py-1 text-[13px] text-content-secondary">
            {draft().default_directory || "OS default"}
          </span>
          <button
            type="button"
            onClick={pickDirectory}
            class="rounded-md border border-[var(--control-border)] px-2 py-1 text-[13px] font-medium text-content transition-colors hover:bg-[var(--control-hover)]"
          >
            Change
          </button>
          {draft().default_directory && (
            <button
              type="button"
              onClick={() => update({ default_directory: null })}
              aria-label="Clear"
              title="Clear"
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-content-tertiary transition-colors hover:bg-[var(--control-hover)] hover:text-content"
            >
              <IconClose class="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div class="flex items-center justify-end gap-2">
        <Show when={notice()}>
          <span class="mr-auto text-[12px] font-medium text-accent">
            {notice()} ✓
          </span>
        </Show>
        <button
          type="button"
          onClick={reset}
          disabled={busy() !== null}
          class="rounded-md border border-[var(--control-border)] px-3 py-1 text-[13px] font-medium text-content-secondary transition-colors hover:bg-[var(--control-hover)] disabled:opacity-50"
        >
          {busy() === "reset" ? "Resetting…" : "Reset"}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy() !== null}
          class="rounded-md bg-accent px-3 py-1 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {busy() === "save" ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default SettingsPanel;
