from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_route import auth_router
from app.routes.s3_route import s3_router

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register Routes
app.include_router(auth_router)
app.include_router(s3_router)

@app.get("/")
async def root():
    return {"message": "Welcome to MetaQuery API"}
