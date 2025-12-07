from sqlalchemy import Column, String, Integer, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
from app.db.database import Base

class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    concept_id = Column(String, nullable=True)
    title = Column(String, nullable=False)
    questions = Column(JSON, nullable=False)
    score = Column(Integer, nullable=True)
    completed = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

class LearningProgress(Base):
    __tablename__ = "learning_progress"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    concept_id = Column(String, nullable=False)
    mastery_level = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    last_reviewed = Column(DateTime, nullable=True)
    next_review = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

# Pydantic schemas
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class QuizCreate(BaseModel):
    concept_id: str
    title: str

class QuizResponse(BaseModel):
    id: str
    user_id: str
    concept_id: str
    title: str
    questions: List[dict]
    score: Optional[int]
    completed: bool
    
    class Config:
        from_attributes = True

class LearningProgressResponse(BaseModel):
    id: str
    user_id: str
    concept_id: str
    mastery_level: int
    review_count: int
    next_review: Optional[str]
    
    class Config:
        from_attributes = True
