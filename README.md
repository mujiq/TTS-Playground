# TextToSpeech Playground - AI-Powered Text-to-Speech with Voice and Avatars

A scalable AI-powered platform for generating high-quality, natural-sounding voice from text with selectable languages and avatars.

## Features

- **Scalable GPU Inference**: Built with Ray for distributed computing across multiple nodes and GPUs
- **High-Quality Text-to-Speech**: Leverages state-of-the-art models like XTTS-v2, Dia, Kokoro, Bark, and Spark-TTS
- **Multiple Languages**: Supports English, Arabic, Spanish, Hindi/Urdu, and more
- **Avatar Selection**: Choose between different voices based on gender and dialect
- **RESTful API**: Easy-to-use API for text input and voice file generation in MP3 format
- **Automated Content Generation**: Process batches of text for social media posts
- **Comprehensive Monitoring**: Full system metrics tracking with Ray Dashboard, Prometheus, and Grafana
- **Optimized Performance**: Supports asynchronous/batched TTS requests and quantized models for efficiency

## Getting Started

### Prerequisites

- Python 3.9+ (Python 3.13+ requires models to be custom-built)
- CUDA-compatible GPU (recommended for production)
- Docker and Docker Compose (optional, for containerized deployment)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/texttospeech-playground.git
   cd texttospeech-playground
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Download and prepare TTS models:
   ```
   python src/download_models.py
   ```

### Running the Application

#### Local Development

```
uvicorn src.api.main:app --reload
```

#### Docker Deployment

```
docker-compose up -d
```

## API Usage

### Text-to-Speech Endpoint

```
POST /api/tts
```

Request body:
```json
{
  "text": "Hello, this is a test message",
  "language": "en",
  "avatar": {
    "gender": "female",
    "dialect": "en-US"
  }
}
```

Response:
```json
{
  "file_url": "/audio-output/2023-09-15_12-30-45_female_en-US.mp3",
  "duration_seconds": 2.5
}
```

## Project Structure

```
├── audio-output/            # Generated audio files
├── models/                  # Downloaded TTS models
│   └── tts/
├── src/                     # Source code
│   ├── api/                 # API endpoints
│   ├── core/                # Core TTS functionality
│   ├── ray/                 # Ray distributed computing
│   └── monitoring/          # System monitoring
├── tests/                   # Test suite
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Hugging Face](https://huggingface.co/) for providing access to state-of-the-art TTS models
- [Ray Project](https://www.ray.io/) for the distributed computing framework
- [Coqui](https://coqui.ai/) for their work on XTTS
- [Suno](https://suno.com/) for the Bark TTS model 