#!/usr/bin/env python3
import asyncio
import os
import sys
from pathlib import Path
import requests

sys.path.insert(0, str(Path(__file__).parent / "backend"))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from utils.auth import decode_token

load_dotenv(Path(__file__).parent / "backend" / '.env')

BASE_URL = "https://jobsift.preview.emergentagent.com/api"

async def debug_sessions():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Login to get a fresh token
    login_data = {"email": "admin@ciatos.com", "password": "admin123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data["access_token"]
        print(f"Got token: {token[:50]}...")
        
        # Check if token is in sessions table
        session = await db.user_sessions.find_one({"session_token": token})
        print(f"Session found: {session is not None}")
        
        if session:
            print(f"Session: {session}")
        
        # Try to decode token directly
        try:
            payload = decode_token(token, "access")
            print(f"Token payload: {payload}")
        except Exception as e:
            print(f"Token decode error: {e}")
        
        # Check all sessions
        all_sessions = await db.user_sessions.find({}, {"_id": 0}).to_list(100)
        print(f"All sessions ({len(all_sessions)}):")
        for sess in all_sessions:
            print(f"  - User: {sess['user_id']}, Token: {sess['session_token'][:20]}..., Expires: {sess['expires_at']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_sessions())