import { Show } from "solid-js";
import VoiceSelector from "./VoiceSelector";
import SpeedControl from "./SpeedControl";
import GenerateButton from "./GenerateButton";
import { IconNew } from "./icons";

interface Props {
  voices: string[];
  voice: string;
  onVoiceChange: (v: string) => void;
  speed: number;
  onSpeedChange: (v: number) => void;
  length: number;
  maxLength: number;
  canClear: boolean;
  onClear: () => void;
  canNew: boolean;
  onNew: () => void;
  onGenerate: () => void;
  loading: boolean;
  canGenerate: boolean;
}

function ControlBar(props: Props) {
  return (
    <div class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-separator bg-[var(--surface-translucent)] px-4 py-2.5 backdrop-blur-xl">
      <VoiceSelector
        voices={props.voices}
        value={props.voice}
        onChange={props.onVoiceChange}
      />
      <SpeedControl value={props.speed} onChange={props.onSpeedChange} />
      <span
        class={`ml-auto text-[11px] tabular-nums ${
          props.length >= props.maxLength
            ? "text-danger"
            : "text-content-tertiary"
        }`}
      >
        {props.length}/{props.maxLength}
      </span>
      <button
        type="button"
        onClick={props.onNew}
        disabled={!props.canNew}
        title="New (⌘N)"
        class="flex h-7 items-center gap-1.5 rounded-md border border-[var(--control-border)] bg-[var(--control)] px-3 text-[13px] font-medium text-content transition-colors hover:bg-[var(--control-hover)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--control)]"
      >
        <IconNew class="h-4 w-4" />
        New
      </button>
      <Show when={props.canClear}>
        <button
          type="button"
          onClick={props.onClear}
          class="h-7 rounded-md border border-[var(--control-border)] bg-[var(--control)] px-3 text-[13px] font-medium text-content transition-colors hover:bg-[var(--control-hover)]"
        >
          Clear
        </button>
      </Show>
      <GenerateButton
        onClick={props.onGenerate}
        loading={props.loading}
        disabled={!props.canGenerate}
      />
    </div>
  );
}

export default ControlBar;
