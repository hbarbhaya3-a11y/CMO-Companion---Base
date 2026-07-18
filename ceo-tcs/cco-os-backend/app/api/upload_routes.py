from fastapi import APIRouter, UploadFile, File, HTTPException
import io
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_TEXT_CHARS = 50_000


def _extract_pdf(data: bytes) -> str:
    from PyPDF2 import PdfReader
    reader = PdfReader(io.BytesIO(data))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n\n".join(pages)


def _extract_docx(data: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(data))
    return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())


@router.post("")
async def upload_document(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}. Only PDF and DOCX allowed.")

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large. Maximum {MAX_FILE_SIZE // (1024*1024)}MB.")

    file_type = ALLOWED_TYPES[file.content_type]
    try:
        if file_type == "pdf":
            text_content = _extract_pdf(data)
        else:
            text_content = _extract_docx(data)
    except Exception as e:
        logger.error(f"Failed to extract text from {file.filename}: {e}")
        raise HTTPException(500, f"Failed to extract text from document: {e}")

    if len(text_content) > MAX_TEXT_CHARS:
        text_content = text_content[:MAX_TEXT_CHARS] + f"\n\n[Document truncated at {MAX_TEXT_CHARS} characters]"

    return {
        "filename": file.filename,
        "file_type": file_type,
        "text_content": text_content,
        "char_count": len(text_content),
    }
