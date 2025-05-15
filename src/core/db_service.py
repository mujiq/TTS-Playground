from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional, Any
import datetime
import uuid

from src.core.db_models import (
    Language, LanguageDialect, Avatar, TTSModel, 
    TTSRequest, BatchJob, BatchJobItem, SystemStat,
    create_random_embedding
)
from src.core.models import (
    LanguageInfo, AvatarInfo, ModelInfo, 
    BatchTTSRequest, BatchTTSItemStatus, BatchTTSJobStatus,
    TTSResult, SystemStats
)

class DatabaseService:
    """Service class for database operations"""
    
    def get_languages(self, db: Session) -> List[Dict]:
        """Get all languages with their dialects"""
        languages = db.query(Language).all()
        return [language.to_dict() for language in languages]
    
    def get_avatars(self, db: Session) -> List[Dict]:
        """Get all avatars"""
        avatars = db.query(Avatar).all()
        return [avatar.to_dict() for avatar in avatars]
    
    def get_models(self, db: Session) -> List[Dict]:
        """Get all TTS models"""
        models = db.query(TTSModel).all()
        return [model.to_dict() for model in models]
    
    def log_tts_request(
        self, 
        db: Session, 
        text: str, 
        language_code: str, 
        avatar_id: Optional[int], 
        model_id: Optional[int], 
        file_path: Optional[str],
        duration_seconds: Optional[float],
        processing_time: Optional[float]
    ) -> TTSRequest:
        """Log a TTS request"""
        tts_request = TTSRequest(
            text=text,
            language_code=language_code,
            avatar_id=avatar_id,
            model_id=model_id,
            file_path=file_path,
            duration_seconds=duration_seconds,
            processing_time=processing_time
        )
        
        db.add(tts_request)
        db.commit()
        db.refresh(tts_request)
        
        return tts_request
    
    def create_batch_job(self, db: Session, batch_request: BatchTTSRequest) -> str:
        """Create a new batch job"""
        job_id = f"batch_{uuid.uuid4().hex}"
        
        batch_job = BatchJob(
            id=job_id,
            status="submitted",
            total_items=len(batch_request.items),
            completed_items=0,
            failed_items=0
        )
        
        db.add(batch_job)
        
        # Create items for the batch job
        for item in batch_request.items:
            # Get avatar ID if available
            avatar_id = None
            if item.avatar:
                avatar_query = db.query(Avatar).join(LanguageDialect)
                avatar_query = avatar_query.filter(
                    Avatar.gender == item.avatar.gender
                )
                
                if item.avatar.dialect:
                    avatar_query = avatar_query.filter(
                        LanguageDialect.code == item.avatar.dialect
                    )
                else:
                    # Try to find an avatar with matching language
                    avatar_query = avatar_query.filter(
                        LanguageDialect.language_id == db.query(Language.id).filter(
                            Language.code == item.language
                        ).scalar_subquery()
                    )
                
                avatar = avatar_query.first()
                if avatar:
                    avatar_id = avatar.id
            
            batch_item = BatchJobItem(
                id=item.id,
                job_id=job_id,
                text=item.text,
                language_code=item.language,
                avatar_id=avatar_id,
                status="pending",
                file_url=None,
                error=None
            )
            
            db.add(batch_item)
        
        db.commit()
        
        return job_id
    
    def update_batch_job_item(
        self, 
        db: Session, 
        job_id: str, 
        item_id: str, 
        status: str, 
        file_url: Optional[str] = None,
        error: Optional[str] = None
    ) -> None:
        """Update the status of a batch job item"""
        # Get the item
        item = db.query(BatchJobItem).filter(
            BatchJobItem.job_id == job_id,
            BatchJobItem.id == item_id
        ).first()
        
        if not item:
            return
        
        # Update the item
        item.status = status
        item.file_url = file_url
        item.error = error
        
        # Update the job status
        job = db.query(BatchJob).filter(BatchJob.id == job_id).first()
        
        if status == "completed":
            job.completed_items += 1
        elif status == "failed":
            job.failed_items += 1
        
        # Check if all items are processed
        if job.completed_items + job.failed_items == job.total_items:
            if job.failed_items == job.total_items:
                job.status = "failed"
            else:
                job.status = "completed"
        else:
            job.status = "processing"
        
        job.updated_at = datetime.datetime.now()
        
        db.commit()
    
    def get_batch_job_status(self, db: Session, job_id: str) -> Optional[BatchTTSJobStatus]:
        """Get the status of a batch job"""
        job = db.query(BatchJob).filter(BatchJob.id == job_id).first()
        
        if not job:
            return None
        
        return BatchTTSJobStatus(
            job_id=job.id,
            status=job.status,
            total_items=job.total_items,
            completed_items=job.completed_items,
            failed_items=job.failed_items,
            items=[
                BatchTTSItemStatus(
                    id=item.id,
                    status=item.status,
                    file_url=item.file_url,
                    error=item.error
                )
                for item in job.items
            ]
        )
    
    def log_system_stats(
        self, 
        db: Session, 
        total_nodes: int, 
        active_nodes: int,
        total_workers: int,
        active_workers: int,
        total_gpus: int,
        active_gpus: int,
        cpu_percent: float,
        memory_percent: float,
        disk_percent: float,
        gpu_percent: Optional[float] = None,
        gpu_memory_percent: Optional[float] = None
    ) -> SystemStat:
        """Log system statistics"""
        stat = SystemStat(
            total_nodes=total_nodes,
            active_nodes=active_nodes,
            total_workers=total_workers,
            active_workers=active_workers,
            total_gpus=total_gpus,
            active_gpus=active_gpus,
            cpu_percent=cpu_percent,
            memory_percent=memory_percent,
            disk_percent=disk_percent,
            gpu_percent=gpu_percent,
            gpu_memory_percent=gpu_memory_percent
        )
        
        db.add(stat)
        db.commit()
        db.refresh(stat)
        
        return stat
    
    def get_latest_system_stats(self, db: Session) -> Optional[SystemStat]:
        """Get the latest system statistics"""
        return db.query(SystemStat).order_by(SystemStat.timestamp.desc()).first()
    
    def find_model_by_name(self, db: Session, model_name: str) -> Optional[TTSModel]:
        """Find a model by its name or ID"""
        return db.query(TTSModel).filter(
            (TTSModel.model_id == model_name) | (TTSModel.name == model_name)
        ).first()
    
    def find_avatar_by_params(
        self, 
        db: Session, 
        gender: str, 
        dialect: Optional[str] = None
    ) -> Optional[Avatar]:
        """Find an avatar by gender and dialect"""
        query = db.query(Avatar).filter(Avatar.gender == gender)
        
        if dialect:
            query = query.join(LanguageDialect).filter(LanguageDialect.code == dialect)
        
        return query.first()
    
    def find_language_by_code(self, db: Session, code: str) -> Optional[Language]:
        """Find a language by its code"""
        return db.query(Language).filter(Language.code == code).first()
    
    def find_dialect_by_code(self, db: Session, code: str) -> Optional[LanguageDialect]:
        """Find a dialect by its code"""
        return db.query(LanguageDialect).filter(LanguageDialect.code == code).first()
    
    def initialize_models_with_embeddings(self, db: Session) -> None:
        """Initialize model embeddings if they don't exist"""
        models = db.query(TTSModel).filter(TTSModel.embedding.is_(None)).all()
        
        for model in models:
            model.embedding = create_random_embedding()
        
        db.commit()
    
    def find_similar_models(self, db: Session, embedding, limit: int = 5) -> List[TTSModel]:
        """Find similar models using vector similarity search"""
        # This is a placeholder for pgvector similarity search
        # In a real implementation, this would use the cosine similarity function
        return db.query(TTSModel).order_by(
            func.l2_distance(TTSModel.embedding, embedding)
        ).limit(limit).all()

# Create a singleton instance
db_service = DatabaseService() 