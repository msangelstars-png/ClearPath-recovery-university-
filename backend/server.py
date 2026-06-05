from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
except Exception:  # pragma: no cover - keeps app bootable if package changes
    LlmChat = None
    UserMessage = None
    TextDelta = None
    StreamDone = None

try:
    from emergentintegrations.payments.stripe.checkout import (
        CheckoutSessionRequest,
        StripeCheckout,
    )
except Exception:  # pragma: no cover
    CheckoutSessionRequest = None
    StripeCheckout = None


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def public_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "student"),
        "subscription_status": user.get("subscription_status", "free"),
        "onboarding_complete": user.get("onboarding_complete", False),
        "created_at": user.get("created_at"),
    }


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> Dict[str, Any]:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = auth.replace("Bearer ", "", 1)
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


SCHOOLS = [
    {
        "id": "recovery",
        "name": "School of Recovery",
        "description": "Build day-by-day recovery foundations, relapse prevention skills, and supportive routines.",
        "professor": "Professor Hope",
        "image": "https://images.unsplash.com/photo-1629161156834-67f7a989ca67?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHxwZWFjZWZ1bCUyMG5hdHVyZSUyMGxhbmRzY2FwZSUyMG1vcm5pbmclMjBzdW5yaXNlfGVufDB8fHx8MTc4MDYyNDUwMHww&ixlib=rb-4.1.0&q=85",
    },
    {
        "id": "mental-wellness",
        "name": "School of Mental Wellness",
        "description": "Learn emotional regulation, grounding, journaling, and mood awareness practices.",
        "professor": "Professor Insight",
        "image": "https://images.pexels.com/photos/30539356/pexels-photo-30539356.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    },
    {
        "id": "life-skills",
        "name": "School of Life Skills",
        "description": "Strengthen routines, communication, planning, boundaries, and practical confidence.",
        "professor": "Professor Compass",
        "image": "https://images.pexels.com/photos/16157307/pexels-photo-16157307.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    },
    {
        "id": "family-recovery",
        "name": "School of Family Recovery",
        "description": "Support families with repair, education, boundaries, and compassionate communication.",
        "professor": "Professor Bridge",
        "image": "https://images.unsplash.com/photo-1621192754911-ffe0d95929dd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB1bml2ZXJzaXR5JTIwYnVpbGRpbmclMjBzdW5ueXxlbnwwfHx8fDE3ODA2MjQ1MDB8MA&ixlib=rb-4.1.0&q=85",
    },
]

COURSES = [
    {
        "id": "recovery-foundations",
        "school_id": "recovery",
        "title": "Recovery Foundations",
        "difficulty": "Beginner",
        "instructor_ai": "Professor Hope",
        "summary": "A grounded starting path for cravings, routines, support systems, and identity rebuilding.",
        "premium": False,
    },
    {
        "id": "emotional-regulation",
        "school_id": "mental-wellness",
        "title": "Emotional Regulation Studio",
        "difficulty": "Beginner",
        "instructor_ai": "Professor Insight",
        "summary": "Practical calming, mood tracking, journaling, and thought reframing lessons.",
        "premium": False,
    },
    {
        "id": "daily-life-systems",
        "school_id": "life-skills",
        "title": "Daily Life Systems",
        "difficulty": "Intermediate",
        "instructor_ai": "Professor Compass",
        "summary": "Turn intentions into schedules, commitments, and tiny repeatable wins.",
        "premium": True,
    },
    {
        "id": "family-communication",
        "school_id": "family-recovery",
        "title": "Family Communication Reset",
        "difficulty": "Intermediate",
        "instructor_ai": "Professor Bridge",
        "summary": "Create safer conversations, supportive boundaries, and repair agreements.",
        "premium": True,
    },
]

LESSONS = [
    {
        "id": "rf-1",
        "course_id": "recovery-foundations",
        "title": "Your Recovery Map",
        "content": "Recovery begins with honest orientation. Notice what strengthens you, what drains you, and who belongs on your support map. Today, write one safe person, one high-risk moment, and one action you can take before pressure builds.",
        "reflection_prompt": "What is one signal that tells you support would help today?",
        "quiz": [{"question": "Which action best supports early recovery?", "options": ["Isolation", "Naming risk moments", "Ignoring cravings"], "answer": 1}],
    },
    {
        "id": "rf-2",
        "course_id": "recovery-foundations",
        "title": "The Next Right Step",
        "content": "A recovery plan works best when it is small enough to use. Choose the next right step: drink water, call support, leave a risky setting, attend a meeting, or pause for five breaths.",
        "reflection_prompt": "Which small action feels realistic in the next 24 hours?",
        "quiz": [{"question": "A useful recovery step should be:", "options": ["Specific and doable", "Perfect", "Hidden from support"], "answer": 0}],
    },
    {
        "id": "mw-1",
        "course_id": "emotional-regulation",
        "title": "Name It to Tame It",
        "content": "Emotions become easier to work with when named clearly. Try: I notice sadness, pressure, fear, or hope. Naming creates distance and gives your nervous system a cue that you are observing, not becoming, the feeling.",
        "reflection_prompt": "What emotion needs a name today?",
        "quiz": [{"question": "Naming an emotion can help by:", "options": ["Creating awareness", "Removing all stress forever", "Avoiding reflection"], "answer": 0}],
    },
    {
        "id": "mw-2",
        "course_id": "emotional-regulation",
        "title": "Grounding With the Present",
        "content": "Use the five senses to return to the present: see five things, touch four textures, hear three sounds, smell two scents, and name one thing you appreciate.",
        "reflection_prompt": "Which grounding sense helps you most?",
        "quiz": [{"question": "Grounding is meant to reconnect you with:", "options": ["The present moment", "Old arguments", "Perfection"], "answer": 0}],
    },
    {
        "id": "ls-1",
        "course_id": "daily-life-systems",
        "title": "Design a Stable Morning",
        "content": "A stable morning lowers decision fatigue. Choose a three-part anchor: body care, environment reset, and one meaningful task. Keep it repeatable, not impressive.",
        "reflection_prompt": "What three-part anchor would help tomorrow morning?",
        "quiz": [{"question": "A strong routine should be:", "options": ["Repeatable", "Overwhelming", "Based on motivation only"], "answer": 0}],
    },
    {
        "id": "fc-1",
        "course_id": "family-communication",
        "title": "Repair Without Defensiveness",
        "content": "Repair begins with ownership. Use: I hear what hurt you. I can see my part. Here is what I will do differently. Boundaries and accountability can exist together.",
        "reflection_prompt": "What is one sentence of repair you can practice safely?",
        "quiz": [{"question": "Repair is strengthened by:", "options": ["Ownership", "Blame", "Avoidance"], "answer": 0}],
    },
]

PROFESSORS = {
    "hope": {"name": "Professor Hope", "focus": "recovery encouragement, relapse prevention, and next-step planning"},
    "insight": {"name": "Professor Insight", "focus": "mental wellness, emotional literacy, and reflective journaling"},
    "compass": {"name": "Professor Compass", "focus": "life skills, routines, goals, and decision support"},
    "bridge": {"name": "Professor Bridge", "focus": "family recovery, communication, boundaries, and repair"},
}

PLANS = {
    "free": {"id": "free", "name": "Free", "amount": 0.0, "currency": "usd", "features": ["Limited courses", "Basic AI access"]},
    "premium": {"id": "premium", "name": "Premium", "amount": 19.99, "currency": "usd", "features": ["Full course access", "AI professors", "Progress tracking", "Certificates"]},
}


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OnboardingRequest(BaseModel):
    recovery_stage: str
    goals: List[str]
    learning_preferences: List[str]
    support_focus: Optional[str] = "balanced"


class CheckInRequest(BaseModel):
    mood_score: int = Field(ge=1, le=10)
    reflection_notes: str = Field(min_length=1, max_length=1200)


class JournalRequest(BaseModel):
    content: str = Field(min_length=1, max_length=3000)
    tags: List[str] = []


class LessonCompleteRequest(BaseModel):
    quiz_answers: List[int] = []
    reflection: str = ""


class AIChatRequest(BaseModel):
    professor_id: str
    message: str = Field(min_length=1, max_length=1500)
    lesson_id: Optional[str] = None


class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str


class PlanSelectRequest(BaseModel):
    plan_id: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "ClearPath Recovery University API"}


@app.on_event("startup")
async def seed_catalog() -> None:
    for school in SCHOOLS:
        await db.schools.update_one({"id": school["id"]}, {"$set": school}, upsert=True)
    for course in COURSES:
        await db.courses.update_one({"id": course["id"]}, {"$set": course}, upsert=True)
    for lesson in LESSONS:
        await db.lessons.update_one({"id": lesson["id"]}, {"$set": lesson}, upsert=True)


@api_router.post("/auth/register")
async def register(payload: AuthRequest):
    existing = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user_count = await db.users.count_documents({})
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": payload.email.lower(),
        "name": payload.name or payload.email.split("@")[0].title(),
        "password_hash": pwd_context.hash(payload.password),
        "role": "admin" if user_count == 0 else "student",
        "subscription_status": "free",
        "onboarding_complete": False,
        "streak": 0,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.users.insert_one(user_doc.copy())
    return {"token": create_token(user_doc["id"]), "user": public_user(user_doc)}


@api_router.post("/auth/login")
async def login(payload: LoginRequest):
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user or not pwd_context.verify(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": create_token(user["id"]), "user": public_user(user)}


@api_router.get("/me")
async def me(user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": public_user(user)}


def build_roadmap(profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    stage = profile.get("recovery_stage", "Starting")
    goals = profile.get("goals", [])
    preferences = profile.get("learning_preferences", [])
    return [
        {"week": 1, "title": f"Stabilize your {stage.lower()} foundation", "actions": ["Complete Recovery Foundations", "Submit daily check-ins", "Start a private journal"]},
        {"week": 2, "title": "Build emotional awareness", "actions": ["Study Emotional Regulation", "Track mood patterns", "Ask Professor Insight for reflection prompts"]},
        {"week": 3, "title": "Translate goals into routines", "actions": [f"Practice: {goals[0] if goals else 'one realistic weekly goal'}", "Enroll in Life Skills", "Review streak progress"]},
        {"week": 4, "title": "Strengthen support connections", "actions": ["Explore Family Recovery", f"Use your preferred learning mode: {', '.join(preferences[:2]) or 'short lessons'}", "Download certificates as courses finish"]},
    ]


@api_router.post("/onboarding")
async def save_onboarding(payload: OnboardingRequest, user: Dict[str, Any] = Depends(get_current_user)):
    profile = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "recovery_stage": payload.recovery_stage,
        "goals": payload.goals,
        "learning_preferences": payload.learning_preferences,
        "support_focus": payload.support_focus,
        "roadmap": build_roadmap(payload.model_dump()),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.assessments.insert_one(profile.copy())
    await db.users.update_one({"id": user["id"]}, {"$set": {"onboarding_complete": True, "updated_at": now_iso()}})
    await db.ai_memories.update_one(
        {"user_id": user["id"]},
        {"$set": {"user_id": user["id"], "profile": profile, "updated_at": now_iso()}},
        upsert=True,
    )
    return {"profile": profile, "roadmap": profile["roadmap"]}


@api_router.get("/roadmap")
async def get_roadmap(user: Dict[str, Any] = Depends(get_current_user)):
    profile = await db.assessments.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("created_at", -1)])
    return {"roadmap": profile.get("roadmap", []) if profile else []}


@api_router.get("/schools")
async def list_schools(user: Dict[str, Any] = Depends(get_current_user)):
    schools = await db.schools.find({}, {"_id": 0}).to_list(100)
    enrollments = await db.school_enrollments.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    enrolled = {item["school_id"] for item in enrollments}
    for school in schools:
        school["enrolled"] = school["id"] in enrolled
    return {"schools": schools}


@api_router.post("/schools/{school_id}/enroll")
async def enroll_school(school_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    school = await db.schools.find_one({"id": school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    enrollment = {"id": str(uuid.uuid4()), "user_id": user["id"], "school_id": school_id, "created_at": now_iso()}
    await db.school_enrollments.update_one({"user_id": user["id"], "school_id": school_id}, {"$setOnInsert": enrollment}, upsert=True)
    return {"enrolled": True, "school": school}


@api_router.get("/courses")
async def list_courses(user: Dict[str, Any] = Depends(get_current_user)):
    courses = await db.courses.find({}, {"_id": 0}).to_list(100)
    enrollments = await db.enrollments.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    progress = {item["course_id"]: item for item in enrollments}
    for course in courses:
        course["enrollment"] = progress.get(course["id"])
        course["locked"] = bool(course.get("premium")) and user.get("subscription_status") != "premium"
    return {"courses": courses}


@api_router.post("/courses/{course_id}/enroll")
async def enroll_course(course_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.get("premium") and user.get("subscription_status") != "premium":
        raise HTTPException(status_code=402, detail="Premium plan required")
    enrollment = {"id": str(uuid.uuid4()), "user_id": user["id"], "course_id": course_id, "progress_percentage": 0, "completed_lessons": [], "created_at": now_iso(), "updated_at": now_iso()}
    await db.enrollments.update_one({"user_id": user["id"], "course_id": course_id}, {"$setOnInsert": enrollment}, upsert=True)
    return {"enrolled": True}


@api_router.get("/courses/{course_id}")
async def get_course(course_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.get("premium") and user.get("subscription_status") != "premium":
        raise HTTPException(status_code=402, detail="Premium plan required")
    lessons = await db.lessons.find({"course_id": course_id}, {"_id": 0}).to_list(100)
    enrollment = await db.enrollments.find_one({"user_id": user["id"], "course_id": course_id}, {"_id": 0})
    return {"course": course, "lessons": lessons, "enrollment": enrollment}


@api_router.post("/lessons/{lesson_id}/complete")
async def complete_lesson(lesson_id: str, payload: LessonCompleteRequest, user: Dict[str, Any] = Depends(get_current_user)):
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    course_id = lesson["course_id"]
    lessons = await db.lessons.find({"course_id": course_id}, {"_id": 0}).to_list(100)
    correct = 0
    for idx, question in enumerate(lesson.get("quiz", [])):
        if idx < len(payload.quiz_answers) and payload.quiz_answers[idx] == question.get("answer"):
            correct += 1
    score = round((correct / max(len(lesson.get("quiz", [])), 1)) * 100)
    enrollment = await db.enrollments.find_one({"user_id": user["id"], "course_id": course_id}, {"_id": 0})
    completed = set((enrollment or {}).get("completed_lessons", []))
    completed.add(lesson_id)
    progress = round((len(completed) / max(len(lessons), 1)) * 100)
    await db.enrollments.update_one(
        {"user_id": user["id"], "course_id": course_id},
        {"$set": {"completed_lessons": list(completed), "progress_percentage": progress, "updated_at": now_iso()}, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now_iso()}},
        upsert=True,
    )
    await db.reflections.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"], "lesson_id": lesson_id, "reflection": payload.reflection, "quiz_score": score, "created_at": now_iso()})
    certificate = None
    if progress == 100:
        course = await db.courses.find_one({"id": course_id}, {"_id": 0})
        certificate = {"id": str(uuid.uuid4()), "user_id": user["id"], "course_id": course_id, "course_title": course["title"], "student_name": user["name"], "completion_date": now_iso()}
        await db.certificates.update_one({"user_id": user["id"], "course_id": course_id}, {"$setOnInsert": certificate}, upsert=True)
    return {"progress_percentage": progress, "quiz_score": score, "certificate": certificate}


@api_router.post("/checkins")
async def create_checkin(payload: CheckInRequest, user: Dict[str, Any] = Depends(get_current_user)):
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "mood_score": payload.mood_score, "reflection_notes": payload.reflection_notes, "created_at": now_iso()}
    await db.daily_checkins.insert_one(doc.copy())
    await db.users.update_one({"id": user["id"]}, {"$inc": {"streak": 1}, "$set": {"last_checkin_at": now_iso()}})
    return {"checkin": doc}


@api_router.get("/checkins")
async def list_checkins(user: Dict[str, Any] = Depends(get_current_user)):
    checkins = await db.daily_checkins.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(30)
    return {"checkins": checkins}


@api_router.post("/journal")
async def create_journal(payload: JournalRequest, user: Dict[str, Any] = Depends(get_current_user)):
    sentiment = "steady"
    low_words = ["sad", "angry", "craving", "afraid", "alone"]
    high_words = ["hope", "grateful", "proud", "calm", "strong"]
    text = payload.content.lower()
    if any(word in text for word in low_words):
        sentiment = "needs-support"
    if any(word in text for word in high_words):
        sentiment = "encouraged"
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "content": payload.content, "tags": payload.tags, "sentiment": sentiment, "created_at": now_iso()}
    await db.journal_entries.insert_one(doc.copy())
    return {"entry": doc}


@api_router.get("/journal")
async def list_journal(user: Dict[str, Any] = Depends(get_current_user)):
    entries = await db.journal_entries.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"entries": entries}


@api_router.get("/certificates")
async def list_certificates(user: Dict[str, Any] = Depends(get_current_user)):
    certificates = await db.certificates.find({"user_id": user["id"]}, {"_id": 0}).sort("completion_date", -1).to_list(50)
    return {"certificates": certificates}


@api_router.get("/dashboard")
async def dashboard(user: Dict[str, Any] = Depends(get_current_user)):
    profile = await db.assessments.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("created_at", -1)])
    enrollments = await db.enrollments.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    certificates = await db.certificates.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    checkins = await db.daily_checkins.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(7)
    courses = await db.courses.find({}, {"_id": 0}).to_list(100)
    course_map = {course["id"]: course for course in courses}
    active = [{**enrollment, "course": course_map.get(enrollment["course_id"])} for enrollment in enrollments]
    avg_progress = round(sum(item.get("progress_percentage", 0) for item in enrollments) / max(len(enrollments), 1))
    recommendations = [
        "Complete one short lesson before your next check-in.",
        "Ask an AI Professor to connect today’s mood with your goals.",
        "Add a journal reflection after any difficult moment.",
    ]
    if profile and profile.get("goals"):
        recommendations.insert(0, f"Focus this week: {profile['goals'][0]}")
    return {
        "user": public_user(user),
        "profile": profile,
        "active_learning": active,
        "progress": avg_progress,
        "streak": user.get("streak", 0),
        "certificates": certificates,
        "recent_checkins": checkins,
        "recommendations": recommendations,
        "notifications": ["Your personalized roadmap is ready", "Daily reflection reminder", "New lesson recommendation available"],
    }


@api_router.post("/ai/chat/stream")
async def ai_chat_stream(payload: AIChatRequest, user: Dict[str, Any] = Depends(get_current_user)):
    professor = PROFESSORS.get(payload.professor_id)
    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")
    profile = await db.assessments.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("created_at", -1)])
    recent_checkins = await db.daily_checkins.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(3)
    await db.ai_messages.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"], "professor_id": payload.professor_id, "role": "user", "content": payload.message, "created_at": now_iso()})

    system_message = (
        f"You are {professor['name']}, an AI professor at ClearPath Recovery University. "
        f"Focus on {professor['focus']}. Be warm, practical, trauma-informed, non-clinical, and concise. "
        "Never claim to be emergency care; if crisis risk is mentioned, encourage contacting local emergency services or trusted support. "
        f"Student profile: {profile or {}}. Recent check-ins: {recent_checkins}."
    )

    async def event_generator():
        collected: List[str] = []
        try:
            if not LlmChat or not EMERGENT_LLM_KEY:
                raise RuntimeError("AI integration unavailable")
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"clearpath-{user['id']}-{payload.professor_id}", system_message=system_message).with_model("openai", "gpt-5.2")
            async for event in chat.stream_message(UserMessage(text=payload.message)):
                if TextDelta and isinstance(event, TextDelta):
                    collected.append(event.content)
                    yield f"data: {event.content}\n\n"
                elif StreamDone and isinstance(event, StreamDone):
                    break
        except Exception:
            fallback = f"{professor['name']}: I’m here with you. Based on your roadmap, choose one small next step today, write what support you need, and return to the lesson that feels most doable."
            collected.append(fallback)
            yield f"data: {fallback}\n\n"
        full_response = "".join(collected)
        await db.ai_messages.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"], "professor_id": payload.professor_id, "role": "assistant", "content": full_response, "created_at": now_iso()})
        await db.ai_memories.update_one({"user_id": user["id"]}, {"$set": {"last_ai_interaction": {"professor": professor["name"], "message": payload.message, "response_summary": full_response[:500]}, "updated_at": now_iso()}}, upsert=True)
        yield "event: done\ndata: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@api_router.get("/ai/messages/{professor_id}")
async def ai_messages(professor_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    messages = await db.ai_messages.find({"user_id": user["id"], "professor_id": professor_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return {"messages": messages}


@api_router.get("/plans")
async def plans():
    return {"plans": list(PLANS.values())}


@api_router.post("/subscriptions/select")
async def select_plan(payload: PlanSelectRequest, user: Dict[str, Any] = Depends(get_current_user)):
    if payload.plan_id != "free":
        raise HTTPException(status_code=400, detail="Use checkout for Premium")
    await db.users.update_one({"id": user["id"]}, {"$set": {"subscription_status": "free", "updated_at": now_iso()}})
    await db.subscriptions.update_one({"user_id": user["id"]}, {"$set": {"id": str(uuid.uuid4()), "user_id": user["id"], "plan_id": "free", "billing_status": "active", "updated_at": now_iso()}}, upsert=True)
    return {"subscription_status": "free"}


@api_router.post("/payments/checkout")
async def create_checkout(payload: CheckoutRequest, request: Request, user: Dict[str, Any] = Depends(get_current_user)):
    if payload.plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    plan = PLANS[payload.plan_id]
    if payload.plan_id == "free":
        await db.users.update_one({"id": user["id"]}, {"$set": {"subscription_status": "free", "updated_at": now_iso()}})
        return {"url": f"{payload.origin_url}/dashboard?plan=free", "session_id": "free-plan"}
    if not StripeCheckout or not CheckoutSessionRequest or not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Stripe checkout is not configured")
    host_url = str(request.base_url).rstrip("/")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")
    success_url = f"{payload.origin_url}/dashboard?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{payload.origin_url}/dashboard?payment=cancelled"
    metadata = {"user_id": user["id"], "email": user["email"], "plan_id": payload.plan_id, "source": "clearpath_subscription"}
    checkout_request = CheckoutSessionRequest(amount=float(plan["amount"]), currency=plan["currency"], success_url=success_url, cancel_url=cancel_url, metadata=metadata)
    session = await stripe_checkout.create_checkout_session(checkout_request)
    transaction = {"id": str(uuid.uuid4()), "user_id": user["id"], "email": user["email"], "plan_id": payload.plan_id, "amount": float(plan["amount"]), "currency": plan["currency"], "session_id": session.session_id, "payment_status": "pending", "status": "initiated", "metadata": metadata, "created_at": now_iso(), "updated_at": now_iso(), "processed": False}
    await db.payment_transactions.insert_one(transaction.copy())
    return {"url": session.url, "session_id": session.session_id}


@api_router.get("/payments/status/{session_id}")
async def checkout_status(session_id: str, request: Request, user: Dict[str, Any] = Depends(get_current_user)):
    transaction = await db.payment_transactions.find_one({"session_id": session_id, "user_id": user["id"]}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment transaction not found")
    host_url = str(request.base_url).rstrip("/")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")
    status = await stripe_checkout.get_checkout_status(session_id)
    update = {"status": status.status, "payment_status": status.payment_status, "updated_at": now_iso()}
    if status.payment_status == "paid" and not transaction.get("processed"):
        update["processed"] = True
        await db.users.update_one({"id": user["id"]}, {"$set": {"subscription_status": "premium", "updated_at": now_iso()}})
        await db.subscriptions.update_one({"user_id": user["id"]}, {"$set": {"id": str(uuid.uuid4()), "user_id": user["id"], "plan_id": "premium", "billing_status": "active", "updated_at": now_iso()}}, upsert=True)
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update})
    return {"status": status.status, "payment_status": status.payment_status, "amount_total": status.amount_total, "currency": status.currency, "metadata": status.metadata}


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    if not StripeCheckout or not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Stripe unavailable")
    host_url = str(request.base_url).rstrip("/")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")
    body = await request.body()
    response = await stripe_checkout.handle_webhook(body, request.headers.get("Stripe-Signature"))
    await db.payment_transactions.update_one({"session_id": response.session_id}, {"$set": {"payment_status": response.payment_status, "status": response.event_type, "updated_at": now_iso()}})
    if response.payment_status == "paid" and response.metadata.get("user_id"):
        await db.users.update_one({"id": response.metadata["user_id"]}, {"$set": {"subscription_status": "premium", "updated_at": now_iso()}})
    return {"received": True, "event_type": response.event_type}


@api_router.get("/support")
async def support_center():
    return {"topics": ["Account access", "Subscriptions", "AI Professors", "Course progress", "Certificates"], "contact": "support@clearpathrecovery.university", "crisis_note": "If you may be in immediate danger, contact local emergency services or a trusted support person now."}


@api_router.get("/admin/summary")
async def admin_summary(admin: Dict[str, Any] = Depends(require_admin)):
    users = await db.users.count_documents({})
    courses = await db.courses.count_documents({})
    payments = await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(25)
    enrollments = await db.enrollments.count_documents({})
    certificates = await db.certificates.count_documents({})
    premium = await db.users.count_documents({"subscription_status": "premium"})
    return {"users": users, "courses": courses, "enrollments": enrollments, "certificates": certificates, "premium_students": premium, "recent_payments": payments}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()