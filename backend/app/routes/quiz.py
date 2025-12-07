from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
import uuid
from app.db.database import get_db
from app.models.quiz import Quiz, QuizCreate, QuizResponse, LearningProgress, LearningProgressResponse
from app.services.ai_service import AIService
from app.services.spaced_repetition import SpacedRepetitionScheduler
from datetime import datetime

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(quiz_data: QuizCreate, db: Session = Depends(get_db), user_id: str = None):
    """Generate a quiz for a concept using AI."""
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="user_id required")
        
        # Get AI-generated questions
        questions = await AIService.generate_quiz_questions(quiz_data.concept_id)
        
        # Create quiz
        quiz = Quiz(
            id=str(uuid.uuid4()),
            user_id=user_id,
            concept_id=quiz_data.concept_id,
            title=quiz_data.title,
            questions=questions,
            completed=0
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        
        return QuizResponse.from_orm(quiz)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit/{quiz_id}")
async def submit_quiz(
    quiz_id: str,
    answers: dict,
    quality: int = Query(3, ge=0, le=5),
    user_id: str = Header(None),
    db: Session = Depends(get_db)
):
    """Submit quiz answers and calculate score."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Calculate score
    score = 0
    for i, question in enumerate(quiz.questions):
        if str(i) in answers and answers[str(i)] == question.get("correct_answer"):
            score += 1
    
    # Update quiz
    quiz.score = score
    quiz.completed = 1
    
    # Update learning progress
    if quiz.concept_id:
        progress = db.query(LearningProgress).filter(
            LearningProgress.user_id == user_id,
            LearningProgress.concept_id == quiz.concept_id
        ).first()
        
        if not progress:
            progress = LearningProgress(
                id=str(uuid.uuid4()),
                user_id=user_id,
                concept_id=quiz.concept_id,
                mastery_level=0,
                review_count=0
            )
            db.add(progress)
        
        # Update using spaced repetition
        quality_score = quality
        updates = SpacedRepetitionScheduler.schedule_next_review(
            progress.review_count,
            int(progress.mastery_level),
            quality_score
        )
        progress.review_count = updates["review_count"]
        progress.mastery_level = updates["mastery_level"]
        progress.next_review = datetime.fromisoformat(updates["next_review"])
        progress.last_reviewed = datetime.utcnow()
    
    db.commit()
    
    return {
        "quiz_id": quiz_id,
        "score": score,
        "total_questions": len(quiz.questions),
        "percentage": (score / len(quiz.questions)) * 100 if quiz.questions else 0
    }

@router.get("/due", response_model=list[LearningProgressResponse])
async def get_due_for_review(user_id: str = Header(None), db: Session = Depends(get_db)):
    """Get concepts due for review (spaced repetition)."""
    concepts = db.query(LearningProgress).filter(
        LearningProgress.user_id == user_id
    ).all()
    
    due_concepts = SpacedRepetitionScheduler.get_due_concepts(concepts)
    
    return [LearningProgressResponse.from_orm(c) for c in due_concepts]

@router.get("/progress/{concept_id}", response_model=LearningProgressResponse)
async def get_concept_progress(
    concept_id: str,
    user_id: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get learning progress for a specific concept."""
    progress = db.query(LearningProgress).filter(
        LearningProgress.user_id == user_id,
        LearningProgress.concept_id == concept_id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="No progress found")
    
    return LearningProgressResponse.from_orm(progress)
