#!/bin/bash

# Configuration script for TextToSpeech Playground environment variables

# First check if env.template exists and use it as a basis
if [ -f "./env.template" ]; then
  if [ ! -f "./.env" ]; then
    # Copy the template to .env if it doesn't exist
    cp "./env.template" "./.env"
    echo "Created .env file from template."
  fi
else
  echo "env.template file not found. Creating basic .env file."
  # Create a minimal .env file
  cat > "./.env" <<EOL
# TextToSpeech Playground Environment
MODEL_DIR=./models/tts
AUDIO_OUTPUT_DIR=./audio-output
EOL
fi

echo "Setting up environment variables for TextToSpeech Playground..."

# Check if token is provided as argument
if [ "$1" ]; then
  HF_TOKEN=$1
  
  # Update the .env file with the token
  if grep -q "HUGGINGFACE_TOKEN=" "./.env"; then
    # Replace existing token
    sed -i "s/HUGGINGFACE_TOKEN=.*/HUGGINGFACE_TOKEN=$HF_TOKEN/" "./.env"
  else
    # Add token to file
    echo "HUGGINGFACE_TOKEN=$HF_TOKEN" >> "./.env"
  fi
  
  # Also set for current session
  export HUGGINGFACE_TOKEN=$HF_TOKEN
  echo "Hugging Face token set successfully!"
else
  # Prompt for token if not provided
  echo "Enter your Hugging Face token (or leave blank to skip):"
  read -s HF_TOKEN
  
  if [ -n "$HF_TOKEN" ]; then
    # Update the .env file with the token
    if grep -q "HUGGINGFACE_TOKEN=" "./.env"; then
      # Replace existing token
      sed -i "s/HUGGINGFACE_TOKEN=.*/HUGGINGFACE_TOKEN=$HF_TOKEN/" "./.env"
    else
      # Add token to file
      echo "HUGGINGFACE_TOKEN=$HF_TOKEN" >> "./.env"
    fi
    
    # Also set for current session
    export HUGGINGFACE_TOKEN=$HF_TOKEN
    echo "Hugging Face token set successfully!"
  else
    echo "No Hugging Face token provided. The application will use fallback models."
  fi
fi

# Load all variables from .env into current session
echo "Loading environment variables from .env file..."
set -a
source "./.env"
set +a

# Create directories based on config
if [ -n "$MODEL_DIR" ]; then
  mkdir -p "$MODEL_DIR"
  echo "Created models directory at $MODEL_DIR"
fi

if [ -n "$AUDIO_OUTPUT_DIR" ]; then
  mkdir -p "$AUDIO_OUTPUT_DIR"
  echo "Created audio output directory at $AUDIO_OUTPUT_DIR"
fi

echo "Environment setup complete!"
echo "To make these settings permanent, you can:"
echo "1. Edit the .env file (recommended)"
echo "2. Add them to your .bashrc or .profile file:"
echo "   export HUGGINGFACE_TOKEN=your_token_here"
echo "   export MODEL_DIR=./models/tts"
echo "   export AUDIO_OUTPUT_DIR=./audio-output" 