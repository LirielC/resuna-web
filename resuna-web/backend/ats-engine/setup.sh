#!/bin/bash

# Setup script for ATS Engine Python service

echo "=========================================="
echo "  Resuna ATS Engine - Setup"
echo "=========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version

if [ $? -ne 0 ]; then
    echo "❌ Python 3 not found. Please install Python 3.8 or higher."
    exit 1
fi

echo "✓ Python found"
echo ""

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

if [ $? -ne 0 ]; then
    echo "❌ Failed to create virtual environment."
    echo "On Ubuntu/Debian, install: sudo apt install python3-venv"
    exit 1
fi

echo "✓ Virtual environment created"
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Download spaCy model
echo "Downloading spaCy language model (en_core_web_md)..."
python -m spacy download en_core_web_md

if [ $? -ne 0 ]; then
    echo "⚠ Warning: Failed to download spaCy model"
    echo "You can download it manually later with:"
    echo "  python -m spacy download en_core_web_md"
else
    echo "✓ spaCy model downloaded"
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "To start the ATS Engine:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Run the server: python main.py"
echo "  3. Or use uvicorn: uvicorn main:app --reload --port 8000"
echo ""
echo "The service will be available at: http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo ""
