"""Register / login / me flow."""


def test_register_login_me(client, register_payload):
    reg = client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    assert token

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": register_payload["email"],
            "password": register_payload["password"],
        },
    )
    assert login.status_code == 200, login.text
    assert login.json()["access_token"]

    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 200, me.text
    body = me.json()
    assert body["email"] == register_payload["email"]
    assert body["full_name"] == register_payload["full_name"]
    assert body["role"] == "owner"
    assert body["organization_id"]
