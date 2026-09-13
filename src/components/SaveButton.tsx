import { invoke } from "@tauri-apps/api/core";

interface Props {
  wavBytes: Uint8Array;
  name: string;
}

function SaveButton(props: Props) {
  async function handleSave() {
    try {
      await invoke("save_audio", {
        data: Array.from(props.wavBytes),
        defaultName: props.name.slice(0, 60),
      });
    } catch (e) {
      if (e !== "Cancelled") console.error(e);
    }
  }

  return (
    <button
      onClick={handleSave}
      class="flex items-center gap-2 whitespace-nowrap rounded-md border border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
    >
      <svg
        class="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Save
    </button>
  );
}

export default SaveButton;
