# KokoroU

A Tauri v2 desktop app for generating speech from text using the Kokoro TTS model.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Desktop shell | Tauri v2 (Rust) |
| Frontend | SolidJS + Tailwind CSS v4 |
| TTS engine | `kokoro-en` (Rust crate, ONNX Runtime) |
| Model | Kokoro-82M fp32 (~325 MB) |
| Font | Inter (Google Fonts) |

## Architecture

```
┌─────────────────────────────────────────┐
│           Tauri App (KokoroU)          │
│                                         │
│  ┌───────────┐      ┌──────────────┐   │
│  │ SolidJS   │◄────►│ Rust Backend │   │
│  │ Tailwind  │ Tauri│ (kokoro-en)  │   │
│  └───────────┘ cmds └──────┬───────┘   │
│                            │            │
│  Bundled: model.onnx       │            │
│           voices/*.bin     │            │
└─────────────────────────────────────────┘
```

The TTS engine runs **in-process** via the `kokoro-en` crate — no sidecar, no HTTP, no Python. The Rust backend manages the model lifecycle and exposes Tauri commands to the frontend.

## Tauri Commands

| Command | Args | Returns |
|---------|------|---------|
| `list_voices` | — | `Vec<String>` (voice names) |
| `synth` | `text: String`, `voice: String` | `SynthResult` (base64 WAV) |
| `save_audio` | `data: Vec<u8>`, `default_name: String` | saved file path |

Handlers live in `src-tauri/src/commands.rs`. The `KokoroTts` instance is managed as Tauri state.

## Frontend Components (`src/components/`)

| Component | Role |
|-----------|------|
| `VoiceSelector` | Inline dropdown populated from `list_voices` |
| `TextInput` | Full-height textarea that fills available space |
| `GenerateButton` | Inline button, calls `synth`, shows loading spinner |
| `AudioPlayer` | Raw `<audio>` element with native controls |
| `SaveButton` | Inline button, opens OS save dialog, writes WAV |

Root component `App.tsx` composes these. State managed with Solid signals — no store/router needed.

## UI Layout

Dark theme (`bg-gray-950`), Inter font, `rounded-md` corners, no gradients.

```
┌──────────────────────────────────────────┐
│  KOKORO                    (thin header) │
├──────────────────────────────────────────┤
│                                          │
│  ┌── textarea (fills window height) ──┐  │
│  │  Enter text to speak...            │  │
│  │                                     │  │
│  └─────────────────────────────────────┘  │
│                                          │
│  Voice [af_heart ▼]   [🔊 Generate]     │
│                                          │
├──────────────────────────────────────────┤
│  ▶  ═══════●══════  0:00/3:45  [Save]   │
└──────────────────────────────────────────┘
```

Controls sit below the textarea in a single row. After generation, the bottom bar appears with the audio player and save button.

## Project Structure

```
kokorou/
├── src/
│   ├── index.tsx
│   ├── index.css              # @import "tailwindcss", Inter font, kokoro color palette
│   ├── App.tsx                # root: composes all components
│   └── components/
│       ├── VoiceSelector.tsx
│       ├── TextInput.tsx
│       ├── GenerateButton.tsx
│       ├── AudioPlayer.tsx
│       └── SaveButton.tsx
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs             # Tauri setup, init KokoroTts as state
│   │   └── commands.rs        # list_voices, synth, save_audio
│   ├── resources/
│   │   ├── model.onnx         # fp32 (~325 MB, downloaded)
│   │   └── voices/            # all 55 *.bin voice files (downloaded)
│   ├── Cargo.toml             # +kokoro-en, base64, hound, tauri-plugin-dialog
│   └── tauri.conf.json
├── scripts/
│   └── download-models.sh     # dynamically fetches model + 55 voices from HF API
├── package.json               # +@tauri-apps/plugin-dialog
├── vite.config.ts
├── tsconfig.json
├── .gitignore
└── AGENTS.md
```

## Data Flow

1. App starts → Rust `setup()` initializes `KokoroTts` with model + voices paths
2. Frontend calls `list_voices` → dropdown populated
3. User selects voice, enters text, clicks Generate
4. Frontend calls `synth(text, voice)` → Rust runs `tts.synth()` → returns base64 WAV
5. Frontend decodes base64 into `Uint8Array`, creates `Blob` → sets `<audio>` src as blob URL
6. User clicks Save → frontend sends raw `Uint8Array` to `save_audio()` → Rust opens OS dialog → writes WAV to disk

## Model Setup

Model files from [onnx-community/Kokoro-82M-v1.0-ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX):

- `onnx/model.onnx` → full precision fp32 (~325 MB)
- `voices/*.bin` → all voice packs (~55 voices)

Run `scripts/download-models.sh` after cloning to fetch them. The script uses the Hugging Face API to discover available voice files dynamically.

Files under `src-tauri/resources/` are gitignored — must be downloaded locally.

## Commands

```sh
bun install
./scripts/download-models.sh
bun tauri dev
```

## Agent Rules

1. **Think first** — understand the full context before writing code
2. **Do we need this?** — question every addition; remove what isn't needed
3. **Can we make it shorter?** — prefer simpler, smaller solutions
4. **Test before finalizing** — run build checks, handle edge cases
5. **Follow existing patterns** — match code style, naming, conventions
