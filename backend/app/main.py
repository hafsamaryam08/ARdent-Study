from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import init_db
from app.routes import auth, ocr, quiz, knowledge_graph, ai

# Initialize FastAPI
app = FastAPI(
    title="ARdent Study API",
    description="AR-Powered Contextual Learning Companion",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
@app.on_event("startup")
async def startup():
    init_db()

# Include routes
app.include_router(auth.router)
app.include_router(ocr.router)
app.include_router(ai.router)
app.include_router(quiz.router)
app.include_router(knowledge_graph.router)

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "name": "ARdent Study API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check for monitoring."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
