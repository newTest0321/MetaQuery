from fastapi import APIRouter, HTTPException
import boto3
from botocore import UNSIGNED
from botocore.config import Config
from urllib.parse import urlparse
import json
import mimetypes
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel
from datetime import datetime
import os
import pyarrow.parquet as pq
import io

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

# 🆕 NEW: Fetch Metadata (Schema, Partitions, Snapshots)
@s3_router.get("/get-metadata")
async def get_metadata(public_url: str, file_key: str):
    try:
        parsed_url = urlparse(public_url)
        bucket_name = parsed_url.netloc.split(".")[0]

        s3 = boto3.client('s3', config=Config(signature_version=UNSIGNED))

        # Check if file is Parquet
        if file_key.endswith('.parquet'):
            # Get Parquet file
            response = s3.get_object(Bucket=bucket_name, Key=file_key)
            parquet_buffer = io.BytesIO(response["Body"].read())
            
            # Read Parquet file
            parquet_file = pq.ParquetFile(parquet_buffer)
            
            # Initialize metadata dictionary
            metadata = {}
            
            # Get basic file metadata
            metadata['num_row_groups'] = parquet_file.num_row_groups
            metadata['num_rows'] = parquet_file.metadata.num_rows
            
            # Get schema information
            schema = parquet_file.schema_arrow
            fields = []
            for field in schema:
                field_info = {
                    'name': field.name,
                    'type': str(field.type),
                    'nullable': field.nullable
                }
                fields.append(field_info)
            metadata['schema'] = fields
            
            # Get row group information
            row_groups = []
            for i in range(parquet_file.num_row_groups):
                row_group = {
                    'num_rows': parquet_file.metadata.row_group(i).num_rows,
                    'total_byte_size': parquet_file.metadata.row_group(i).total_byte_size,
                    'columns': []
                }
                
                # Get column information
                for j in range(parquet_file.metadata.row_group(i).num_columns):
                    column = parquet_file.metadata.row_group(i).column(j)
                    col_info = {
                        'path': column.path_in_schema,
                        'type': str(column.physical_type),
                        'file_offset': column.file_offset,
                        'total_compressed_size': column.total_compressed_size,
                        'total_uncompressed_size': column.total_uncompressed_size
                    }
                    
                    # Try to get statistics if available
                    try:
                        stats = column.statistics
                        if stats:
                            col_info['statistics'] = {
                                'null_count': stats.null_count,
                                'min_value': str(stats.min) if stats.has_min_max else None,
                                'max_value': str(stats.max) if stats.has_min_max else None
                            }
                    except:
                        pass
                    
                    row_group['columns'].append(col_info)
                
                row_groups.append(row_group)
            
            metadata['row_groups'] = row_groups
            return metadata
        else:
            # Handle existing JSON metadata files
            metadata_key = file_key.replace(".parquet", "_metadata.json")
            response = s3.get_object(Bucket=bucket_name, Key=metadata_key)
            metadata_content = response["Body"].read().decode("utf-8")
            return json.loads(metadata_content)

    except Exception as e:
        print(f"Error getting metadata: {str(e)}")
        return {"error": str(e)}
