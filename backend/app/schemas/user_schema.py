from pydantic import BaseModel, EmailStr

class UserSignupSchema(BaseModel):
    email: EmailStr
    password: str

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class UserResponseSchema(BaseModel):
    id: str
    email: EmailStr
    username: str
