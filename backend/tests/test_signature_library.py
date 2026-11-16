"""Global signature library — one shared set for every account."""


def _auth_headers(client, payload):
    payload = {**payload, "consent": True}
    reg = client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201, reg.text
    return {"Authorization": f"Bearer {reg.json()['access_token']}"}


def _library(entries=None, folders=None):
    return {
        "folders": folders or [],
        "entries": entries or [],
        "revision": 0,
    }


def test_signature_library_roundtrip(client, register_payload):
    headers = _auth_headers(client, register_payload)

    empty = client.get("/api/v1/signatures/library", headers=headers)
    assert empty.status_code == 200, empty.text
    assert empty.json()["empty"] is True

    lib = _library(
        folders=[
            {
                "id": "f1",
                "parentId": None,
                "name": "Отдел",
                "createdAt": "2026-10-28T10:00:00+00:00",
            }
        ],
        entries=[
            {
                "id": "sig1",
                "folderId": "f1",
                "surname": "Зеленцов",
                "imageDataUrl": "data:image/png;base64,aaa",
                "createdAt": "2026-10-28T10:00:00+00:00",
            }
        ],
    )
    put = client.put(
        "/api/v1/signatures/library",
        headers=headers,
        json={"library": lib, "migrate_local": True},
    )
    assert put.status_code == 200, put.text
    assert put.json()["imported"] is True

    got = client.get("/api/v1/signatures/library", headers=headers)
    body = got.json()
    assert body["empty"] is False
    assert body["library"]["entries"][0]["surname"] == "Зеленцов"
    assert body["library"]["entries"][0]["folderId"] == "f1"
    assert body["library"]["folders"][0]["name"] == "Отдел"


def test_signature_library_shared_across_accounts(client, register_payload):
    """Главное: разные аккаунты видят ОДНУ и ту же библиотеку (не изоляция)."""
    h1 = _auth_headers(client, register_payload)
    lib = _library(
        entries=[
            {
                "id": "sig_shared",
                "folderId": None,
                "surname": "Иванов",
                "imageDataUrl": "data:image/png;base64,bbb",
                "createdAt": "2026-10-28T10:00:00+00:00",
            }
        ]
    )
    assert (
        client.put(
            "/api/v1/signatures/library",
            headers=h1,
            json={"library": lib, "migrate_local": True},
        ).status_code
        == 200
    )

    other = {
        "org_name": "Other Co",
        "email": "other-sig@example.com",
        "password": "password123",
        "full_name": "Other Owner",
        "consent": True,
    }
    h2 = _auth_headers(client, other)
    got = client.get("/api/v1/signatures/library", headers=h2)
    assert got.status_code == 200
    body = got.json()
    assert body["empty"] is False
    assert body["library"]["entries"][0]["surname"] == "Иванов"


def test_signature_library_migrate_conflict_when_not_empty(client, register_payload):
    headers = _auth_headers(client, register_payload)
    lib = _library(
        entries=[
            {
                "id": "s1",
                "folderId": None,
                "surname": "Петров",
                "imageDataUrl": "data:image/png;base64,ccc",
                "createdAt": "2026-10-28T10:00:00+00:00",
            }
        ]
    )
    assert (
        client.put(
            "/api/v1/signatures/library",
            headers=headers,
            json={"library": lib, "migrate_local": True},
        ).status_code
        == 200
    )
    # second migrate_local must be refused (library already has data)
    second = client.put(
        "/api/v1/signatures/library",
        headers=headers,
        json={"library": lib, "migrate_local": True},
    )
    assert second.status_code == 409


def test_signature_library_requires_auth(client):
    assert client.get("/api/v1/signatures/library").status_code == 401
