import { createSignal, createEffect } from "solid-js";
import { MAX_TEXT_CHARS } from "../lib/constants";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  refocusKey?: number;
}

function TextInput(props: Props) {
  let ref: HTMLTextAreaElement | undefined;
  const [dragging, setDragging] = createSignal(false);

  createEffect(() => {
    if (props.refocusKey) ref?.focus();
  });

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      props.onSubmit?.();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const el = ref;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const val = el.value;
      el.value = val.slice(0, start) + "\t" + val.slice(end);
      el.selectionStart = el.selectionEnd = start + 1;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function handleDragOver(e: DragEvent) {
    if (!e.dataTransfer?.types.includes("Files")) return;
    // Required so the browser allows the drop.
    e.preventDefault();
    setDragging(true);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".txt")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      props.onChange(text.slice(0, MAX_TEXT_CHARS));
    };
    reader.readAsText(file);
  }

  return (
    <div class="relative flex flex-1 flex-col">
      <textarea
        ref={ref}
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        placeholder="Enter text to speak... (or drop a .txt file)"
        maxLength={MAX_TEXT_CHARS}
        class={
          "w-full flex-1 resize-none rounded-lg border bg-[var(--editor)] p-4 text-[13px] leading-relaxed text-content placeholder:text-content-tertiary focus:border-[var(--focus-border)] focus:outline-none " +
          (dragging() ? "border-[var(--focus-border)]" : "border-separator")
        }
      />
      {dragging() && (
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-[var(--focus-border)] bg-[var(--surface-translucent)] backdrop-blur-sm">
          <span class="text-[13px] font-medium text-content-secondary">
            Drop .txt to load
          </span>
        </div>
      )}
    </div>
  );
}

export default TextInput;
