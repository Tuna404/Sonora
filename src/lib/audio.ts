import type { SynthResult } from "./types";

/** Decode a base64 payload from the Rust backend into raw bytes. */
export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Decode a synth/load response into WAV bytes. */
export function toWavBytes(result: SynthResult): Uint8Array<ArrayBuffer> {
  return base64ToBytes(result.audio);
}

/** Create a playable object URL for WAV bytes. Caller owns and must revoke it. */
export function createWavUrl(bytes: Uint8Array<ArrayBuffer>): string {
  return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
}
