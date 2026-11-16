"""Workspace snapshot sync + tenant isolation."""


def _auth_headers(client, payload):
    payload = {**payload, "consent": True}
    reg = client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201, reg.text
    return {"Authorization": f"Bearer {reg.json()['access_token']}"}


def test_register_requires_consent(client, register_payload):
    bad = {**register_payload, "consent": False}
    res = client.post("/api/v1/auth/register", json=bad)
    assert res.status_code == 400


def test_workspace_snapshot_roundtrip(client, register_payload):
    headers = _auth_headers(client, register_payload)

    empty = client.get("/api/v1/workspace/snapshot", headers=headers)
    assert empty.status_code == 200, empty.text
    assert empty.json()["empty"] is True

    snap = {
        "projects": [
            {
                "id": "prj_1",
                "kind": "info_sheet",
                "name": "Объект А",
                "createdAt": "2026-09-24T10:00:00+00:00",
            }
        ],
        "folders": [],
        "documents": [
            {
                "id": "doc_1",
                "projectId": "prj_1",
                "folderId": None,
                "kind": "info_sheet",
                "title": "ИУЛ-1",
                "version": 1,
                "parentId": None,
                "status": "draft",
                "wizard": {},
                "iulWizard": {
                    "step": 2,
                    "sourceFileName": "drawing.pdf",
                    "fileHash": "abc",
                    "sourcePdf": "SHOULD_BE_STRIPPED",
                },
                "createdAt": "2026-09-24T10:00:00+00:00",
                "updatedAt": "2026-09-24T10:00:00+00:00",
            }
        ],
        "signatureFolders": [],
        "signatures": [
            {
                "id": "sig_1",
                "projectId": "prj_1",
                "folderId": None,
                "surname": "Иванов",
                "storageKey": "",
                "contentType": "image/png",
                "imageDataUrl": "data:image/png;base64,aaa",
                "createdAt": "2026-09-24T10:00:00+00:00",
            }
        ],
        "revision": 0,
    }

    put = client.put(
        "/api/v1/workspace/snapshot",
        headers=headers,
        json={"snapshot": snap, "migrate_local": True},
    )
    assert put.status_code == 200, put.text
    assert put.json()["imported"] is True

    got = client.get("/api/v1/workspace/snapshot", headers=headers)
    assert got.status_code == 200
    body = got.json()
    assert body["empty"] is False
    assert len(body["snapshot"]["projects"]) == 1
    assert body["snapshot"]["projects"][0]["name"] == "Объект А"
    assert len(body["snapshot"]["documents"]) == 1
    iul = body["snapshot"]["documents"][0]["iulWizard"]
    assert "sourcePdf" not in iul
    assert iul["sourceFileName"] == "drawing.pdf"
    assert body["snapshot"]["signatures"][0]["surname"] == "Иванов"


def test_workspace_isolation_between_orgs(client, register_payload):
    h1 = _auth_headers(client, register_payload)
    snap = {
        "projects": [
            {
                "id": "prj_secret",
                "kind": "info_sheet",
                "name": "Secret Org1",
                "createdAt": "2026-09-24T10:00:00+00:00",
            }
        ],
        "folders": [],
        "documents": [],
        "signatureFolders": [],
        "signatures": [],
        "revision": 0,
    }
    assert (
        client.put(
            "/api/v1/workspace/snapshot",
            headers=h1,
            json={"snapshot": snap, "migrate_local": True},
        ).status_code
        == 200
    )

    other = {
        "org_name": "Other Co",
        "email": "other@example.com",
        "password": "password123",
        "full_name": "Other Owner",
        "consent": True,
    }
    h2 = _auth_headers(client, other)
    got = client.get("/api/v1/workspace/snapshot", headers=h2)
    assert got.status_code == 200
    assert got.json()["empty"] is True
    assert got.json()["snapshot"]["projects"] == []


def test_migrate_local_conflict_when_not_empty(client, register_payload):
    headers = _auth_headers(client, register_payload)
    snap = {
        "projects": [
            {
                "id": "prj_1",
                "kind": "waybill",
                "name": "P",
                "createdAt": "2026-09-24T10:00:00+00:00",
            }
        ],
        "folders": [],
        "documents": [],
        "signatureFolders": [],
        "signatures": [],
        "revision": 0,
    }
    assert (
        client.put(
            "/api/v1/workspace/snapshot",
            headers=headers,
            json={"snapshot": snap, "migrate_local": True},
        ).status_code
        == 200
    )
    again = client.put(
        "/api/v1/workspace/snapshot",
        headers=headers,
        json={"snapshot": snap, "migrate_local": True},
    )
    assert again.status_code == 409


def test_workspace_revision_conflict(client, register_payload):
    headers = _auth_headers(client, register_payload)
    snap = {
        "projects": [
            {
                "id": "prj_1",
                "kind": "waybill",
                "name": "P",
                "createdAt": "2026-09-24T10:00:00+00:00",
            }
        ],
        "folders": [],
        "documents": [
            {
                "id": "doc_1",
                "projectId": "prj_1",
                "folderId": None,
                "kind": "waybill",
                "title": "Накладная",
                "version": 1,
                "parentId": None,
                "status": "draft",
                "wizard": {},
                "templateStorageKey": "org/x/docs/doc_1/template/a.docx",
                "createdAt": "2026-09-24T10:00:00+00:00",
                "updatedAt": "2026-09-24T10:00:00+00:00",
            }
        ],
        "signatureFolders": [],
        "signatures": [],
        "revision": 0,
    }
    first = client.put(
        "/api/v1/workspace/snapshot",
        headers=headers,
        json={"snapshot": snap, "migrate_local": True},
    )
    assert first.status_code == 200, first.text
    server_rev = first.json()["server_revision"]
    assert server_rev > 0

    got = client.get("/api/v1/workspace/snapshot", headers=headers)
    assert got.json()["snapshot"]["documents"][0]["templateStorageKey"]

    conflict = client.put(
        "/api/v1/workspace/snapshot",
        headers=headers,
        json={
            "snapshot": snap,
            "migrate_local": False,
            "expected_revision": server_rev - 1 if server_rev > 1 else 1,
        },
    )
    # Wrong expected → 409 (unless lucky match with -1 edge; force mismatch)
    if conflict.status_code != 409:
        conflict = client.put(
            "/api/v1/workspace/snapshot",
            headers=headers,
            json={
                "snapshot": snap,
                "migrate_local": False,
                "expected_revision": 999999999,
            },
        )
    assert conflict.status_code == 409

    ok = client.put(
        "/api/v1/workspace/snapshot",
        headers=headers,
        json={
            "snapshot": snap,
            "migrate_local": False,
            "expected_revision": server_rev,
        },
    )
    assert ok.status_code == 200, ok.text
