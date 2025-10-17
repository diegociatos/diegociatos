"""
Migration script to fix existing user sessions without expires_at field
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_sessions():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db = client.get_database()
    
    # Find all sessions without expires_at
    sessions_without_expires = await db.user_sessions.find(
        {"expires_at": {"$exists": False}}
    ).to_list(None)
    
    print(f"Found {len(sessions_without_expires)} sessions without expires_at")
    
    # Update each session to add expires_at
    for session in sessions_without_expires:
        created_at = session.get("created_at")
        if created_at:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)
            expires_at = created_at + timedelta(days=7)
        else:
            # If no created_at, use current time + 7 days
            expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        # Update the session
        await db.user_sessions.update_one(
            {"id": session["id"]},
            {
                "$set": {
                    "expires_at": expires_at.isoformat() if isinstance(expires_at, datetime) else expires_at,
                    "created_at": created_at.isoformat() if isinstance(created_at, datetime) else datetime.now(timezone.utc).isoformat()
                }
            }
        )
        print(f"Updated session {session['id']}")
    
    print("Migration complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_sessions())
