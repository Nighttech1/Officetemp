"""Role-based access control helpers."""

from enum import Enum
from typing import Annotated, Callable

from fastapi import Depends, HTTPException, status

from app.api.deps import CurrentUser, get_current_user


class Role(str, Enum):
    owner = "owner"
    admin = "admin"
    member = "member"


def require_roles(*allowed: Role | str) -> Callable:
    """FastAPI dependency factory: allow only listed roles."""

    allowed_values = {r.value if isinstance(r, Role) else str(r) for r in allowed}

    def _checker(
        current: Annotated[CurrentUser, Depends(get_current_user)],
    ) -> CurrentUser:
        if current.role not in allowed_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current

    return _checker
