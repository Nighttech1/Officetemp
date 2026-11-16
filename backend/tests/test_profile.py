"""Profile / subject rights (152-ФЗ) — export & erase."""


def _token(client, register_payload):
    payload = {**register_payload, "consent": True}
    reg = client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201, reg.text
    return reg.json()["access_token"]


def test_profile_get_patch_export_erase(client, register_payload):
    token = _token(client, register_payload)
    headers = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/v1/profile/me", headers=headers)
    assert me.status_code == 200, me.text
    assert me.json()["email"] == register_payload["email"]
    assert me.json()["consent_at"]

    patched = client.patch(
        "/api/v1/profile/me",
        headers=headers,
        json={"full_name": "Иван Тестов", "phone": "+79991234567"},
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["full_name"] == "Иван Тестов"
    assert patched.json()["phone"] == "+79991234567"

    exported = client.get("/api/v1/profile/me/export", headers=headers)
    assert exported.status_code == 200, exported.text
    body = exported.json()
    assert body["email"] == register_payload["email"]
    assert body["phone"] == "+79991234567"
    assert body["exported_at"]

    erased = client.post("/api/v1/profile/me/erase", headers=headers)
    assert erased.status_code == 200, erased.text
    assert erased.json()["erased"] is True

    # Account deactivated — login should fail
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": register_payload["email"],
            "password": register_payload["password"],
        },
    )
    assert login.status_code == 401
