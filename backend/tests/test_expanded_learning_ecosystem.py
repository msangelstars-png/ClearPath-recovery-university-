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


ADMIN_EMAIL = "admin.clearpath@example.com"
ADMIN_PASSWORD = "ClearPathAdmin123!"
STUDENT_EMAIL = "student.clearpath@example.com"
STUDENT_PASSWORD = "ClearPathStudent123!"


@pytest.fixture(scope="session")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _login(session: requests.Session, email: str, password: str) -> dict:
    response = session.post(
        f"{API_BASE}/auth/login",
        json={"email": email, "password": password},
        timeout=30,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data.get("token"), str)
    assert data["user"]["email"] == email
    return data


@pytest.fixture(scope="session")
def student_auth(api_client):
    # Auth module: seeded student login
    data = _login(api_client, STUDENT_EMAIL, STUDENT_PASSWORD)
    return {"token": data["token"], "user": data["user"]}


@pytest.fixture(scope="session")
def admin_auth(api_client):
    # Auth module: seeded admin login
    data = _login(api_client, ADMIN_EMAIL, ADMIN_PASSWORD)
    return {"token": data["token"], "user": data["user"]}


@pytest.fixture
def student_client(student_auth):
    # Student API module: authenticated session
    session = requests.Session()
    session.headers.update(
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {student_auth['token']}",
        }
    )
    return session


@pytest.fixture
def admin_client(admin_auth):
    # Admin API module: authenticated session
    session = requests.Session()
    session.headers.update(
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {admin_auth['token']}",
        }
    )
    return session


@pytest.fixture(scope="session")
def run_state():
    # Shared state: class and ticket/certificate IDs used across persistence checks
    return {"class_id": None, "ticket_id": None, "certificate_id": None}


def test_expanded_catalog_and_pathways(student_client):
    # Catalog module: schools/pathways/languages expanded payload
    schools_res = student_client.get(f"{API_BASE}/schools", timeout=30)
    assert schools_res.status_code == 200
    schools = schools_res.json()["schools"]
    assert len(schools) >= 10
    assert any(item["id"] == "active-addiction" for item in schools)
    assert any(item["id"] == "financial-freedom" for item in schools)

    pathways_res = student_client.get(f"{API_BASE}/pathways", timeout=30)
    assert pathways_res.status_code == 200
    payload = pathways_res.json()
    assert len(payload["pathways"]) == 10
    assert {lang["code"] for lang in payload["languages"]} == {
        "en",
        "es",
        "fr",
        "pt",
        "de",
        "ar",
    }


def test_professors_payload(student_client):
    # Professors module: 12 professors with required persona metadata
    res = student_client.get(f"{API_BASE}/professors", timeout=30)
    assert res.status_code == 200
    professors = res.json()["professors"]
    assert len(professors) == 12

    ids = {item["id"] for item in professors}
    assert ids == {
        "hope",
        "insight",
        "grace",
        "compass",
        "bridge",
        "nurture",
        "prosper",
        "horizon",
        "strength",
        "freedom",
        "voice",
        "legacy",
    }
    for prof in professors:
        assert isinstance(prof.get("personality"), str) and prof["personality"].strip()
        assert isinstance(prof.get("teaching_style"), str) and prof["teaching_style"].strip()
        assert isinstance(prof.get("voice"), str) and prof["voice"].strip()
        assert isinstance(prof.get("avatar"), str) and prof["avatar"].strip()
        assert "memory_summary" in prof
        assert "student_progress_context" in prof


def test_onboarding_and_learning_plan_persistence(student_client):
    # Onboarding + Learning Plan module: save interests/language/consent and verify persistence
    onboarding_payload = {
        "recovery_stage": "Early recovery",
        "goals": ["Build daily structure", "Repair relationships"],
        "learning_preferences": ["Short lessons", "AI professor coaching"],
        "support_focus": "balanced",
        "preferred_language": "es",
        "pathway_interests": ["active-addiction", "financial-freedom", "life-skills"],
        "journal_memory_consent": False,
    }
    post_res = student_client.post(
        f"{API_BASE}/onboarding", json=onboarding_payload, timeout=30
    )
    assert post_res.status_code == 200
    profile = post_res.json()["profile"]
    assert profile["preferred_language"] == "es"
    assert profile["pathway_interests"] == [
        "active-addiction",
        "financial-freedom",
        "life-skills",
    ]
    assert profile["journal_memory_consent"] is False

    save_plan = student_client.post(
        f"{API_BASE}/learning-plan",
        json={
            "pathway_ids": ["active-addiction", "financial-freedom", "life-skills"],
            "intensity": "balanced",
            "preferred_language": "es",
        },
        timeout=30,
    )
    assert save_plan.status_code == 200
    saved_plan = save_plan.json()["learning_plan"]
    assert saved_plan["language"] == "es"

    read_plan = student_client.get(f"{API_BASE}/learning-plan", timeout=30)
    assert read_plan.status_code == 200
    fetched_plan = read_plan.json()["learning_plan"]
    assert fetched_plan["language"] == "es"
    assert len(fetched_plan["weekly_plan"]) >= 3
    assert all(item["pathway_id"] in ["active-addiction", "financial-freedom", "life-skills"] for item in fetched_plan["weekly_plan"][:3])


def test_live_classes_and_classroom_flow(student_client, run_state):
    # Live classes module: list, join, ask Q&A, complete -> certificate
    list_res = student_client.get(f"{API_BASE}/classes", timeout=30)
    assert list_res.status_code == 200
    classes_payload = list_res.json()
    classes = classes_payload["classes"]
    assert len(classes) >= 4
    assert {item["type"] for item in classes}.issuperset({"live_video", "live_text", "workshop"})
    assert {lang["code"] for lang in classes_payload["languages"]} == {
        "en",
        "es",
        "fr",
        "pt",
        "de",
        "ar",
    }

    class_id = classes[0]["id"]
    run_state["class_id"] = class_id

    detail_before = student_client.get(f"{API_BASE}/classes/{class_id}", timeout=30)
    assert detail_before.status_code == 200
    class_obj = detail_before.json()["class"]
    assert isinstance(class_obj["text_lesson"], str)
    assert isinstance(class_obj["transcript"], str)

    join_res = student_client.post(f"{API_BASE}/classes/{class_id}/join", timeout=30)
    assert join_res.status_code == 200
    assert join_res.json()["attendance"]["status"] == "attending"

    ask_res = student_client.post(
        f"{API_BASE}/classes/{class_id}/question",
        json={"question": "How do I apply this today?", "language": "en"},
        timeout=30,
    )
    assert ask_res.status_code == 200
    question = ask_res.json()["question"]
    assert question["question"] == "How do I apply this today?"
    assert "Professor" in question["answer"]

    detail_after = student_client.get(f"{API_BASE}/classes/{class_id}", timeout=30)
    assert detail_after.status_code == 200
    detail_data = detail_after.json()
    assert detail_data["attendance"]["progress_percentage"] >= 50
    assert any(q["id"] == question["id"] for q in detail_data["questions"])

    complete_res = student_client.post(f"{API_BASE}/classes/{class_id}/complete", timeout=30)
    assert complete_res.status_code == 200
    certificate = complete_res.json()["certificate"]
    run_state["certificate_id"] = certificate["id"]
    assert certificate["course_id"] == class_id
    assert certificate["type"] == "live_class"


def test_certificate_download(student_client, run_state):
    # Certificates module: fetch and downloadable certificate action
    certs_res = student_client.get(f"{API_BASE}/certificates", timeout=30)
    assert certs_res.status_code == 200
    certs = certs_res.json()["certificates"]
    assert len(certs) >= 1

    if not run_state.get("certificate_id"):
        run_state["certificate_id"] = certs[0]["id"]

    download_res = student_client.get(
        f"{API_BASE}/certificates/{run_state['certificate_id']}/download", timeout=30
    )
    assert download_res.status_code == 200
    download_data = download_res.json()
    assert download_data["format"] == "downloadable_text"
    assert isinstance(download_data.get("download_url"), str)

    text_res = student_client.get(
        f"{API_BASE}/certificates/{run_state['certificate_id']}/downloadable-text",
        timeout=30,
    )
    assert text_res.status_code == 200
    assert "certifies" in text_res.json()["text"]


def test_support_tickets_and_admin_inbox(student_client, admin_client, run_state):
    # Support module: create/list/reply ticket + admin inbox status/internal note updates
    cfg_res = student_client.get(f"{API_BASE}/support/config", timeout=30)
    assert cfg_res.status_code == 200
    cfg = cfg_res.json()
    assert "Safety Concerns" in cfg["categories"]
    assert "Urgent" in cfg["priorities"]

    uniq = f"{int(time.time())}-{uuid.uuid4().hex[:6]}"
    create_payload = {
        "category": "Live Class Issues",
        "priority": "High",
        "subject": f"TEST Ticket {uniq}",
        "message": "Unable to hear the class audio during replay.",
        "language": "en",
        "attachments": [{"name": "screenshot", "url": "https://example.com/file.png", "type": "image"}],
    }
    create_res = student_client.post(
        f"{API_BASE}/support/tickets", json=create_payload, timeout=30
    )
    assert create_res.status_code == 200
    ticket = create_res.json()["ticket"]
    run_state["ticket_id"] = ticket["id"]
    assert ticket["category"] == "Live Class Issues"
    assert ticket["priority"] == "High"
    assert len(ticket["attachments"]) == 1

    list_res = student_client.get(f"{API_BASE}/support/tickets", timeout=30)
    assert list_res.status_code == 200
    tickets = list_res.json()["tickets"]
    assert any(t["id"] == ticket["id"] for t in tickets)

    reply_res = student_client.post(
        f"{API_BASE}/support/tickets/{ticket['id']}/reply",
        json={"message": "Adding more context.", "status": "Waiting for Student", "rating": 4},
        timeout=30,
    )
    assert reply_res.status_code == 200
    replied = reply_res.json()["ticket"]
    assert replied["status"] == "Waiting for Student"
    assert replied["rating"] == 4
    assert len(replied["history"]) >= 2

    admin_list = admin_client.get(f"{API_BASE}/admin/support/tickets", timeout=30)
    assert admin_list.status_code == 200
    admin_tickets = admin_list.json()["tickets"]
    assert any(t["id"] == ticket["id"] for t in admin_tickets)

    admin_update = admin_client.post(
        f"{API_BASE}/admin/support/tickets/{ticket['id']}",
        json={"status": "Resolved", "internal_note": "Reviewed in regression test"},
        timeout=30,
    )
    assert admin_update.status_code == 200
    updated = admin_update.json()["ticket"]
    assert updated["status"] == "Resolved"
    assert len(updated["internal_notes"]) >= 1


def test_admin_summary_and_cross_login_persistence(admin_client, run_state):
    # Admin + persistence module: dashboard counters and data persistence after re-login
    admin_summary = admin_client.get(f"{API_BASE}/admin/summary", timeout=30)
    assert admin_summary.status_code == 200
    summary = admin_summary.json()
    assert isinstance(summary.get("support_open"), int)
    assert isinstance(summary.get("class_attendance"), int)

    relogin_session = requests.Session()
    relogin_session.headers.update({"Content-Type": "application/json"})
    login_data = _login(relogin_session, STUDENT_EMAIL, STUDENT_PASSWORD)
    relogin_session.headers.update({"Authorization": f"Bearer {login_data['token']}"})

    plan_res = relogin_session.get(f"{API_BASE}/learning-plan", timeout=30)
    assert plan_res.status_code == 200
    assert isinstance(plan_res.json()["learning_plan"]["weekly_plan"], list)

    ticket_res = relogin_session.get(f"{API_BASE}/support/tickets", timeout=30)
    assert ticket_res.status_code == 200
    if run_state.get("ticket_id"):
        assert any(t["id"] == run_state["ticket_id"] for t in ticket_res.json()["tickets"])

    if run_state.get("class_id"):
        class_res = relogin_session.get(
            f"{API_BASE}/classes/{run_state['class_id']}", timeout=30
        )
        assert class_res.status_code == 200
        assert class_res.json()["attendance"]["status"] in {"attending", "completed"}

    cert_res = relogin_session.get(f"{API_BASE}/certificates", timeout=30)
    assert cert_res.status_code == 200
    if run_state.get("certificate_id"):
        assert any(c["id"] == run_state["certificate_id"] for c in cert_res.json()["certificates"])
