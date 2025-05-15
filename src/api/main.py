from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query, Depends, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Union, Any
import os
import uuid
import mimetypes
import ray
import json
import time
from datetime import datetime

# Import core TTS functionality (to be implemented)
from src.core.tts_service import TextToSpeechService
from src.core.models import TTSRequest, TTSResponse, TTSResult, Avatar, BatchTTSRequest, BatchTTSItem, BatchTTSItemStatus, BatchTTSJobStatus, ModelInfo, LanguageInfo, AvatarInfo, SystemStats

# Import database dependencies
from src.core.db_models import get_db
from sqlalchemy.orm import Session

# Create FastAPI app
app = FastAPI(
    title="TextToSpeech Playground API",
    description="API for generating high-quality speech from text with selectable languages and avatars",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the TTS service
tts_service = TextToSpeechService()

# Define output directory
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "audio-output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "TextToSpeech Playground API",
        "version": "1.0.0",
        "description": "AI-powered text-to-speech with voice and avatar selection"
    }

@app.post("/tts", response_model=TTSResponse)
async def generate_speech(request: TTSRequest, db: Session = Depends(get_db)):
    """Generate speech from text"""
    # Validate language
    supported_languages = tts_service.get_supported_languages(db)
    if request.language not in [lang.code for lang in supported_languages]:
        raise HTTPException(status_code=400, detail=f"Language {request.language} not supported")
    
    # Generate unique filename
    timestamp = int(time.time())
    filename = f"tts_{timestamp}_{uuid.uuid4().hex}.mp3"
    output_path = os.path.join(OUTPUT_DIR, filename)
    
    # Call TTS service
    try:
        result = await tts_service.generate_speech(
            text=request.text,
            language=request.language,
            avatar=request.avatar,
            output_path=output_path,
            db=db
        )
        
        # Create response
        response = TTSResponse(
            text=request.text,
            language=request.language,
            avatar=request.avatar.dict() if request.avatar else None,
            audio_url=f"/audio-output/{filename}",
            duration_seconds=result.duration_seconds,
            model_used=result.model_used,
            message="Speech generation successful"
        )
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-tts", response_model=Dict[str, str])
def submit_batch_job(request: BatchTTSRequest, db: Session = Depends(get_db)):
    """Submit a batch TTS job"""
    try:
        # Call TTS service
        job_id = tts_service.submit_batch_job(request, db=db)
        
        # Return job ID
        return {"job_id": job_id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/batch-tts/{job_id}/status", response_model=BatchTTSJobStatus)
def get_batch_job_status(job_id: str, db: Session = Depends(get_db)):
    """Get the status of a batch TTS job"""
    try:
        # Call TTS service
        job_status = tts_service.get_batch_job_status(job_id, db=db)
        
        return job_status
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/languages", response_model=List[LanguageInfo])
def get_supported_languages(db: Session = Depends(get_db)):
    """Get supported languages"""
    return tts_service.get_supported_languages(db)

@app.get("/avatars", response_model=List[AvatarInfo])
def get_available_avatars(db: Session = Depends(get_db)):
    """Get available avatars"""
    return tts_service.get_available_avatars(db)

@app.get("/models", response_model=List[ModelInfo])
def list_available_models(db: Session = Depends(get_db)):
    """List available TTS models"""
    return tts_service.list_available_models(db)

@app.get("/system-stats", response_model=SystemStats)
def get_system_stats(db: Session = Depends(get_db)):
    """Get system statistics"""
    return tts_service.get_system_stats(db)

@app.get("/audio-output/{filename}")
def get_audio_file(filename: str):
    """Get generated audio file"""
    file_path = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        file_path,
        media_type="audio/mpeg",
        filename=filename
    )

@app.get("/models/huggingface-leaderboard", response_model=List[Dict])
async def get_huggingface_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    """Get the top TTS models from Hugging Face leaderboard"""
    try:
        models = await tts_service.get_huggingface_leaderboard(limit=limit, db=db)
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get Hugging Face leaderboard: {str(e)}")

@app.post("/models/download", response_model=Dict)
async def download_model(model_id: str, optimize: bool = True, db: Session = Depends(get_db)):
    """Download a TTS model from Hugging Face"""
    try:
        result = await tts_service.download_model(model_id=model_id, optimize=optimize, db=db)
        
        if not result.get("success", False):
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to download model: {result.get('message', 'Unknown error')}"
            )
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download model: {str(e)}")

@app.delete("/models/{model_id}", response_model=Dict)
def delete_model(model_id: str, db: Session = Depends(get_db)):
    """Delete a TTS model from the system"""
    try:
        result = tts_service.delete_model(model_id=model_id, db=db)
        
        if not result.get("success", False):
            raise HTTPException(
                status_code=404 if "not found" in result.get("message", "") else 500, 
                detail=result.get("message", "Unknown error")
            )
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete model: {str(e)}")

@app.post("/models/download-batch", response_model=Dict)
async def download_multiple_models(model_ids: List[str], optimize: bool = True, db: Session = Depends(get_db)):
    """Download multiple TTS models from Hugging Face"""
    results = []
    successful = 0
    failed = 0
    
    for model_id in model_ids:
        try:
            result = await tts_service.download_model(model_id=model_id, optimize=optimize, db=db)
            results.append(result)
            
            if result.get("success", False):
                successful += 1
            else:
                failed += 1
                
        except Exception as e:
            results.append({
                "success": False,
                "model_id": model_id,
                "message": f"Failed to download model: {str(e)}",
                "error": str(e)
            })
            failed += 1
    
    return {
        "total": len(model_ids),
        "successful": successful,
        "failed": failed,
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 