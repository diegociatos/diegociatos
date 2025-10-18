#!/usr/bin/env python3
import asyncio
import os
import sys
from pathlib import Path
import requests

sys.path.insert(0, str(Path(__file__).parent / "backend"))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / "backend" / '.env')

BASE_URL = "https://hiring-hub-4.preview.emergentagent.com/api"

async def debug_auth():
    # First login as admin
    login_data = {"email": "admin@ciatos.com", "password": "admin123"}
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Login response: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        token = data["access_token"]
        user_info = data["user"]
        print(f"User info: {user_info}")
        
        # Check user roles via API
        headers = {"Authorization": f"Bearer {token}"}
        roles_response = requests.get(f"{BASE_URL}/users/me/roles", headers=headers)
        print(f"Roles response: {roles_response.status_code}")
        if roles_response.status_code == 200:
            roles = roles_response.json()
            print(f"User roles: {roles}")
        
        # Try to access admin endpoint
        orgs_response = requests.get(f"{BASE_URL}/organizations", headers=headers)
        print(f"Organizations response: {orgs_response.status_code}")
        if orgs_response.status_code != 200:
            print(f"Organizations error: {orgs_response.text}")
        
        # Try with trailing slash
        orgs_response2 = requests.get(f"{BASE_URL}/organizations/", headers=headers)
        print(f"Organizations/ response: {orgs_response2.status_code}")
        if orgs_response2.status_code != 200:
            print(f"Organizations/ error: {orgs_response2.text}")
        else:
            print(f"Organizations/ success: {orgs_response2.json()}")
        
        # Test /auth/me endpoint
        me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"Auth/me response: {me_response.status_code}")
        if me_response.status_code != 200:
            print(f"Auth/me error: {me_response.text}")
        else:
            print(f"Auth/me success: {me_response.json()}")

if __name__ == "__main__":
    asyncio.run(debug_auth())