from fastapi import APIRouter, HTTPException
import boto3
from botocore import UNSIGNED
from botocore.config import Config
from urllib.parse import urlparse
import json
import mimetypes

s3_router = APIRouter(prefix="/s3", tags=["S3 Storage"])

def parse_s3_url(public_url: str):
    """Extracts bucket name and prefix from a public S3 URL."""
    parsed_url = urlparse(public_url)
    bucket_name = parsed_url.netloc.split(".")[0]
    prefix = parsed_url.path.lstrip("/")  # Remove leading '/'
    return bucket_name, prefix

@s3_router.get("/list-public-bucket")
async def list_public_bucket(public_url: str, folder: str = ""):
    try:
        bucket_name, prefix = parse_s3_url(public_url)
        
        s3 = boto3.client('s3', config=Config(signature_version=UNSIGNED))
        
        response = s3.list_objects_v2(Bucket=bucket_name, Prefix=folder, Delimiter="/")
        
        folders = [prefix.get("Prefix") for prefix in response.get("CommonPrefixes", [])]
        files = [item["Key"] for item in response.get("Contents", [])]
        
        return {"folders": folders, "files": files}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error listing bucket contents: {str(e)}")

@s3_router.get("/get-file")
async def get_file(public_url: str, file_key: str):
    try:
        parsed_url = urlparse(public_url)
        bucket_name = parsed_url.netloc.split(".")[0]

        s3 = boto3.client('s3', config=Config(signature_version=UNSIGNED))

        # Get the object from S3
        response = s3.get_object(Bucket=bucket_name, Key=file_key)
        content = response["Body"].read()
        mime_type, _ = mimetypes.guess_type(file_key)

        if mime_type == "application/json":
            return {"file_key": file_key, "content": content.decode("utf-8"), "type": "json"}
        elif mime_type and mime_type.startswith("text"):
            return {"file_key": file_key, "content": content.decode("utf-8"), "type": "text"}
        else:
            return {"file_key": file_key, "type": "binary"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching file: {str(e)}")
