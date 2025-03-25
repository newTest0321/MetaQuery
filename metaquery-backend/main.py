from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import boto3
import os
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change "*" to ["http://localhost:3000"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AWS S3 Client Configuration
AWS_REGION = "eu-north-1"
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION,
)

# Using Bucket Path
@app.get("/list-bucket")
async def list_bucket_contents(bucket_name: str):
    try:
        response = s3.list_objects_v2(Bucket=bucket_name)
        contents = response.get("Contents", [])
        return [{"Key": item["Key"]} for item in contents]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error listing bucket: {str(e)}")

# Using Bucket Pubic URL
@app.get("/list-public-bucket")
async def list_public_bucket(public_url: str):
    try:
        parsed_url = urlparse(public_url)
        bucket_name = parsed_url.netloc.split(".")[0]  # Extract bucket name from public URL

        response = s3.list_objects_v2(Bucket=bucket_name)
        contents = response.get("Contents", [])
        return [{"Key": item["Key"]} for item in contents]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error listing public bucket: {str(e)}")
