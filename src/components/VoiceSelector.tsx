import { createSignal, createEffect } from "solid-js";

interface Props {
  voices: string[];
  value: string;
  onChange: (v: string) => void;
}

function VoiceSelector(props: Props) {
  const [open, setOpen] = createSignal(false);
  let ref: HTMLDivElement | undefined;

  createEffect(() => {
    if (open()) {
      const handler = (e: FocusEvent) => {
        if (ref && !ref.contains(e.relatedTarget as Node)) {
          setOpen(false);
        }
      };
      ref!.addEventListener("focusout", handler);
      return () => ref!.removeEventListener("focusout", handler);
    }
  });

  return (
    <div class="flex items-center gap-2">
      <label class="text-xs font-medium text-gray-400">
        Voice
      </label>
      <div
        ref={ref}
        tabIndex={0}
        class="relative h-9 min-w-[180px] cursor-pointer"
      >
        <div
          onClick={() => setOpen(!open())}
          class="flex h-full items-center justify-between gap-3 rounded-md border border-gray-700 bg-gray-800 px-2 text-sm text-gray-100"
        >
          <span class={props.value ? "text-gray-100" : "text-gray-500"}>
            {props.value || "Select a voice..."}
          </span>
          <svg
            class={`h-3 w-3 text-gray-400 transition-transform ${open() ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {open() && (
          <ul class="absolute bottom-full left-0 right-0 z-10 mb-1 max-h-48 overflow-y-auto rounded-md border border-gray-600 bg-gray-800 py-1 shadow-lg">
            {props.voices.map((v) => (
              <li
                role="option"
                aria-selected={v === props.value}
                onClick={() => { props.onChange(v); setOpen(false); }}
                class={`cursor-pointer border-b border-gray-700 px-2 py-1.5 text-sm last:border-b-0 hover:bg-gray-700 ${v === props.value ? "text-blue-400" : "text-gray-100"}`}
              >
                {v}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default VoiceSelector;
