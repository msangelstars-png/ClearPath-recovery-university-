import os
import time
import uuid

import pytest
import requests


def _load_base_url() -> str:
    base_url = os.environ.get("REACT_APP_BACKEND_URL")
    if not base_url:
        env_path = "/app/frontend/.env"
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        base_url = line.split("=", 1)[1].strip()
                        break
    if not base_url:
        pytest.skip("REACT_APP_BACKEND_URL is not configured")
    return base_url.rstrip("/")


BASE_URL = _load_base_url()
API_BASE = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def test_account(api_client):
    # Auth module: registration/login test account setup
    stamp = int(time.time())
    email = f"clearpath_{stamp}_{uuid.uuid4().hex[:6]}@example.com"
    password = "SecurePass123"
    payload = {"email": email, "password": password, "name": "TEST QA User"}
    register_res = api_client.post(f"{API_BASE}/auth/register", json=payload, timeout=30)
    assert register_res.status_code == 200, register_res.text
    register_data = register_res.json()
    assert "token" in register_data and isinstance(register_data["token"], str)
    assert register_data["user"]["email"] == email
    return {
        "email": email,
        "password": password,
        "token": register_data["token"],
        "user": register_data["user"],
    }


@pytest.fixture(scope="session")
def auth_client(api_client, test_account):
    # Auth module: authenticated request session
    token = test_account["token"]
    api_client.headers.update({"Authorization": f"Bearer {token}"})
    return api_client


@pytest.fixture(scope="session")
def flow_state():
    # Cross-module state for test chaining of created resources
    return {
        "free_course_id": None,
        "first_lesson_id": None,
        "course_id_for_certificate": None,
    }


def test_api_root(api_client):
    # Core health/routing module
    res = api_client.get(f"{API_BASE}/", timeout=30)
    assert res.status_code == 200
    data = res.json()
    assert data["message"] == "ClearPath Recovery University API"


def test_login_success(api_client, test_account):
    # Auth module: JWT login
    res = api_client.post(
        f"{API_BASE}/auth/login",
        json={"email": test_account["email"], "password": test_account["password"]},
        timeout=30,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == test_account["email"]
    assert isinstance(data["token"], str) and len(data["token"]) > 10


def test_me(auth_client, test_account):
    # Auth module: current user verification
    res = auth_client.get(f"{API_BASE}/me", timeout=30)
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == test_account["email"]


def test_onboarding_and_roadmap(auth_client):
    # Onboarding module: save profile and roadmap generation
    onboarding_payload = {
        "recovery_stage": "Early recovery",
        "goals": ["Reduce cravings", "Build daily structure"],
        "learning_preferences": ["Short lessons", "Journaling"],
        "support_focus": "balanced",
    }
    post_res = auth_client.post(f"{API_BASE}/onboarding", json=onboarding_payload, timeout=30)
    assert post_res.status_code == 200
    post_data = post_res.json()
    assert post_data["profile"]["recovery_stage"] == "Early recovery"
    assert len(post_data["roadmap"]) >= 1

    get_res = auth_client.get(f"{API_BASE}/roadmap", timeout=30)
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert isinstance(get_data["roadmap"], list)
    assert len(get_data["roadmap"]) >= 1


def test_dashboard_data(auth_client):
    # Dashboard module: key cards payload
    res = auth_client.get(f"{API_BASE}/dashboard", timeout=30)
    assert res.status_code == 200
    data = res.json()
    assert "progress" in data and isinstance(data["progress"], int)
    assert "recommendations" in data and isinstance(data["recommendations"], list)
    assert "notifications" in data and isinstance(data["notifications"], list)


def test_schools_and_free_course_enrollment(auth_client, flow_state):
    # Schools/Courses module: list + enroll flow
    schools_res = auth_client.get(f"{API_BASE}/schools", timeout=30)
    assert schools_res.status_code == 200
    schools = schools_res.json()["schools"]
    assert isinstance(schools, list) and len(schools) > 0

    school_id = schools[0]["id"]
    enroll_school_res = auth_client.post(f"{API_BASE}/schools/{school_id}/enroll", timeout=30)
    assert enroll_school_res.status_code == 200
    assert enroll_school_res.json()["enrolled"] is True

    courses_res = auth_client.get(f"{API_BASE}/courses", timeout=30)
    assert courses_res.status_code == 200
    courses = courses_res.json()["courses"]
    free_courses = [c for c in courses if not c.get("premium")]
    assert len(free_courses) >= 1

    free_course_id = free_courses[0]["id"]
    flow_state["free_course_id"] = free_course_id
    enroll_course_res = auth_client.post(f"{API_BASE}/courses/{free_course_id}/enroll", timeout=30)
    assert enroll_course_res.status_code == 200
    assert enroll_course_res.json()["enrolled"] is True


def test_course_lessons_completion_progress(auth_client, flow_state):
    # Lessons module: complete lessons + progress/certificate check
    course_id = flow_state["free_course_id"]
    assert course_id is not None

    course_res = auth_client.get(f"{API_BASE}/courses/{course_id}", timeout=30)
    assert course_res.status_code == 200
    course_data = course_res.json()
    lessons = course_data["lessons"]
    assert len(lessons) >= 1

    flow_state["course_id_for_certificate"] = course_id
    for lesson in lessons:
        quiz_answers = [q.get("answer", 0) for q in lesson.get("quiz", [])]
        complete_res = auth_client.post(
            f"{API_BASE}/lessons/{lesson['id']}/complete",
            json={"quiz_answers": quiz_answers, "reflection": "TEST_reflection"},
            timeout=30,
        )
        assert complete_res.status_code == 200
        complete_data = complete_res.json()
        assert isinstance(complete_data["progress_percentage"], int)
        assert isinstance(complete_data["quiz_score"], int)

    updated_course_res = auth_client.get(f"{API_BASE}/courses/{course_id}", timeout=30)
    assert updated_course_res.status_code == 200
    updated_course = updated_course_res.json()
    assert updated_course["enrollment"]["progress_percentage"] == 100

    cert_res = auth_client.get(f"{API_BASE}/certificates", timeout=30)
    assert cert_res.status_code == 200
    cert_data = cert_res.json()["certificates"]
    assert any(c["course_id"] == course_id for c in cert_data)


def test_checkins_and_journal_persistence(auth_client):
    # Wellbeing module: check-ins + journal create and fetch
    checkin_payload = {"mood_score": 8, "reflection_notes": "TEST_checkin_note"}
    checkin_post_res = auth_client.post(f"{API_BASE}/checkins", json=checkin_payload, timeout=30)
    assert checkin_post_res.status_code == 200
    assert checkin_post_res.json()["checkin"]["reflection_notes"] == "TEST_checkin_note"

    checkin_get_res = auth_client.get(f"{API_BASE}/checkins", timeout=30)
    assert checkin_get_res.status_code == 200
    checkins = checkin_get_res.json()["checkins"]
    assert any(c["reflection_notes"] == "TEST_checkin_note" for c in checkins)

    journal_payload = {"content": "TEST_journal_content hopeful and grateful", "tags": ["test", "qa"]}
    journal_post_res = auth_client.post(f"{API_BASE}/journal", json=journal_payload, timeout=30)
    assert journal_post_res.status_code == 200
    assert journal_post_res.json()["entry"]["content"] == journal_payload["content"]

    journal_get_res = auth_client.get(f"{API_BASE}/journal", timeout=30)
    assert journal_get_res.status_code == 200
    entries = journal_get_res.json()["entries"]
    assert any(e["content"] == journal_payload["content"] for e in entries)


def test_ai_professor_stream_and_message_history(auth_client):
    # AI module: streaming chat endpoint and message history
    professor_id = "hope"
    stream_res = auth_client.post(
        f"{API_BASE}/ai/chat/stream",
        json={"professor_id": professor_id, "message": "I need a small next step today"},
        stream=True,
        timeout=60,
    )
    assert stream_res.status_code == 200

    chunks = []
    for line in stream_res.iter_lines(decode_unicode=True):
        if not line:
            continue
        if line.startswith("data: "):
            payload = line.replace("data: ", "")
            if payload != "[DONE]":
                chunks.append(payload)
        if line.startswith("event: done"):
            break
    assert len("".join(chunks).strip()) > 0

    messages_res = auth_client.get(f"{API_BASE}/ai/messages/{professor_id}", timeout=30)
    assert messages_res.status_code == 200
    messages = messages_res.json()["messages"]
    assert any(m["role"] == "assistant" for m in messages)


def test_plans_checkout_support_and_admin(auth_client, test_account):
    # Monetization/support/admin module: plans, checkout wiring, support, admin access
    plans_res = auth_client.get(f"{API_BASE}/plans", timeout=30)
    assert plans_res.status_code == 200
    plans = plans_res.json()["plans"]
    assert any(p["id"] == "free" for p in plans)
    assert any(p["id"] == "premium" for p in plans)

    free_checkout_res = auth_client.post(
        f"{API_BASE}/payments/checkout",
        json={"plan_id": "free", "origin_url": BASE_URL},
        timeout=30,
    )
    assert free_checkout_res.status_code == 200
    free_data = free_checkout_res.json()
    assert "url" in free_data and "session_id" in free_data

    premium_checkout_res = auth_client.post(
        f"{API_BASE}/payments/checkout",
        json={"plan_id": "premium", "origin_url": BASE_URL},
        timeout=45,
    )
    assert premium_checkout_res.status_code in [200, 503]

    support_res = auth_client.get(f"{API_BASE}/support", timeout=30)
    assert support_res.status_code == 200
    support_data = support_res.json()
    assert "topics" in support_data and isinstance(support_data["topics"], list)

    admin_res = auth_client.get(f"{API_BASE}/admin/summary", timeout=30)
    if test_account["user"].get("role") == "admin":
        assert admin_res.status_code == 200
        admin_data = admin_res.json()
        assert "users" in admin_data and "courses" in admin_data
    else:
        assert admin_res.status_code == 403
