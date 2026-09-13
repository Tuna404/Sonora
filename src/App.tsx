import { createSignal, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import VoiceSelector from "./components/VoiceSelector";
import TextInput from "./components/TextInput";
import GenerateButton from "./components/GenerateButton";
import AudioPlayer from "./components/AudioPlayer";
import SaveButton from "./components/SaveButton";

interface SynthResult {
  audio: string;
  format: string;
  sample_rate: number;
}

function App() {
  const [voices, setVoices] = createSignal<string[]>([]);
  const [selectedVoice, setSelectedVoice] = createSignal("");
  const [text, setText] = createSignal("");
  const [audioUrl, setAudioUrl] = createSignal<string | null>(null);
  const [wavBytes, setWavBytes] = createSignal<Uint8Array | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const v = await invoke<string[]>("list_voices");
      setVoices(v);
      if (v.length > 0) setSelectedVoice(v[0]);
    } catch (e) {
      setError(String(e));
    }
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
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="flex h-screen flex-col bg-gray-950">
      <header class="flex items-center border-b border-gray-800 px-6 py-1.5">
        <h1 class="text-xs font-semibold tracking-widest text-gray-500 uppercase">
          KokoroU
        </h1>
      </header>

      <main class="flex min-h-0 flex-1 flex-col">
        <div class="flex flex-1 flex-col px-6 pt-4 pb-3">
          <TextInput value={text()} onChange={setText} />
        </div>

        <div class="flex items-center gap-4 px-6 pb-4">
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
          {error() && (
            <p class="text-sm text-red-400">{error()}</p>
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
    </div>
  );
}

export default App;
