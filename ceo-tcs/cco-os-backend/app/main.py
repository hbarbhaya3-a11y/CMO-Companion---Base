import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api import cxo_routes, chat_routes, simulation_routes, deep_simulation_routes, abm_routes, enterprise_routes, memory_routes, market_routes, wargame_routes, chat_history_routes, sim_history_routes, auth_routes, brief_routes, upload_routes
from app.utils.auth import get_current_user, hash_password
from app.database import engine, Base, SessionLocal
from app.config import settings
from app.models.user import User
from app.seed_memory import seed_memory_cards

logger = logging.getLogger(__name__)

SEED_USERS = [
    {"username": "admin", "password": "admin123", "full_name": "CCO Admin", "role": "admin"},
    {"username": "mat", "password": "mat123", "full_name": "Mat", "role": "admin"},
    {"username": "quinn.kilbury", "password": "Quinn@2026", "full_name": "Quinn Kilbury", "role": "viewer"},
    {"username": "francine.li", "password": "Francine@2026", "full_name": "Francine Li", "role": "viewer"},
    {"username": "remi.kent", "password": "Remi@2026", "full_name": "Remi Kent", "role": "viewer"},
    {"username": "stephanie.brown", "password": "Stephanie@2026", "full_name": "Stephanie Dobbs Brown", "role": "viewer"},
]


def _seed_users():
    db = SessionLocal()
    try:
        for u in SEED_USERS:
            if not db.query(User).filter(User.username == u["username"]).first():
                db.add(User(
                    username=u["username"],
                    hashed_password=hash_password(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    cxo_id=1,
                ))
                logger.info(f"Seeded user: {u['username']}")
        db.commit()
    except Exception as e:
        logger.error(f"Failed to seed users: {e}")
        db.rollback()
    finally:
        db.close()


def create_app() -> FastAPI:
    app = FastAPI(title="CCO OS Backend", version="2.0")

    Base.metadata.create_all(bind=engine)
    _seed_users()
    seed_memory_cards()

    origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")] if settings.ALLOWED_ORIGINS != "*" else ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Public routes — no auth required
    app.include_router(auth_routes.router)

    # Protected routes — require valid JWT
    app.include_router(cxo_routes.router, dependencies=[Depends(get_current_user)])
    app.include_router(chat_routes.router, dependencies=[Depends(get_current_user)])
    app.include_router(simulation_routes.router, dependencies=[Depends(get_current_user)])
    app.include_router(deep_simulation_routes.router, dependencies=[Depends(get_current_user)])
    app.include_router(abm_routes.router, dependencies=[Depends(get_current_user)])
    app.include_router(enterprise_routes.router, dependencies=[Depends(get_current_user)])
    app.include_router(memory_routes.router, dependencies=[Depends(get_current_user)])
    app.include_router(market_routes.router, dependencies=[Depends(get_current_user)])
    app.include_router(wargame_routes.router, dependencies=[Depends(get_current_user)])
    app.include_router(chat_history_routes.router, dependencies=[Depends(get_current_user)])
    app.include_router(sim_history_routes.router, dependencies=[Depends(get_current_user)])
    app.include_router(brief_routes.router, dependencies=[Depends(get_current_user)])
    app.include_router(upload_routes.router, dependencies=[Depends(get_current_user)])

    @app.get("/")
    def root():
        return {"message": "CCO OS Backend is running"}

    return app

app = create_app()
