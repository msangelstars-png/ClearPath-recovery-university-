import os

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
STUDENT_EMAIL = "student.clearpath@example.com"
STUDENT_PASSWORD = "ClearPathStudent123!"


@pytest.fixture
def api_client() -> requests.Session:
    # HTTP client module: shared visitor session without auth
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def student_token(api_client: requests.Session) -> str:
    # Authentication module: seeded student token for authenticated access checks
    response = api_client.post(
        f"{API_BASE}/auth/login",
        json={"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD},
        timeout=30,
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert isinstance(payload.get("token"), str) and len(payload["token"]) > 10
    return payload["token"]


def test_public_preview_contains_browsable_catalog(api_client: requests.Session):
    # Public browse module: schools, catalog, professors, programs, pricing, stories visible to visitors
    response = api_client.get(f"{API_BASE}/public/preview", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data.get("schools"), list) and len(data["schools"]) > 0
    assert isinstance(data.get("courses"), list) and len(data["courses"]) > 0
    assert isinstance(data.get("professors"), list) and len(data["professors"]) > 0
    assert isinstance(data.get("programs"), list) and len(data["programs"]) > 0
    assert isinstance(data.get("sample_lessons"), list) and len(data["sample_lessons"]) > 0
    assert isinstance(data.get("pricing"), list) and len(data["pricing"]) > 0
    assert isinstance(data.get("features"), list) and len(data["features"]) > 0
    assert isinstance(data.get("success_stories"), list) and len(data["success_stories"]) > 0
    assert isinstance(data.get("programs"), list) and len(data["programs"]) > 0

    # Public preview contract module: summary only for visitor-safe catalog data
    sample_program = data["programs"][0]
    assert sample_program.get("preview_only") is True
    assert isinstance(sample_program.get("track_count"), int)
    assert "tracks" not in sample_program


@pytest.mark.parametrize(
    "endpoint",
    [
        "/dashboard",
        "/journal",
        "/classes",
        "/replays",
        "/certificates",
        "/support/tickets",
    ],
)
def test_visitor_cannot_access_protected_endpoints(api_client: requests.Session, endpoint: str):
    # Protected API module: private resources must remain blocked for anonymous visitors
    response = api_client.get(f"{API_BASE}{endpoint}", timeout=30)
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


def test_programs_listing_for_visitor_does_not_expose_full_tracks(api_client: requests.Session):
    # Program access-control module: visitor list should not expose full track/module/assignment internals
    response = api_client.get(f"{API_BASE}/programs", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data.get("programs"), list) and len(data["programs"]) > 0

    # Expectation: visitor program list should be summary-only and never include nested curriculum objects
    for program in data["programs"]:
        assert program.get("preview_only") is True
        assert isinstance(program.get("track_count"), int)
        assert "tracks" not in program
        assert "modules" not in program
        assert "assignments" not in program


def test_program_detail_for_visitor_does_not_expose_assignments(api_client: requests.Session):
    # Program detail access-control module: visitor detail should be preview-only with enrollment prompt
    preview = api_client.get(f"{API_BASE}/public/preview", timeout=30)
    assert preview.status_code == 200
    programs = preview.json().get("programs", [])
    assert len(programs) > 0
    program_id = programs[0]["id"]

    response = api_client.get(f"{API_BASE}/programs/{program_id}", timeout=30)
    assert response.status_code == 200
    payload = response.json()
    assert payload.get("submissions") == []
    assert isinstance(payload.get("enrollment_prompt"), str) and len(payload["enrollment_prompt"]) > 0

    program = payload.get("program")
    assert isinstance(program, dict)

    # Expectation: visitor detail should keep descriptive metadata only, no full tracks/modules/assignments
    assert program.get("preview_only") is True
    assert "tracks" not in program
    assert "modules" not in program
    assert "assignments" not in program


def test_programs_listing_for_authenticated_user_includes_tracks(api_client: requests.Session, student_token: str):
    # Authenticated curriculum module: signed-in users receive full program track payloads
    response = api_client.get(
        f"{API_BASE}/programs",
        headers={"Authorization": f"Bearer {student_token}"},
        timeout=30,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data.get("programs"), list) and len(data["programs"]) > 0

    sample_program = data["programs"][0]
    assert isinstance(sample_program.get("tracks"), list)
    assert len(sample_program["tracks"]) > 0
    assert "preview_only" not in sample_program


def test_program_detail_for_authenticated_user_includes_modules_and_assignments(api_client: requests.Session, student_token: str):
    # Authenticated detail module: signed-in users retain full detail payload for track/module workflows
    listing = api_client.get(
        f"{API_BASE}/programs",
        headers={"Authorization": f"Bearer {student_token}"},
        timeout=30,
    )
    assert listing.status_code == 200
    programs = listing.json().get("programs", [])
    assert len(programs) > 0
    program_id = programs[0]["id"]

    response = api_client.get(
        f"{API_BASE}/programs/{program_id}",
        headers={"Authorization": f"Bearer {student_token}"},
        timeout=30,
    )
    assert response.status_code == 200
    payload = response.json()
    program = payload.get("program")
    assert isinstance(program, dict)
    assert isinstance(program.get("tracks"), list) and len(program["tracks"]) > 0

    first_track = program["tracks"][0]
    assert isinstance(first_track.get("modules"), list) and len(first_track["modules"]) > 0
    first_module = first_track["modules"][0]
    assert isinstance(first_module.get("assignments"), list) and len(first_module["assignments"]) > 0
