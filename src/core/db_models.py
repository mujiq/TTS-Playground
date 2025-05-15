from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Table, DateTime, Text, func, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import text
import os
from datetime import datetime
from pgvector.sqlalchemy import Vector
import numpy as np

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cursor_admin:xh7Gt5p9JQk2Vb8Z3eR2yF4W@postgres:5432/cursor_tts_db")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create SQLAlchemy base
Base = declarative_base()

# Define model language association table
model_languages = Table(
    'model_languages',
    Base.metadata,
    Column('model_id', Integer, ForeignKey('tts_models.id'), primary_key=True),
    Column('language_id', Integer, ForeignKey('languages.id'), primary_key=True)
)

# Define database models
class Language(Base):
    __tablename__ = 'languages'
    
    id = Column(Integer, primary_key=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    
    # Relationships
    dialects = relationship("LanguageDialect", back_populates="language", cascade="all, delete-orphan")
    models = relationship("TTSModel", secondary=model_languages, back_populates="languages")
    
    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "dialects": [dialect.to_dict() for dialect in self.dialects] if self.dialects else None
        }

class LanguageDialect(Base):
    __tablename__ = 'language_dialects'
    
    id = Column(Integer, primary_key=True)
    language_id = Column(Integer, ForeignKey('languages.id'), nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    
    # Relationships
    language = relationship("Language", back_populates="dialects")
    avatars = relationship("Avatar", back_populates="dialect")
    
    def to_dict(self):
        return {
            "code": self.code,
            "name": self.name
        }

class Avatar(Base):
    __tablename__ = 'avatars'
    
    id = Column(Integer, primary_key=True)
    gender = Column(String(10), nullable=False)
    dialect_id = Column(Integer, ForeignKey('language_dialects.id'))
    description = Column(String(255), nullable=False)
    
    # Relationships
    dialect = relationship("LanguageDialect", back_populates="avatars")
    tts_requests = relationship("TTSRequest", back_populates="avatar")
    
    def to_dict(self):
        return {
            "id": self.id,
            "gender": self.gender,
            "dialect": self.dialect.code if self.dialect else None,
            "description": self.description
        }

class TTSModel(Base):
    __tablename__ = 'tts_models'
    
    id = Column(Integer, primary_key=True)
    model_id = Column(String(100), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    quantized = Column(Boolean, default=False, nullable=False)
    embedding = Column(Vector(384), nullable=True)  # Vector embedding for semantic search
    
    # Relationships
    languages = relationship("Language", secondary=model_languages, back_populates="models")
    tts_requests = relationship("TTSRequest", back_populates="model")
    
    def to_dict(self):
        return {
            "id": self.model_id,
            "name": self.name,
            "description": self.description,
            "quantized": self.quantized,
            "languages": [lang.code for lang in self.languages]
        }

class TTSRequest(Base):
    __tablename__ = 'tts_requests'
    
    id = Column(Integer, primary_key=True)
    text = Column(Text, nullable=False)
    language_code = Column(String(10), nullable=False)
    avatar_id = Column(Integer, ForeignKey('avatars.id'))
    model_id = Column(Integer, ForeignKey('tts_models.id'))
    file_path = Column(String(255))
    duration_seconds = Column(Float)
    processing_time = Column(Float)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    # Relationships
    avatar = relationship("Avatar", back_populates="tts_requests")
    model = relationship("TTSModel", back_populates="tts_requests")
    
    def to_dict(self):
        return {
            "id": self.id,
            "text": self.text,
            "language_code": self.language_code,
            "avatar": self.avatar.to_dict() if self.avatar else None,
            "model_id": self.model.model_id if self.model else None,
            "file_path": self.file_path,
            "duration_seconds": self.duration_seconds,
            "processing_time": self.processing_time,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class BatchJob(Base):
    __tablename__ = 'batch_jobs'
    
    id = Column(String(100), primary_key=True)
    status = Column(String(20), nullable=False)
    total_items = Column(Integer, nullable=False)
    completed_items = Column(Integer, default=0, nullable=False)
    failed_items = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    items = relationship("BatchJobItem", back_populates="job", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "job_id": self.id,
            "status": self.status,
            "total_items": self.total_items,
            "completed_items": self.completed_items,
            "failed_items": self.failed_items,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "items": [item.to_dict() for item in self.items]
        }

class BatchJobItem(Base):
    __tablename__ = 'batch_job_items'
    
    id = Column(String(100), nullable=False)
    job_id = Column(String(100), ForeignKey('batch_jobs.id'), nullable=False, primary_key=True)
    text = Column(Text, nullable=False)
    language_code = Column(String(10), nullable=False)
    avatar_id = Column(Integer, ForeignKey('avatars.id'))
    status = Column(String(20), nullable=False)
    file_url = Column(String(255))
    error = Column(Text)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    # Relationships
    job = relationship("BatchJob", back_populates="items")
    avatar = relationship("Avatar")
    
    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status,
            "file_url": self.file_url,
            "error": self.error
        }

class SystemStat(Base):
    __tablename__ = 'system_stats'
    
    id = Column(Integer, primary_key=True)
    total_nodes = Column(Integer, nullable=False)
    active_nodes = Column(Integer, nullable=False)
    total_workers = Column(Integer, nullable=False)
    active_workers = Column(Integer, nullable=False)
    total_gpus = Column(Integer, nullable=False)
    active_gpus = Column(Integer, nullable=False)
    cpu_percent = Column(Float, nullable=False)
    memory_percent = Column(Float, nullable=False)
    disk_percent = Column(Float, nullable=False)
    gpu_percent = Column(Float)
    gpu_memory_percent = Column(Float)
    timestamp = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "total_nodes": self.total_nodes,
            "active_nodes": self.active_nodes,
            "total_workers": self.total_workers,
            "active_workers": self.active_workers,
            "total_gpus": self.total_gpus,
            "active_gpus": self.active_gpus,
            "cpu_percent": self.cpu_percent,
            "memory_percent": self.memory_percent,
            "disk_percent": self.disk_percent,
            "gpu_percent": self.gpu_percent,
            "gpu_memory_percent": self.gpu_memory_percent,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Helper function to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper function to create random vector embeddings for models
def create_random_embedding(dimension=384):
    """Create a random vector embedding for a model."""
    embedding = np.random.randn(dimension).astype(np.float32)
    # Normalize to unit length
    embedding = embedding / np.linalg.norm(embedding)
    return embedding 