#!/bin/bash

# Start script for ATS Engine

echo "Starting Resuna ATS Engine..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found."
    echo "Run ./setup.sh first to set up the environment."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Start the server
echo "🚀 Starting FastAPI server on port 8000..."
python main.py
