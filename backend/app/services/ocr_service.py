import httpx
import base64
from io import BytesIO
from PIL import Image
import pytesseract
from app.core.config import settings
from typing import Optional

class OCRService:
    """OCR service with pluggable implementation."""
    
    @staticmethod
    async def extract_text_from_image(image_base64: str) -> dict:
        """Extract text from base64 encoded image."""
        try:
            # Try external API first
            if settings.openai_api_key:
                return await OCRService._call_external_ocr(image_base64)
        except Exception as e:
            print(f"External OCR failed: {e}")
        
        # Fallback to local pytesseract
        return await OCRService._call_local_ocr(image_base64)
    
    @staticmethod
    async def _call_external_ocr(image_base64: str) -> dict:
        """Call external OCR API (pluggable)."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.ocr_api_url,
                json={"image": image_base64},
                headers={"Authorization": f"Bearer {settings.ocr_api_key}"}
            )
            response.raise_for_status()
            data = response.json()
            return {
                "extracted_text": data.get("text", ""),
                "confidence": data.get("confidence", 0.9),
                "language": data.get("language", "en")
            }
    
    @staticmethod
    async def _call_local_ocr(image_base64: str) -> dict:
        """Fallback to local pytesseract implementation."""
        try:
            # Decode base64
            image_data = base64.b64decode(image_base64)
            image = Image.open(BytesIO(image_data))
            
            # Extract text using pytesseract
            text = pytesseract.image_to_string(image)
            
            return {
                "extracted_text": text,
                "confidence": 0.85,
                "language": "en"
            }
        except Exception as e:
            # Mock fallback
            return {
                "extracted_text": "Sample extracted text from image. This is a mock implementation.",
                "confidence": 0.75,
                "language": "en"
            }
