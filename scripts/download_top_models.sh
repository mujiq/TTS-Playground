#!/bin/bash

# Script to download the top 5 TTS models from Hugging Face
# Usage: bash download_top_models.sh [--no-optimize]

# Parse arguments
OPTIMIZE=true
if [[ "$1" == "--no-optimize" ]]; then
  OPTIMIZE=false
fi

# Ensure we have the download script
if [ ! -f "scripts/download_tts_models.py" ]; then
  echo "Error: download_tts_models.py script not found!"
  exit 1
fi

echo "===================================="
echo "  Downloading Top 5 TTS Models"
echo "===================================="
echo "Optimization: $OPTIMIZE"
echo ""

# Create models directory
mkdir -p models/tts

# Set optimization flag
OPTIMIZE_FLAG=""
if [ "$OPTIMIZE" = true ]; then
  OPTIMIZE_FLAG="--optimize"
fi

# Run download script for top models
echo "Fetching leaderboard information..."
python scripts/download_tts_models.py --fetch-leaderboard --models-dir models/tts

echo "Downloading top 5 models..."
python scripts/download_tts_models.py $OPTIMIZE_FLAG --top-n 5 --models-dir models/tts

echo ""
echo "===================================="
echo "  Download Complete!"
echo "===================================="
echo "Models are stored in models/tts directory"
echo "You can now deploy the models on the Ray cluster"
echo "" 