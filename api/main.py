from fastapi import FastAPI
import boto3
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware  # Add this import


# Load environment variables
load_dotenv()

# AWS S3 Configuration
S3_BUCKET = "meta-query-init"
AWS_REGION = "eu-north-1"

# Initialize S3 Client
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION,
)

# Initialize FastAPI
app = FastAPI()

app = FastAPI()

# Allow CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change "*" to ["http://localhost:3000"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# List all files in S3 bucket
@app.get("/list-files")
async def list_files():
    try:
        response = s3.list_objects_v2(Bucket=S3_BUCKET)
        files = response.get("Contents", [])
        return [{"Key": file["Key"], "Size": file["Size"]} for file in files]
    except Exception as e:
        return {"error": str(e)}

# Get metadata of a specific file
@app.get("/get-metadata/{filename}")
async def get_metadata(filename: str):
    try:
        metadata = s3.head_object(Bucket=S3_BUCKET, Key=filename)
        return {
            "ContentLength": metadata["ContentLength"],
            "ContentType": metadata["ContentType"],
            "LastModified": metadata["LastModified"].isoformat(),
        }
    except Exception as e:
        return {"error": str(e)}


# Run the server (use: uvicorn main:app --reload)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)
