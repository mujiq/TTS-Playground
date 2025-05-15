-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Languages table
CREATE TABLE IF NOT EXISTS languages (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
);

-- Language dialects table
CREATE TABLE IF NOT EXISTS language_dialects (
    id SERIAL PRIMARY KEY,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
);

-- Avatars table
CREATE TABLE IF NOT EXISTS avatars (
    id SERIAL PRIMARY KEY,
    gender VARCHAR(10) NOT NULL,
    dialect_id INTEGER REFERENCES language_dialects(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL
);

-- TTS models table
CREATE TABLE IF NOT EXISTS tts_models (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    quantized BOOLEAN NOT NULL DEFAULT FALSE,
    embedding vector(384)  -- Vector embedding for semantic search
);

-- Model-language support
CREATE TABLE IF NOT EXISTS model_languages (
    model_id INTEGER NOT NULL REFERENCES tts_models(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    PRIMARY KEY (model_id, language_id)
);

-- TTS request logs
CREATE TABLE IF NOT EXISTS tts_requests (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    avatar_id INTEGER REFERENCES avatars(id) ON DELETE SET NULL,
    model_id INTEGER REFERENCES tts_models(id) ON DELETE SET NULL,
    file_path VARCHAR(255),
    duration_seconds FLOAT,
    processing_time FLOAT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Batch jobs table
CREATE TABLE IF NOT EXISTS batch_jobs (
    id VARCHAR(100) PRIMARY KEY,
    status VARCHAR(20) NOT NULL,
    total_items INTEGER NOT NULL,
    completed_items INTEGER NOT NULL DEFAULT 0,
    failed_items INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Batch job items
CREATE TABLE IF NOT EXISTS batch_job_items (
    id VARCHAR(100) NOT NULL,
    job_id VARCHAR(100) NOT NULL REFERENCES batch_jobs(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    avatar_id INTEGER REFERENCES avatars(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL,
    file_url VARCHAR(255),
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (job_id, id)
);

-- System stats table for monitoring
CREATE TABLE IF NOT EXISTS system_stats (
    id SERIAL PRIMARY KEY,
    total_nodes INTEGER NOT NULL,
    active_nodes INTEGER NOT NULL,
    total_workers INTEGER NOT NULL,
    active_workers INTEGER NOT NULL,
    total_gpus INTEGER NOT NULL,
    active_gpus INTEGER NOT NULL,
    cpu_percent FLOAT NOT NULL,
    memory_percent FLOAT NOT NULL,
    disk_percent FLOAT NOT NULL,
    gpu_percent FLOAT,
    gpu_memory_percent FLOAT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default languages
INSERT INTO languages (code, name) VALUES
    ('en', 'English'),
    ('ar', 'Arabic'),
    ('es', 'Spanish'),
    ('hi', 'Hindi'),
    ('ur', 'Urdu')
ON CONFLICT (code) DO NOTHING;

-- Insert default dialects
INSERT INTO language_dialects (language_id, code, name) VALUES
    ((SELECT id FROM languages WHERE code = 'en'), 'en-US', 'American English'),
    ((SELECT id FROM languages WHERE code = 'en'), 'en-GB', 'British English'),
    ((SELECT id FROM languages WHERE code = 'en'), 'en-AU', 'Australian English'),
    ((SELECT id FROM languages WHERE code = 'ar'), 'ar-SA', 'Saudi Arabic'),
    ((SELECT id FROM languages WHERE code = 'ar'), 'ar-EG', 'Egyptian Arabic'),
    ((SELECT id FROM languages WHERE code = 'ar'), 'ar-AE', 'Gulf Arabic'),
    ((SELECT id FROM languages WHERE code = 'es'), 'es-ES', 'Castilian Spanish'),
    ((SELECT id FROM languages WHERE code = 'es'), 'es-MX', 'Mexican Spanish'),
    ((SELECT id FROM languages WHERE code = 'es'), 'es-AR', 'Argentine Spanish')
ON CONFLICT (code) DO NOTHING;

-- Insert default avatars
INSERT INTO avatars (gender, dialect_id, description) VALUES
    ('male', (SELECT id FROM language_dialects WHERE code = 'en-US'), 'American English Male Voice'),
    ('female', (SELECT id FROM language_dialects WHERE code = 'en-US'), 'American English Female Voice'),
    ('male', (SELECT id FROM language_dialects WHERE code = 'en-GB'), 'British English Male Voice'),
    ('female', (SELECT id FROM language_dialects WHERE code = 'en-GB'), 'British English Female Voice'),
    ('male', (SELECT id FROM language_dialects WHERE code = 'ar-SA'), 'Saudi Arabic Male Voice'),
    ('female', (SELECT id FROM language_dialects WHERE code = 'ar-SA'), 'Saudi Arabic Female Voice')
ON CONFLICT DO NOTHING;

-- Insert default TTS models
INSERT INTO tts_models (model_id, name, description, quantized) VALUES
    ('coqui/XTTS-v2', 'XTTS v2', 'High-quality multilingual TTS with voice cloning capabilities', TRUE),
    ('nari-labs/Dia-1.6B', 'Dia 1.6B', 'Large-scale TTS model with expressive capabilities', TRUE),
    ('hexgrad/Kokoro-82M', 'Kokoro 82M', 'Efficient smaller model for East Asian languages', FALSE),
    ('suno/bark', 'Bark', 'General-purpose TTS with music and sound effects', TRUE),
    ('SparkAudio/Spark-TTS-0.5B', 'Spark TTS', 'Balanced model for quality and performance', TRUE)
ON CONFLICT (model_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tts_requests_language ON tts_requests(language_code);
CREATE INDEX IF NOT EXISTS idx_tts_requests_created_at ON tts_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_job_items_status ON batch_job_items(status);
CREATE INDEX IF NOT EXISTS idx_system_stats_timestamp ON system_stats(timestamp);

-- Create vector index for model embeddings
CREATE INDEX IF NOT EXISTS idx_tts_models_embedding ON tts_models USING ivfflat (embedding vector_l2_ops);

-- Create function to log system stats
CREATE OR REPLACE FUNCTION log_system_stats(
    p_total_nodes INTEGER,
    p_active_nodes INTEGER,
    p_total_workers INTEGER,
    p_active_workers INTEGER,
    p_total_gpus INTEGER,
    p_active_gpus INTEGER,
    p_cpu_percent FLOAT,
    p_memory_percent FLOAT,
    p_disk_percent FLOAT,
    p_gpu_percent FLOAT,
    p_gpu_memory_percent FLOAT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO system_stats (
        total_nodes, active_nodes, total_workers, active_workers, total_gpus, active_gpus,
        cpu_percent, memory_percent, disk_percent, gpu_percent, gpu_memory_percent
    ) VALUES (
        p_total_nodes, p_active_nodes, p_total_workers, p_active_workers, p_total_gpus, p_active_gpus,
        p_cpu_percent, p_memory_percent, p_disk_percent, p_gpu_percent, p_gpu_memory_percent
    );
END;
$$ LANGUAGE plpgsql; 