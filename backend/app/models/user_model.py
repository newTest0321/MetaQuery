from pydantic import BaseModel, EmailStr
from bson import ObjectId

class UserModel(BaseModel):
    id: str  # MongoDB Object ID (string)
    email: EmailStr
    password: str
    username: str
