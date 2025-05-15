#!/bin/bash

# Start Ray in the background
ray start --head --dashboard-host=0.0.0.0 --port=10001 --dashboard-port=8265 &

# Wait a moment for Ray to initialize
sleep 5

# Start the FastAPI server
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 