"""
Main FastAPI Application Entrypoint for SIH MPLADS AI.

AI-Powered MPLADS Anomaly Detection and Governance Risk Analysis System.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.anomalies import router as anomalies_router
from backend.api.statistics import router as statistics_router
from backend.api.search import router as search_router
from backend.api.projects import router as projects_router
from backend.api.assistant import router as assistant_router
from backend.api.alerts import router as alerts_router
from backend.api.upload import router as upload_router

app = FastAPI(
    title="MPLADS AI Anomaly Detection API",
    version="1.0.0",
    description=(
        "Governance decision-support and risk-prioritization system for analyzing "
        "Members of Parliament Local Area Development Scheme (MPLADS) constituency data. "
        "Identifies potential anomalies, elevated operational risks, and unusual patterns "
        "to assist administrative and audit prioritization."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend integration across local development ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8443",
        "http://127.0.0.1:8443",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(anomalies_router)
app.include_router(statistics_router)
app.include_router(search_router)
app.include_router(projects_router)
app.include_router(assistant_router)
app.include_router(alerts_router)
app.include_router(upload_router)


@app.get(
    "/",
    tags=["Health & Status"],
    summary="Health check endpoint",
    description="Returns the operational status of the MPLADS AI Backend API.",
)
def root_health_check():
    """
    Root API health check endpoint.
    """
    return {
        "message": "MPLADS AI API is running",
        "status": "success"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
