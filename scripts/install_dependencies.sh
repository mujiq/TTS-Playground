#!/bin/bash

# Install all the necessary dependencies for TTS models
# This script should be run inside the Docker container

echo "Installing dependencies for TTS models..."

# Install PyTorch with CUDA support
pip install torch==2.0.1+cu118 torchaudio==2.0.2+cu118 --extra-index-url https://download.pytorch.org/whl/cu118

# Install base requirements
pip install -r requirements.txt

# Install additional dependencies for TTS models
pip install ffmpeg-python
pip install sounddevice

# Install additional dependencies for optimization
pip install triton

# Verify CUDA availability
python -c "import torch; print('CUDA available:', torch.cuda.is_available()); print('CUDA version:', torch.version.cuda if torch.cuda.is_available() else 'N/A'); print('GPU devices:', torch.cuda.device_count() if torch.cuda.is_available() else 0)"

echo "Dependencies installation complete" 