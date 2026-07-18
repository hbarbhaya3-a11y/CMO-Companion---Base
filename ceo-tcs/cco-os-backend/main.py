import uvicorn
from app.main import app  # noqa: F401 — re-export for `uvicorn main:app`
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=False,
    )
