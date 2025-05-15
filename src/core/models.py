from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from enum import Enum

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"

class Avatar(BaseModel):
    """Avatar model representing a voice type"""
    gender: Gender
    dialect: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "gender": "female",
                "dialect": "en-US"
            }
        }

class TTSRequest(BaseModel):
    """Request model for text-to-speech generation"""
    text: str = Field(..., description="Text to convert to speech")
    language: str = Field(..., description="Language code (e.g., 'en', 'ar', 'es')")
    avatar: Optional[Avatar] = Field(None, description="Avatar selection for voice type")
    
    class Config:
        schema_extra = {
            "example": {
                "text": "Hello, this is a test message.",
                "language": "en",
                "avatar": {
                    "gender": "female",
                    "dialect": "en-US"
                }
            }
        }

class TTSResult(BaseModel):
    """Internal result model for TTS processing"""
    file_path: str
    duration_seconds: float
    model_used: str
    processing_time: float

class TTSResponse(BaseModel):
    """Response model for text-to-speech generation"""
    file_url: str = Field(..., description="URL to access the generated audio file")
    duration_seconds: float = Field(..., description="Duration of the audio in seconds")
    
    class Config:
        schema_extra = {
            "example": {
                "file_url": "/audio-output/2023-09-15_12-30-45_female_en-US_abcd1234.mp3",
                "duration_seconds": 2.5
            }
        }

class TTSHistoryItem(BaseModel):
    """Model for an individual TTS history item"""
    id: int = Field(..., description="Unique ID of the TTS request")
    text: str = Field(..., description="Text that was converted to speech")
    language_code: str = Field(..., description="Language code used")
    avatar: Optional[Dict] = Field(None, description="Avatar used for voice")
    model_id: Optional[str] = Field(None, description="ID of the model used")
    file_path: Optional[str] = Field(None, description="File path of the audio file")
    file_url: Optional[str] = Field(None, description="URL to access the audio file")
    duration_seconds: Optional[float] = Field(None, description="Duration of the audio in seconds")
    processing_time: Optional[float] = Field(None, description="Time taken to process the request")
    created_at: str = Field(..., description="Timestamp when the request was created")

class TTSHistoryResponse(BaseModel):
    """Response model for TTS history"""
    total: int = Field(..., description="Total number of history items")
    items: List[TTSHistoryItem] = Field(..., description="List of TTS history items")

class BatchTTSItem(BaseModel):
    """Individual item in a batch TTS request"""
    id: str = Field(..., description="Unique identifier for this batch item")
    text: str = Field(..., description="Text to convert to speech")
    language: str = Field(..., description="Language code")
    avatar: Optional[Avatar] = Field(None, description="Avatar selection")

class BatchTTSRequest(BaseModel):
    """Request model for batch text-to-speech generation"""
    items: List[BatchTTSItem] = Field(..., description="List of items to process")
    
    class Config:
        schema_extra = {
            "example": {
                "items": [
                    {
                        "id": "post_01",
                        "text": "Welcome to our luxury hotel where every detail matters.",
                        "language": "en",
                        "avatar": {"gender": "female", "dialect": "en-US"}
                    },
                    {
                        "id": "post_02",
                        "text": "Bienvenido a nuestro hotel de lujo donde cada detalle importa.",
                        "language": "es",
                        "avatar": {"gender": "male", "dialect": "es-ES"}
                    }
                ]
            }
        }

class BatchTTSItemStatus(BaseModel):
    """Status of an individual item in a batch TTS job"""
    id: str
    status: str  # "pending", "processing", "completed", "failed"
    file_url: Optional[str] = None
    error: Optional[str] = None

class BatchTTSJobStatus(BaseModel):
    """Status of a batch TTS job"""
    job_id: str
    status: str  # "submitted", "processing", "completed", "failed"
    total_items: int
    completed_items: int
    failed_items: int
    items: List[BatchTTSItemStatus]

class ModelInfo(BaseModel):
    """Information about a TTS model"""
    id: str
    name: str
    languages: List[str]
    description: str
    quantized: bool

class LanguageInfo(BaseModel):
    """Information about a supported language"""
    code: str
    name: str
    dialects: Optional[List[Dict[str, str]]] = None

class AvatarInfo(BaseModel):
    """Information about an available avatar"""
    gender: Gender
    dialect: Optional[str] = None
    description: str

class ResourceUsage(BaseModel):
    """System resource usage statistics"""
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    gpu_percent: Optional[float] = None
    gpu_memory_percent: Optional[float] = None

class WorkerStats(BaseModel):
    """Statistics for a Ray worker"""
    worker_id: str
    model_id: Optional[str] = None
    hostname: str
    tasks_processed: int
    last_accessed: Optional[str] = None
    resources: Optional[Dict[str, Any]] = None

class NodeMetrics(BaseModel):
    """Metrics for a Ray node"""
    node_id: str
    node_ip: str
    hostname: str
    cpu_total: float
    cpu_used: float
    memory_total: float
    memory_used: float
    gpu_total: Optional[float] = None
    gpu_used: Optional[float] = None
    uptime_seconds: Optional[float] = None
    ray_version: Optional[str] = None
    workers: Optional[int] = None
    actor_count: Optional[int] = None

class ClusterResources(BaseModel):
    """Ray cluster resource usage"""
    cpu_total: float
    cpu_used: float
    cpu_percent: float
    memory_total: float
    memory_used: float
    memory_percent: float

class GPUMetrics(BaseModel):
    """GPU metrics"""
    gpu_id: int
    node_id: str
    usage_percent: float
    memory_used: float
    memory_total: float
    temperature: Optional[float] = None
    power: Optional[float] = None

class SystemStats(BaseModel):
    """Overall system statistics"""
    total_nodes: int
    active_nodes: int
    total_workers: int
    active_workers: int
    total_gpus: int
    active_gpus: int
    cluster_resources: Optional[Dict[str, Any]] = None
    node_metrics: Optional[List[Dict[str, Any]]] = None
    workers: List[Dict[str, Any]]
    gpu_info: List[Dict[str, Any]]
    jobs_pending: Optional[int] = 0
    jobs_running: Optional[int] = 0
    jobs_completed: Optional[int] = 0
    jobs_failed: Optional[int] = 0 