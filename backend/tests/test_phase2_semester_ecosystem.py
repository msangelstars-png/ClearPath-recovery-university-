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


@pytest.fixture(scope="session")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _login(session: requests.Session, email: str, password: str) -> Dict[str, str]:
    response = session.post(
        f"{API_BASE}/auth/login",
        json={"email": email, "password": password},
        timeout=30,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data.get("token"), str) and data["token"]
    return {"token": data["token"], "user_id": data["user"]["id"], "email": data["user"]["email"]}


@pytest.fixture(scope="session")
def student_auth(api_client):
    # Auth module: seeded student login from test credentials
    return _login(api_client, STUDENT_CREDS[0], STUDENT_CREDS[1])


@pytest.fixture(scope="session")
def admin_auth(api_client):
    # Auth module: seeded admin login from test credentials
    return _login(api_client, ADMIN_CREDS[0], ADMIN_CREDS[1])


@pytest.fixture
def student_client(student_auth):
    # Student API module: authenticated requests
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {student_auth['token']}",
    })
    return session


@pytest.fixture
def admin_client(admin_auth):
    # Admin API module: authenticated requests
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_auth['token']}",
    })
    return session


@pytest.fixture(scope="session")
def run_state() -> Dict[str, str]:
    # Cross-feature state: IDs for persistence and RBAC checks
    return {
        "program_id": "",
        "track_id": "",
        "module_id": "",
        "assignment_id": "",
        "uploaded_file_id": "",
        "uploaded_filename": "",
        "event_id": "",
        "voice_session_id": "",
    }


def test_programs_semester_tracks(student_client):
    # Programs module: all schools + semester tracks validation
    response = student_client.get(f"{API_BASE}/programs", timeout=30)
    assert response.status_code == 200
    programs = response.json()["programs"]

    assert len(programs) >= 13
    for program in programs:
        tracks = program.get("tracks", [])
        assert len(tracks) == 4
        levels = {track["level"] for track in tracks}
        assert levels == {"beginner", "intermediate", "advanced", "mastery"}
        for track in tracks:
            assert track["semester_weeks"] == 16
            assert len(track.get("modules", [])) == 4


def test_program_detail_and_assignment_progress(student_client, run_state):
    # Assignment module: submit assignment and verify persisted progress
    programs_res = student_client.get(f"{API_BASE}/programs", timeout=30)
    assert programs_res.status_code == 200
    first_program = programs_res.json()["programs"][0]

    first_track = first_program["tracks"][0]
    first_module = first_track["modules"][0]
    first_assignment = first_module["assignments"][0]

    run_state["program_id"] = first_program["id"]
    run_state["track_id"] = first_track["id"]
    run_state["module_id"] = first_module["id"]
    run_state["assignment_id"] = first_assignment["id"]

    submit_payload = {
        "program_id": run_state["program_id"],
        "track_id": run_state["track_id"],
        "module_id": run_state["module_id"],
        "assignment_id": run_state["assignment_id"],
        "text_response": f"TEST assignment submission {int(time.time())}",
        "file_ids": [],
        "language": "en",
    }
    submit_res = student_client.post(f"{API_BASE}/assignments/submit", json=submit_payload, timeout=30)
    assert submit_res.status_code == 200
    submit_data = submit_res.json()
    assert submit_data["submission"]["program_id"] == run_state["program_id"]
    assert submit_data["submission"]["assignment_id"] == run_state["assignment_id"]
    assert submit_data["progress_percentage"] >= 25

    detail_res = student_client.get(f"{API_BASE}/programs/{run_state['program_id']}", timeout=30)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert any(item["assignment_id"] == run_state["assignment_id"] for item in detail["submissions"])

    list_res_after = student_client.get(f"{API_BASE}/programs", timeout=30)
    assert list_res_after.status_code == 200
    refreshed = list_res_after.json()["programs"]
    matched = next(item for item in refreshed if item["id"] == run_state["program_id"])
    matched_track = next(track for track in matched["tracks"] if track["id"] == run_state["track_id"])
    assert matched_track["progress"]["progress_percentage"] >= 25
    assert run_state["module_id"] in matched_track["progress"]["completed_modules"]


def test_files_upload_list_download_and_export(student_client, run_state):
    # Files module: upload object storage, list, download, student export
    filename = f"phase2-test-{int(time.time())}.txt"
    file_bytes = b"phase2 regression upload"

    upload_session = requests.Session()
    upload_session.headers.update({"Authorization": student_client.headers["Authorization"]})

    upload_res = upload_session.post(
        f"{API_BASE}/files/upload",
        data={"purpose": "student_document", "related_id": ""},
        files={"file": (filename, file_bytes, "text/plain")},
        timeout=60,
    )
    assert upload_res.status_code == 200, upload_res.text
    uploaded = upload_res.json()["file"]
    run_state["uploaded_file_id"] = uploaded["id"]
    run_state["uploaded_filename"] = uploaded["original_filename"]
    assert uploaded["encrypted"] is True
    assert uploaded["purpose"] == "student_document"

    list_res = student_client.get(f"{API_BASE}/files", timeout=30)
    assert list_res.status_code == 200
    files = list_res.json()["files"]
    assert any(item["id"] == run_state["uploaded_file_id"] for item in files)

    download_res = student_client.get(
        f"{API_BASE}/files/{run_state['uploaded_file_id']}/download",
        timeout=30,
    )
    assert download_res.status_code == 200
    assert download_res.content == file_bytes

    export_res = student_client.get(f"{API_BASE}/student/export", timeout=30)
    assert export_res.status_code == 200
    export_data = export_res.json()
    assert export_data["data_governance"]["encrypted_storage"] is True
    assert export_data["data_governance"]["role_based_access"] is True
    assert any(item["id"] == run_state["uploaded_file_id"] for item in export_data["files"])


def test_events_rsvp_attendance_and_replay_library(student_client, run_state):
    # Events + replay module: RSVP/attendance persistence and replay metadata
    list_res = student_client.get(f"{API_BASE}/events", timeout=30)
    assert list_res.status_code == 200
    events = list_res.json()["events"]
    assert len(events) >= 3

    event_id = events[0]["id"]
    run_state["event_id"] = event_id

    rsvp_res = student_client.post(
        f"{API_BASE}/events/{event_id}/rsvp",
        json={"status": "going", "language": "en"},
        timeout=30,
    )
    assert rsvp_res.status_code == 200
    assert rsvp_res.json()["rsvp"]["status"] == "going"

    attend_res = student_client.post(f"{API_BASE}/events/{event_id}/attend", timeout=30)
    assert attend_res.status_code == 200
    assert attend_res.json()["attendance"]["event_id"] == event_id

    events_after = student_client.get(f"{API_BASE}/events", timeout=30)
    assert events_after.status_code == 200
    event = next(item for item in events_after.json()["events"] if item["id"] == event_id)
    assert event["rsvp"]["status"] == "going"

    replay_res = student_client.get(f"{API_BASE}/replays", timeout=30)
    assert replay_res.status_code == 200
    replays = replay_res.json()["replays"]
    assert len(replays) >= 6
    assert all(isinstance(item.get("transcript"), str) for item in replays)
    assert all(isinstance(item.get("languages"), list) and len(item["languages"]) > 0 for item in replays)


def test_voice_professors_and_provider_ready_session(student_client, run_state):
    # Voice studio module: 12 professors + provider-ready session architecture
    prof_res = student_client.get(f"{API_BASE}/voice/professors", timeout=30)
    assert prof_res.status_code == 200
    professors = prof_res.json()["professors"]
    assert len(professors) == 12
    assert all(item["voice_ready"] for item in professors)
    assert all(item["video_avatar_ready"] for item in professors)

    target_prof = professors[0]["id"]
    session_res = student_client.post(
        f"{API_BASE}/voice/session",
        json={"professor_id": target_prof, "mode": "video", "language": "en"},
        timeout=30,
    )
    assert session_res.status_code == 200
    session = session_res.json()["session"]
    run_state["voice_session_id"] = session["id"]
    assert session["provider"] == "openai_realtime_ready"
    assert session["status"] == "text_tts_active_until_voice_key_added"
    assert session["webrtc_ready"] is True
    assert session["mode"] == "video"


def test_file_rbac_non_owner_denied_admin_allowed(student_client, admin_client, run_state):
    # RBAC module: non-owner blocked from file access, admin can access
    assert run_state["uploaded_file_id"]

    outsider_email = f"phase2_outsider_{int(time.time())}_{uuid.uuid4().hex[:5]}@example.com"
    outsider_password = "Phase2Outsider123"

    register_res = requests.post(
        f"{API_BASE}/auth/register",
        json={"email": outsider_email, "password": outsider_password, "name": "Phase2 Outsider"},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    assert register_res.status_code == 200, register_res.text

    outsider_token = register_res.json()["token"]
    outsider_client = requests.Session()
    outsider_client.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {outsider_token}",
    })

    denied_res = outsider_client.get(
        f"{API_BASE}/files/{run_state['uploaded_file_id']}/download",
        timeout=30,
    )
    assert denied_res.status_code == 403

    admin_ok_res = admin_client.get(
        f"{API_BASE}/files/{run_state['uploaded_file_id']}/download",
        timeout=30,
    )
    assert admin_ok_res.status_code == 200
    assert admin_ok_res.headers.get("Content-Type", "").startswith("text/plain")


def test_persistence_after_relogin_for_phase2_data(run_state):
    # Persistence module: verify created records survive logout/login
    assert run_state["program_id"]
    assert run_state["track_id"]
    assert run_state["uploaded_file_id"]
    assert run_state["event_id"]

    relogin = requests.Session()
    relog_data = _login(relogin, STUDENT_CREDS[0], STUDENT_CREDS[1])
    relogin.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {relog_data['token']}",
    })

    files_res = relogin.get(f"{API_BASE}/files", timeout=30)
    assert files_res.status_code == 200
    assert any(item["id"] == run_state["uploaded_file_id"] for item in files_res.json()["files"])

    events_res = relogin.get(f"{API_BASE}/events", timeout=30)
    assert events_res.status_code == 200
    persisted_event = next(item for item in events_res.json()["events"] if item["id"] == run_state["event_id"])
    assert persisted_event["rsvp"]["status"] == "going"

    programs_res = relogin.get(f"{API_BASE}/programs", timeout=30)
    assert programs_res.status_code == 200
    persisted_program = next(item for item in programs_res.json()["programs"] if item["id"] == run_state["program_id"])
    persisted_track = next(track for track in persisted_program["tracks"] if track["id"] == run_state["track_id"])
    assert persisted_track["progress"]["progress_percentage"] >= 25

    # No public API currently exposes historical voice sessions by user; verify current API contract via export payload.
    export_res = relogin.get(f"{API_BASE}/student/export", timeout=30)
    assert export_res.status_code == 200
    export_payload = export_res.json()
    assert "voice_sessions" not in export_payload
