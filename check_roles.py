#!/usr/bin/env python3
import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "backend"))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / "backend" / '.env')

async def check_roles():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Checking users and roles...")
    
    # Check users
    users = await db.users.find({}, {"_id": 0}).to_list(100)
    print(f"\nUsers ({len(users)}):")
    for user in users:
        print(f"  - {user['email']} (id: {user['id']})")
    
    # Check roles
    roles = await db.user_org_roles.find({}, {"_id": 0}).to_list(100)
    print(f"\nRoles ({len(roles)}):")
    for role in roles:
        print(f"  - User {role['user_id']} -> {role['role']} in org {role['organization_id']}")
    
    # Check organizations
    orgs = await db.organizations.find({}, {"_id": 0}).to_list(100)
    print(f"\nOrganizations ({len(orgs)}):")
    for org in orgs:
        print(f"  - {org['name']} (id: {org['id']}, type: {org['org_type']})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_roles())