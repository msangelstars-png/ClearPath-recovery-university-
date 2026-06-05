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

EXPECTED_STAGE_OPTIONS = [
    "Actively using",
    "Thinking about change",
    "Preparing to quit",
    "Early recovery",
    "Maintaining recovery",
    "Returning after relapse",
    "Supporting a loved one",
]


@pytest.fixture
def api_client() -> requests.Session:
    # HTTP module: shared API client
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _register_and_get_token(session: requests.Session) -> Tuple[str, Dict]:
    # Auth module: unique user registration for onboarding personalization tests
    email = f"focus_{int(time.time())}_{uuid.uuid4().hex[:6]}@example.com"
    payload = {"email": email, "password": "SecurePass123", "name": "TEST Focus User"}
    response = session.post(f"{API_BASE}/auth/register", json=payload, timeout=30)
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data.get("token"), str) and len(data["token"]) > 10
    return data["token"], data["user"]


def _auth_headers(token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _onboarding_payload(primary_focus: list[str]) -> Dict:
    return {
        "primary_recovery_focus": primary_focus,
        "recovery_stage": "Early recovery",
        "goals": ["Reduce cravings", "Build daily structure"],
        "learning_preferences": ["Short lessons", "AI professor coaching"],
        "support_focus": "balanced",
        "preferred_language": "en",
        "pathway_interests": ["early-recovery", "active-addiction"],
        "journal_memory_consent": True,
    }


def test_onboarding_options_stage_values_are_exact(api_client: requests.Session):
    # Onboarding options module: verify exact stage options contract
    response = api_client.get(f"{API_BASE}/onboarding/options", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert data["stage_options"] == EXPECTED_STAGE_OPTIONS


def test_onboarding_persists_primary_recovery_focus(api_client: requests.Session):
    # Onboarding persistence module: verify assessment/profile stores primary_recovery_focus
    token, _ = _register_and_get_token(api_client)
    payload = _onboarding_payload(["Alcohol", "Opioids"])
    response = api_client.post(
        f"{API_BASE}/onboarding", json=payload, headers=_auth_headers(token), timeout=30
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["profile"]["primary_recovery_focus"] == ["Alcohol", "Opioids"]

    profile_response = api_client.get(
        f"{API_BASE}/student/profile", headers=_auth_headers(token), timeout=30
    )
    assert profile_response.status_code == 200
    profile_data = profile_response.json()
    assert profile_data["profile"]["primary_recovery_focus"] == ["Alcohol", "Opioids"]


def test_dashboard_first_visit_reflects_focus_personalization(api_client: requests.Session):
    # Dashboard personalization module: focus recommendations + first course + professor
    token, _ = _register_and_get_token(api_client)
    onboard = api_client.post(
        f"{API_BASE}/onboarding",
        json=_onboarding_payload(["Alcohol", "Opioids"]),
        headers=_auth_headers(token),
        timeout=30,
    )
    assert onboard.status_code == 200, onboard.text

    dashboard = api_client.get(f"{API_BASE}/dashboard", headers=_auth_headers(token), timeout=30)
    assert dashboard.status_code == 200
    payload = dashboard.json()
    assert payload["is_first_session"] is True

    first_visit = payload["first_visit_experience"]
    focuses = [item["focus"] for item in first_visit["focus_recommendations"]]
    assert "Alcohol" in focuses
    assert "Opioids" in focuses
    assert first_visit["recommended_first_course"]["id"] == "recovery-foundations"
    assert first_visit["assigned_ai_professor"]["name"] == "Professor Hope"


def test_learning_plan_contains_focus_and_specialized_content(api_client: requests.Session):
    # Learning plan module: verify primary_recovery_focus and specialized_content are present
    token, _ = _register_and_get_token(api_client)
    onboard = api_client.post(
        f"{API_BASE}/onboarding",
        json=_onboarding_payload(["Alcohol", "Opioids"]),
        headers=_auth_headers(token),
        timeout=30,
    )
    assert onboard.status_code == 200, onboard.text

    plan_response = api_client.get(f"{API_BASE}/learning-plan", headers=_auth_headers(token), timeout=30)
    assert plan_response.status_code == 200
    plan = plan_response.json()["learning_plan"]
    assert plan["primary_recovery_focus"] == ["Alcohol", "Opioids"]
    assert isinstance(plan.get("specialized_content"), list)
    assert len(plan["specialized_content"]) == 2
    assert any("Alcohol-specific" in item for item in plan["specialized_content"])
    assert any("Opioid-specific" in item for item in plan["specialized_content"])


def test_ai_chat_stream_works_for_focus_personalized_profile(api_client: requests.Session):
    # AI integration module: focus-personalized user receives streaming professor response
    token, _ = _register_and_get_token(api_client)
    onboard = api_client.post(
        f"{API_BASE}/onboarding",
        json=_onboarding_payload(["Alcohol", "Opioids"]),
        headers=_auth_headers(token),
        timeout=30,
    )
    assert onboard.status_code == 200, onboard.text

    stream = api_client.post(
        f"{API_BASE}/ai/chat/stream",
        json={"professor_id": "hope", "message": "Give me one action for alcohol and opioids risk today."},
        headers=_auth_headers(token),
        stream=True,
        timeout=60,
    )
    assert stream.status_code == 200

    chunks = []
    for line in stream.iter_lines(decode_unicode=True):
        if not line:
            continue
        if line.startswith("data: "):
            text = line.replace("data: ", "")
            if text != "[DONE]":
                chunks.append(text)
        if line.startswith("event: done"):
            break

    full_text = "".join(chunks).strip()
    assert len(full_text) > 0

    history = api_client.get(
        f"{API_BASE}/ai/messages/hope", headers=_auth_headers(token), timeout=30
    )
    assert history.status_code == 200
    messages = history.json()["messages"]
    assert any(message["role"] == "assistant" for message in messages)


def test_onboarding_allows_empty_primary_focus_current_behavior(api_client: requests.Session):
    # Validation gap module: backend currently accepts empty primary_recovery_focus list
    token, _ = _register_and_get_token(api_client)
    response = api_client.post(
        f"{API_BASE}/onboarding",
        json=_onboarding_payload([]),
        headers=_auth_headers(token),
        timeout=30,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["profile"]["primary_recovery_focus"] == []
