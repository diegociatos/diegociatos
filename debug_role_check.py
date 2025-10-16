#!/usr/bin/env python3
import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "backend"))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from utils.auth import get_user_roles, require_role

load_dotenv(Path(__file__).parent / "backend" / '.env')

async def debug_role_check():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Get admin user
    admin_user = await db.users.find_one({"email": "admin@ciatos.com"}, {"_id": 0})
    print(f"Admin user: {admin_user}")
    
    if admin_user:
        # Check roles
        roles = await get_user_roles(admin_user["id"])
        print(f"Admin roles: {roles}")
        
        # Test require_role function
        try:
            result = await require_role(admin_user, ["admin"])
            print(f"require_role result: {result}")
        except Exception as e:
            print(f"require_role error: {e}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_role_check())