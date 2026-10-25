#!/bin/bash
cd /home/avantik/Documents/hacathon1
exec backend/venv/bin/uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

