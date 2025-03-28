from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel
from datetime import datetime
import json
import os

session_router = APIRouter(prefix="/sessions", tags=["sessions"])

# Path to store sessions
SESSIONS_DIR = "data/sessions"
os.makedirs(SESSIONS_DIR, exist_ok=True)

class SessionData(BaseModel):
    name: str
    timestamp: str
    publicUrl: str
    currentPath: str
    currentFile: Optional[str] = None
    fileContent: Optional[Union[Dict, str]] = None
    fileType: Optional[str] = None
    isMetadataOpened: bool = False
    activeFilter: Optional[str] = None
    filteredData: Optional[List[Dict[str, Any]]] = None
    selectedItems: List[Dict[str, Any]] = []
    showSelectedPanel: bool = False
    isCodeExpanded: bool = False
    expandedLines: List[str] = []
    metadata: Dict[str, List[Dict[str, Any]]] = {
        "schema": [],
        "partition": [],
        "snapshot": []
    }

    class Config:
        arbitrary_types_allowed = True

@session_router.post("/save")
async def save_session(session: SessionData):
    try:
        # Create a unique filename using timestamp and sanitized name
        safe_name = "".join(c for c in session.name if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{safe_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(SESSIONS_DIR, filename)
        
        # Convert session data to dict and handle any non-serializable types
        session_dict = session.dict()
        
        # Save session data to file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(session_dict, f, indent=2, ensure_ascii=False)
            
        return {"message": "Session saved successfully", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save session: {str(e)}")

@session_router.get("/list")
async def list_sessions():
    try:
        sessions = []
        if not os.path.exists(SESSIONS_DIR):
            return []
            
        for filename in os.listdir(SESSIONS_DIR):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(SESSIONS_DIR, filename), 'r', encoding='utf-8') as f:
                        session_data = json.load(f)
                        sessions.append({
                            "filename": filename,
                            **session_data
                        })
                except Exception as e:
                    print(f"Error reading session file {filename}: {str(e)}")
                    continue
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list sessions: {str(e)}")

@session_router.get("/load/{filename}")
async def load_session(filename: str):
    try:
        filepath = os.path.join(SESSIONS_DIR, filename)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Session not found")
            
        with open(filepath, 'r', encoding='utf-8') as f:
            session_data = json.load(f)
            # Convert expandedLines back to a list if it's not already
            if 'expandedLines' in session_data and not isinstance(session_data['expandedLines'], list):
                session_data['expandedLines'] = list(session_data['expandedLines'])
        return session_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load session: {str(e)}")

@session_router.delete("/delete/{filename}")
async def delete_session(filename: str):
    try:
        filepath = os.path.join(SESSIONS_DIR, filename)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Session not found")
            
        os.remove(filepath)
        return {"message": "Session deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}") 