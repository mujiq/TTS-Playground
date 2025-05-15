import os
import time
import uuid
import json
import ray
import librosa
import numpy as np
from typing import List, Dict, Optional, Any, Union
import asyncio
from datetime import datetime
import logging
from fastapi import Depends
import shutil
import glob
import torch

# Local imports
from src.core.models import (
    TTSRequest, TTSResponse, TTSResult, Avatar, 
    BatchTTSRequest, BatchTTSJobStatus, BatchTTSItemStatus,
    ModelInfo, LanguageInfo, AvatarInfo, SystemStats
)

# Database imports
from src.core.db_models import SessionLocal, get_db
from src.core.db_service import db_service
from sqlalchemy.orm import Session

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ray initialization - should be done once at the application level
if not ray.is_initialized():
    ray.init(address="auto", namespace="cursor_tts")

# Model directory
MODEL_DIR = os.environ.get("MODEL_DIR", "models/tts")

@ray.remote(num_gpus=1)
class TTSWorker:
    """Ray Actor for TTS generation"""
    
    def __init__(self, model_id: str):
        """Initialize the TTS Worker with a specific model"""
        self.model_id = model_id
        
        # Handle different possible model path formats:
        # 1. HF-style: "org/model" -> convert to local format
        # 2. Local path already in correct format
        if '/' in model_id and not os.path.exists(model_id):
            self.model_path = os.path.join(MODEL_DIR, model_id.replace('/', '--'))
        else:
            self.model_path = model_id
            
        logger.info(f"Initializing TTS worker for model: {model_id}")
        logger.info(f"Model path: {self.model_path}")
        
        # Determine model type from model info file
        self.model_info = self._load_model_info()
        self.model_type = self.model_info.get("type", self._detect_model_type())
        
        # Load the appropriate model based on type
        self._load_model()
        
        # Track statistics
        self.tasks_processed = 0
        self.last_accessed = datetime.now()
    
    def _load_model_info(self) -> Dict:
        """Load model information from JSON file"""
        info_path = os.path.join(self.model_path, "model_info.json")
        if os.path.exists(info_path):
            try:
                with open(info_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Error loading model info for {self.model_id}: {str(e)}")
                
        return {"id": self.model_id, "type": "unknown"}
    
    def _detect_model_type(self) -> str:
        """Detect the model type based on available files and structure"""
        # Check for config.json and model structure to determine type
        if os.path.exists(os.path.join(self.model_path, "processor")):
            return "xtts"
        elif os.path.exists(os.path.join(self.model_path, "bark_config.json")):
            return "bark"
        elif os.path.exists(os.path.join(self.model_path, "vits_config.json")):
            return "vits"
        elif "XTTS" in self.model_id:
            return "xtts"
        elif "bark" in self.model_id:
            return "bark"
        elif "speecht5" in self.model_id:
            return "speecht5"
        elif "vits" in self.model_id:
            return "vits"
        elif "mms" in self.model_id:
            return "mms"
        else:
            return "generic"
    
    def _load_model(self):
        """Load the TTS model based on its type"""
        try:
            logger.info(f"Loading model type: {self.model_type}")
            
            if self.model_type == "xtts":
                self._load_xtts_model()
            elif self.model_type == "bark":
                self._load_bark_model()
            elif self.model_type == "speecht5":
                self._load_speecht5_model()
            elif self.model_type == "vits":
                self._load_vits_model()
            elif self.model_type == "mms":
                self._load_mms_model()
            else:
                # Default loading using transformers
                self._load_generic_model()
            
            logger.info(f"Model {self.model_id} loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading model {self.model_id}: {str(e)}")
            raise
    
    def _load_xtts_model(self):
        """Load XTTS model"""
        try:
            from transformers import AutoProcessor, AutoModel
            
            # For XTTS, we need to handle the processor directory structure
            processor_dir = os.path.join(self.model_path, "processor")
            
            # Check if processor directory exists
            if os.path.exists(processor_dir):
                logger.info(f"Loading processor from: {processor_dir}")
                self.processor = AutoProcessor.from_pretrained(
                    processor_dir,
                    local_files_only=True,
                    trust_remote_code=True
                )
            else:
                # Fall back to using the model directory
                logger.info(f"Processor directory not found, using model directory: {self.model_path}")
                self.processor = AutoProcessor.from_pretrained(
                    self.model_path,
                    local_files_only=True,
                    trust_remote_code=True
                )
            
            # Load the model
            logger.info(f"Loading model from: {self.model_path}")
            self.model = AutoModel.from_pretrained(
                self.model_path, 
                local_files_only=True,
                trust_remote_code=True
            )
            
            # Move model to GPU if available
            if hasattr(self.model, "to") and torch.cuda.is_available():
                self.model = self.model.to("cuda")
                logger.info("Model moved to GPU")
                
        except Exception as e:
            logger.error(f"Error loading XTTS model: {str(e)}")
            raise
    
    def _load_bark_model(self):
        """Load Bark model"""
        try:
            from transformers import AutoProcessor, AutoModel
            
            # Load processor and model
            self.processor = AutoProcessor.from_pretrained(
                self.model_path,
                local_files_only=True,
                trust_remote_code=True
            )
            
            self.model = AutoModel.from_pretrained(
                self.model_path,
                local_files_only=True,
                trust_remote_code=True
            )
            
            # Move model to GPU if available
            if hasattr(self.model, "to") and torch.cuda.is_available():
                self.model = self.model.to("cuda")
                logger.info("Model moved to GPU")
                
        except Exception as e:
            logger.error(f"Error loading Bark model: {str(e)}")
            raise
    
    def _load_speecht5_model(self):
        """Load SpeechT5 model"""
        try:
            from transformers import SpeechT5Processor, SpeechT5ForTextToSpeech
            from transformers import SpeechT5HifiGan
            
            # Load processor and model
            self.processor = SpeechT5Processor.from_pretrained(
                self.model_path,
                local_files_only=True
            )
            
            self.model = SpeechT5ForTextToSpeech.from_pretrained(
                self.model_path,
                local_files_only=True
            )
            
            # Load vocoder for SpeechT5
            self.vocoder = SpeechT5HifiGan.from_pretrained(
                "microsoft/speecht5_hifigan",
                local_files_only=False
            )
            
            # Move models to GPU if available
            if torch.cuda.is_available():
                self.model = self.model.to("cuda")
                self.vocoder = self.vocoder.to("cuda")
                logger.info("Models moved to GPU")
                
        except Exception as e:
            logger.error(f"Error loading SpeechT5 model: {str(e)}")
            raise
    
    def _load_vits_model(self):
        """Load VITS model"""
        try:
            from transformers import AutoProcessor, AutoModel
            
            # Load processor and model
            self.processor = AutoProcessor.from_pretrained(
                self.model_path,
                local_files_only=True,
                trust_remote_code=True
            )
            
            self.model = AutoModel.from_pretrained(
                self.model_path,
                local_files_only=True,
                trust_remote_code=True
            )
            
            # Move model to GPU if available
            if hasattr(self.model, "to") and torch.cuda.is_available():
                self.model = self.model.to("cuda")
                logger.info("Model moved to GPU")
                
        except Exception as e:
            logger.error(f"Error loading VITS model: {str(e)}")
            raise
    
    def _load_mms_model(self):
        """Load MMS model"""
        try:
            from transformers import AutoProcessor, AutoModel
            
            # Load processor and model
            self.processor = AutoProcessor.from_pretrained(
                self.model_path,
                local_files_only=True,
                trust_remote_code=True
            )
            
            self.model = AutoModel.from_pretrained(
                self.model_path,
                local_files_only=True,
                trust_remote_code=True
            )
            
            # Move model to GPU if available
            if hasattr(self.model, "to") and torch.cuda.is_available():
                self.model = self.model.to("cuda")
                logger.info("Model moved to GPU")
                
        except Exception as e:
            logger.error(f"Error loading MMS model: {str(e)}")
            raise
    
    def _load_generic_model(self):
        """Load a generic model using transformers"""
        try:
        from transformers import AutoProcessor, AutoModel
        
            # Try to load processor
            try:
                self.processor = AutoProcessor.from_pretrained(
                    self.model_path,
                    local_files_only=True,
                    trust_remote_code=True
                )
            except Exception as e:
                logger.warning(f"Could not load processor for {self.model_id}: {str(e)}")
                self.processor = None
            
            # Load model
            self.model = AutoModel.from_pretrained(
                self.model_path,
                local_files_only=True,
                trust_remote_code=True
            )
            
            # Move model to GPU if available
            if hasattr(self.model, "to") and torch.cuda.is_available():
                self.model = self.model.to("cuda")
                logger.info("Model moved to GPU")
                
        except Exception as e:
            logger.error(f"Error loading generic model: {str(e)}")
            raise
    
    def generate_speech(self, text: str, language: str, avatar: Optional[Dict] = None, 
                        output_path: str = None) -> Dict:
        """Generate speech from text"""
        start_time = time.time()
        self.last_accessed = datetime.now()
        
        try:
            # Generate speech based on model type
            if self.model_type == "xtts":
                result = self._generate_xtts_speech(text, language, avatar, output_path)
            elif self.model_type == "bark":
                result = self._generate_bark_speech(text, language, avatar, output_path)
            elif self.model_type == "speecht5":
                result = self._generate_speecht5_speech(text, language, avatar, output_path)
            elif self.model_type == "vits":
                result = self._generate_vits_speech(text, language, avatar, output_path)
            elif self.model_type == "mms":
                result = self._generate_mms_speech(text, language, avatar, output_path)
            else:
                result = self._generate_generic_speech(text, language, avatar, output_path)
            
            # Add processing metadata
            result.update({
                "model_used": self.model_id,
                "processing_time": time.time() - start_time
            })
            
            # Increment tasks processed count
            self.tasks_processed += 1
            
            return result
        
        except Exception as e:
            logger.error(f"Error generating speech: {str(e)}")
            raise
    
    def _generate_xtts_speech(self, text, language, avatar, output_path):
        """Generate speech using XTTS model"""
        # TODO: Replace with actual implementation
        # This is a placeholder
        
        # Simulate audio generation
        audio_length = len(text.split()) * 0.3  # Rough estimate
        
        # In production, this would be:
        # inputs = self.processor(text=text, return_tensors="pt")
        # if torch.cuda.is_available():
        #     inputs = {k: v.to("cuda") for k, v in inputs.items()}
        # speech = self.model.generate_speech(**inputs)
        # Save audio to output_path...
        
        return {
            "file_path": output_path,
            "duration_seconds": audio_length
        }
    
    def _generate_bark_speech(self, text, language, avatar, output_path):
        """Generate speech using Bark model"""
        # Placeholder for actual Bark implementation
        audio_length = len(text.split()) * 0.3
        return {"file_path": output_path, "duration_seconds": audio_length}
    
    def _generate_speecht5_speech(self, text, language, avatar, output_path):
        """Generate speech using SpeechT5 model"""
        # Placeholder for actual SpeechT5 implementation
        audio_length = len(text.split()) * 0.3
        return {"file_path": output_path, "duration_seconds": audio_length}
    
    def _generate_vits_speech(self, text, language, avatar, output_path):
        """Generate speech using VITS model"""
        # Placeholder for actual VITS implementation
        audio_length = len(text.split()) * 0.3
        return {"file_path": output_path, "duration_seconds": audio_length}
    
    def _generate_mms_speech(self, text, language, avatar, output_path):
        """Generate speech using MMS model"""
        # Placeholder for actual MMS implementation
        audio_length = len(text.split()) * 0.3
        return {"file_path": output_path, "duration_seconds": audio_length}
    
    def _generate_generic_speech(self, text, language, avatar, output_path):
        """Generate speech using generic model"""
        # Placeholder for generic implementation
        audio_length = len(text.split()) * 0.3
        return {"file_path": output_path, "duration_seconds": audio_length}
    
    def get_stats(self) -> Dict:
        """Get worker statistics"""
        return {
            "model_id": self.model_id,
            "model_type": self.model_type,
            "tasks_processed": self.tasks_processed,
            "last_accessed": self.last_accessed.isoformat(),
            "optimized": self.model_info.get("optimized", False)
        }

# Batch processing task using Ray
@ray.remote
def process_batch_item(worker_handle, item_id, text, language, avatar, output_dir):
    """Process a single batch item using a worker"""
    try:
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        gender = avatar["gender"] if avatar else "default"
        dialect = avatar["dialect"] if avatar and "dialect" in avatar else language
        filename = f"{item_id}_{gender}_{dialect}_{timestamp}.mp3"
        output_path = os.path.join(output_dir, filename)
        
        # Call worker to generate speech
        result = ray.get(worker_handle.generate_speech.remote(
            text=text,
            language=language,
            avatar=avatar,
            output_path=output_path
        ))
        
        # Return status
        return {
            "id": item_id,
            "status": "completed",
            "file_url": f"/audio-output/{filename}",
            "duration": result["duration_seconds"],
            "error": None
        }
        
    except Exception as e:
        logger.error(f"Error processing batch item {item_id}: {str(e)}")
        return {
            "id": item_id,
            "status": "failed",
            "file_url": None,
            "duration": 0,
            "error": str(e)
        }

class TextToSpeechService:
    """Service for text-to-speech generation"""
    
    def __init__(self):
        """Initialize the Text-to-Speech service"""
        # Ensure model directory exists
        os.makedirs(MODEL_DIR, exist_ok=True)
        
        # Worker references (model_id -> Ray actor handle)
        self.workers = {}
        
        # Batch jobs (job_id -> status)
        self.batch_jobs = {}
        
        # Output directory
        self.output_dir = os.environ.get("OUTPUT_DIR", "audio-output")
        os.makedirs(self.output_dir, exist_ok=True)
        
        logger.info("Text-to-Speech service initialized")
    
    def _initialize_models(self, db: Session):
        """Initialize TTS models as Ray actors"""
        # Load available models from the models directory
        models = []
        for model_dir in glob.glob(os.path.join(MODEL_DIR, "*")):
            if os.path.isdir(model_dir):
                model_id = os.path.basename(model_dir).replace('--', '/')
                models.append(model_id)
        
        if not models:
            # If no models are available, use default list
            models = [
                "coqui/XTTS-v2",
                "suno/bark",
                "microsoft/speecht5_tts",
                "espnet/kan-bayashi_ljspeech_vits",
                "facebook/mms-tts"
            ]
        
        # Initialize workers for each model
        for model_id in models:
            if model_id not in self.workers:
                try:
                # Create a Ray actor for this model
                    worker = TTSWorker.remote(model_id)
                    self.workers[model_id] = worker
                    logger.info(f"Initialized TTS worker for model: {model_id}")
                except Exception as e:
                    logger.error(f"Failed to initialize worker for model {model_id}: {str(e)}")
    
    def _select_model_for_language(self, db: Session, language: str) -> str:
        """Select the most appropriate model for a given language"""
        # This is a placeholder implementation
        # In a production system, you would have a mapping of languages to preferred models
        
        # If we have language-specific models, we would select them here
        language_model_map = {
            "en": "coqui/XTTS-v2",
            "es": "facebook/mms-tts",
            "ar": "microsoft/speecht5_tts",
            "hi": "facebook/mms-tts",
            "zh": "facebook/mms-tts"
        }
        
        # Return the model ID for this language, or fall back to a default
        return language_model_map.get(language, "coqui/XTTS-v2")
    
    async def generate_speech(self, text: str, language: str, avatar: Optional[Dict] = None, 
                              output_path: str = None, db: Session = None) -> TTSResult:
        """Generate speech from text"""
        if db is None:
            db = next(get_db())
        
        # Initialize models if needed
        if not self.workers:
            self._initialize_models(db)
        
        # Select the most appropriate model for this language
        model_id = self._select_model_for_language(db, language)
        
        # Check if we have a worker for this model
        if model_id not in self.workers:
            try:
                # Create a worker for this model
                self.workers[model_id] = TTSWorker.remote(model_id)
                logger.info(f"Created new worker for model: {model_id}")
            except Exception as e:
                logger.error(f"Failed to create worker for model {model_id}: {str(e)}")
                # Fall back to a different model
                available_models = list(self.workers.keys())
                if available_models:
                    model_id = available_models[0]
                    logger.info(f"Falling back to model: {model_id}")
                else:
                    raise ValueError("No TTS models available")
        
        # Generate a default output path if none provided
        if not output_path:
            timestamp = int(time.time())
            filename = f"tts_{timestamp}_{uuid.uuid4().hex}.mp3"
            output_path = os.path.join(self.output_dir, filename)
        
        try:
            # Get the worker for this model
            worker = self.workers[model_id]
            
            # Generate speech using the worker
            result = await asyncio.to_thread(
                ray.get,
                worker.generate_speech.remote(
                    text=text,
                    language=language,
                    avatar=avatar.dict() if avatar else None,
                    output_path=output_path
                )
            )
            
            # Return the result
            return TTSResult(
                file_path=result["file_path"],
                duration_seconds=result["duration_seconds"],
                model_used=model_id
            )
            
        except Exception as e:
            logger.error(f"Error generating speech: {str(e)}")
            raise
    
    def submit_batch_job(self, request: BatchTTSRequest, db: Session = None) -> str:
        """Submit a batch TTS job"""
        if db is None:
            db = next(get_db())
        
        # Initialize models if needed
        if not self.workers:
            self._initialize_models(db)
        
        # Generate a job ID
        job_id = f"job_{uuid.uuid4().hex}"
        
        # Select the model for this language
        model_id = self._select_model_for_language(db, request.language)
        
        # Check if we have a worker for this model
        if model_id not in self.workers:
            try:
                # Create a worker for this model
                self.workers[model_id] = TTSWorker.remote(model_id)
            except Exception as e:
                logger.error(f"Failed to create worker for model {model_id}: {str(e)}")
                # Fall back to a different model
                available_models = list(self.workers.keys())
                if available_models:
                    model_id = available_models[0]
                else:
                    raise ValueError("No TTS models available")
        
        # Get the worker
        worker = self.workers[model_id]
        
        # Process each item in the batch
            refs = []
            for item in request.items:
                # Submit task to Ray
                ref = process_batch_item.remote(
                worker,
                item.id,
                item.text,
                request.language,
                request.avatar.dict() if request.avatar else None,
                self.output_dir
            )
            refs.append(ref)
        
        # Create job status
        self.batch_jobs[job_id] = {
            "job_id": job_id,
            "status": "processing",
            "total_items": len(request.items),
            "completed_items": 0,
            "failed_items": 0,
            "start_time": datetime.now().isoformat(),
            "refs": refs,  # Store Ray object refs
            "items": []
        }
        
        # Start a background task to handle completion
        asyncio.create_task(self._handle_batch_completion(refs))
            
            return job_id
        
    async def _handle_batch_completion(self, refs):
        """Handle batch job completion"""
        
        async def process_results():
            """Process the results of a batch job"""
            # Wait for all items to complete
            results = await asyncio.to_thread(ray.get, refs)
            
            # Update job status
            for job_id, job in self.batch_jobs.items():
                if "refs" in job and job["refs"] == refs:
                    job["items"] = results
                    job["completed_items"] = sum(1 for r in results if r["status"] == "completed")
                    job["failed_items"] = sum(1 for r in results if r["status"] == "failed")
                    job["status"] = "completed"
                    job["end_time"] = datetime.now().isoformat()
                    
                    # Calculate stats
                    completed = job["completed_items"]
                    total = job["total_items"]
                    job["success_rate"] = (completed / total * 100) if total > 0 else 0
                    
                    # Clean up refs
                    job.pop("refs", None)
                    
                    logger.info(f"Batch job {job_id} completed. Success rate: {job['success_rate']}%")
                    break
        
        # Start the processing task
        await process_results()
    
    def get_batch_job_status(self, job_id: str, db: Session = None) -> BatchTTSJobStatus:
        """Get the status of a batch job"""
        if job_id not in self.batch_jobs:
            raise ValueError(f"Batch job {job_id} not found")
        
        job = self.batch_jobs[job_id]
        
        # Convert to API model
        items = [
            BatchTTSItemStatus(
                id=item["id"],
                status=item["status"],
                file_url=item["file_url"],
                error=item["error"]
            )
            for item in job.get("items", [])
        ]
        
        return BatchTTSJobStatus(
            job_id=job_id,
            status=job["status"],
            total_items=job["total_items"],
            completed_items=job["completed_items"],
            failed_items=job["failed_items"],
            items=items
        )
    
    def list_available_models(self, db: Session = None) -> List[ModelInfo]:
        """List available TTS models"""
        if db is None:
            db = next(get_db())
        
        # Initialize models if needed
        if not self.workers:
            self._initialize_models(db)
        
        models = []
        
        # Check the models directory for available models
        for model_path in glob.glob(os.path.join(MODEL_DIR, "*")):
            if os.path.isdir(model_path):
                model_name = os.path.basename(model_path)
                
                # Load model info if available
                info_path = os.path.join(model_path, "model_info.json")
                model_info = {}
                if os.path.exists(info_path):
                    try:
                        with open(info_path, 'r') as f:
                            model_info = json.load(f)
                    except Exception:
                        model_info = {}
                
                # Convert local model name to HF format if needed
                model_id = model_name.replace('--', '/')
                
                # Create ModelInfo object
                models.append(ModelInfo(
                    id=model_id,
                    name=model_info.get("name", model_name),
                    description=model_info.get("description", f"TTS model: {model_id}"),
                    languages=model_info.get("languages", ["en"]),
                    optimized=model_info.get("optimized", False)
                ))
        
        # If models list is empty, return default models
        if not models:
            models = [
                ModelInfo(id="coqui/XTTS-v2", name="XTTS v2", description="High-quality multilingual TTS", languages=["en", "es", "fr", "de", "it"]),
                ModelInfo(id="suno/bark", name="Bark", description="Multilingual text-to-audio model", languages=["en", "zh", "fr", "de", "hi", "es"]),
                ModelInfo(id="microsoft/speecht5_tts", name="SpeechT5", description="Microsoft's TTS model", languages=["en"]),
                ModelInfo(id="espnet/kan-bayashi_ljspeech_vits", name="VITS", description="VITS TTS model", languages=["en"]),
                ModelInfo(id="facebook/mms-tts", name="MMS TTS", description="Facebook's multilingual TTS", languages=["en", "es", "fr", "de", "hi", "zh"])
            ]
        
        return models
    
    def get_supported_languages(self, db: Session = None) -> List[LanguageInfo]:
        """Get supported languages"""
        # This could be loaded from a configuration file or database
        languages = [
            LanguageInfo(code="en", name="English", dialects=[
                {"code": "en-US", "name": "American English"},
                {"code": "en-GB", "name": "British English"},
                {"code": "en-AU", "name": "Australian English"}
            ]),
            LanguageInfo(code="es", name="Spanish", dialects=[
                {"code": "es-ES", "name": "European Spanish"},
                {"code": "es-MX", "name": "Mexican Spanish"}
            ]),
            LanguageInfo(code="ar", name="Arabic", dialects=[
                {"code": "ar-SA", "name": "Saudi Arabic"},
                {"code": "ar-EG", "name": "Egyptian Arabic"}
            ]),
            LanguageInfo(code="hi", name="Hindi"),
            LanguageInfo(code="zh", name="Chinese", dialects=[
                {"code": "zh-CN", "name": "Mandarin (Simplified)"},
                {"code": "zh-TW", "name": "Mandarin (Traditional)"}
            ])
        ]
        
        return languages
    
    def get_available_avatars(self, db: Session = None) -> List[AvatarInfo]:
        """Get available avatars"""
        # This could be loaded from a configuration file or database
        avatars = [
            AvatarInfo(gender="male", dialect="en-US", description="American English Male Voice"),
            AvatarInfo(gender="female", dialect="en-US", description="American English Female Voice"),
            AvatarInfo(gender="male", dialect="en-GB", description="British English Male Voice"),
            AvatarInfo(gender="female", dialect="en-GB", description="British English Female Voice"),
            AvatarInfo(gender="male", dialect="es-ES", description="Spanish Male Voice"),
            AvatarInfo(gender="female", dialect="es-ES", description="Spanish Female Voice"),
            AvatarInfo(gender="male", dialect="ar-SA", description="Arabic Male Voice"),
            AvatarInfo(gender="female", dialect="ar-SA", description="Arabic Female Voice"),
            AvatarInfo(gender="male", dialect="zh-CN", description="Chinese Male Voice"),
            AvatarInfo(gender="female", dialect="zh-CN", description="Chinese Female Voice")
        ]
        
        return avatars
    
    def get_system_stats(self, db: Session = None) -> SystemStats:
        """Get system statistics"""
        try:
            # Get Ray cluster info
            nodes_info = ray.nodes()
            
            # Count nodes and workers
            num_nodes = len(nodes_info)
            alive_nodes = sum(1 for node in nodes_info if node["alive"])
            
            # Get worker stats
            worker_stats = []
            for model_id, worker in self.workers.items():
                try:
                    stats = ray.get(worker.get_stats.remote())
                    worker_stats.append({
                        "model_id": model_id,
                        "tasks_processed": stats["tasks_processed"],
                        "last_accessed": stats["last_accessed"]
                    })
                except Exception as e:
                    logger.error(f"Error getting stats for worker {model_id}: {str(e)}")
            
            # Get GPU info
            gpu_info = []
            for node in nodes_info:
                if "GPUs" in node["resources"]:
                    num_gpus = node["resources"]["GPUs"]
                    for i in range(int(num_gpus)):
                        gpu_info.append({
                            "gpu_id": i,
                            "node_id": node["node_id"],
                            "usage_percent": 0,  # Would need GPU monitoring
                            "memory_used": 0,    # Would need GPU monitoring
                            "memory_total": 0    # Would need GPU monitoring
                        })
            
            return SystemStats(
                total_nodes=num_nodes,
                active_nodes=alive_nodes,
                workers=worker_stats,
                gpu_info=gpu_info
            )
            
        except Exception as e:
            logger.error(f"Error getting system stats: {str(e)}")
            # Return default stats on error
            return SystemStats(
                total_nodes=3,
                active_nodes=3,
                workers=[],
                gpu_info=[]
            )
    
    async def download_model(self, model_id: str, optimize: bool = True, db: Session = None) -> Dict:
        """Download a model from Hugging Face"""
        if db is None:
            db = next(get_db())
        
        # Import the model download script
        import sys
        sys.path.append("scripts")
        from download_tts_models import download_model
        
        try:
            # Download the model
            result = await asyncio.to_thread(
                download_model,
                model_id=model_id,
                target_dir=MODEL_DIR,
                optimize=optimize
            )
            
            # Reload the model in the service
            if model_id in self.workers:
                # Remove existing worker
                del self.workers[model_id]
            
            # Create a new worker for this model
            self.workers[model_id] = TTSWorker.remote(model_id)
            
            return {
                "success": True,
                "model_id": model_id,
                "message": f"Model {model_id} downloaded and loaded successfully",
                "details": result
            }
            
        except Exception as e:
            logger.error(f"Error downloading model {model_id}: {str(e)}")
            return {
                "success": False,
                "model_id": model_id,
                "message": f"Error downloading model: {str(e)}",
                "error": str(e)
            }
    
    async def get_huggingface_leaderboard(self, limit: int = 10, db: Session = None) -> List[Dict]:
        """Get the Hugging Face TTS model leaderboard"""
        if db is None:
            db = next(get_db())
        
        # Import the model download script
        import sys
        sys.path.append("scripts")
        from download_tts_models import get_top_models_from_huggingface
        
        try:
            # Get the leaderboard
            models = await asyncio.to_thread(
                get_top_models_from_huggingface,
                limit=limit
            )
            
            return models
            
        except Exception as e:
            logger.error(f"Error getting Hugging Face leaderboard: {str(e)}")
            return []
    
    def delete_model(self, model_id: str, db: Session = None) -> Dict:
        """Delete a model from the system"""
        if db is None:
            db = next(get_db())
        
        try:
            # Convert model ID to directory name if needed
            if '/' in model_id:
                model_dir = os.path.join(MODEL_DIR, model_id.replace('/', '--'))
            else:
                model_dir = os.path.join(MODEL_DIR, model_id)
            
            # Check if the model exists
            if not os.path.exists(model_dir):
                return {
                    "success": False,
                    "model_id": model_id,
                    "message": f"Model {model_id} not found"
                }
            
            # Remove the worker if it exists
            if model_id in self.workers:
                del self.workers[model_id]
            
            # Delete the model directory
            shutil.rmtree(model_dir)
            
            return {
                "success": True,
                "model_id": model_id,
                "message": f"Model {model_id} deleted successfully"
            }
            
        except Exception as e:
            logger.error(f"Error deleting model {model_id}: {str(e)}")
            return {
                "success": False,
                "model_id": model_id,
                "message": f"Error deleting model: {str(e)}",
                "error": str(e)
            } 