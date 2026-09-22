import logging
import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.exceptions import AppException
from app.api.v1 import api_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("railone")

# Ensure tables exist
Base.metadata.create_all(bind=engine)

tags_metadata = [
    {"name": "Authentication", "description": "User registration, login, token refresh, and profile management."},
    {"name": "Stations", "description": "Railway station discovery and autocomplete search."},
    {"name": "Trains", "description": "Train schedules, routes, and seat availability search."},
    {"name": "Fares", "description": "Detailed multi-class railway ticket fare calculation."},
    {"name": "Passengers", "description": "Saved passenger profile management."},
    {"name": "Bookings", "description": "Transactional reservation and ticket management."},
    {"name": "Payments", "description": "Simulated payment processing for reservations."},
    {"name": "PNR", "description": "10-digit Passenger Name Record (PNR) status queries."},
    {"name": "Live Train Status", "description": "Real-time running status and timeline tracking."},
    {"name": "Notifications", "description": "User notifications and journey reminders."},
    {"name": "Favourites", "description": "Quick-access favourite travel routes."},
    {"name": "Admin Operations", "description": "Railway master data and system analytics oversight."},
    {"name": "Health", "description": "System and database connectivity health probe."}
]

app = FastAPI(
    title=f"{settings.PROJECT_NAME} Super App API",
    version=settings.VERSION,
    description="Production-grade Railway Super App backend providing train search, atomic booking, live status, PNR, payments, and admin operations.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    openapi_tags=tags_metadata
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    # Log sanitized request info
    if not request.url.path.startswith(("/api/docs", "/api/openapi.json", "/api/redoc")):
        logger.info(f"{request.method} {request.url.path} completed with status {response.status_code} in {duration_ms}ms")
    return response

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development and container flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Exception Handler for AppException
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    logger.warning(f"AppException on {request.url.path}: code={exc.code}, msg={exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

# Request Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_err = errors[0] if errors else {}
    msg = f"{first_err.get('loc', ['field'])[-1]}: {first_err.get('msg', 'Validation error')}"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": msg,
                "details": errors
            }
        }
    )

# Generic Exception Handler
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc)
            }
        }
    )

# Mount Routes under /api/v1 and alias to /api for convenience
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")

@app.get("/health", tags=["Health"])
def health_check():
    db_status = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} Super App API",
        "version": settings.VERSION,
        "documentation": "/api/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
