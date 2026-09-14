use base64::Engine;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct SynthResult {
    pub audio: String,
    pub format: String,
    pub sample_rate: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HistoryEntry {
    pub id: String,
    pub text: String,
    pub voice: String,
    pub timestamp: u64,
}

#[tauri::command]
pub fn list_voices(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    Ok(state.voices.clone())
}

#[tauri::command]
pub async fn synth(
    state: State<'_, AppState>,
    text: String,
    voice: String,
) -> Result<SynthResult, String> {
    let (samples, _took) = state
        .tts
        .synth(&text, &voice)
        .await
        .map_err(|e| format!("Synth failed: {e}"))?;

    let wav_bytes = encode_wav(&samples, 24000);
    let b64 = base64::engine::general_purpose::STANDARD.encode(&wav_bytes);

    Ok(SynthResult {
        audio: b64,
        format: "wav".into(),
        sample_rate: 24000,
    })
}

#[tauri::command]
pub async fn save_generation(
    state: State<'_, AppState>,
    text: String,
    voice: String,
    audio: Vec<u8>,
) -> Result<HistoryEntry, String> {
    let id = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos()
        .to_string();

    let history_dir = &state.history_path;
    std::fs::create_dir_all(history_dir).map_err(|e| format!("Dir create failed: {e}"))?;

    let wav_path = history_dir.join(format!("{id}.wav"));
    std::fs::write(&wav_path, &audio).map_err(|e| format!("Write failed: {e}"))?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let entry = HistoryEntry {
        id,
        text,
        voice,
        timestamp,
    };

    let json_path = history_dir.join("history.json");
    let mut entries: Vec<HistoryEntry> = if json_path.exists() {
        let content = std::fs::read_to_string(&json_path).map_err(|e| format!("Read failed: {e}"))?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        Vec::new()
    };
    entries.push(entry.clone());
    let json = serde_json::to_string(&entries).map_err(|e| format!("Serialize failed: {e}"))?;
    std::fs::write(&json_path, json).map_err(|e| format!("Write failed: {e}"))?;

    Ok(entry)
}

#[tauri::command]
pub fn get_history(state: State<'_, AppState>) -> Result<Vec<HistoryEntry>, String> {
    let json_path = state.history_path.join("history.json");
    if !json_path.exists() {
        return Ok(Vec::new());
    }
    let content = std::fs::read_to_string(&json_path).map_err(|e| format!("Read failed: {e}"))?;
    let mut entries: Vec<HistoryEntry> =
        serde_json::from_str(&content).map_err(|e| format!("Parse failed: {e}"))?;
    entries.reverse();
    Ok(entries)
}

#[tauri::command]
pub fn load_history_audio(
    state: State<'_, AppState>,
    id: String,
) -> Result<SynthResult, String> {
    let wav_path = state.history_path.join(format!("{id}.wav"));
    let bytes = std::fs::read(&wav_path).map_err(|e| format!("Read failed: {e}"))?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(SynthResult {
        audio: b64,
        format: "wav".into(),
        sample_rate: 24000,
    })
}

#[tauri::command]
pub fn delete_history_entry(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let json_path = state.history_path.join("history.json");
    let wav_path = state.history_path.join(format!("{id}.wav"));

    let _ = std::fs::remove_file(&wav_path);

    if json_path.exists() {
        let content = std::fs::read_to_string(&json_path).map_err(|e| format!("Read failed: {e}"))?;
        let mut entries: Vec<HistoryEntry> =
            serde_json::from_str(&content).map_err(|e| format!("Parse failed: {e}"))?;
        entries.retain(|e| e.id != id);
        let json = serde_json::to_string(&entries).map_err(|e| format!("Serialize failed: {e}"))?;
        std::fs::write(&json_path, json).map_err(|e| format!("Write failed: {e}"))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn save_audio(
    app: tauri::AppHandle,
    data: Vec<u8>,
    default_name: String,
) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;

    let path = app
        .dialog()
        .file()
        .add_filter("Audio", &["wav"])
        .set_file_name(&format!("{}.wav", &default_name[..default_name.len().min(60)]))
        .blocking_save_file();

    match path {
        Some(p) => {
            let p = p.as_path().unwrap();
            std::fs::write(p, &data).map_err(|e| format!("Write failed: {e}"))?;
            Ok(p.to_string_lossy().to_string())
        }
        None => Err("Cancelled".into()),
    }
}

fn encode_wav(samples: &[f32], sample_rate: u32) -> Vec<u8> {
    use hound::{WavSpec, WavWriter};
    use std::io::Cursor;

    let spec = WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut cursor = Cursor::new(Vec::new());
    let mut writer = WavWriter::new(&mut cursor, spec).unwrap();
    for &s in samples {
        let sample = (s.clamp(-1.0, 1.0) * i16::MAX as f32) as i16;
        writer.write_sample(sample).unwrap();
    }
    writer.finalize().unwrap();
    cursor.into_inner()
}
