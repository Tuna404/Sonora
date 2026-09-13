#!/usr/bin/env bash
set -euo pipefail

HF_API="https://huggingface.co/api/models/onnx-community/Kokoro-82M-v1.0-ONNX"
HF_BASE="https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main"
RESOURCES="src-tauri/resources"

mkdir -p "$RESOURCES/voices"

echo "Downloading model (fp32, ~325 MB)..."
curl -fSL "$HF_BASE/onnx/model.onnx" -o "$RESOURCES/model.onnx"

echo "Discovering voices via HF API..."
VOICE_FILES=$(curl -s "$HF_API" | \
  grep -o '"rfilename":"[^"]*"' | \
  grep 'voices/.*\.bin' | \
  sed 's/"rfilename":"\(.*\)"/\1/')

echo "$VOICE_FILES" | while IFS= read -r f; do
  name=$(basename "$f")
  echo "  $name"
  curl -fSL "$HF_BASE/$f" -o "$RESOURCES/voices/$name"
done

echo "Done. Model + $(echo "$VOICE_FILES" | wc -l | tr -d ' ') voices ready."
