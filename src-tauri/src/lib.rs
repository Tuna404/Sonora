mod commands;

use kokoro_en::KokoroTts;
use std::path::{Path, PathBuf};
use tauri::Manager;

pub struct AppState {
    pub tts: KokoroTts,
    pub voices: Vec<String>,
}

fn resolve_resource(dir: &Path, name: &str) -> PathBuf {
    let candidates = [
        dir.join(name),
        dir.join("resources").join(name),
    ];
    candidates.iter().find(|p| p.exists()).cloned().unwrap_or_else(|| candidates[0].clone())
}

fn collect_voices(voices_path: &Path) -> Vec<String> {
    let mut voices = Vec::new();
    if let Ok(entries) = std::fs::read_dir(voices_path) {
        for entry in entries.flatten() {
            if entry.path().extension().is_some_and(|e| e == "bin") {
                if let Some(stem) = entry.path().file_stem().and_then(|s| s.to_str()) {
                    voices.push(stem.to_string());
                }
            }
        }
    }
    voices.sort();
    voices
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let resource_dir = app.path().resource_dir()?;
            let model_path = resolve_resource(&resource_dir, "model.onnx");
            let voices_path = resolve_resource(&resource_dir, "voices");

            let voices = collect_voices(&voices_path);

            let tts = tauri::async_runtime::block_on(
                KokoroTts::new(&model_path, &voices_path),
            )
            .expect("Failed to initialize KokoroTts");

            app.manage(AppState { tts, voices });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_voices,
            commands::synth,
            commands::save_audio,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
