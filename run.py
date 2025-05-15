#!/usr/bin/env python
"""
Run script for TextToSpeech Playground

This script initializes and runs the TextToSpeech Playground application,
using the centralized configuration from src/config.py.

Usage:
    python run.py
"""

import os
import sys
import logging
from pathlib import Path

# Ensure we can import from src
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import configuration
from src.config import API_HOST, API_PORT, DEBUG_MODE, validate_config
from src.api.main import app

if __name__ == "__main__":
    # Validate configuration
    validation = validate_config()
    if not validation["valid"]:
        for error in validation["errors"]:
            logging.error(f"Configuration error: {error}")
        sys.exit(1)
    
    # Run the application
    import uvicorn
    uvicorn.run(
        app, 
        host=API_HOST, 
        port=API_PORT,
        reload=DEBUG_MODE
    ) 