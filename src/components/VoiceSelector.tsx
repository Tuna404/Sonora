import { createSignal, createEffect, createMemo, For } from "solid-js";
import { IconChevronDown } from "./icons";

function groupPrefix(v: string): string {
  const i = v.indexOf("_");
  return i > 0 ? v.slice(0, i) : "other";
}

function voiceGroups(voices: string[]): [string, string[]][] {
  const groups = new Map<string, string[]>();
  for (const v of voices) {
    const key = groupPrefix(v);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(v);
  }
  return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

interface Props {
  voices: string[];
  value: string;
  onChange: (v: string) => void;
}

function VoiceSelector(props: Props) {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [activeIndex, setActiveIndex] = createSignal(0);
  let ref: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (open()) {
      inputRef?.focus();
      const handler = (e: FocusEvent) => {
        if (ref && !ref.contains(e.relatedTarget as Node)) {
          setOpen(false);
          setQuery("");
        }
      };
      ref!.addEventListener("focusout", handler);
      return () => ref!.removeEventListener("focusout", handler);
    } else {
      setQuery("");
    }
  });

  // Group matches for display, tracking each group's offset so the active
  // keyboard index maps onto the flattened option list.
  const grouped = createMemo(() => {
    const q = query().toLowerCase();
    const groups: [string, string[]][] = !q
      ? voiceGroups(props.voices)
      : (() => {
          const matching = props.voices.filter((v) =>
            v.toLowerCase().includes(q),
          );
          return matching.length ? [["", matching] as [string, string[]]] : [];
        })();

    let start = 0;
    return groups.map(([group, items]) => {
      const g = { group, items, start };
      start += items.length;
      return g;
    });
  });

  const flat = createMemo(() => grouped().flatMap((g) => g.items));

  createEffect(() => {
    query();
    setActiveIndex(0);
  });

  createEffect(() => {
    if (open()) setActiveIndex(0);
  });

  function select(v: string) {
    props.onChange(v);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open()) {
        setOpen(true);
        return;
      }
      const options = flat();
      if (options.length === 0) return;
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => {
        const next = i + delta;
        if (next < 0) return options.length - 1;
        if (next >= options.length) return 0;
        return next;
      });
      return;
    }
    if (e.key === "Enter") {
      if (!open()) {
        setOpen(true);
        return;
      }
      e.preventDefault();
      const v = flat()[activeIndex()];
      if (v) select(v);
    }
  }

  return (
    <div class="flex items-center gap-2">
      <label class="shrink-0 text-[11px] font-medium text-content-secondary">
        Voice
      </label>
      <div
        ref={ref}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        class="relative h-7 min-w-[170px] cursor-pointer"
      >
        <div
          onClick={() => setOpen(!open())}
          class="flex h-full items-center justify-between gap-3 rounded-md border border-[var(--control-border)] bg-[var(--control)] px-2 text-[13px]"
        >
          <span class={props.value ? "text-content" : "text-content-tertiary"}>
            {props.value || `Select a voice (${props.voices.length})...`}
          </span>
          <IconChevronDown
            class={`h-3.5 w-3.5 text-content-tertiary transition-transform ${open() ? "rotate-180" : ""}`}
          />
        </div>
        {open() && (
          <ul
            role="listbox"
            class="absolute bottom-full left-0 right-0 z-10 mb-1 max-h-56 overflow-y-auto rounded-md border border-separator bg-surface-elevated py-1 shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
          >
            <li class="sticky -top-px border-b border-separator bg-surface-elevated px-1">
              <input
                ref={inputRef}
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                placeholder="Search voices..."
                class="w-full rounded border border-transparent bg-transparent px-1 py-1.5 text-[13px] text-content placeholder:text-content-tertiary focus:border-[var(--focus-border)] focus:outline-none"
              />
            </li>
            {grouped().length === 0 ? (
              <li class="px-2 py-1.5 text-[13px] text-content-tertiary">
                No matches
              </li>
            ) : (
              <For each={grouped()}>
                {(g) => (
                  <>
                    {g.group && (
                      <li class="sticky top-[33px] border-b border-separator bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
                        {g.group}
                      </li>
                    )}
                    <For each={g.items}>
                      {(v, i) => {
                        const active = () => g.start + i() === activeIndex();
                        return (
                          <li
                            role="option"
                            aria-selected={v === props.value}
                            onMouseEnter={() => setActiveIndex(g.start + i())}
                            onClick={() => select(v)}
                            class={`cursor-pointer border-b border-separator px-2 py-1.5 text-[13px] last:border-b-0 ${
                              active() ? "bg-[var(--control-active)]" : "hover:bg-[var(--control-hover)]"
                            } ${v === props.value ? "text-accent" : "text-content"}`}
                          >
                            {v}
                          </li>
                        );
                      }}
                    </For>
                  </>
                )}
              </For>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default VoiceSelector;
