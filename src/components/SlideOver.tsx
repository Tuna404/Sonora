import type { JSX } from "solid-js";
import { IconClose } from "./icons";

interface Props {
  title: string;
  onClose: () => void;
  children: JSX.Element;
}

/** Right-docked panel, e.g. the History surface. */
function SlideOver(props: Props) {
  return (
    <div class="fixed inset-0 z-50">
      <div
        class="animate-fade-in absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm"
        onClick={props.onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        class="animate-slide-in-right absolute right-0 top-0 flex h-full w-[360px] max-w-[calc(100vw-2rem)] flex-col border-l border-separator bg-surface-elevated shadow-[0_0_60px_rgba(0,0,0,0.35)]"
      >
        <div class="flex shrink-0 items-center border-b border-separator px-4 py-2.5">
          <h2 class="flex-1 text-[13px] font-semibold text-content">{props.title}</h2>
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close"
            class="flex h-6 w-6 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-[var(--control-hover)] hover:text-content"
          >
            <IconClose class="h-4 w-4" />
          </button>
        </div>
        <div class="flex min-h-0 flex-1 flex-col">{props.children}</div>
      </aside>
    </div>
  );
}

export default SlideOver;
