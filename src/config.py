import os
from pathlib import Path
from dotenv import load_dotenv
import logging

# Load .env file if it exists
load_dotenv()

# Base paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"

# API Configuration
API_PORT = int(os.environ.get("API_PORT", 8000))
API_HOST = os.environ.get("API_HOST", "0.0.0.0")
DEBUG_MODE = os.environ.get("DEBUG_MODE", "False").lower() in ("true", "1", "t")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

# Database Configuration
DB_PATH = os.environ.get("DB_PATH", str(DATA_DIR / "tts.db"))
SQLITE_URL = f"sqlite:///{DB_PATH}"

# Model Configuration
MODEL_DIR = os.environ.get("MODEL_DIR", str(BASE_DIR / "models/tts"))
DEFAULT_MODELS = [
    "coqui/XTTS-v2",
    "suno/bark",
    "microsoft/speecht5_tts",
    "espnet/kan-bayashi_ljspeech_vits", 
    "facebook/mms-tts"
]

# Output Configuration
AUDIO_OUTPUT_DIR = os.environ.get("AUDIO_OUTPUT_DIR", str(BASE_DIR / "audio-output"))

# Ray Configuration
RAY_ADDRESS = os.environ.get("RAY_ADDRESS", "auto")
RAY_NAMESPACE = os.environ.get("RAY_NAMESPACE", "texttospeech_playground")

# API Keys
HUGGINGFACE_TOKEN = os.environ.get("HUGGINGFACE_TOKEN") or os.environ.get("HF_TOKEN")

# Monitoring Configuration
PROMETHEUS_PORT = int(os.environ.get("PROMETHEUS_PORT", 9090))
GRAFANA_PORT = int(os.environ.get("GRAFANA_PORT", 3000))

# Logging Configuration
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
LOG_FORMAT = os.environ.get("LOG_FORMAT", "%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Setup logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format=LOG_FORMAT,
)

# Ensure directories exist
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# Initialize configuration validation
def validate_config():
    """Validate that the configuration is valid and ready for use"""
    errors = []
    
    # Check directories are writable
    if not os.access(MODEL_DIR, os.W_OK):
        errors.append(f"MODEL_DIR {MODEL_DIR} is not writable")
    
    if not os.access(AUDIO_OUTPUT_DIR, os.W_OK):
        errors.append(f"AUDIO_OUTPUT_DIR {AUDIO_OUTPUT_DIR} is not writable")
    
    if not os.access(os.path.dirname(DB_PATH), os.W_OK):
        errors.append(f"DB_PATH directory {os.path.dirname(DB_PATH)} is not writable")
    
    # Check optional but recommended variables
    if not HUGGINGFACE_TOKEN:
        logging.warning("HUGGINGFACE_TOKEN is not set. Hugging Face API features will be limited.")
    
    # Return validation results
    return {
        "valid": len(errors) == 0,
        "errors": errors
    } 