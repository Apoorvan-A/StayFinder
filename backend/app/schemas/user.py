from pydantic import BaseModel, ConfigDict


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: str | None = None
    role: str
    is_superhost: bool = False
    bio: str | None = None
