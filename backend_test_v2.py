#!/usr/bin/env python3
"""
Backend API Testing for Ciatos ATS User Management System - Version 2
Focused testing with fresh sessions
"""

import requests
import json
import sys

BASE_URL = "https://hiring-hub-4.preview.emergentagent.com/api"

TEST_CREDENTIALS = {
    "admin": {"email": "admin@ciatos.com", "password": "admin123"},
    "recruiter": {"email": "recrutador@ciatos.com", "password": "recruiter123"},
    "client": {"email": "cliente@techcorp.com", "password": "client123"}
}

def log_test(test_name: str, success: bool, message: str, details=None):
    """Log test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}: {message}")
    if details and not success:
        print(f"   Details: {details}")

def get_fresh_token(role: str):
    """Get a fresh token for a role"""
    credentials = TEST_CREDENTIALS[role]
    response = requests.post(f"{BASE_URL}/auth/login", json=credentials)
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_generic_signup_disabled():
    """Test that generic /signup route is disabled"""
    test_data = {
        "email": "test@example.com",
        "password": "testpass123",
        "full_name": "Test User"
    }
    
    response = requests.post(f"{BASE_URL}/auth/signup", json=test_data)
    
    if response.status_code in [404, 405]:
        log_test("Generic Signup Disabled", True, "Generic signup route properly disabled")
        return True
    else:
        log_test("Generic Signup Disabled", False, f"Expected 404/405, got {response.status_code}", response.text)
        return False

def test_candidate_signup():
    """Test candidate public signup"""
    test_data = {
        "email": "candidato.novo@example.com",
        "password": "senha123",
        "full_name": "Candidato Novo Teste",
        "phone": "+5511999999999"
    }
    
    response = requests.post(f"{BASE_URL}/auth/candidate/signup", json=test_data)
    
    if response.status_code == 200:
        data = response.json()
        required_fields = ["access_token", "refresh_token", "token_type", "user"]
        
        if all(field in data for field in required_fields):
            user_data = data["user"]
            if (user_data.get("email") == test_data["email"] and 
                user_data.get("full_name") == test_data["full_name"] and
                user_data.get("requires_password_change") == False):
                
                log_test("Candidate Signup", True, "Candidate signup successful with correct data")
                return True
            else:
                log_test("Candidate Signup", False, "User data incorrect", user_data)
                return False
        else:
            log_test("Candidate Signup", False, "Missing required fields in response", data)
            return False
    elif response.status_code == 400 and "já cadastrado" in response.text:
        log_test("Candidate Signup", True, "Email already exists validation working")
        return True
    else:
        log_test("Candidate Signup", False, f"Unexpected status {response.status_code}", response.text)
        return False

def test_login_requires_password_change():
    """Test login and verify requires_password_change field"""
    all_passed = True
    
    for role, credentials in TEST_CREDENTIALS.items():
        response = requests.post(f"{BASE_URL}/auth/login", json=credentials)
        
        if response.status_code == 200:
            data = response.json()
            user_data = data.get("user", {})
            
            if "requires_password_change" in user_data:
                log_test(f"Login {role.title()}", True, 
                        f"Login successful, requires_password_change: {user_data['requires_password_change']}")
            else:
                log_test(f"Login {role.title()}", False, 
                        "Missing requires_password_change field", user_data)
                all_passed = False
        else:
            log_test(f"Login {role.title()}", False, 
                    f"Login failed with status {response.status_code}", response.text)
            all_passed = False
    
    return all_passed

def test_admin_create_user():
    """Test admin creating new users"""
    token = get_fresh_token("admin")
    if not token:
        log_test("Admin Create User", False, "Could not get admin token")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get organizations
    orgs_response = requests.get(f"{BASE_URL}/organizations/", headers=headers)
    if orgs_response.status_code != 200:
        log_test("Admin Create User", False, "Could not fetch organizations", orgs_response.text)
        return False
    
    orgs = orgs_response.json()
    if not orgs:
        log_test("Admin Create User", False, "No organizations found")
        return False
    
    org_id = orgs[0]["id"]
    
    # Create user
    test_user_data = {
        "email": "cliente.teste.novo@testecorp.com",
        "full_name": "Cliente Teste Novo",
        "phone": "+5511888888888",
        "role": "client",
        "organization_id": org_id
    }
    
    response = requests.post(f"{BASE_URL}/auth/admin/create-user", json=test_user_data, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        
        if ("temporary_password" in data and 
            "user" in data and 
            data["user"]["email"] == test_user_data["email"]):
            
            log_test("Admin Create User", True, 
                    f"User created successfully with temp password: {data['temporary_password']}")
            return True, data["temporary_password"], test_user_data["email"]
        else:
            log_test("Admin Create User", False, "Missing required fields in response", data)
            return False, None, None
    elif response.status_code == 400 and "já cadastrado" in response.text:
        log_test("Admin Create User", True, "Email already exists validation working")
        return True, None, None
    else:
        log_test("Admin Create User", False, 
                f"Unexpected status {response.status_code}", response.text)
        return False, None, None

def test_change_password(temp_password=None, temp_email=None):
    """Test password change functionality"""
    # Test with admin (normal user - should require old password)
    token = get_fresh_token("admin")
    if token:
        headers = {"Authorization": f"Bearer {token}"}
        change_data = {
            "old_password": "admin123",
            "new_password": "newadmin123"
        }
        
        response = requests.post(f"{BASE_URL}/auth/change-password", json=change_data, headers=headers)
        
        if response.status_code == 200:
            log_test("Change Password (Normal User)", True, "Password change successful")
            
            # Change it back
            revert_data = {
                "old_password": "newadmin123",
                "new_password": "admin123"
            }
            requests.post(f"{BASE_URL}/auth/change-password", json=revert_data, headers=headers)
        else:
            log_test("Change Password (Normal User)", False, 
                    f"Password change failed: {response.status_code}", response.text)
    
    # Test with newly created user (first access - should not require old password)
    if temp_password and temp_email:
        login_data = {"email": temp_email, "password": temp_password}
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if login_response.status_code == 200:
            login_data_resp = login_response.json()
            user_info = login_data_resp.get("user", {})
            
            if user_info.get("requires_password_change") == True:
                temp_token = login_data_resp["access_token"]
                headers = {"Authorization": f"Bearer {temp_token}"}
                
                change_data = {"new_password": "novaSenha123"}
                
                change_response = requests.post(f"{BASE_URL}/auth/change-password", 
                                              json=change_data, headers=headers)
                
                if change_response.status_code == 200:
                    log_test("Change Password (First Access)", True, 
                            "First access password change successful")
                else:
                    log_test("Change Password (First Access)", False, 
                            f"First access password change failed: {change_response.status_code}", 
                            change_response.text)
            else:
                log_test("Change Password (First Access)", False, 
                        f"requires_password_change should be True, got {user_info.get('requires_password_change')}")
        else:
            log_test("Change Password (First Access)", False, 
                    f"Login with temp password failed: {login_response.status_code}")

def test_user_crud():
    """Test user CRUD operations"""
    token = get_fresh_token("admin")
    if not token:
        log_test("User CRUD", False, "Admin token not available")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test GET /users/ - List users
    response = requests.get(f"{BASE_URL}/users/", headers=headers)
    
    if response.status_code == 200:
        users = response.json()
        if isinstance(users, list):
            log_test("List Users", True, f"Retrieved {len(users)} users")
        else:
            log_test("List Users", False, "Response is not a list", users)
    else:
        log_test("List Users", False, f"Failed to list users: {response.status_code}", response.text)
    
    # Test GET /users/{id} - Get specific user
    me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if me_response.status_code == 200:
        admin_user = me_response.json()["user"]
        admin_id = admin_user["id"]
        
        user_response = requests.get(f"{BASE_URL}/users/{admin_id}", headers=headers)
        
        if user_response.status_code == 200:
            user_data = user_response.json()
            if user_data.get("id") == admin_id:
                log_test("Get User by ID", True, "User retrieved successfully")
            else:
                log_test("Get User by ID", False, "User ID mismatch", user_data)
        else:
            log_test("Get User by ID", False, f"Failed to get user: {user_response.status_code}")

def test_authorization():
    """Test authorization checks"""
    # Test admin route without token
    response = requests.get(f"{BASE_URL}/users/")
    if response.status_code == 401:
        log_test("Authorization Check (No Token)", True, "Properly rejected request without token")
    else:
        log_test("Authorization Check (No Token)", False, 
                f"Expected 401, got {response.status_code}")
    
    # Test admin route with non-admin token
    recruiter_token = get_fresh_token("recruiter")
    if recruiter_token:
        headers = {"Authorization": f"Bearer {recruiter_token}"}
        test_user_data = {
            "email": "test@unauthorized.com",
            "full_name": "Test User",
            "role": "client",
            "organization_id": "test-org-id"
        }
        
        response = requests.post(f"{BASE_URL}/auth/admin/create-user", 
                               json=test_user_data, headers=headers)
        
        if response.status_code == 403:
            log_test("Authorization Check (Non-Admin)", True, "Properly rejected non-admin request")
        else:
            log_test("Authorization Check (Non-Admin)", False, 
                    f"Expected 403, got {response.status_code}")

def main():
    """Run all tests"""
    print("🚀 Starting Backend API Tests for Ciatos ATS User Management - V2")
    print("=" * 70)
    
    results = []
    
    # Run tests
    results.append(test_generic_signup_disabled())
    results.append(test_candidate_signup())
    results.append(test_login_requires_password_change())
    
    # Admin create user test returns additional data
    admin_result = test_admin_create_user()
    if isinstance(admin_result, tuple):
        results.append(admin_result[0])
        temp_password = admin_result[1]
        temp_email = admin_result[2]
    else:
        results.append(admin_result)
        temp_password = None
        temp_email = None
    
    test_change_password(temp_password, temp_email)
    test_user_crud()
    test_authorization()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for result in results if result)
    total = len(results)
    
    print(f"Core Tests: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All core backend tests passed!")
        return True
    else:
        print("❌ Some tests failed - check output above")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)