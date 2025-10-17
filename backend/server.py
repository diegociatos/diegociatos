from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Ciatos ATS API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import and include all route modules
from routes import auth, organizations, users, candidates, skills, jobs, applications, interviews, feedbacks, questionnaires, assessments, scores, notifications, consents, reports, recruiter

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(candidates.router, prefix="/candidates", tags=["candidates"])
api_router.include_router(skills.router, prefix="/skills", tags=["skills"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["interviews"])
api_router.include_router(feedbacks.router, prefix="/feedbacks", tags=["feedbacks"])
api_router.include_router(questionnaires.router, prefix="/questionnaires", tags=["questionnaires"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
api_router.include_router(scores.router, prefix="/scores", tags=["scores"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(consents.router, prefix="/consents", tags=["consents"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(recruiter.router, prefix="/recruiter", tags=["recruiter"])

api_router.get("/")(lambda: {"message": "Ciatos ATS API v1.0"})

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
