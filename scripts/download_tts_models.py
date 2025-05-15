#!/usr/bin/env python3

import os
import argparse
import torch
from transformers import AutoProcessor, AutoModel, AutoTokenizer
from huggingface_hub import HfApi, ModelFilter
from transformers.utils import logging
import shutil
from pathlib import Path
import json

# Set up logging
logging.set_verbosity_info()
logger = logging.get_logger("download_models")

# Top TTS models on Hugging Face
TOP_TTS_MODELS = [
    "coqui/XTTS-v2",
    "suno/bark",
    "microsoft/speecht5_tts",
    "espnet/kan-bayashi_ljspeech_vits", 
    "facebook/mms-tts"
]

MODELS_DIR = os.environ.get("MODEL_DIR", "models/tts")

def get_top_models_from_huggingface(limit=10):
    """Get top TTS models from Hugging Face based on downloads and likes"""
    logger.info("Fetching top TTS models from Hugging Face...")
    
    api = HfApi()
    
    # Get models with TTS tag, sorted by downloads
    tts_models = api.list_models(
        filter=ModelFilter(task="text-to-speech", sort="downloads", direction=-1),
        limit=limit
    )
    
    models_info = []
    for model in tts_models:
        models_info.append({
            "id": model.id,
            "name": model.id.split('/')[-1],
            "downloads": model.downloads,
            "likes": model.likes,
            "last_modified": str(model.last_modified),
            "description": model.description
        })
    
    return models_info

def download_model(model_id, target_dir, optimize=True):
    """Download and optionally optimize a model from Hugging Face"""
    logger.info(f"Downloading model {model_id}...")
    
    model_dir = os.path.join(target_dir, model_id.replace('/', '--'))
    os.makedirs(model_dir, exist_ok=True)
    
    # Record model information
    model_info = {
        "id": model_id,
        "name": model_id.split('/')[-1],
        "optimized": optimize,
        "local_dir": model_dir,
        "downloaded_at": str(torch.datetime.datetime.now())
    }
    
    try:
        # Try to determine the model type and download appropriately
        if "XTTS" in model_id:
            download_xtts_model(model_id, model_dir, optimize)
            model_info["type"] = "xtts"
        elif "bark" in model_id:
            download_bark_model(model_id, model_dir, optimize)
            model_info["type"] = "bark"
        elif "speecht5" in model_id:
            download_speecht5_model(model_id, model_dir, optimize)
            model_info["type"] = "speecht5"
        elif "vits" in model_id:
            download_vits_model(model_id, model_dir, optimize)
            model_info["type"] = "vits"
        elif "mms-tts" in model_id:
            download_mms_model(model_id, model_dir, optimize)
            model_info["type"] = "mms"
        else:
            # Generic model download approach
            logger.info(f"Using generic download for {model_id}")
            try:
                processor = AutoProcessor.from_pretrained(model_id)
                processor.save_pretrained(model_dir)
                model_info["has_processor"] = True
            except Exception as e:
                logger.warning(f"No processor available for {model_id}: {str(e)}")
                model_info["has_processor"] = False
            
            try:
                # Try using AutoModel as a fallback
                model = AutoModel.from_pretrained(model_id)
                
                if optimize and hasattr(model, "half") and torch.cuda.is_available():
                    logger.info(f"Optimizing model {model_id} with FP16...")
                    model = model.half()  # Convert to FP16
                    model_info["optimization"] = "fp16"
                
                model.save_pretrained(model_dir)
                model_info["downloaded"] = True
            except Exception as e:
                logger.error(f"Failed to download model {model_id}: {str(e)}")
                model_info["downloaded"] = False
                model_info["error"] = str(e)
        
        # Save model info
        with open(os.path.join(model_dir, "model_info.json"), "w") as f:
            json.dump(model_info, f, indent=2)
        
        return model_info
    
    except Exception as e:
        logger.error(f"Error downloading model {model_id}: {str(e)}")
        return {"id": model_id, "error": str(e), "downloaded": False}

def download_xtts_model(model_id, model_dir, optimize=True):
    """Download and optimize XTTS model"""
    logger.info(f"Downloading XTTS model {model_id}...")
    
    # Create subdirectories for XTTS components
    processor_dir = os.path.join(model_dir, "processor")
    os.makedirs(processor_dir, exist_ok=True)
    
    # Download components
    processor = AutoProcessor.from_pretrained(model_id)
    processor.save_pretrained(processor_dir)
    
    # Download model with optimization if requested
    model_kwargs = {}
    if optimize and torch.cuda.is_available():
        logger.info(f"Optimizing XTTS model {model_id} with mixed precision...")
        model_kwargs["torch_dtype"] = torch.float16
    
    model = AutoModel.from_pretrained(model_id, **model_kwargs)
    model.save_pretrained(model_dir)
    
    # For local access, create a config file that points to subdirectories
    config = {
        "model_id": model_id,
        "model_dir": ".",
        "processor_dir": "processor",
        "optimized": optimize
    }
    
    with open(os.path.join(model_dir, "config.json"), "w") as f:
        json.dump(config, f, indent=2)
    
    return True

def download_bark_model(model_id, model_dir, optimize=True):
    """Download and optimize Bark model"""
    logger.info(f"Downloading Bark model {model_id}...")
    
    # Download with optimization if requested
    model_kwargs = {}
    if optimize and torch.cuda.is_available():
        logger.info(f"Optimizing Bark model {model_id} with mixed precision...")
        model_kwargs["torch_dtype"] = torch.float16
    
    model = AutoModel.from_pretrained(model_id, **model_kwargs)
    model.save_pretrained(model_dir)
    
    # Download tokenizer if available
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        tokenizer.save_pretrained(model_dir)
    except Exception as e:
        logger.warning(f"Could not download tokenizer for {model_id}: {str(e)}")
    
    return True

def download_speecht5_model(model_id, model_dir, optimize=True):
    """Download and optimize SpeechT5 model"""
    logger.info(f"Downloading SpeechT5 model {model_id}...")
    
    processor = AutoProcessor.from_pretrained(model_id)
    processor.save_pretrained(model_dir)
    
    # Download model with optimization if requested
    model_kwargs = {}
    if optimize and torch.cuda.is_available():
        logger.info(f"Optimizing SpeechT5 model {model_id} with mixed precision...")
        model_kwargs["torch_dtype"] = torch.float16
    
    model = AutoModel.from_pretrained(model_id, **model_kwargs)
    model.save_pretrained(model_dir)
    
    return True

def download_vits_model(model_id, model_dir, optimize=True):
    """Download and optimize VITS model"""
    logger.info(f"Downloading VITS model {model_id}...")
    
    # Generic download approach for VITS
    model_kwargs = {}
    if optimize and torch.cuda.is_available():
        logger.info(f"Optimizing VITS model {model_id} with mixed precision...")
        model_kwargs["torch_dtype"] = torch.float16
    
    model = AutoModel.from_pretrained(model_id, **model_kwargs)
    model.save_pretrained(model_dir)
    
    return True

def download_mms_model(model_id, model_dir, optimize=True):
    """Download and optimize MMS model"""
    logger.info(f"Downloading MMS model {model_id}...")
    
    processor = AutoProcessor.from_pretrained(model_id)
    processor.save_pretrained(model_dir)
    
    # Download model with optimization if requested
    model_kwargs = {}
    if optimize and torch.cuda.is_available():
        logger.info(f"Optimizing MMS model {model_id} with mixed precision...")
        model_kwargs["torch_dtype"] = torch.float16
    
    model = AutoModel.from_pretrained(model_id, **model_kwargs)
    model.save_pretrained(model_dir)
    
    return True

def save_models_info(models_info, target_dir):
    """Save information about available models to a JSON file"""
    info_file = os.path.join(target_dir, "models_info.json")
    
    with open(info_file, "w") as f:
        json.dump(models_info, f, indent=2)
    
    logger.info(f"Saved models information to {info_file}")

def main():
    parser = argparse.ArgumentParser(description="Download and optimize TTS models from Hugging Face")
    parser.add_argument("--models-dir", type=str, default=MODELS_DIR, help="Directory to save models")
    parser.add_argument("--top-n", type=int, default=5, help="Number of top models to download")
    parser.add_argument("--optimize", action="store_true", help="Optimize models for inference")
    parser.add_argument("--fetch-leaderboard", action="store_true", help="Fetch top models from Hugging Face")
    parser.add_argument("--specific-models", nargs="+", help="Download specific models instead of top ones")
    
    args = parser.parse_args()
    
    # Create models directory
    os.makedirs(args.models_dir, exist_ok=True)
    
    # Get top models from HF if requested
    leaderboard_models = []
    if args.fetch_leaderboard:
        leaderboard_models = get_top_models_from_huggingface(limit=10)
        
        # Save leaderboard info
        leaderboard_file = os.path.join(args.models_dir, "leaderboard.json")
        with open(leaderboard_file, "w") as f:
            json.dump(leaderboard_models, f, indent=2)
        
        logger.info(f"Saved leaderboard information to {leaderboard_file}")
    
    # Determine which models to download
    models_to_download = []
    if args.specific_models:
        models_to_download = args.specific_models
    else:
        models_to_download = TOP_TTS_MODELS[:args.top_n]
    
    # Download and optimize models
    downloaded_models = []
    for model_id in models_to_download:
        try:
            model_info = download_model(model_id, args.models_dir, optimize=args.optimize)
            downloaded_models.append(model_info)
            logger.info(f"Successfully processed model {model_id}")
        except Exception as e:
            logger.error(f"Failed to process model {model_id}: {str(e)}")
            downloaded_models.append({
                "id": model_id, 
                "error": str(e), 
                "downloaded": False
            })
    
    # Save information about downloaded models
    save_models_info(downloaded_models, args.models_dir)
    
    logger.info(f"Download complete. Processed {len(downloaded_models)} models.")

if __name__ == "__main__":
    main() 