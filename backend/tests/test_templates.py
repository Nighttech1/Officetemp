"""Tenant isolation for templates."""


def _register(client, org_name: str, email: str):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "org_name": org_name,
            "email": email,
            "password": "password123",
            "full_name": f"User {org_name}",
            "consent": True,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["access_token"]


def test_tenant_isolation_templates(client):
    token_a = _register(client, "Org A", "a@test.example")
    token_b = _register(client, "Org B", "b@test.example")

    create_a = client.post(
        "/api/v1/templates",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"name": "A Template", "storage_key": "org/a/templates/1.docx"},
    )
    assert create_a.status_code == 201, create_a.text

    create_b = client.post(
        "/api/v1/templates",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"name": "B Template", "storage_key": "org/b/templates/1.docx"},
    )
    assert create_b.status_code == 201, create_b.text

    list_a = client.get(
        "/api/v1/templates",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert list_a.status_code == 200
    names_a = {t["name"] for t in list_a.json()}
    assert names_a == {"A Template"}

    list_b = client.get(
        "/api/v1/templates",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert list_b.status_code == 200
    names_b = {t["name"] for t in list_b.json()}
    assert names_b == {"B Template"}
