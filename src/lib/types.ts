export interface SynthResult {
  audio: string;
  format: string;
  sample_rate: number;
}

export interface HistoryEntry {
  id: string;
  text: string;
  voice: string;
  timestamp: number;
}

/** Returned by `synth`: audio for immediate playback plus the persisted history entry. */
export interface SynthSaveResult extends SynthResult {
  entry: HistoryEntry;
}

export interface Settings {
  default_voice: string | null;
  default_speed: number;
  audio_format: string;
  default_directory: string | null;
}
