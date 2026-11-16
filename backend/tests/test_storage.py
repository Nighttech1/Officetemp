"""Local disk storage (prod-default) + org isolation for blobs."""

from unittest.mock import MagicMock, patch


def test_presign_upload_local_mode(client, register_payload, monkeypatch):
    monkeypatch.setenv("STORAGE_BACKEND", "local")
    from app.core.config import get_settings

    get_settings.cache_clear()

    reg = client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]

    response = client.post(
        "/api/v1/storage/presign-upload",
        headers={"Authorization": f"Bearer {token}"},
        json={"filename": "contract.docx"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["key"].startswith("org/")
    assert body["mode"] == "local"
    assert body["expires_in"] == 0

    get_settings.cache_clear()


def test_presign_upload_s3_mocked(client, register_payload, monkeypatch):
    monkeypatch.setenv("STORAGE_BACKEND", "s3")
    from app.core.config import get_settings

    get_settings.cache_clear()

    reg = client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]

    mock_client = MagicMock()
    mock_client.head_bucket.return_value = {}
    mock_client.generate_presigned_url.return_value = (
        "http://localhost:9000/test-bucket/presigned-put"
    )

    with patch("app.services.s3_storage.boto3.client", return_value=mock_client):
        response = client.post(
            "/api/v1/storage/presign-upload",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "filename": "contract.docx",
                "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            },
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["url"] == "http://localhost:9000/test-bucket/presigned-put"
    assert "/templates/" in body["key"]
    mock_client.generate_presigned_url.assert_called_once()
    get_settings.cache_clear()


def test_upload_download_local_disk(client, register_payload, tmp_path, monkeypatch):
    monkeypatch.setenv("STORAGE_BACKEND", "local")
    monkeypatch.setenv("LOCAL_BLOB_ROOT", str(tmp_path / "blobs"))
    from app.core.config import get_settings

    get_settings.cache_clear()

    reg = client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    up = client.post(
        "/api/v1/storage/objects",
        headers=headers,
        files={"file": ("t.docx", b"PK\x03\x04fake", "application/octet-stream")},
        data={"doc_id": "doc_1", "kind": "template"},
    )
    assert up.status_code == 200, up.text
    key = up.json()["key"]
    assert up.json()["backend"] == "local"
    assert f"org/" in key

    down = client.get(
        "/api/v1/storage/objects",
        headers=headers,
        params={"key": key},
    )
    assert down.status_code == 200
    assert down.content == b"PK\x03\x04fake"
    get_settings.cache_clear()


def test_storage_and_workspace_isolated_between_orgs(
    client, register_payload, tmp_path, monkeypatch
):
    monkeypatch.setenv("STORAGE_BACKEND", "local")
    monkeypatch.setenv("LOCAL_BLOB_ROOT", str(tmp_path / "blobs"))
    from app.core.config import get_settings

    get_settings.cache_clear()

    a = {**register_payload, "consent": True}
    reg_a = client.post("/api/v1/auth/register", json=a)
    assert reg_a.status_code == 201, reg_a.text
    tok_a = reg_a.json()["access_token"]
    h_a = {"Authorization": f"Bearer {tok_a}"}

    up = client.post(
        "/api/v1/storage/objects",
        headers=h_a,
        files={"file": ("secret.docx", b"SECRET-A", "application/octet-stream")},
        data={"doc_id": "doc_a", "kind": "template"},
    )
    assert up.status_code == 200, up.text
    key_a = up.json()["key"]

    snap = {
        "projects": [
            {
                "id": "prj_a",
                "kind": "waybill",
                "name": "Only A",
                "createdAt": "2026-09-30T10:00:00+00:00",
            }
        ],
        "folders": [],
        "documents": [
            {
                "id": "doc_a",
                "projectId": "prj_a",
                "folderId": None,
                "kind": "waybill",
                "title": "Secret doc",
                "version": 1,
                "parentId": None,
                "status": "draft",
                "wizard": {},
                "templateStorageKey": key_a,
                "createdAt": "2026-09-30T10:00:00+00:00",
                "updatedAt": "2026-09-30T10:00:00+00:00",
            }
        ],
        "signatureFolders": [],
        "signatures": [],
        "revision": 0,
    }
    put = client.put(
        "/api/v1/workspace/snapshot",
        headers=h_a,
        json={"snapshot": snap, "migrate_local": True},
    )
    assert put.status_code == 200, put.text

    b = {
        "org_name": "Org B",
        "email": "b-iso@example.com",
        "password": "password123",
        "full_name": "User B",
        "consent": True,
    }
    reg_b = client.post("/api/v1/auth/register", json=b)
    assert reg_b.status_code == 201, reg_b.text
    tok_b = reg_b.json()["access_token"]
    h_b = {"Authorization": f"Bearer {tok_b}"}

    # Org B must not read Org A file
    forbidden = client.get(
        "/api/v1/storage/objects",
        headers=h_b,
        params={"key": key_a},
    )
    assert forbidden.status_code == 403

    # Org B workspace empty / no A's project
    snap_b = client.get("/api/v1/workspace/snapshot", headers=h_b)
    assert snap_b.status_code == 200
    assert snap_b.json()["empty"] is True
    assert snap_b.json()["snapshot"]["projects"] == []

    get_settings.cache_clear()
