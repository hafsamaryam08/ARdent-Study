import httpx
import json
from typing import List, Dict
from app.core.config import settings

class AIService:
    """AI wrapper for OpenAI and other AI services."""
    
    @staticmethod
    async def get_enhancements(concepts: List[str]) -> Dict:
        """Get AI-enhanced concept explanations."""
        if settings.openai_api_key:
            return await AIService._call_openai(concepts)
        else:
            return AIService._mock_enhancements(concepts)
    
    @staticmethod
    async def _call_openai(concepts: List[str]) -> Dict:
        """Call OpenAI API for concept enhancement."""
        prompt = f"""For these learning concepts: {', '.join(concepts)}
        
Provide for each concept:
1. A clear, student-friendly definition
2. 2-3 real-world examples
3. Common misconceptions
4. 2-3 related concepts

Return as JSON with concept as key."""
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7
                }
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
    
    @staticmethod
    def _mock_enhancements(concepts: List[str]) -> Dict:
        """Mock implementation for testing."""
        enhancements = {}
        for concept in concepts:
            enhancements[concept] = {
                "definition": f"Clear explanation of {concept} for learners",
                "examples": [
                    f"Real-world example 1 of {concept}",
                    f"Real-world example 2 of {concept}",
                    f"Real-world example 3 of {concept}"
                ],
                "misconceptions": [
                    f"Common misunderstanding about {concept}",
                    f"Another misconception about {concept}"
                ],
                "related_concepts": ["concept1", "concept2", "concept3"],
                "multimedia_resources": [
                    {"type": "video", "url": "https://example.com/video"},
                    {"type": "article", "url": "https://example.com/article"}
                ]
            }
        return enhancements
    
    @staticmethod
    async def generate_quiz_questions(concept: str, num_questions: int = 5) -> List[Dict]:
        """Generate quiz questions for a concept."""
        if settings.openai_api_key:
            return await AIService._generate_with_openai(concept, num_questions)
        else:
            return AIService._generate_mock_questions(concept, num_questions)
    
    @staticmethod
    async def _generate_with_openai(concept: str, num_questions: int) -> List[Dict]:
        """Generate questions using OpenAI."""
        prompt = f"""Generate {num_questions} multiple-choice questions about "{concept}".
        
For each question, provide:
- question: The question text
- options: List of 4 options
- correct_answer: The correct option
- explanation: Why this is correct

Return as JSON array."""
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7
                }
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
    
    @staticmethod
    def _generate_mock_questions(concept: str, num_questions: int) -> List[Dict]:
        """Generate mock quiz questions."""
        questions = []
        for i in range(num_questions):
            questions.append({
                "question": f"What is an important aspect of {concept}?",
                "options": [
                    f"Option A for {concept}",
                    f"Option B for {concept}",
                    f"Option C for {concept}",
                    f"Option D for {concept}"
                ],
                "correct_answer": f"Option A for {concept}",
                "explanation": f"This is the correct answer because it directly relates to {concept}"
            })
        return questions
