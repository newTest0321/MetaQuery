from fastapi import APIRouter, HTTPException
import boto3
import os
from urllib.parse import urlparse

s3_router = APIRouter(prefix="/s3", tags=["S3 Storage"])

AWS_REGION = "eu-north-1"
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION,
)

@s3_router.get("/list-bucket")
async def list_bucket_contents(bucket_name: str):
    try:
        response = s3.list_objects_v2(Bucket=bucket_name)
        contents = response.get("Contents", [])
        return [{"Key": item["Key"]} for item in contents]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error listing bucket: {str(e)}")

@s3_router.get("/list-public-bucket")
async def list_public_bucket(public_url: str):
    try:
        parsed_url = urlparse(public_url)
        bucket_name = parsed_url.netloc.split(".")[0]

        response = s3.list_objects_v2(Bucket=bucket_name)
        contents = response.get("Contents", [])
        return [{"Key": item["Key"]} for item in contents]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error listing public bucket: {str(e)}")
