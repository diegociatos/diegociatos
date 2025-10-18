#!/usr/bin/env python3
import requests
import json

BASE_URL = "https://hiring-hub-4.preview.emergentagent.com/api"

def test_admin_endpoint():
    # Login as admin
    login_data = {"email": "admin@ciatos.com", "password": "admin123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data["access_token"]
        print(f"✅ Login successful")
        
        # Test /auth/me first
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"Auth/me: {me_response.status_code}")
        
        # Test /users/me/roles
        roles_response = requests.get(f"{BASE_URL}/users/me/roles", headers=headers)
        print(f"My roles: {roles_response.status_code}")
        if roles_response.status_code == 200:
            roles = roles_response.json()
            print(f"Roles: {roles}")
        
        # Test organizations endpoint
        orgs_response = requests.get(f"{BASE_URL}/organizations/", headers=headers)
        print(f"Organizations: {orgs_response.status_code}")
        
        if orgs_response.status_code == 200:
            orgs = orgs_response.json()
            if orgs:
                org_id = orgs[0]["id"]
                print(f"Using org_id: {org_id}")
                
                # Test admin create user
                user_data = {
                    "email": "teste.admin@example.com",
                    "full_name": "Teste Admin User",
                    "role": "client",
                    "organization_id": org_id
                }
                
                create_response = requests.post(f"{BASE_URL}/auth/admin/create-user", 
                                              json=user_data, headers=headers)
                print(f"Create user: {create_response.status_code}")
                if create_response.status_code != 200:
                    print(f"Error: {create_response.text}")
                else:
                    print(f"Success: {create_response.json()}")
        else:
            print(f"Organizations error: {orgs_response.text}")
    else:
        print(f"Login failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_admin_endpoint()