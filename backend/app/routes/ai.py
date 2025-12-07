from fastapi import APIRouter, HTTPException
from typing import List, Dict
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/enhance")
async def enhance_concepts(request: Dict[str, List[str]]):
    """Enhance learning concepts with AI-generated explanations."""
    try:
        concepts = request.get("concepts", [])
        if not concepts:
            raise HTTPException(status_code=400, detail="concepts list required")
        
        enhancements = await AIService.get_enhancements(concepts)
        return enhancements
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
