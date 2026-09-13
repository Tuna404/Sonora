use base64::Engine;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct SynthResult {
    pub audio: String,
    pub format: String,
    pub sample_rate: u32,
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
