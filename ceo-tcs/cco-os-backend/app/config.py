import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cxo_db.db")
    GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
    GCP_LOCATION = os.getenv("GCP_LOCATION") or os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    GEMINI_FAST_MODEL = os.getenv("GEMINI_FAST_MODEL", "gemini-2.5-flash")
    GEMINI_CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-2.5-flash")
    GEMINI_BRIEF_MODEL = os.getenv("GEMINI_BRIEF_MODEL", "gemini-2.5-flash")
    GEMINI_TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0.4"))
    GEMINI_MAX_TOKENS = int(os.getenv("GEMINI_MAX_TOKENS", "2048"))
    ENABLE_GOOGLE_SEARCH = os.getenv("ENABLE_GOOGLE_SEARCH", "true").lower() == "true"

    # LLM provider for companion chat — "gemini" or "slm".
    # Default provider when the request doesn't specify one (UI toggle overrides).
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
    # SLM (llama-server on the GPU VM) — OpenAI-compatible endpoint.
    SLM_BASE_URL = os.getenv("SLM_BASE_URL", "http://localhost:8080")  # http://<VM_IP>:8080
    SLM_API_KEY = os.getenv("SLM_API_KEY", "")
    SLM_MODEL = os.getenv("SLM_MODEL", "qwen3-4b-instruct")
    SLM_TEMPERATURE = float(os.getenv("SLM_TEMPERATURE", "0.4"))
    SLM_MAX_TOKENS = int(os.getenv("SLM_MAX_TOKENS", "2048"))
    BACKEND_HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
    REGISTRATION_SECRET = os.getenv("REGISTRATION_SECRET", "cco-ups-2026")

settings = Settings()
