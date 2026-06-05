import os
import time
import uuid
from typing import Dict, Tuple

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


@pytest.fixture
def api_client() -> requests.Session:
    # Core HTTP module: shared API client
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _register_and_get_token(session: requests.Session, *, name: str = "TEST First Session") -> Tuple[str, Dict]:
    # Auth module: unique registration for first-time flow validation
    email = f"clearpath_first_{int(time.time())}_{uuid.uuid4().hex[:6]}@example.com"
    payload = {"email": email, "password": "SecurePass123", "name": name}
    response = session.post(f"{API_BASE}/auth/register", json=payload, timeout=30)
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data.get("token"), str) and len(data["token"]) > 10
    assert data["user"]["email"] == email
    return data["token"], data["user"]


def _auth_headers(token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _submit_onboarding(session: requests.Session, token: str) -> Dict:
    # Onboarding module: deterministic onboarding payload for dashboard personalization
    payload = {
        "recovery_stage": "Early recovery",
        "goals": ["Build daily structure", "Strengthen confidence"],
        "learning_preferences": ["Short lessons", "AI professor coaching"],
        "support_focus": "balanced",
        "preferred_language": "en",
        "pathway_interests": ["early-recovery", "life-skills"],
        "journal_memory_consent": True,
    }
    response = session.post(
        f"{API_BASE}/onboarding",
        json=payload,
        headers=_auth_headers(token),
        timeout=30,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data.get("roadmap"), list)
    return data


def test_new_user_first_dashboard_contains_first_session_payload(api_client: requests.Session):
    # Dashboard module: first visit should be first-session and contain orientation content
    token, _user = _register_and_get_token(api_client, name="TEST First Session User")
    _submit_onboarding(api_client, token)

    dashboard_response = api_client.get(
        f"{API_BASE}/dashboard", headers=_auth_headers(token), timeout=30
    )
    assert dashboard_response.status_code == 200
    dashboard = dashboard_response.json()

    assert dashboard["is_first_session"] is True
    first_visit = dashboard["first_visit_experience"]
    assert "Welcome to ClearPath" in first_visit["welcome_message"]
    assert isinstance(first_visit.get("roadmap_summary"), list) and len(first_visit["roadmap_summary"]) >= 1
    assert isinstance(first_visit.get("recommended_first_course"), dict)
    assert isinstance(first_visit.get("assigned_ai_professor"), dict)
    assert isinstance(first_visit.get("next_steps"), list) and len(first_visit["next_steps"]) == 4


def test_mark_visited_flips_first_session_false(api_client: requests.Session):
    # Dashboard module: mark-visited should transition first-session -> returning-session
    token, _user = _register_and_get_token(api_client, name="TEST Mark Visited User")
    _submit_onboarding(api_client, token)

    before = api_client.get(f"{API_BASE}/dashboard", headers=_auth_headers(token), timeout=30)
    assert before.status_code == 200
    assert before.json()["is_first_session"] is True

    mark = api_client.post(
        f"{API_BASE}/dashboard/mark-visited",
        headers=_auth_headers(token),
        timeout=30,
    )
    assert mark.status_code == 200
    mark_data = mark.json()
    assert mark_data["has_visited_dashboard"] is True
    assert mark_data["has_completed_first_login"] is True

    after = api_client.get(f"{API_BASE}/dashboard", headers=_auth_headers(token), timeout=30)
    assert after.status_code == 200
    after_data = after.json()
    assert after_data["is_first_session"] is False
    assert "Welcome back" in after_data["first_visit_experience"]["welcome_message"]
    assert after_data["first_visit_experience"]["next_steps"] == []


def test_user_flags_progression_in_me_endpoint(api_client: requests.Session):
    # User flags module: onboarding + mark-visited should propagate to /api/me fields
    token, user = _register_and_get_token(api_client, name="TEST Flags User")

    me_before = api_client.get(f"{API_BASE}/me", headers=_auth_headers(token), timeout=30)
    assert me_before.status_code == 200
    user_before = me_before.json()["user"]
    assert user_before["id"] == user["id"]
    assert user_before["has_completed_onboarding"] is False
    assert user_before["has_completed_first_login"] is False
    assert user_before["has_visited_dashboard"] is False

    _submit_onboarding(api_client, token)

    me_after_onboarding = api_client.get(f"{API_BASE}/me", headers=_auth_headers(token), timeout=30)
    assert me_after_onboarding.status_code == 200
    user_after_onboarding = me_after_onboarding.json()["user"]
    assert user_after_onboarding["has_completed_onboarding"] is True
    assert user_after_onboarding["has_completed_first_login"] is False
    assert user_after_onboarding["has_visited_dashboard"] is False

    mark = api_client.post(f"{API_BASE}/dashboard/mark-visited", headers=_auth_headers(token), timeout=30)
    assert mark.status_code == 200

    me_after_mark = api_client.get(f"{API_BASE}/me", headers=_auth_headers(token), timeout=30)
    assert me_after_mark.status_code == 200
    user_after_mark = me_after_mark.json()["user"]
    assert user_after_mark["has_completed_onboarding"] is True
    assert user_after_mark["has_completed_first_login"] is True
    assert user_after_mark["has_visited_dashboard"] is True


def _read_user_credentials(role: str) -> Tuple[str, str]:
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


def test_existing_returning_user_sees_welcome_back(api_client: requests.Session):
    # Regression module: seeded returning user should continue seeing returning-session greeting
    student_email, student_password = _read_user_credentials("student")
    login = api_client.post(
        f"{API_BASE}/auth/login",
        json={"email": student_email, "password": student_password},
        timeout=30,
    )
    assert login.status_code == 200, login.text
    token = login.json()["token"]

    dashboard = api_client.get(f"{API_BASE}/dashboard", headers=_auth_headers(token), timeout=30)
    assert dashboard.status_code == 200
    payload = dashboard.json()
    assert payload["is_first_session"] is False
    assert "Welcome back" in payload["first_visit_experience"]["welcome_message"]


def test_existing_returning_admin_sees_welcome_back(api_client: requests.Session):
    # Regression module: seeded returning admin should continue seeing returning-session greeting
    admin_email, admin_password = _read_user_credentials("admin")
    login = api_client.post(
        f"{API_BASE}/auth/login",
        json={"email": admin_email, "password": admin_password},
        timeout=30,
    )
    assert login.status_code == 200, login.text
    token = login.json()["token"]

    dashboard = api_client.get(f"{API_BASE}/dashboard", headers=_auth_headers(token), timeout=30)
    assert dashboard.status_code == 200
    payload = dashboard.json()
    assert payload["is_first_session"] is False
    assert "Welcome back" in payload["first_visit_experience"]["welcome_message"]


def test_rerun_onboarding_does_not_downgrade_returning_student(api_client: requests.Session):
    # Idempotency module: re-submitting onboarding for returning student must not reset first-session flags
    student_email, student_password = _read_user_credentials("student")
    login = api_client.post(
        f"{API_BASE}/auth/login",
        json={"email": student_email, "password": student_password},
        timeout=30,
    )
    assert login.status_code == 200, login.text
    token = login.json()["token"]

    before = api_client.get(f"{API_BASE}/dashboard", headers=_auth_headers(token), timeout=30)
    assert before.status_code == 200
    before_payload = before.json()
    assert before_payload["is_first_session"] is False
    assert "Welcome back" in before_payload["first_visit_experience"]["welcome_message"]

    _submit_onboarding(api_client, token)

    after = api_client.get(f"{API_BASE}/dashboard", headers=_auth_headers(token), timeout=30)
    assert after.status_code == 200
    after_payload = after.json()
    assert after_payload["is_first_session"] is False
    assert "Welcome back" in after_payload["first_visit_experience"]["welcome_message"]


def test_post_onboarding_routes_no_regression(api_client: requests.Session):
    # Route regression module: login/me/dashboard/onboarding/dashboard routes remain healthy
    token, _ = _register_and_get_token(api_client, name="TEST No Regression")

    me = api_client.get(f"{API_BASE}/me", headers=_auth_headers(token), timeout=30)
    assert me.status_code == 200
    assert isinstance(me.json().get("user"), dict)

    onboarding = _submit_onboarding(api_client, token)
    assert isinstance(onboarding.get("profile"), dict)

    dashboard_before = api_client.get(f"{API_BASE}/dashboard", headers=_auth_headers(token), timeout=30)
    assert dashboard_before.status_code == 200
    assert dashboard_before.json()["is_first_session"] is True

    mark = api_client.post(f"{API_BASE}/dashboard/mark-visited", headers=_auth_headers(token), timeout=30)
    assert mark.status_code == 200

    dashboard_after = api_client.get(f"{API_BASE}/dashboard", headers=_auth_headers(token), timeout=30)
    assert dashboard_after.status_code == 200
    assert dashboard_after.json()["is_first_session"] is False
