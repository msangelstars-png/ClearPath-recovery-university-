import os
import time
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


def _read_seed_credentials() -> Tuple[Tuple[str, str], Tuple[str, str]]:
    creds_path = "/app/memory/test_credentials.md"
    if not os.path.exists(creds_path):
        pytest.skip("/app/memory/test_credentials.md is missing")

    admin_email = admin_password = student_email = student_password = None
    with open(creds_path, "r", encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if line.lower().startswith("- admin email:"):
                admin_email = line.split(":", 1)[1].strip()
            elif line.lower().startswith("- admin password:"):
                admin_password = line.split(":", 1)[1].strip()
            elif line.lower().startswith("- student email:"):
                student_email = line.split(":", 1)[1].strip()
            elif line.lower().startswith("- student password:"):
                student_password = line.split(":", 1)[1].strip()

    if not all([admin_email, admin_password, student_email, student_password]):
        pytest.skip("Seed credentials are incomplete in /app/memory/test_credentials.md")

    return (admin_email, admin_password), (student_email, student_password)


BASE_URL = _load_base_url()
API_BASE = f"{BASE_URL}/api"
(ADMIN_CREDS, STUDENT_CREDS) = _read_seed_credentials()


def _login(email: str, password: str) -> Dict[str, str]:
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={"email": email, "password": password},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data.get("token"), str) and data["token"]
    assert isinstance(data.get("user", {}).get("id"), str)
    return {"token": data["token"], "user_id": data["user"]["id"]}


@pytest.fixture(scope="module")
def student_client_and_user_id():
    # Auth module: seeded student login for voice/export verification
    auth = _login(STUDENT_CREDS[0], STUDENT_CREDS[1])
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth['token']}",
    })
    return session, auth["user_id"]


@pytest.fixture(scope="module")
def admin_client_and_user_id():
    # Auth module: seeded admin login for cross-user scoping validation
    auth = _login(ADMIN_CREDS[0], ADMIN_CREDS[1])
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth['token']}",
    })
    return session, auth["user_id"]


def test_voice_provider_ready_contract_intact(student_client_and_user_id):
    # Voice module: provider-ready flags remain true
    student_client, _ = student_client_and_user_id

    prof_res = student_client.get(f"{API_BASE}/voice/professors", timeout=30)
    assert prof_res.status_code == 200
    professors = prof_res.json().get("professors", [])
    assert len(professors) >= 1

    first = professors[0]
    assert first["voice_ready"] is True
    assert first["video_avatar_ready"] is True
    assert first["realtime_provider_ready"] is True


def test_student_voice_session_is_listed_and_scoped(student_client_and_user_id):
    # Voice session module: POST -> GET verification with student scoping
    student_client, student_user_id = student_client_and_user_id

    prof_res = student_client.get(f"{API_BASE}/voice/professors", timeout=30)
    assert prof_res.status_code == 200
    professor_id = prof_res.json()["professors"][0]["id"]

    mode = "video"
    create_res = student_client.post(
        f"{API_BASE}/voice/session",
        json={"professor_id": professor_id, "mode": mode, "language": "en"},
        timeout=30,
    )
    assert create_res.status_code == 200
    created = create_res.json()["session"]

    assert created["professor_id"] == professor_id
    assert created["mode"] == mode
    assert created["provider"] == "openai_realtime_ready"
    assert created["status"] == "text_tts_active_until_voice_key_added"
    assert created["webrtc_ready"] is True
    assert created["avatar_ready"] is True

    list_res = student_client.get(f"{API_BASE}/voice/sessions", timeout=30)
    assert list_res.status_code == 200
    sessions = list_res.json().get("sessions", [])
    assert isinstance(sessions, list)
    assert any(item["id"] == created["id"] for item in sessions)
    assert all(item["user_id"] == student_user_id for item in sessions)


def test_student_export_includes_voice_sessions(student_client_and_user_id):
    # Export module: ensure voice_sessions are present and persisted in student export
    student_client, _ = student_client_and_user_id

    marker_mode = f"video_{int(time.time())}"
    prof_res = student_client.get(f"{API_BASE}/voice/professors", timeout=30)
    assert prof_res.status_code == 200
    professor_id = prof_res.json()["professors"][0]["id"]

    create_res = student_client.post(
        f"{API_BASE}/voice/session",
        json={"professor_id": professor_id, "mode": marker_mode, "language": "en"},
        timeout=30,
    )
    assert create_res.status_code == 200
    created_id = create_res.json()["session"]["id"]

    export_res = student_client.get(f"{API_BASE}/student/export", timeout=30)
    assert export_res.status_code == 200
    export_data = export_res.json()

    assert "voice_sessions" in export_data
    assert isinstance(export_data["voice_sessions"], list)
    assert any(item["id"] == created_id for item in export_data["voice_sessions"])


def test_admin_cannot_view_student_voice_sessions(admin_client_and_user_id, student_client_and_user_id):
    # Voice session module: user-scoped isolation between admin and student session lists
    admin_client, admin_user_id = admin_client_and_user_id
    student_client, student_user_id = student_client_and_user_id

    student_list_res = student_client.get(f"{API_BASE}/voice/sessions", timeout=30)
    assert student_list_res.status_code == 200
    student_sessions = student_list_res.json().get("sessions", [])
    assert all(item["user_id"] == student_user_id for item in student_sessions)

    admin_list_res = admin_client.get(f"{API_BASE}/voice/sessions", timeout=30)
    assert admin_list_res.status_code == 200
    admin_sessions = admin_list_res.json().get("sessions", [])
    assert all(item["user_id"] == admin_user_id for item in admin_sessions)

    student_ids = {item["id"] for item in student_sessions}
    admin_ids = {item["id"] for item in admin_sessions}
    assert student_ids.isdisjoint(admin_ids)
