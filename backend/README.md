# ARdent Study - FastAPI Backend

AR-Powered Contextual Learning Companion backend with FastAPI, SQLite, Neo4j, and AI integration.

## Features

- **JWT Authentication** - Secure signup/login with bcrypt password hashing
- **SQLite Database** - Local persistence for users, quizzes, and learning progress
- **Neo4j Knowledge Graph** - Collaborative concept relationships and knowledge visualization
- **OCR Ingestion** - Extract text from images with pluggable OCR (OpenAI Vision + pytesseract fallback)
- **AI Enhancement** - Call OpenAI API to generate quiz questions and concept explanations
- **Spaced Repetition** - Anki-like scheduling for optimal learning intervals
- **RESTful API** - Clean, well-documented endpoints with FastAPI

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app setup
│   ├── core/
│   │   ├── config.py           # Settings and environment config
│   │   └── security.py         # JWT and password utilities
│   ├── db/
│   │   ├── database.py         # SQLAlchemy setup
│   │   └── neo4j_driver.py     # Neo4j driver and utilities
│   ├── models/
│   │   ├── user.py             # User and auth schemas
│   │   ├── quiz.py             # Quiz and progress models
│   │   └── ocr.py              # OCR request/response schemas
│   ├── routes/
│   │   ├── auth.py             # Authentication endpoints
│   │   ├── ocr.py              # OCR endpoints
│   │   ├── quiz.py             # Quiz and spaced repetition endpoints
│   │   └── knowledge_graph.py  # Knowledge graph endpoints
│   └── services/
│       ├── ocr_service.py      # Pluggable OCR with fallback
│       ├── ai_service.py       # OpenAI integration
│       └── spaced_repetition.py # Anki-like scheduler
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Key settings:
- `DATABASE_URL` - SQLite path (default: `sqlite:///./ardent_study.db`)
- `NEO4J_URI` - Neo4j connection (default: `bolt://localhost:7687`)
- `SECRET_KEY` - JWT secret (change in production!)
- `OPENAI_API_KEY` - Your OpenAI API key (optional, mock fallback included)

### 3. Initialize Database

```bash
python -c "from app.db.database import init_db; init_db()"
```

### 4. Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server runs on `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

## API Endpoints

### Authentication

**Signup**
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student123",
    "email": "student@example.com",
    "password": "secure_password",
    "full_name": "John Student",
    "learning_style": "visual"
  }'
```

**Login**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student123",
    "password": "secure_password"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "student123",
    "email": "student@example.com",
    "full_name": "John Student",
    "learning_style": "visual"
  }
}
```

### OCR - Extract Text from Images

**Extract from Base64**
```bash
curl -X POST http://localhost:8000/api/ocr/extract \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

**Upload File**
```bash
curl -X POST http://localhost:8000/api/ocr/upload \
  -F "file=@path/to/image.jpg"
```

Response:
```json
{
  "extracted_text": "Sample text from image...",
  "confidence": 0.95,
  "language": "en"
}
```

### Quiz - Generate and Submit

**Generate Quiz**
```bash
curl -X POST http://localhost:8000/api/quiz/generate \
  -H "Content-Type: application/json" \
  -d '{
    "concept_id": "photosynthesis",
    "title": "Photosynthesis Fundamentals"
  }' \
  -H "Authorization: Bearer {access_token}"
```

**Submit Quiz Answers**
```bash
curl -X POST "http://localhost:8000/api/quiz/submit/quiz_id_here?quality=4&user_id=user_id_here" \
  -H "Content-Type: application/json" \
  -d '{
    "0": "Option A",
    "1": "Option B",
    "2": "Option A"
  }'
```

Response:
```json
{
  "quiz_id": "quiz_id_here",
  "score": 2,
  "total_questions": 3,
  "percentage": 66.67
}
```

**Get Due for Review** (Spaced Repetition)
```bash
curl -X GET "http://localhost:8000/api/quiz/due?user_id=user_id_here"
```

**Get Concept Progress**
```bash
curl -X GET "http://localhost:8000/api/quiz/progress/photosynthesis?user_id=user_id_here"
```

### Knowledge Graph

**Create Concept Node**
```bash
curl -X POST http://localhost:8000/api/knowledge-graph/concepts/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "photosynthesis",
    "name": "Photosynthesis",
    "definition": "Process by which plants convert light to chemical energy"
  }'
```

**Link Concepts**
```bash
curl -X POST http://localhost:8000/api/knowledge-graph/relations/create \
  -H "Content-Type: application/json" \
  -d '{
    "concept1_id": "photosynthesis",
    "concept2_id": "cellular_respiration",
    "relation_type": "OPPOSITE_OF"
  }'
```

**Get Knowledge Graph**
```bash
curl -X GET "http://localhost:8000/api/knowledge-graph/concepts/photosynthesis/graph?depth=2"
```

## Pluggable Services

### OCR Service
Located in `app/services/ocr_service.py`:
- **Primary**: External API (configurable via `OCR_API_URL`, `OCR_API_KEY`)
- **Fallback**: Local pytesseract implementation
- **Mock**: Returns sample text when OCR unavailable

To implement custom OCR:
```python
# Edit app/services/ocr_service.py
@staticmethod
async def _call_external_ocr(image_base64: str) -> dict:
    # Your custom OCR implementation
    pass
```

### AI Service
Located in `app/services/ai_service.py`:
- **Primary**: OpenAI API (requires `OPENAI_API_KEY`)
- **Mock**: Returns structured sample data for testing

To implement custom AI:
```python
# Edit app/services/ai_service.py
@staticmethod
async def _call_openai(concepts: List[str]) -> Dict:
    # Your custom AI implementation
    pass
```

## Spaced Repetition Algorithm

Implemented in `app/services/spaced_repetition.py`:
- **Intervals**: 1, 3, 7, 14, 30, 60+ days
- **Mastery Adjustment**: Based on quiz quality (0-5 scale)
- **Adaptive Scheduling**: Longer intervals for higher mastery

Usage:
```python
from app.services.spaced_repetition import SpacedRepetitionScheduler

# Get due concepts for review
due = SpacedRepetitionScheduler.get_due_concepts(user_concepts)

# Schedule next review after quiz
updates = SpacedRepetitionScheduler.schedule_next_review(
    review_count=3,
    mastery_level=2,
    quality=4  # User performance (0-5)
)
```

## Database Notes

### SQLite (Default)
```bash
# Location: ./ardent_study.db
# No server needed - file-based database
```

### Switch to PostgreSQL
```bash
# 1. Update .env
DATABASE_URL=postgresql://user:password@localhost/ardent_study

# 2. Install driver
pip install psycopg2-binary

# 3. Update requirements.txt
# Replace: sqlalchemy==2.0.23
# Add: psycopg2-binary==2.9.9
```

## Development

### Run with Hot Reload
```bash
uvicorn app.main:app --reload --port 8000
```

### Interactive Docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Database Inspection
```python
from app.db.database import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()
for user in users:
    print(user.username, user.email)
```

## Troubleshooting

**Neo4j Connection Failed**
- Ensure Neo4j is running: `docker run -p 7687:7687 -p 7474:7474 neo4j`
- Update `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` in `.env`

**OCR Not Working**
- Pytesseract requires system dependencies:
  - Ubuntu: `sudo apt-get install tesseract-ocr`
  - macOS: `brew install tesseract`
  - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki

**OpenAI API Errors**
- Verify `OPENAI_API_KEY` is set
- App gracefully falls back to mock data

## License

MIT License - Open for educational use
