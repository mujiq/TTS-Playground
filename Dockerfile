FROM nvidia/cuda:12.0.0-base-ubuntu22.04

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    libsndfile1 \
    ffmpeg \
    git \
    curl \
    postgresql-client \
    libpq-dev \
    cmake \
    zlib1g-dev \
    libbz2-dev \
    liblzma-dev \
    wget \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and installation scripts
COPY requirements.txt .
COPY scripts/install_dependencies.sh .

# Install Python dependencies
RUN chmod +x install_dependencies.sh && ./install_dependencies.sh

# Copy application code
COPY . .

# Make scripts executable
RUN chmod +x scripts/*.sh

# Create directories for models and audio output
RUN mkdir -p models/tts audio-output

# Environment variables
ENV PYTHONPATH="${PYTHONPATH}:/app"
ENV MODEL_DIR="/app/models/tts"
ENV OUTPUT_DIR="/app/audio-output"
ENV TRANSFORMERS_CACHE="/app/.cache/huggingface"
ENV HF_HOME="/app/.cache/huggingface"

# Expose ports for API and Ray dashboard
EXPOSE 8000 8265

# Set default command
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"] 