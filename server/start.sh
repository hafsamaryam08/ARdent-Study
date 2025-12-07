#!/bin/bash
export PYTHON_API_URL="http://localhost:8000"

# Start Python backend
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# Start Node.js frontend
npm run dev

wait
