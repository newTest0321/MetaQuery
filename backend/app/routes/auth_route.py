from fastapi import APIRouter, HTTPException, Depends
from app.schemas.user_schema import UserSignupSchema, UserLoginSchema, UserResponseSchema
from app.models.user_model import UserModel
from app.config.database import users_collection
from app.utils.security import hash_password, verify_password
import uuid

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

# Helper function to generate a random username
def generate_username(email: str) -> str:
    return email.split("@")[0] + "_" + uuid.uuid4().hex[:6]

# Signup Route
@auth_router.post("/signup", response_model=UserResponseSchema)
async def signup(user_data: UserSignupSchema):
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user_data.password)
    username = generate_username(user_data.email)

    user = UserModel(id=str(uuid.uuid4()), email=user_data.email, password=hashed_password, username=username)
    await users_collection.insert_one(user.dict())

    return {"id": user.id, "email": user.email, "username": user.username}

# Login Route
@auth_router.post("/login", response_model=UserResponseSchema)
async def login(user_data: UserLoginSchema):
    user = await users_collection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    return {"id": user["id"], "email": user["email"], "username": user["username"]}
