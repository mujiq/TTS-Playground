#!/usr/bin/env python3

import os
import sys
from sqlalchemy import create_engine, text

# Get the connection string from environment variable
DB_URL = os.environ.get('DATABASE_URL', 'postgresql://cursor_admin:xh7Gt5p9JQk2Vb8Z3eR2yF4W@postgres:5432/cursor_tts_db')

def check_database_connection():
    """Check if we can connect to the PostgreSQL database"""
    try:
        print(f"Attempting to connect to database with URL: {DB_URL}")
        engine = create_engine(DB_URL)
        
        # Test the connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"Successfully connected to PostgreSQL database.")
            print(f"Database version: {version}")
            
            # Check tables
            result = conn.execute(text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
            ))
            tables = [row[0] for row in result]
            print(f"Available tables: {', '.join(tables)}")
            
            # Check languages
            result = conn.execute(text("SELECT code, name FROM languages"))
            languages = [f"{row[0]} ({row[1]})" for row in result]
            print(f"Available languages: {', '.join(languages)}")
            
            # Check avatars
            result = conn.execute(text("""
                SELECT a.gender, ld.code, a.description 
                FROM avatars a 
                JOIN language_dialects ld ON a.dialect_id = ld.id
            """))
            avatars = [f"{row[0]} ({row[1]}): {row[2]}" for row in result]
            print(f"Available avatars: {', '.join(avatars)}")
            
            # Check models
            result = conn.execute(text("SELECT model_id, name FROM tts_models"))
            models = [f"{row[0]} ({row[1]})" for row in result]
            print(f"Available models: {', '.join(models)}")
            
            return True
            
    except Exception as e:
        print(f"Error connecting to database: {str(e)}")
        return False

if __name__ == "__main__":
    success = check_database_connection()
    sys.exit(0 if success else 1) 