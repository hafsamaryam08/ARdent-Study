from pydantic import BaseModel
from typing import Optional

class OCRRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None

class OCRResponse(BaseModel):
    extracted_text: str
    confidence: float
    language: str = "en"

class ConceptExtraction(BaseModel):
    concept: str
    definition: str
    related_terms: list
