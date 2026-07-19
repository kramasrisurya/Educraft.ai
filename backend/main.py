import os
import jwt
import fitz  # PyMuPDF
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="EduCraft AI Backend",
    description="FastAPI service for EduCraft AI Course Generation and PDF Parsing",
    version="1.0.0"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# JWT Secret setup
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "your_supabase_jwt_secret_here")

# Security schema for standard bearer token header
security = HTTPBearer(auto_error=False)

def verify_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """
    Dependency to verify and decode Supabase JWT token.
    Supports standard Bearer header.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization credentials missing"
        )
    
    token = credentials.credentials
    try:
        # Supabase JWTs are typically HS256 encoded with the JWT secret
        # Disable audience verification as it may differ by Supabase project configuration, but verify signature
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

# Health check endpoint
@app.get("/api/health")
def health_check():
    """
    Simple health check endpoint to verify status of backend service.
    """
    return {
        "status": "healthy",
        "service": "EduCraft AI Backend",
        "database_connected": os.getenv("DATABASE_URL") is not None
    }

# Course Generation / PDF Extraction Endpoint
@app.post("/api/courses/generate")
async def generate_course(
    file: UploadFile = File(...),
    token: Optional[str] = Form(None),
    user_payload: dict = Depends(verify_user)
):
    """
    Endpoint that accepts a PDF file, parses its contents using PyMuPDF,
    and returns a structured success message.
    """
    # Verify file is a PDF
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid PDF document"
        )

    # Read PDF content
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    # Extract text using PyMuPDF (fitz)
    extracted_text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total_pages = len(doc)
        
        for page_num in range(total_pages):
            page = doc.load_page(page_num)
            extracted_text += page.get_text()
            
        doc.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract text from PDF: {str(e)}"
        )

    text_length = len(extracted_text.strip())
    if text_length == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded PDF appears to be empty or contains non-extractable scanned images."
        )

    # Prepare response
    return {
        "success": True,
        "message": "PDF content extracted successfully and course processing initiated.",
        "user_id": user_payload.get("sub"),
        "email": user_payload.get("email"),
        "file_info": {
            "filename": file.filename,
            "size_bytes": len(file_bytes),
            "total_pages": total_pages,
            "extracted_characters": text_length
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Use HOST and PORT environment variables or defaults
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host=host, port=port)
