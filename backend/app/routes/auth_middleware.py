from fastapi import Request, HTTPException
from fastapi.middleware.base import BaseHTTPMiddleware
from app.config.database import users_collection
from app.utils.security import decode_jwt

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow public routes without authentication
        public_routes = ["/auth/login", "/auth/signup", "/docs", "/openapi.json"]
        if request.url.path in public_routes:
            return await call_next(request)

        token = request.headers.get("Authorization")
        if not token or not token.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid token")

        token = token.split(" ")[1]  # Extract token after "Bearer"
        decoded_data = decode_jwt(token)
        if not decoded_data:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Fetch user from the database
        user = await users_collection.find_one({"id": decoded_data["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        request.state.user = user  # Attach user to request
        return await call_next(request)
