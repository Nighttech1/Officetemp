"""PII must not live on the public User model."""

from sqlalchemy import inspect

from app.models.user import User


def test_pii_not_on_user_model():
    mapper = inspect(User)
    column_names = {c.key for c in mapper.columns}
    forbidden = {"email", "phone", "full_name"}
    assert forbidden.isdisjoint(column_names), (
        f"User model must not contain PII columns; found {forbidden & column_names}"
    )
