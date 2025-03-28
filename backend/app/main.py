from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_route import auth_router
from app.routes.s3_route import s3_router
from app.routes.session_route import session_router


app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routes
app.include_router(auth_router)
app.include_router(s3_router)
app.include_router(session_router)

@app.get("/")
async def root():
    return {"message": "Welcome to MetaQuery API"}
