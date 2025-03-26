from fastapi import APIRouter, HTTPException
import boto3
from botocore import UNSIGNED
from botocore.config import Config
from urllib.parse import urlparse

s3_router = APIRouter(prefix="/s3", tags=["S3 Storage"])

@s3_router.get("/list-public-bucket")
async def list_public_bucket(public_url: str):
    try:
        # Parse the bucket name from the public URL
        parsed_url = urlparse(public_url)
        bucket_name = parsed_url.netloc.split(".")[0]

        # Initialize S3 client with unsigned configuration
        s3 = boto3.client('s3', config=Config(signature_version=UNSIGNED))

        # Attempt to list objects in the bucket
        response = s3.list_objects_v2(Bucket=bucket_name)
        contents = response.get("Contents", [])
        return [{"Key": item["Key"]} for item in contents]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error listing public bucket: {str(e)}")
