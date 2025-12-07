from fastapi import APIRouter, HTTPException, File, UploadFile
from app.models.ocr import OCRRequest, OCRResponse
from app.services.ocr_service import OCRService
import base64

router = APIRouter(prefix="/api/ocr", tags=["ocr"])

@router.post("/extract", response_model=OCRResponse)
async def extract_text(request: OCRRequest):
    """Extract text from image using OCR."""
    if not request.image_base64 and not request.image_url:
        raise HTTPException(status_code=400, detail="Either image_base64 or image_url required")
    
    try:
        if request.image_base64:
            result = await OCRService.extract_text_from_image(request.image_base64)
        else:
            # Download image from URL and convert to base64
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(request.image_url)
                image_base64 = base64.b64encode(response.content).decode()
            result = await OCRService.extract_text_from_image(image_base64)
        
        return OCRResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_and_extract(file: UploadFile = File(...)):
    """Upload image file and extract text."""
    try:
        content = await file.read()
        image_base64 = base64.b64encode(content).decode()
        result = await OCRService.extract_text_from_image(image_base64)
        return OCRResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
