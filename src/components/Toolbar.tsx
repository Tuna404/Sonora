import type { JSX } from "solid-js";
import { IconHistory, IconSettings } from "./icons";

interface Props {
  historyActive: boolean;
  settingsActive: boolean;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

function ToolbarButton(props: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: JSX.Element;
}) {
  return (
    <button
      type="button"
      title={props.label}
      aria-label={props.label}
      aria-pressed={props.active}
      disabled={props.disabled}
      onClick={props.onClick}
      class={`flex h-7 w-7 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-[var(--control-hover)] hover:text-content disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-content-secondary ${
        props.active ? "bg-[var(--control-active)] text-content" : ""
      }`}
    >
      {props.children}
    </button>
  );
}

function Toolbar(props: Props) {
  return (
    <header
      data-tauri-drag-region="deep"
      class="flex h-11 shrink-0 items-center border-b border-separator bg-[var(--surface-translucent)] backdrop-blur-xl"
    >
      {/* Reserve space for the native macOS traffic lights. */}
      <div class="flex flex-1 items-center pl-[76px]" />
      <div class="shrink-0 text-center text-[13px] font-semibold text-content-secondary">
        KokoroU
      </div>
      {/* Symmetric flex-1 zone keeps the title centered. */}
      <div class="flex flex-1 items-center justify-end gap-2 pr-3">
        <ToolbarButton
          label="History"
          active={props.historyActive}
          onClick={props.onOpenHistory}
        >
          <IconHistory class="h-4 w-4" />
        </ToolbarButton>
        <div class="h-5 w-px bg-separator" />
        <ToolbarButton
          label="Settings"
          active={props.settingsActive}
          onClick={props.onOpenSettings}
        >
          <IconSettings class="h-4 w-4" />
        </ToolbarButton>
      </div>
    </header>
  );
}

export default Toolbar;
