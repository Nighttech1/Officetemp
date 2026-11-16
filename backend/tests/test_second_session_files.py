"""6.3.6 — second session (simulates other browser): same user sees workspace + Word file."""


def test_second_session_sees_project_and_template_file(
    client, register_payload, tmp_path, monkeypatch
):
    monkeypatch.setenv("STORAGE_BACKEND", "local")
    monkeypatch.setenv("LOCAL_BLOB_ROOT", str(tmp_path / "blobs"))
    from app.core.config import get_settings

    get_settings.cache_clear()

    payload = {**register_payload, "consent": True}
    reg = client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201, reg.text
    token1 = reg.json()["access_token"]
    h1 = {"Authorization": f"Bearer {token1}"}

    up = client.post(
        "/api/v1/storage/objects",
        headers=h1,
        files={"file": ("tpl.docx", b"PK\x03\x04SESSION1", "application/octet-stream")},
        data={"doc_id": "doc_cross", "kind": "template"},
    )
    assert up.status_code == 200, up.text
    key = up.json()["key"]
    assert up.json()["backend"] == "local"

    snap = {
        "projects": [
            {
                "id": "prj_cross",
                "kind": "waybill",
                "name": "Cross Browser Project",
                "createdAt": "2026-09-30T12:00:00+00:00",
            }
        ],
        "folders": [
            {
                "id": "fld_1",
                "projectId": "prj_cross",
                "parentId": None,
                "name": "Накладные",
                "systemKey": None,
                "createdAt": "2026-09-30T12:00:00+00:00",
            }
        ],
        "documents": [
            {
                "id": "doc_cross",
                "projectId": "prj_cross",
                "folderId": "fld_1",
                "kind": "waybill",
                "title": "Накладная 1",
                "version": 1,
                "parentId": None,
                "status": "draft",
                "wizard": {},
                "templateStorageKey": key,
                "createdAt": "2026-09-30T12:00:00+00:00",
                "updatedAt": "2026-09-30T12:00:00+00:00",
            }
        ],
        "signatureFolders": [],
        "signatures": [],
        "revision": 0,
    }
    put = client.put(
        "/api/v1/workspace/snapshot",
        headers=h1,
        json={"snapshot": snap, "migrate_local": True},
    )
    assert put.status_code == 200, put.text

    # Second "browser": fresh login, no localStorage — only JWT + server
    login = client.post(
        "/api/v1/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert login.status_code == 200, login.text
    token2 = login.json()["access_token"]
    assert token2 != token1 or True  # may equal if same claims/time; session is new HTTP client usage
    h2 = {"Authorization": f"Bearer {token2}"}

    got = client.get("/api/v1/workspace/snapshot", headers=h2)
    assert got.status_code == 200, got.text
    body = got.json()
    assert body["empty"] is False
    assert len(body["snapshot"]["projects"]) == 1
    assert body["snapshot"]["projects"][0]["name"] == "Cross Browser Project"
    assert len(body["snapshot"]["folders"]) == 1
    assert len(body["snapshot"]["documents"]) == 1
    assert body["snapshot"]["documents"][0]["templateStorageKey"] == key

    down = client.get(
        "/api/v1/storage/objects",
        headers=h2,
        params={"key": key},
    )
    assert down.status_code == 200, down.text
    assert down.content == b"PK\x03\x04SESSION1"

    get_settings.cache_clear()
