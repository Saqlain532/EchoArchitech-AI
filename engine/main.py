import logging
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, Request, HTTPException, Header, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId

from config import settings
from db import Database, get_projects_collection, get_tasks_collection, get_commits_collection
from services.webhook_handler import WebhookHandler
from services.github_poller import GitHubPoller
from services.task_scheduler import TaskScheduler

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [%(name)s]: %(message)s'
)
logger = logging.getLogger('engine.main')

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB Atlas
    logger.info("Initializing EchoArchitech AI Engine Service...")
    try:
        Database.connect()
        logger.info("Connected to MongoDB Atlas!")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB on startup: {e}")
    yield
    # Shutdown: Close database connection
    Database.close()
    logger.info("EchoArchitech AI Engine shutdown completed.")

app = FastAPI(
    title="EchoArchitech AI - Git & Webhook Monitoring Engine",
    description="Microservice for public GitHub commit polling, webhook processing, diff parsing, and automated task advancement.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend and API gateway
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas for request payloads
class ManualCommitItem(BaseModel):
    hash: str
    message: str
    author: Optional[str] = "developer"
    timestamp: Optional[str] = None
    modifiedFiles: List[str]

class ManualSyncPayload(BaseModel):
    projectId: str
    commits: List[ManualCommitItem]

@app.get("/")
@app.get("/health")
def health_check():
    """Health check endpoint confirming MongoDB and service status."""
    db_connected = False
    try:
        db = Database.get_db()
        db.command('ping')
        db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "online",
        "service": "EchoArchitech-AI-Engine",
        "port": settings.PORT,
        "database": {
            "name": settings.DB_NAME,
            "connected": db_connected,
        },
    }

@app.post("/webhook")
@app.post("/api/webhook/github")
async def github_webhook(
    request: Request,
    x_github_event: Optional[str] = Header(None, alias="X-GitHub-Event"),
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256"),
    projectId: Optional[str] = Query(None)
):
    """
    GitHub Webhook receiver for public repo push events.
    Parses commit diffs, matches targetFiles, and advances project sprint day.
    """
    raw_body = await request.body()

    # Validate HMAC signature if configured
    if not WebhookHandler.verify_signature(raw_body, x_hub_signature_256):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid GitHub webhook signature"
        )

    # Handle ping event
    if x_github_event == "ping":
        return {"status": "ok", "message": "GitHub ping event acknowledged"}

    try:
        payload = await request.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON payload: {e}"
        )

    result = WebhookHandler.handle_github_push(payload, project_id_param=projectId)
    return result

@app.post("/api/sync/manual")
def manual_commit_simulation(payload: ManualSyncPayload):
    """
    Allows direct commit submission to verify diff matching and task scheduling
    without requiring an active GitHub push.
    """
    try:
        commits_data = [c.model_dump() for c in payload.commits]
        result = TaskScheduler.process_commits_for_project(payload.projectId, commits_data)
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Manual commit processing error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/api/sync/{project_id}")
def sync_public_repo(project_id: str):
    """
    Inspects a public GitHub repository directly without webhooks,
    fetching recent commits, matching diffs against project tasks, and advancing progress.
    """
    try:
        result = GitHubPoller.sync_project_repo(project_id)
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Sync error for project {project_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.get("/api/project/{project_id}/status")
def get_project_monitoring_status(project_id: str):
    """
    Retrieves live monitoring statistics, sprint progress, and task metrics from MongoDB Atlas.
    """
    try:
        p_oid = ObjectId(project_id)
        project = get_projects_collection().find_one({'_id': p_oid})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        tasks = list(get_tasks_collection().find({'projectId': p_oid}))
        commits = list(get_commits_collection().find({'projectId': p_oid}).sort('timestamp', -1).limit(10))

        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.get('status') == 'Completed')
        progress = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0

        # Serialize ObjectIds to strings
        for c in commits:
            c['_id'] = str(c['_id'])
            c['projectId'] = str(c['projectId'])
            if 'timestamp' in c and hasattr(c['timestamp'], 'isoformat'):
                c['timestamp'] = c['timestamp'].isoformat()

        return {
            "success": True,
            "data": {
                "projectId": str(project['_id']),
                "title": project.get('title'),
                "currentDay": project.get('currentDay', 1),
                "totalDays": project.get('totalDays', 14),
                "status": project.get('status'),
                "repo": project.get('repo'),
                "progressPercent": progress,
                "totalTasks": total_tasks,
                "completedTasks": completed_tasks,
                "recentCommits": commits,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
