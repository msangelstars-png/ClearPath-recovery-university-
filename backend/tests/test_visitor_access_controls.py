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


@pytest.fixture
def api_client() -> requests.Session:
    # HTTP client module: shared visitor session without auth
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


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

    # Expectation: visitor program list should be descriptions only (no unlocked track content)
    assert all(len(program.get("tracks", [])) == 0 for program in data["programs"])


def test_program_detail_for_visitor_does_not_expose_assignments(api_client: requests.Session):
    # Program detail access-control module: visitor detail should not expose module lessons/assignments
    preview = api_client.get(f"{API_BASE}/public/preview", timeout=30)
    assert preview.status_code == 200
    programs = preview.json().get("programs", [])
    assert len(programs) > 0
    program_id = programs[0]["id"]

    response = api_client.get(f"{API_BASE}/programs/{program_id}", timeout=30)
    assert response.status_code == 200
    payload = response.json()
    assert payload.get("submissions") == []

    program = payload.get("program")
    assert isinstance(program, dict)

    # Expectation: visitor detail should keep descriptive metadata only, no full tracks/modules/assignments
    assert len(program.get("tracks", [])) == 0
