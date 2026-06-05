import os
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple

import pytest
import requests
from pymongo import MongoClient


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


def _read_seed_credentials(role: str) -> Tuple[str, str]:
    creds_path = "/app/memory/test_credentials.md"
    if not os.path.exists(creds_path):
        pytest.skip("/app/memory/test_credentials.md missing")

    role = role.lower().strip()
    role_email = None
    role_password = None
    with open(creds_path, "r", encoding="utf-8") as f:
        for line in f:
            lower = line.strip().lower()
            if lower.startswith(f"- {role} email:"):
                role_email = line.split(":", 1)[1].strip()
            if lower.startswith(f"- {role} password:"):
                role_password = line.split(":", 1)[1].strip()

    if not role_email or not role_password:
        pytest.skip(f"{role.title()} credentials missing in test_credentials.md")
    return role_email, role_password


BASE_URL = _load_base_url()
API_BASE = f"{BASE_URL}/api"


@pytest.fixture
def api_client() -> requests.Session:
    # HTTP module: shared requests session
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def mongo_db():
    # DB module: direct DB access used only for trial-expiration simulation
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        pytest.skip("MONGO_URL or DB_NAME not configured")
    client = MongoClient(mongo_url)
    db = client[db_name]
    yield db
    client.close()


def _auth_headers(token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _register(session: requests.Session, *, name: str = "TEST Trial User") -> Dict:
    # Auth module: unique registration helper
    email = f"trial_reg_{int(time.time())}_{uuid.uuid4().hex[:6]}@example.com"
    payload = {"email": email, "password": "SecurePass123", "name": name}
    res = session.post(f"{API_BASE}/auth/register", json=payload, timeout=30)
    assert res.status_code == 200, res.text
    data = res.json()
    assert isinstance(data.get("token"), str) and len(data["token"]) > 10
    assert data["user"]["email"] == email
    return data


def _login(session: requests.Session, email: str, password: str) -> Dict:
    # Auth module: login helper
    res = session.post(
        f"{API_BASE}/auth/login",
        json={"email": email, "password": password},
        timeout=30,
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert isinstance(data.get("token"), str) and len(data["token"]) > 10
    return data


def _onboarding_payload(primary_focus: list[str]) -> Dict:
    return {
        "primary_recovery_focus": primary_focus,
        "duration_affecting_life": "1 to 5 years",
        "previous_treatment_support": "No, this is my first time",
        "recovery_stage": "Early recovery",
        "goals": ["Reduce cravings", "Build daily structure"],
        "learning_preferences": ["Short lessons", "AI professor coaching"],
        "support_focus": "balanced",
        "preferred_language": "en",
        "pathway_interests": ["early-recovery", "active-addiction"],
        "journal_memory_consent": True,
    }


def _onboard(session: requests.Session, token: str, primary_focus: list[str]) -> Dict:
    # Onboarding module: helper to save full onboarding payload
    res = session.post(
        f"{API_BASE}/onboarding",
        json=_onboarding_payload(primary_focus),
        headers=_auth_headers(token),
        timeout=30,
    )
    assert res.status_code == 200, res.text
    return res.json()


def _get_dashboard(session: requests.Session, token: str) -> Dict:
    res = session.get(f"{API_BASE}/dashboard", headers=_auth_headers(token), timeout=30)
    assert res.status_code == 200, res.text
    return res.json()


def test_new_onboarded_user_gets_premium_trial_fields_and_days(mongo_db, api_client: requests.Session):
    # Trial activation module: onboarding should start 7-day premium trial
    reg = _register(api_client, name="TEST Trial Activation")
    token = reg["token"]
    user_id = reg["user"]["id"]

    _onboard(api_client, token, ["Alcohol"])

    me = api_client.get(f"{API_BASE}/me", headers=_auth_headers(token), timeout=30)
    assert me.status_code == 200
    user = me.json()["user"]
    assert user["subscription_status"] == "premium_trial"
    assert user["premium_access"] is True
    assert isinstance(user.get("trial_start_at"), str)
    assert isinstance(user.get("trial_end_at"), str)
    assert user["trial_days_remaining"] == 7

    db_user = mongo_db.users.find_one({"id": user_id}, {"_id": 0})
    assert db_user["subscription_status"] == "premium_trial"
    assert db_user.get("trial_start_at")
    assert db_user.get("trial_end_at")


def test_trial_user_has_premium_course_access_and_unlocks(api_client: requests.Session):
    # Access module: trial users should see premium courses unlocked and enroll
    reg = _register(api_client, name="TEST Trial Access")
    token = reg["token"]
    _onboard(api_client, token, ["Alcohol"])

    courses_res = api_client.get(f"{API_BASE}/courses", headers=_auth_headers(token), timeout=30)
    assert courses_res.status_code == 200
    courses = courses_res.json()["courses"]
    premium_courses = [c for c in courses if c.get("premium") is True]
    assert len(premium_courses) > 0
    assert all(c.get("locked") is False for c in premium_courses)

    enroll_res = api_client.post(
        f"{API_BASE}/courses/{premium_courses[0]['id']}/enroll",
        headers=_auth_headers(token),
        timeout=30,
    )
    assert enroll_res.status_code == 200, enroll_res.text
    assert enroll_res.json()["enrolled"] is True


def test_dashboard_first_visit_contains_trial_banner_payload_and_welcome(api_client: requests.Session):
    # Dashboard first-visit module: welcome copy and trial payload
    reg = _register(api_client, name="TEST First Visit Welcome")
    token = reg["token"]
    name = reg["user"]["name"]
    _onboard(api_client, token, ["Alcohol"])

    dashboard = _get_dashboard(api_client, token)
    assert dashboard["is_first_session"] is True
    assert dashboard["first_visit_experience"]["welcome_message"] == f"Welcome to ClearPath Recovery University, {name}"
    assert "Welcome back" not in dashboard["first_visit_experience"]["welcome_message"]

    trial = dashboard["trial"]
    assert trial["active"] is True
    assert trial["days_remaining"] == 7
    assert isinstance(trial.get("trial_end_at"), str)

    first_visit = dashboard["first_visit_experience"]
    assert isinstance(first_visit.get("assigned_ai_professor"), dict)
    assert isinstance(first_visit.get("roadmap_summary"), list) and len(first_visit["roadmap_summary"]) >= 1
    assert isinstance(first_visit.get("recommended_first_course"), dict)
    assert isinstance(first_visit.get("next_steps"), list) and len(first_visit["next_steps"]) >= 4
    assert any("Premium trial" in step for step in first_visit["next_steps"])


def test_expired_trial_auto_downgrades_to_free_preserving_data(mongo_db, api_client: requests.Session):
    # Subscription normalization module: expired trial should auto-downgrade on authenticated API request
    reg = _register(api_client, name="TEST Expired Trial")
    token = reg["token"]
    user_id = reg["user"]["id"]
    _onboard(api_client, token, ["Alcohol"])

    premium_course_id = "alcohol-recovery-skills"
    enroll = api_client.post(
        f"{API_BASE}/courses/{premium_course_id}/enroll",
        headers=_auth_headers(token),
        timeout=30,
    )
    assert enroll.status_code == 200

    past_end = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    mongo_db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "subscription_status": "premium_trial",
                "trial_end_at": past_end,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    me = api_client.get(f"{API_BASE}/me", headers=_auth_headers(token), timeout=30)
    assert me.status_code == 200
    user = me.json()["user"]
    assert user["subscription_status"] == "free"
    assert user["premium_access"] is False
    assert user["trial_expired"] is True

    dashboard = _get_dashboard(api_client, token)
    enrolled_ids = {item["course_id"] for item in dashboard["active_learning"]}
    assert premium_course_id in enrolled_ids


def test_plans_api_includes_premium_annual_199(api_client: requests.Session):
    # Plans module: verify annual plan is available
    res = api_client.get(f"{API_BASE}/plans", timeout=30)
    assert res.status_code == 200
    plans = res.json()["plans"]
    annual = next((p for p in plans if p["id"] == "premium_annual"), None)
    assert annual is not None
    assert annual["name"] == "Premium Annual"
    assert annual["amount"] == 199.0


@pytest.mark.parametrize(
    "focus,expected_course_id",
    [
        ("Alcohol", "alcohol-recovery-skills"),
        ("Opioids", "opioid-safety-recovery"),
        ("Fentanyl", "fentanyl-safety-planning"),
        ("Stimulants", "stimulant-recovery-regulation"),
        ("Gambling", "gambling-recovery-accountability"),
        ("Gaming", "gaming-balance-reset"),
        ("Mental Wellness Only", "mental-wellness-foundations"),
    ],
)
def test_focus_specific_course_recommendation_on_first_dashboard(
    api_client: requests.Session, focus: str, expected_course_id: str
):
    # Focus routing module: first dashboard should map focus -> unique recommended course
    reg = _register(api_client, name=f"TEST Focus {focus}")
    token = reg["token"]
    _onboard(api_client, token, [focus])

    dashboard = _get_dashboard(api_client, token)
    first_course = dashboard["first_visit_experience"]["recommended_first_course"]
    assert first_course["id"] == expected_course_id


def test_supporting_loved_one_routes_to_bridge_and_family_content(api_client: requests.Session):
    # Family member module: no substance-user guidance, must route to Professor Bridge + family resources
    reg = _register(api_client, name="TEST Family Path")
    token = reg["token"]
    _onboard(api_client, token, ["Supporting a Loved One"])

    dashboard = _get_dashboard(api_client, token)
    first_visit = dashboard["first_visit_experience"]
    assert first_visit["assigned_ai_professor"]["name"] == "Professor Bridge"
    assert first_visit["recommended_first_course"]["id"] == "family-support-foundations"
    family_focus = next(
        (item for item in first_visit["focus_recommendations"] if item["focus"] == "Supporting a Loved One"),
        None,
    )
    assert family_focus is not None
    assert "support without rescuing" in family_focus["resource"].lower()


def test_focus_curriculum_includes_required_focuses(api_client: requests.Session):
    # Focus curriculum module: endpoint should return focus-specific packs
    reg = _register(api_client, name="TEST Focus Curriculum")
    token = reg["token"]
    focuses = ["Alcohol", "Opioids", "Fentanyl", "Stimulants", "Gambling", "Gaming", "Mental Wellness Only"]
    _onboard(api_client, token, focuses)

    res = api_client.get(f"{API_BASE}/focus/curriculum", headers=_auth_headers(token), timeout=30)
    assert res.status_code == 200
    packs = res.json()["focus_curriculum"]
    returned_focuses = {pack["focus"] for pack in packs}
    assert set(focuses).issubset(returned_focuses)
    assert all(isinstance(pack.get("lesson_titles"), list) and len(pack["lesson_titles"]) >= 1 for pack in packs)


def test_ai_chat_stream_persists_messages_and_mentions_family_guidance(api_client: requests.Session):
    # AI memory module: AI chat should stream response and persist user+assistant messages
    reg = _register(api_client, name="TEST AI Family")
    token = reg["token"]
    _onboard(api_client, token, ["Supporting a Loved One"])

    stream_res = api_client.post(
        f"{API_BASE}/ai/chat/stream",
        json={
            "professor_id": "bridge",
            "message": "I support my partner. Give me one boundary and one communication step.",
        },
        headers=_auth_headers(token),
        stream=True,
        timeout=60,
    )
    assert stream_res.status_code == 200

    chunks = []
    for line in stream_res.iter_lines(decode_unicode=True):
        if not line:
            continue
        if line.startswith("data: "):
            text = line.replace("data: ", "")
            if text != "[DONE]":
                chunks.append(text)
        if line.startswith("event: done"):
            break
    full_response = "".join(chunks).strip().lower()
    assert len(full_response) > 0

    messages = api_client.get(
        f"{API_BASE}/ai/messages/bridge", headers=_auth_headers(token), timeout=30
    )
    assert messages.status_code == 200
    payload = messages.json()["messages"]
    assert any(msg["role"] == "user" for msg in payload)
    assert any(msg["role"] == "assistant" for msg in payload)


def test_returning_seeded_student_remains_welcome_back_after_onboarding_resubmit(api_client: requests.Session):
    # Returning user module: onboarding resubmission must not reset first-session state
    student_email, student_password = _read_seed_credentials("student")
    login_data = _login(api_client, student_email, student_password)
    token = login_data["token"]

    before = _get_dashboard(api_client, token)
    assert before["is_first_session"] is False
    assert "Welcome back" in before["first_visit_experience"]["welcome_message"]

    _onboard(api_client, token, ["Alcohol"])

    after = _get_dashboard(api_client, token)
    assert after["is_first_session"] is False
    assert "Welcome back" in after["first_visit_experience"]["welcome_message"]
