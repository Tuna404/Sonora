import { invoke } from "@tauri-apps/api/core";
import { recordingName } from "../lib/format";
import { IconDownload } from "./icons";

interface Props {
  wavBytes: Uint8Array;
}

function SaveButton(props: Props) {
  async function handleSave() {
    try {
      await invoke("save_audio", {
        data: Array.from(props.wavBytes),
        defaultName: recordingName(),
      });
    } catch (e) {
      if (e !== "Cancelled") console.error(e);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      class="flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--control-border)] bg-[var(--control)] px-3 text-[13px] font-medium text-content transition-colors hover:bg-[var(--control-hover)]"
    >
      <IconDownload class="h-4 w-4" />
      Save
    </button>
  );
}

export default SaveButton;
