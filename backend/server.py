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
    {
        "id": "active-addiction",
        "name": "School of Active Addiction Support",
        "description": "Immediate education for stabilization, safety planning, cravings, and readiness for help.",
        "professor": "Professor Hope",
        "image": "https://images.unsplash.com/photo-1629161156834-67f7a989ca67?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHxwZWFjZWZ1bCUyMG5hdHVyZSUyMGxhbmRzY2FwZSUyMG1vcm5pbmclMjBzdW5yaXNlfGVufDB8fHx8MTc4MDYyNDUwMHww&ixlib=rb-4.1.0&q=85",
    },
    {
        "id": "faith-spiritual-growth",
        "name": "School of Faith & Spiritual Growth",
        "description": "Faith-based and spiritually grounded recovery pathways with respect for each student’s beliefs.",
        "professor": "Professor Grace",
        "image": "https://images.unsplash.com/photo-1621192754911-ffe0d95929dd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB1bml2ZXJzaXR5JTIwYnVpbGRpbmclMjBzdW5ueXxlbnwwfHx8fDE3ODA2MjQ1MDB8MA&ixlib=rb-4.1.0&q=85",
    },
    {
        "id": "parenting",
        "name": "School of Parenting",
        "description": "Parenting skills, repair, consistency, co-parenting, and emotionally safe family routines.",
        "professor": "Professor Nurture",
        "image": "https://images.pexels.com/photos/30539356/pexels-photo-30539356.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    },
    {
        "id": "relationships",
        "name": "School of Relationships",
        "description": "Healthy connection, boundaries, conflict resolution, trust rebuilding, and communication.",
        "professor": "Professor Voice",
        "image": "https://images.unsplash.com/photo-1621192754911-ffe0d95929dd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHxtb2Rlcm4lMjB1bml2ZXJzaXR5JTIwYnVpbGRpbmclMjBzdW5ueXxlbnwwfHx8fDE3ODA2MjQ1MDB8MA&ixlib=rb-4.1.0&q=85",
    },
    {
        "id": "financial-freedom",
        "name": "School of Financial Freedom",
        "description": "Budgeting, rebuilding stability, debt awareness, money habits, and recovery-safe planning.",
        "professor": "Professor Prosper",
        "image": "https://images.pexels.com/photos/16157307/pexels-photo-16157307.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    },
    {
        "id": "career-development",
        "name": "School of Career Development",
        "description": "Career confidence, resume readiness, interviews, workplace habits, and purpose-driven work.",
        "professor": "Professor Horizon",
        "image": "https://images.unsplash.com/photo-1621192754911-ffe0d95929dd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHxtb2Rlcm4lMjB1bml2ZXJzaXR5JTIwYnVpbGRpbmclMjBzdW5ueXxlbnwwfHx8fDE3ODA2MjQ1MDB8MA&ixlib=rb-4.1.0&q=85",
    },
    {
        "id": "physical-wellness",
        "name": "School of Physical Wellness",
        "description": "Body care, sleep, movement, nutrition basics, and nervous-system support for recovery.",
        "professor": "Professor Strength",
        "image": "https://images.unsplash.com/photo-1629161156834-67f7a989ca67?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHxwZWFjZWZ1bCUyMG5hdHVyZSUyMGxhbmRzY2FwZSUyMG1vcm5pbmclMjBzdW5yaXNlfGVufDB8fHx8MTc4MDYyNDUwMHww&ixlib=rb-4.1.0&q=85",
    },
    {
        "id": "relapse-prevention",
        "name": "School of Relapse Prevention & Long-Term Recovery",
        "description": "Long-term prevention plans, triggers, support maps, identity growth, and maintenance routines.",
        "professor": "Professor Freedom",
        "image": "https://images.pexels.com/photos/16157307/pexels-photo-16157307.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    },
    {
        "id": "purpose-leadership",
        "name": "School of Purpose, Leadership & Giving Back",
        "description": "Purpose, service, mentorship, leadership habits, and building a meaningful future.",
        "professor": "Professor Legacy",
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
    {"id": "stabilization-today", "school_id": "active-addiction", "title": "Stabilization Today", "difficulty": "Beginner", "instructor_ai": "Professor Hope", "summary": "A safety-first pathway for cravings, risk moments, and readiness for support.", "premium": False},
    {"id": "faith-and-recovery", "school_id": "faith-spiritual-growth", "title": "Faith, Hope, and Recovery", "difficulty": "Beginner", "instructor_ai": "Professor Grace", "summary": "Spiritual reflection, surrender, forgiveness, and values-aligned daily practices.", "premium": True},
    {"id": "parenting-repair", "school_id": "parenting", "title": "Parenting Repair & Consistency", "difficulty": "Intermediate", "instructor_ai": "Professor Nurture", "summary": "Supportive scripts, repair routines, consistency, and child-centered emotional safety.", "premium": True},
    {"id": "healthy-relationships", "school_id": "relationships", "title": "Healthy Relationships Lab", "difficulty": "Intermediate", "instructor_ai": "Professor Voice", "summary": "Communication, boundaries, conflict resets, and rebuilding trust after harm.", "premium": True},
    {"id": "money-stability", "school_id": "financial-freedom", "title": "Money Stability Foundations", "difficulty": "Beginner", "instructor_ai": "Professor Prosper", "summary": "Budgeting, spending awareness, debt planning, and values-based financial routines.", "premium": True},
    {"id": "career-restart", "school_id": "career-development", "title": "Career Restart Studio", "difficulty": "Beginner", "instructor_ai": "Professor Horizon", "summary": "Resume confidence, interview scripts, workplace routines, and career rebuilding.", "premium": True},
    {"id": "body-recovery", "school_id": "physical-wellness", "title": "Body Recovery Basics", "difficulty": "Beginner", "instructor_ai": "Professor Strength", "summary": "Sleep, nourishment, movement, hydration, and nervous-system steadiness.", "premium": True},
    {"id": "long-term-freedom", "school_id": "relapse-prevention", "title": "Long-Term Freedom Plan", "difficulty": "Advanced", "instructor_ai": "Professor Freedom", "summary": "Trigger mapping, recovery identity, relapse prevention, and sustainable support systems.", "premium": True},
    {"id": "purpose-after-recovery", "school_id": "purpose-leadership", "title": "Purpose After Recovery", "difficulty": "Advanced", "instructor_ai": "Professor Legacy", "summary": "Meaning, service, leadership, mentorship, and giving back with healthy boundaries.", "premium": True},
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
    {"id": "sat-1", "course_id": "stabilization-today", "title": "Make the Next Hour Safer", "content": "When life feels urgent, shrink the plan to the next hour. Move away from high-risk settings, contact safe support, hydrate, and choose one stabilizing action. If there is immediate danger, contact local emergency services now.", "reflection_prompt": "What would make the next hour safer?", "quiz": [{"question": "A safety-first plan should focus on:", "options": ["The next doable step", "Shame", "Isolation"], "answer": 0}]},
    {"id": "far-1", "course_id": "faith-and-recovery", "title": "Values as Anchors", "content": "Faith-based recovery can begin with values: honesty, humility, courage, service, and hope. Values become anchors when practiced in small daily choices.", "reflection_prompt": "Which value can guide your next choice?", "quiz": [{"question": "A spiritual anchor is strengthened by:", "options": ["Daily practice", "Perfection", "Avoidance"], "answer": 0}]},
    {"id": "pr-1", "course_id": "parenting-repair", "title": "Repair With Children", "content": "Repair does not require perfect words. Try: I am sorry, that was not your fault, I am working on doing this differently, and I love you.", "reflection_prompt": "What repair sentence can you practice?", "quiz": [{"question": "Child-centered repair includes:", "options": ["Ownership", "Blame", "Silence"], "answer": 0}]},
    {"id": "hr-1", "course_id": "healthy-relationships", "title": "Conflict Pause Plan", "content": "Healthy conflict needs a pause plan: name the pause, set a return time, regulate your body, and return with one clear request.", "reflection_prompt": "What phrase can you use to pause safely?", "quiz": [{"question": "A good pause plan includes:", "options": ["A return time", "Walking away forever", "Winning"], "answer": 0}]},
    {"id": "ms-1", "course_id": "money-stability", "title": "Name Your Money Pattern", "content": "Financial rebuilding starts with awareness. Notice the pattern without shame: avoidance, impulse spending, secrecy, or fear. Then choose one visible action.", "reflection_prompt": "What money pattern are you ready to name?", "quiz": [{"question": "Financial awareness should be:", "options": ["Shame-free", "Secretive", "Punishing"], "answer": 0}]},
    {"id": "cr-1", "course_id": "career-restart", "title": "Your Work Story", "content": "A career restart includes your strengths, lessons learned, and next practical step. You are more than gaps or setbacks.", "reflection_prompt": "What strength belongs in your work story?", "quiz": [{"question": "A career restart begins with:", "options": ["One next step", "Hiding all progress", "Self-judgment"], "answer": 0}]},
    {"id": "br-1", "course_id": "body-recovery", "title": "Body Care Minimums", "content": "Recovery asks the body to heal too. Start with minimums: water, sleep routine, nourishment, movement, and medical support when needed.", "reflection_prompt": "Which body-care minimum needs attention today?", "quiz": [{"question": "Body recovery works best with:", "options": ["Small repeatable care", "Ignoring needs", "All-or-nothing plans"], "answer": 0}]},
    {"id": "ltf-1", "course_id": "long-term-freedom", "title": "Trigger Map 2.0", "content": "Long-term recovery uses pattern recognition. Map people, places, emotions, and transitions that increase risk, then pair each with a prepared support action.", "reflection_prompt": "Which trigger needs a prepared action?", "quiz": [{"question": "Trigger mapping pairs risk with:", "options": ["Support actions", "Shame", "Secrecy"], "answer": 0}]},
    {"id": "par-1", "course_id": "purpose-after-recovery", "title": "Giving Back With Boundaries", "content": "Purpose can include service, but healthy service has boundaries. Give from stability, not depletion.", "reflection_prompt": "Where can you give back without overextending?", "quiz": [{"question": "Healthy service includes:", "options": ["Boundaries", "Rescuing everyone", "Ignoring your needs"], "answer": 0}]},
]

PROFESSORS = {
    "hope": {"name": "Professor Hope", "school": "Recovery & Addiction", "focus": "active addiction support, recovery encouragement, safety planning, and next-step planning", "personality": "warm, steady, hopeful", "teaching_style": "short practical steps with compassionate accountability", "voice": "calm mentor", "avatar": "🌅"},
    "insight": {"name": "Professor Insight", "school": "Mental Wellness", "focus": "mental wellness, emotional literacy, mood patterns, and reflective journaling", "personality": "curious, grounding, validating", "teaching_style": "guided reflection and nervous-system education", "voice": "gentle coach", "avatar": "🧠"},
    "grace": {"name": "Professor Grace", "school": "Faith & Spiritual Growth", "focus": "faith-based, spiritual, and values-guided recovery", "personality": "reverent, inclusive, humble", "teaching_style": "spiritual reflection, values practice, and compassionate encouragement", "voice": "peaceful guide", "avatar": "🕊️"},
    "compass": {"name": "Professor Compass", "school": "Life Skills & Personal Development", "focus": "life skills, routines, goals, and decision support", "personality": "organized, practical, encouraging", "teaching_style": "step-by-step planning and habit design", "voice": "clear advisor", "avatar": "🧭"},
    "bridge": {"name": "Professor Bridge", "school": "Relationships & Family Recovery", "focus": "family recovery, relationship repair, communication, and boundaries", "personality": "relational, careful, fair", "teaching_style": "scripts, repair frameworks, and perspective-taking", "voice": "relationship mediator", "avatar": "🌉"},
    "nurture": {"name": "Professor Nurture", "school": "Parenting", "focus": "parenting repair, consistency, co-parenting, and emotionally safe routines", "personality": "protective, patient, child-centered", "teaching_style": "simple parenting scripts and repair practice", "voice": "supportive parent coach", "avatar": "🌱"},
    "prosper": {"name": "Professor Prosper", "school": "Financial Freedom", "focus": "budgeting, debt awareness, money habits, and financial rebuilding", "personality": "nonjudgmental, clear, empowering", "teaching_style": "numbers made simple with shame-free planning", "voice": "financial mentor", "avatar": "🌿"},
    "horizon": {"name": "Professor Horizon", "school": "Career Development", "focus": "career rebuilding, resumes, interviews, workplace stability, and purpose-driven work", "personality": "forward-looking, confident, practical", "teaching_style": "career labs, scripts, and action plans", "voice": "career coach", "avatar": "🌄"},
    "strength": {"name": "Professor Strength", "school": "Physical Wellness", "focus": "sleep, movement, nutrition basics, body care, and nervous-system steadiness", "personality": "grounded, motivating, gentle", "teaching_style": "body-first minimums and sustainable routines", "voice": "wellness trainer", "avatar": "💪"},
    "freedom": {"name": "Professor Freedom", "school": "Relapse Prevention & Long-Term Recovery", "focus": "relapse prevention, long-term recovery identity, and support systems", "personality": "wise, direct, deeply hopeful", "teaching_style": "trigger mapping, scenario planning, and maintenance routines", "voice": "long-term recovery mentor", "avatar": "🛤️"},
    "voice": {"name": "Professor Voice", "school": "Communication & Conflict Resolution", "focus": "communication, conflict resolution, assertiveness, and boundaries", "personality": "clear, respectful, brave", "teaching_style": "role-play, sentence stems, and conflict pause plans", "voice": "communication coach", "avatar": "🗣️"},
    "legacy": {"name": "Professor Legacy", "school": "Purpose, Leadership & Giving Back", "focus": "purpose, service, leadership, mentorship, and giving back", "personality": "visionary, humble, inspiring", "teaching_style": "purpose mapping, leadership reflection, and service planning", "voice": "purpose mentor", "avatar": "🏛️"},
}

LANGUAGES = [
    {"code": "en", "name": "English"},
    {"code": "es", "name": "Spanish"},
    {"code": "fr", "name": "French"},
    {"code": "pt", "name": "Portuguese"},
    {"code": "de", "name": "German"},
    {"code": "ar", "name": "Arabic"},
]

PATHWAYS = [
    {"id": "active-addiction", "title": "Active Addiction Support", "professor_id": "hope", "level": "Beginner", "school_id": "active-addiction", "description": "Safety-first stabilization, support readiness, and next-hour planning."},
    {"id": "early-recovery", "title": "Recovery Foundations", "professor_id": "hope", "level": "Beginner", "school_id": "recovery", "description": "Core recovery education, cravings, routines, and support systems."},
    {"id": "family-member", "title": "Family Member Support", "professor_id": "bridge", "level": "Beginner", "school_id": "family-recovery", "description": "Education for loved ones, boundaries, repair, and support without rescuing."},
    {"id": "faith-based", "title": "Faith-Based Recovery", "professor_id": "grace", "level": "Beginner", "school_id": "faith-spiritual-growth", "description": "Spiritual practices, values, hope, forgiveness, and inclusive faith support."},
    {"id": "mental-wellness", "title": "Mental Wellness", "professor_id": "insight", "level": "Beginner", "school_id": "mental-wellness", "description": "Mood tracking, grounding, emotional awareness, and journaling."},
    {"id": "parenting", "title": "Parenting", "professor_id": "nurture", "level": "Intermediate", "school_id": "parenting", "description": "Repair, consistency, co-parenting, and emotionally safe family routines."},
    {"id": "relationships", "title": "Relationships", "professor_id": "voice", "level": "Intermediate", "school_id": "relationships", "description": "Communication, conflict resolution, boundaries, and trust rebuilding."},
    {"id": "financial-freedom", "title": "Financial Freedom", "professor_id": "prosper", "level": "Beginner", "school_id": "financial-freedom", "description": "Budgeting, stability, debt awareness, and money habits."},
    {"id": "career-development", "title": "Career Development", "professor_id": "horizon", "level": "Beginner", "school_id": "career-development", "description": "Resume, interviews, workplace routines, and career rebuilding."},
    {"id": "life-skills", "title": "Life Skills", "professor_id": "compass", "level": "Beginner", "school_id": "life-skills", "description": "Daily routines, decision-making, planning, and personal development."},
]

LIVE_CLASSES = [
    {"id": "lc-orientation", "title": "New Student Orientation", "professor_id": "compass", "school_id": "life-skills", "type": "live_text", "level": "Beginner", "recurring": "Every Monday", "start_time": "2026-06-08T16:00:00+00:00", "duration_minutes": 45, "languages": ["en", "es", "fr", "pt", "de", "ar"], "description": "Learn how to use ClearPath, meet the AI professors, and set your first weekly plan.", "text_lesson": "Orientation helps you understand your roadmap, dashboard, professors, support center, and daily check-ins.", "transcript": "Welcome to ClearPath Recovery University. You are seen, remembered, and supported here."},
    {"id": "lc-cravings", "title": "Cravings: The Next Right Step", "professor_id": "hope", "school_id": "recovery", "type": "live_video", "level": "Beginner", "recurring": "Tuesdays", "start_time": "2026-06-09T18:00:00+00:00", "duration_minutes": 50, "languages": ["en", "es", "fr", "pt", "de", "ar"], "description": "A live AI video-style class with voice controls, captions, transcript, and personalized Q&A.", "text_lesson": "Cravings rise and fall. Your job is to create enough space to choose support before pressure peaks.", "transcript": "Professor Hope teaches craving waves, support calls, and the next-hour safety plan."},
    {"id": "lc-family", "title": "Family Boundaries Workshop", "professor_id": "bridge", "school_id": "family-recovery", "type": "workshop", "level": "Intermediate", "recurring": "Monthly special event", "start_time": "2026-06-12T17:00:00+00:00", "duration_minutes": 60, "languages": ["en", "es", "fr", "pt", "de", "ar"], "description": "Boundary scripts, repair practice, and support without rescuing.", "text_lesson": "Boundaries protect love from becoming burnout.", "transcript": "Professor Bridge explains boundaries, repair language, and family agreements."},
    {"id": "lc-money", "title": "Money Stability Lab", "professor_id": "prosper", "school_id": "financial-freedom", "type": "live_text", "level": "Beginner", "recurring": "Every Thursday", "start_time": "2026-06-11T19:00:00+00:00", "duration_minutes": 45, "languages": ["en", "es", "fr", "pt", "de", "ar"], "description": "Shame-free budgeting and one-week spending awareness.", "text_lesson": "Financial recovery begins with visibility, not shame.", "transcript": "Professor Prosper guides students through a simple one-week budget reset."},
]

SUPPORT_CATEGORIES = ["Technical Issues", "Billing", "Account Access", "Course Questions", "Certificate Requests", "Live Class Issues", "AI Professor Issues", "General Support", "Safety Concerns"]
SUPPORT_PRIORITIES = ["Low", "Normal", "High", "Urgent"]
SUPPORT_STATUSES = ["Open", "In Review", "Waiting for Student", "Resolved", "Closed"]

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
    preferred_language: Optional[str] = "en"
    pathway_interests: List[str] = []
    journal_memory_consent: bool = True


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


class ClassQuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1500)
    language: str = "en"


class LearningPlanRequest(BaseModel):
    pathway_ids: List[str]
    intensity: str = "balanced"
    preferred_language: str = "en"


class SupportTicketRequest(BaseModel):
    category: str
    priority: str = "Normal"
    subject: str = Field(min_length=3, max_length=160)
    message: str = Field(min_length=5, max_length=3000)
    language: str = "en"
    attachments: List[Dict[str, str]] = []


class TicketReplyRequest(BaseModel):
    message: str = Field(min_length=1, max_length=3000)
    status: Optional[str] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)


class AdminTicketUpdateRequest(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    internal_note: Optional[str] = None
    public_reply: Optional[str] = None

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
    for pathway in PATHWAYS:
        await db.pathways.update_one({"id": pathway["id"]}, {"$set": pathway}, upsert=True)
    for class_item in LIVE_CLASSES:
        await db.live_classes.update_one({"id": class_item["id"]}, {"$set": class_item}, upsert=True)


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


def build_individual_learning_plan(profile: Dict[str, Any]) -> Dict[str, Any]:
    interests = profile.get("pathway_interests") or []
    goals = profile.get("goals") or []
    preferences = profile.get("learning_preferences") or []
    stage = profile.get("recovery_stage", "Starting")
    selected = [item for item in PATHWAYS if item["id"] in interests] or PATHWAYS[:4]
    weekly = []
    for idx, pathway in enumerate(selected[:6], start=1):
        weekly.append({
            "week": idx,
            "pathway_id": pathway["id"],
            "title": f"{pathway['title']} focus week",
            "professor_id": pathway["professor_id"],
            "level": pathway["level"],
            "actions": [
                f"Attend or replay one {pathway['title']} class",
                "Complete one written lesson version",
                "Ask your professor one personalized question",
                "Log one journal or reflection insight",
            ],
        })
    return {
        "id": str(uuid.uuid4()),
        "stage": stage,
        "primary_goal": goals[0] if goals else "Build steady progress",
        "preferred_learning": preferences,
        "language": profile.get("preferred_language", "en"),
        "weekly_plan": weekly,
        "personalization_notes": [
            "Professors reference prior coursework, journals where permitted, goals, and completed lessons.",
            "Classes adapt between beginner, intermediate, and advanced explanations.",
            "Progress is saved automatically across logins and devices.",
        ],
    }


@api_router.post("/onboarding")
async def save_onboarding(payload: OnboardingRequest, user: Dict[str, Any] = Depends(get_current_user)):
    profile = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "recovery_stage": payload.recovery_stage,
        "goals": payload.goals,
        "learning_preferences": payload.learning_preferences,
        "support_focus": payload.support_focus,
        "preferred_language": payload.preferred_language,
        "pathway_interests": payload.pathway_interests,
        "journal_memory_consent": payload.journal_memory_consent,
        "roadmap": build_roadmap(payload.model_dump()),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    profile["individual_learning_plan"] = build_individual_learning_plan(profile)
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


@api_router.get("/professors")
async def list_professors(user: Dict[str, Any] = Depends(get_current_user)):
    memory = await db.ai_memories.find_one({"user_id": user["id"]}, {"_id": 0})
    completed = await db.enrollments.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    professor_list = []
    for professor_id, professor in PROFESSORS.items():
        professor_list.append({
            "id": professor_id,
            **professor,
            "memory_summary": memory.get("last_ai_interaction") if memory else None,
            "student_progress_context": {"active_courses": len(completed), "completed_courses": len([c for c in completed if c.get("progress_percentage") == 100])},
        })
    return {"professors": professor_list}


@api_router.get("/pathways")
async def list_pathways(user: Dict[str, Any] = Depends(get_current_user)):
    pathways = await db.pathways.find({}, {"_id": 0}).to_list(100)
    return {"pathways": pathways, "languages": LANGUAGES}


@api_router.get("/learning-plan")
async def get_learning_plan(user: Dict[str, Any] = Depends(get_current_user)):
    profile = await db.assessments.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("created_at", -1)])
    if not profile:
        return {"learning_plan": build_individual_learning_plan({"recovery_stage": "Starting"})}
    return {"learning_plan": profile.get("individual_learning_plan") or build_individual_learning_plan(profile)}


@api_router.post("/learning-plan")
async def create_learning_plan(payload: LearningPlanRequest, user: Dict[str, Any] = Depends(get_current_user)):
    profile = await db.assessments.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("created_at", -1)]) or {}
    profile.update({"pathway_interests": payload.pathway_ids, "preferred_language": payload.preferred_language, "intensity": payload.intensity})
    plan = build_individual_learning_plan(profile)
    await db.learning_plans.update_one({"user_id": user["id"]}, {"$set": {"user_id": user["id"], "learning_plan": plan, "updated_at": now_iso()}}, upsert=True)
    await db.assessments.update_one({"user_id": user["id"]}, {"$set": {"individual_learning_plan": plan, "pathway_interests": payload.pathway_ids, "preferred_language": payload.preferred_language, "updated_at": now_iso()}}, upsert=True)
    return {"learning_plan": plan}


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
    attended_classes = await db.class_attendance.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    tickets = await db.support_tickets.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
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
        "class_attendance": attended_classes,
        "open_tickets": [ticket for ticket in tickets if ticket.get("status") not in ["Resolved", "Closed"]],
        "learning_plan": profile.get("individual_learning_plan") if profile else None,
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
    enrollments = await db.enrollments.find({"user_id": user["id"]}, {"_id": 0}).to_list(20)
    journals = []
    if not profile or profile.get("journal_memory_consent", True):
        journals = await db.journal_entries.find({"user_id": user["id"]}, {"_id": 0, "content": 1, "sentiment": 1, "tags": 1}).sort("created_at", -1).to_list(3)
    await db.ai_messages.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"], "professor_id": payload.professor_id, "role": "user", "content": payload.message, "created_at": now_iso()})

    system_message = (
        f"You are {professor['name']}, an AI professor at ClearPath Recovery University. "
        f"Focus on {professor['focus']}. Be warm, practical, trauma-informed, non-clinical, and concise. "
        f"Your personality: {professor.get('personality')}. Teaching style: {professor.get('teaching_style')}. "
        "Never claim to be emergency care; if crisis risk is mentioned, encourage contacting local emergency services or trusted support. "
        f"Greet returning students by name ({user['name']}) and reference progress when relevant. "
        f"Student profile: {profile or {}}. Recent check-ins: {recent_checkins}. Enrollments: {enrollments}. Journal insights if permitted: {journals}."
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


@api_router.get("/classes")
async def list_classes(user: Dict[str, Any] = Depends(get_current_user)):
    classes = await db.live_classes.find({}, {"_id": 0}).to_list(100)
    attendance = await db.class_attendance.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    attendance_map = {item["class_id"]: item for item in attendance}
    for class_item in classes:
        professor = PROFESSORS.get(class_item.get("professor_id"), {})
        class_item["professor"] = professor
        class_item["attendance"] = attendance_map.get(class_item["id"])
        class_item["replay_available"] = True
        class_item["captions_available"] = True
        class_item["text_version_available"] = True
    return {"classes": classes, "languages": LANGUAGES}


@api_router.post("/classes/{class_id}/join")
async def join_class(class_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    class_item = await db.live_classes.find_one({"id": class_id}, {"_id": 0})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    attendance = {"id": str(uuid.uuid4()), "user_id": user["id"], "class_id": class_id, "joined_at": now_iso(), "participation_count": 0, "progress_percentage": 10, "status": "attending"}
    await db.class_attendance.update_one({"user_id": user["id"], "class_id": class_id}, {"$set": attendance}, upsert=True)
    return {"attendance": attendance, "class": class_item}


@api_router.get("/classes/{class_id}")
async def get_class(class_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    class_item = await db.live_classes.find_one({"id": class_id}, {"_id": 0})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    professor = PROFESSORS.get(class_item.get("professor_id"), {})
    attendance = await db.class_attendance.find_one({"user_id": user["id"], "class_id": class_id}, {"_id": 0})
    questions = await db.class_questions.find({"user_id": user["id"], "class_id": class_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return {"class": {**class_item, "professor": professor}, "attendance": attendance, "questions": questions}


@api_router.post("/classes/{class_id}/question")
async def class_question(class_id: str, payload: ClassQuestionRequest, user: Dict[str, Any] = Depends(get_current_user)):
    class_item = await db.live_classes.find_one({"id": class_id}, {"_id": 0})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    professor = PROFESSORS.get(class_item.get("professor_id"), PROFESSORS["hope"])
    profile = await db.assessments.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("created_at", -1)])
    response = f"{professor['name']}: {user['name']}, based on your {profile.get('recovery_stage', 'current') if profile else 'current'} stage, here is a practical answer: connect this class idea to one small action today, then save a reflection so I can remember your progress next time."
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "class_id": class_id, "question": payload.question, "answer": response, "language": payload.language, "created_at": now_iso()}
    await db.class_questions.insert_one(doc.copy())
    await db.class_attendance.update_one({"user_id": user["id"], "class_id": class_id}, {"$inc": {"participation_count": 1}, "$set": {"progress_percentage": 50, "last_participation_at": now_iso()}}, upsert=True)
    return {"question": doc}


@api_router.post("/classes/{class_id}/complete")
async def complete_class(class_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    class_item = await db.live_classes.find_one({"id": class_id}, {"_id": 0})
    if not class_item:
        raise HTTPException(status_code=404, detail="Class not found")
    await db.class_attendance.update_one({"user_id": user["id"], "class_id": class_id}, {"$set": {"progress_percentage": 100, "status": "completed", "completed_at": now_iso()}}, upsert=True)
    certificate = {"id": str(uuid.uuid4()), "user_id": user["id"], "course_id": class_id, "course_title": class_item["title"], "student_name": user["name"], "completion_date": now_iso(), "type": "live_class"}
    await db.certificates.update_one({"user_id": user["id"], "course_id": class_id}, {"$setOnInsert": certificate}, upsert=True)
    return {"completed": True, "certificate": certificate}


@api_router.get("/certificates/{certificate_id}/download")
async def download_certificate(certificate_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    certificate = await db.certificates.find_one({"id": certificate_id, "user_id": user["id"]}, {"_id": 0})
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"download_url": f"/api/certificates/{certificate_id}/downloadable-text", "certificate": certificate, "format": "downloadable_text"}


@api_router.get("/certificates/{certificate_id}/downloadable-text")
async def certificate_text(certificate_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    certificate = await db.certificates.find_one({"id": certificate_id, "user_id": user["id"]}, {"_id": 0})
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"text": f"ClearPath Recovery University certifies that {certificate['student_name']} completed {certificate['course_title']} on {certificate['completion_date']}."}


@api_router.get("/support/config")
async def support_config(user: Dict[str, Any] = Depends(get_current_user)):
    return {"categories": SUPPORT_CATEGORIES, "priorities": SUPPORT_PRIORITIES, "statuses": SUPPORT_STATUSES, "languages": LANGUAGES}


@api_router.post("/support/tickets")
async def create_ticket(payload: SupportTicketRequest, user: Dict[str, Any] = Depends(get_current_user)):
    if payload.category not in SUPPORT_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid support category")
    if payload.priority not in SUPPORT_PRIORITIES:
        raise HTTPException(status_code=400, detail="Invalid priority")
    ticket_number = f"CPRU-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    ai_triage = "Try refreshing the page, checking your connection, and capturing a screenshot. A support specialist will review this ticket."
    if payload.category == "Safety Concerns" or payload.priority == "Urgent":
        ai_triage = "If there is immediate danger, contact local emergency services now. This ticket is marked urgent for review."
    doc = {"id": str(uuid.uuid4()), "ticket_number": ticket_number, "user_id": user["id"], "student_name": user["name"], "email": user["email"], "category": payload.category, "priority": payload.priority, "subject": payload.subject, "message": payload.message, "language": payload.language, "attachments": payload.attachments, "status": "Open", "ai_triage": ai_triage, "history": [{"at": now_iso(), "actor": "student", "message": payload.message}], "internal_notes": [], "created_at": now_iso(), "updated_at": now_iso(), "rating": None}
    await db.support_tickets.insert_one(doc.copy())
    return {"ticket": doc}


@api_router.get("/support/tickets")
async def list_tickets(user: Dict[str, Any] = Depends(get_current_user)):
    tickets = await db.support_tickets.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"tickets": tickets}


@api_router.post("/support/tickets/{ticket_id}/reply")
async def reply_ticket(ticket_id: str, payload: TicketReplyRequest, user: Dict[str, Any] = Depends(get_current_user)):
    ticket = await db.support_tickets.find_one({"id": ticket_id, "user_id": user["id"]}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    update: Dict[str, Any] = {"updated_at": now_iso()}
    if payload.status in SUPPORT_STATUSES:
        update["status"] = payload.status
    if payload.rating:
        update["rating"] = payload.rating
    await db.support_tickets.update_one({"id": ticket_id}, {"$set": update, "$push": {"history": {"at": now_iso(), "actor": "student", "message": payload.message}}})
    updated = await db.support_tickets.find_one({"id": ticket_id}, {"_id": 0})
    return {"ticket": updated}


@api_router.get("/admin/support/tickets")
async def admin_tickets(admin: Dict[str, Any] = Depends(require_admin)):
    tickets = await db.support_tickets.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"tickets": tickets, "categories": SUPPORT_CATEGORIES, "priorities": SUPPORT_PRIORITIES, "statuses": SUPPORT_STATUSES}


@api_router.post("/admin/support/tickets/{ticket_id}")
async def admin_update_ticket(ticket_id: str, payload: AdminTicketUpdateRequest, admin: Dict[str, Any] = Depends(require_admin)):
    update: Dict[str, Any] = {"updated_at": now_iso()}
    if payload.status in SUPPORT_STATUSES:
        update["status"] = payload.status
    if payload.priority in SUPPORT_PRIORITIES:
        update["priority"] = payload.priority
    pushes: Dict[str, Any] = {}
    if payload.internal_note:
        pushes["internal_notes"] = {"at": now_iso(), "actor": admin["email"], "note": payload.internal_note}
    if payload.public_reply:
        pushes["history"] = {"at": now_iso(), "actor": "support", "message": payload.public_reply}
    operation: Dict[str, Any] = {"$set": update}
    if pushes:
        operation["$push"] = pushes
    await db.support_tickets.update_one({"id": ticket_id}, operation)
    ticket = await db.support_tickets.find_one({"id": ticket_id}, {"_id": 0})
    return {"ticket": ticket}


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
    return {"topics": ["Account access", "Subscriptions", "AI Professors", "Course progress", "Certificates", "Live classes", "Safety concerns"], "contact": "support@clearpathrecovery.university", "phone": "+1 (555) 012-CPRU", "hours": "Mon–Fri, 8am–8pm local support time", "faqs": ["How do I reset my learning plan?", "How do I download certificates?", "How do AI professors remember my progress?", "How do I attend a live class?"], "crisis_note": "If you may be in immediate danger, contact local emergency services or a trusted support person now.", "live_chat_future": True}


@api_router.get("/admin/summary")
async def admin_summary(admin: Dict[str, Any] = Depends(require_admin)):
    users = await db.users.count_documents({})
    courses = await db.courses.count_documents({})
    payments = await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(25)
    enrollments = await db.enrollments.count_documents({})
    certificates = await db.certificates.count_documents({})
    premium = await db.users.count_documents({"subscription_status": "premium"})
    support_open = await db.support_tickets.count_documents({"status": {"$nin": ["Resolved", "Closed"]}})
    class_attendance = await db.class_attendance.count_documents({})
    return {"users": users, "courses": courses, "enrollments": enrollments, "certificates": certificates, "premium_students": premium, "support_open": support_open, "class_attendance": class_attendance, "recent_payments": payments}

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