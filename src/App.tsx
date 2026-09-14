import { createSignal, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import VoiceSelector from "./components/VoiceSelector";
import TextInput from "./components/TextInput";
import GenerateButton from "./components/GenerateButton";
import AudioPlayer from "./components/AudioPlayer";
import SaveButton from "./components/SaveButton";
import HistoryPanel from "./components/HistoryPanel";

interface SynthResult {
  audio: string;
  format: string;
  sample_rate: number;
}

interface HistoryEntry {
  id: string;
  text: string;
  voice: string;
  timestamp: number;
}

type View = "generate" | "history";

function App() {
  const [voices, setVoices] = createSignal<string[]>([]);
  const [selectedVoice, setSelectedVoice] = createSignal("");
  const [text, setText] = createSignal("");
  const [audioUrl, setAudioUrl] = createSignal<string | null>(null);
  const [wavBytes, setWavBytes] = createSignal<Uint8Array | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [view, setView] = createSignal<View>("generate");
  const [history, setHistory] = createSignal<HistoryEntry[]>([]);

  async function loadHistory() {
    try {
      const h = await invoke<HistoryEntry[]>("get_history");
      setHistory(h);
    } catch (e) {
      console.error(e);
    }
  }

  onMount(async () => {
    try {
      const v = await invoke<string[]>("list_voices");
      setVoices(v);
      if (v.length > 0) setSelectedVoice(v[0]);
    } catch (e) {
      setError(String(e));
    }
    loadHistory();
  });

  async function handleGenerate() {
    if (!text().trim() || !selectedVoice()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<SynthResult>("synth", {
        text: text(),
        voice: selectedVoice(),
      });
      const binary = atob(result.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/wav" });
      setAudioUrl(URL.createObjectURL(blob));
      setWavBytes(bytes);

      try {
        await invoke("save_generation", {
          text: text(),
          voice: selectedVoice(),
          audio: Array.from(bytes),
        });
        loadHistory();
      } catch (e) {
        console.error("Save to history failed:", e);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleHistorySelect(entry: HistoryEntry) {
    setText(entry.text);
    setSelectedVoice(entry.voice);
    setView("generate");
    loadHistoryAudio(entry.id);
  }

  async function loadHistoryAudio(id: string) {
    try {
      const result = await invoke<SynthResult>("load_history_audio", { id });
      const binary = atob(result.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/wav" });
      setAudioUrl(URL.createObjectURL(blob));
      setWavBytes(bytes);
    } catch (e) {
      console.error(e);
    }
  }

  function handleHistoryDelete(id: string) {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }

  function tabClass(tab: View) {
    const active = view() === tab;
    return `px-4 py-1.5 text-sm transition-colors ${
      active
        ? "bg-gray-800 text-gray-100 font-medium"
        : "bg-gray-950 text-gray-500 hover:text-gray-300"
    }`;
  }

  return (
    <div class="flex h-screen flex-col bg-gray-950">
      <header class="flex flex-col items-center gap-3 pt-4 pb-2">
        <div class="border-2 border-gray-500 px-5 py-2">
          <h1 class="text-2xl font-bold">
            <span class="font-['Boldonse'] text-white">Kokoro</span>
            <span class="font-['Boldonse'] text-blue-400">U</span>
          </h1>
        </div>
        <div class="flex divide-x divide-gray-700 overflow-hidden rounded-md border border-gray-700">
          <button class={tabClass("generate")} onClick={() => setView("generate")}>
            Generate
          </button>
          <button class={tabClass("history")} onClick={() => setView("history")}>
            History
          </button>
        </div>
      </header>

      {view() === "generate" ? (
        <>
          <main class="flex min-h-0 flex-1 flex-col">
            <div class="flex flex-1 flex-col px-6 pt-4 pb-3">
              <TextInput value={text()} onChange={setText} />
            </div>

            <div class="flex items-center gap-4 px-6 pb-4">
              <div class="flex items-center gap-4 flex-1">
                <VoiceSelector
                  voices={voices()}
                  value={selectedVoice()}
                  onChange={setSelectedVoice}
                />
                <GenerateButton
                  onClick={handleGenerate}
                  loading={loading()}
                  disabled={!text().trim() || !selectedVoice()}
                />
                {error() && <p class="text-sm text-red-400">{error()}</p>}
              </div>
              {text().length > 0 && (
                <button
                  onClick={() => setText("")}
                  class="rounded-md border border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
                >
                  Clear
                </button>
              )}
            </div>
          </main>

          {audioUrl() && (
            <div class="flex items-center justify-between gap-4 border-t border-gray-800 px-6 py-3">
              <div class="flex-1">
                <AudioPlayer src={audioUrl()!} />
              </div>
              <SaveButton wavBytes={wavBytes()!} name={text().trim()} />
            </div>
          )}
        </>
      ) : (
        <HistoryPanel
          entries={history()}
          onSelect={handleHistorySelect}
          onDelete={handleHistoryDelete}
        />
      )}
    </div>
  );
}

export default App;
