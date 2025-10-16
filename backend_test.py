#!/usr/bin/env python3
"""
Backend API Testing for Ciatos ATS User Management System
Tests all authentication and user management endpoints
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Backend URL from frontend/.env
BASE_URL = "https://hire-genius-24.preview.emergentagent.com/api"

# Test credentials provided
TEST_CREDENTIALS = {
    "admin": {"email": "admin@ciatos.com", "password": "admin123"},
    "recruiter": {"email": "recrutador@ciatos.com", "password": "recruiter123"},
    "client": {"email": "cliente@techcorp.com", "password": "client123"}
}

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, auth_token: str = None) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{BASE_URL}{endpoint}"
        
        if headers is None:
            headers = {"Content-Type": "application/json"}
        
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise
    
    def test_generic_signup_disabled(self):
        """Test that generic /signup route is disabled"""
        test_data = {
            "email": "test@example.com",
            "password": "testpass123",
            "full_name": "Test User"
        }
        
        try:
            response = self.make_request("POST", "/auth/signup", test_data)
            
            # Should return 404 or 405 since route is disabled
            if response.status_code in [404, 405]:
                self.log_test("Generic Signup Disabled", True, "Generic signup route properly disabled")
            else:
                self.log_test("Generic Signup Disabled", False, f"Expected 404/405, got {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Generic Signup Disabled", False, f"Request failed: {str(e)}")
    
    def test_candidate_signup(self):
        """Test candidate public signup"""
        test_data = {
            "email": "candidato.teste@example.com",
            "password": "senha123",
            "full_name": "João Silva Candidato",
            "phone": "+5511999999999"
        }
        
        try:
            response = self.make_request("POST", "/auth/candidate/signup", test_data)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["access_token", "refresh_token", "token_type", "user"]
                
                if all(field in data for field in required_fields):
                    user_data = data["user"]
                    if (user_data.get("email") == test_data["email"] and 
                        user_data.get("full_name") == test_data["full_name"] and
                        user_data.get("requires_password_change") == False):
                        
                        self.tokens["candidate"] = data["access_token"]
                        self.log_test("Candidate Signup", True, "Candidate signup successful with correct data")
                    else:
                        self.log_test("Candidate Signup", False, "User data incorrect", user_data)
                else:
                    self.log_test("Candidate Signup", False, "Missing required fields in response", data)
            elif response.status_code == 400 and "já cadastrado" in response.text:
                self.log_test("Candidate Signup", True, "Email already exists validation working")
            else:
                self.log_test("Candidate Signup", False, f"Unexpected status {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Candidate Signup", False, f"Request failed: {str(e)}")
    
    def test_login_with_requires_password_change(self):
        """Test login and verify requires_password_change field"""
        for role, credentials in TEST_CREDENTIALS.items():
            try:
                response = self.make_request("POST", "/auth/login", credentials)
                
                if response.status_code == 200:
                    data = response.json()
                    user_data = data.get("user", {})
                    
                    if "requires_password_change" in user_data:
                        self.tokens[role] = data["access_token"]
                        self.log_test(f"Login {role.title()}", True, 
                                    f"Login successful, requires_password_change: {user_data['requires_password_change']}")
                    else:
                        self.log_test(f"Login {role.title()}", False, 
                                    "Missing requires_password_change field", user_data)
                else:
                    self.log_test(f"Login {role.title()}", False, 
                                f"Login failed with status {response.status_code}", response.text)
            except Exception as e:
                self.log_test(f"Login {role.title()}", False, f"Request failed: {str(e)}")
    
    def test_admin_create_user(self):
        """Test admin creating new users with temporary password"""
        if "admin" not in self.tokens:
            self.log_test("Admin Create User", False, "Admin token not available")
            return
        
        # First, get an organization ID
        try:
            orgs_response = self.make_request("GET", "/organizations/", auth_token=self.tokens["admin"])
            if orgs_response.status_code != 200:
                self.log_test("Admin Create User", False, "Could not fetch organizations", orgs_response.text)
                return
            
            orgs = orgs_response.json()
            if not orgs:
                self.log_test("Admin Create User", False, "No organizations found")
                return
            
            org_id = orgs[0]["id"]
            
        except Exception as e:
            self.log_test("Admin Create User", False, f"Failed to get organizations: {str(e)}")
            return
        
        # Test creating a client user
        test_user_data = {
            "email": "cliente.novo@testecorp.com",
            "full_name": "Cliente Novo Teste",
            "phone": "+5511888888888",
            "role": "client",
            "organization_id": org_id
        }
        
        try:
            response = self.make_request("POST", "/auth/admin/create-user", test_user_data, 
                                       auth_token=self.tokens["admin"])
            
            if response.status_code == 200:
                data = response.json()
                
                if ("temporary_password" in data and 
                    "user" in data and 
                    data["user"]["email"] == test_user_data["email"]):
                    
                    # Store temp password for later testing
                    self.temp_user = {
                        "email": test_user_data["email"],
                        "temp_password": data["temporary_password"]
                    }
                    
                    self.log_test("Admin Create User", True, 
                                f"User created successfully with temp password: {data['temporary_password']}")
                else:
                    self.log_test("Admin Create User", False, "Missing required fields in response", data)
            elif response.status_code == 400 and "já cadastrado" in response.text:
                self.log_test("Admin Create User", True, "Email already exists validation working")
            else:
                self.log_test("Admin Create User", False, 
                            f"Unexpected status {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Admin Create User", False, f"Request failed: {str(e)}")
    
    def test_change_password_flow(self):
        """Test password change functionality"""
        # Test with admin (should require old password)
        if "admin" in self.tokens:
            change_data = {
                "old_password": "admin123",
                "new_password": "newadmin123"
            }
            
            try:
                response = self.make_request("POST", "/auth/change-password", change_data,
                                           auth_token=self.tokens["admin"])
                
                if response.status_code == 200:
                    self.log_test("Change Password (Normal User)", True, "Password change successful")
                    
                    # Change it back
                    revert_data = {
                        "old_password": "newadmin123",
                        "new_password": "admin123"
                    }
                    self.make_request("POST", "/auth/change-password", revert_data,
                                    auth_token=self.tokens["admin"])
                else:
                    self.log_test("Change Password (Normal User)", False, 
                                f"Password change failed: {response.status_code}", response.text)
            except Exception as e:
                self.log_test("Change Password (Normal User)", False, f"Request failed: {str(e)}")
        
        # Test with newly created user (should not require old password)
        if hasattr(self, 'temp_user'):
            # First login with temp password
            login_data = {
                "email": self.temp_user["email"],
                "password": self.temp_user["temp_password"]
            }
            
            try:
                login_response = self.make_request("POST", "/auth/login", login_data)
                
                if login_response.status_code == 200:
                    login_data_resp = login_response.json()
                    user_info = login_data_resp.get("user", {})
                    
                    if user_info.get("requires_password_change") == True:
                        temp_token = login_data_resp["access_token"]
                        
                        # Now change password without old password
                        change_data = {
                            "new_password": "novaSenha123"
                        }
                        
                        change_response = self.make_request("POST", "/auth/change-password", change_data,
                                                          auth_token=temp_token)
                        
                        if change_response.status_code == 200:
                            self.log_test("Change Password (First Access)", True, 
                                        "First access password change successful")
                        else:
                            self.log_test("Change Password (First Access)", False, 
                                        f"First access password change failed: {change_response.status_code}", 
                                        change_response.text)
                    else:
                        self.log_test("Change Password (First Access)", False, 
                                    f"requires_password_change should be True, got {user_info.get('requires_password_change')}")
                else:
                    self.log_test("Change Password (First Access)", False, 
                                f"Login with temp password failed: {login_response.status_code}")
            except Exception as e:
                self.log_test("Change Password (First Access)", False, f"Request failed: {str(e)}")
    
    def test_user_crud_operations(self):
        """Test user CRUD operations"""
        if "admin" not in self.tokens:
            self.log_test("User CRUD", False, "Admin token not available")
            return
        
        # Test GET /users - List users
        try:
            response = self.make_request("GET", "/users", auth_token=self.tokens["admin"])
            
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list):
                    self.log_test("List Users", True, f"Retrieved {len(users)} users")
                else:
                    self.log_test("List Users", False, "Response is not a list", users)
            else:
                self.log_test("List Users", False, f"Failed to list users: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("List Users", False, f"Request failed: {str(e)}")
        
        # Test GET /users/{id} - Get specific user
        if "admin" in self.tokens:
            try:
                # Get admin user details
                me_response = self.make_request("GET", "/auth/me", auth_token=self.tokens["admin"])
                if me_response.status_code == 200:
                    admin_user = me_response.json()["user"]
                    admin_id = admin_user["id"]
                    
                    user_response = self.make_request("GET", f"/users/{admin_id}", auth_token=self.tokens["admin"])
                    
                    if user_response.status_code == 200:
                        user_data = user_response.json()
                        if user_data.get("id") == admin_id:
                            self.log_test("Get User by ID", True, "User retrieved successfully")
                        else:
                            self.log_test("Get User by ID", False, "User ID mismatch", user_data)
                    else:
                        self.log_test("Get User by ID", False, f"Failed to get user: {user_response.status_code}")
            except Exception as e:
                self.log_test("Get User by ID", False, f"Request failed: {str(e)}")
        
        # Test PATCH /users/{id} - Update user
        if hasattr(self, 'temp_user'):
            try:
                # Get the created user's ID first
                users_response = self.make_request("GET", "/users", auth_token=self.tokens["admin"])
                if users_response.status_code == 200:
                    users = users_response.json()
                    temp_user_obj = next((u for u in users if u["email"] == self.temp_user["email"]), None)
                    
                    if temp_user_obj:
                        update_data = {"full_name": "Cliente Atualizado Teste"}
                        
                        update_response = self.make_request("PATCH", f"/users/{temp_user_obj['id']}", 
                                                          update_data, auth_token=self.tokens["admin"])
                        
                        if update_response.status_code == 200:
                            self.log_test("Update User", True, "User updated successfully")
                        else:
                            self.log_test("Update User", False, 
                                        f"Failed to update user: {update_response.status_code}", update_response.text)
            except Exception as e:
                self.log_test("Update User", False, f"Request failed: {str(e)}")
        
        # Test DELETE /users/{id} - Deactivate user
        if hasattr(self, 'temp_user'):
            try:
                users_response = self.make_request("GET", "/users", auth_token=self.tokens["admin"])
                if users_response.status_code == 200:
                    users = users_response.json()
                    temp_user_obj = next((u for u in users if u["email"] == self.temp_user["email"]), None)
                    
                    if temp_user_obj:
                        delete_response = self.make_request("DELETE", f"/users/{temp_user_obj['id']}", 
                                                          auth_token=self.tokens["admin"])
                        
                        if delete_response.status_code == 200:
                            self.log_test("Deactivate User", True, "User deactivated successfully")
                        else:
                            self.log_test("Deactivate User", False, 
                                        f"Failed to deactivate user: {delete_response.status_code}", delete_response.text)
            except Exception as e:
                self.log_test("Deactivate User", False, f"Request failed: {str(e)}")
    
    def test_authorization_checks(self):
        """Test that admin routes require proper authorization"""
        # Test admin route without token
        try:
            response = self.make_request("GET", "/users")
            if response.status_code == 401:
                self.log_test("Authorization Check (No Token)", True, "Properly rejected request without token")
            else:
                self.log_test("Authorization Check (No Token)", False, 
                            f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_test("Authorization Check (No Token)", False, f"Request failed: {str(e)}")
        
        # Test admin route with non-admin token (if we have recruiter token)
        if "recruiter" in self.tokens:
            try:
                test_user_data = {
                    "email": "test@unauthorized.com",
                    "full_name": "Test User",
                    "role": "client",
                    "organization_id": "test-org-id"
                }
                
                response = self.make_request("POST", "/auth/admin/create-user", test_user_data,
                                           auth_token=self.tokens["recruiter"])
                
                if response.status_code == 403:
                    self.log_test("Authorization Check (Non-Admin)", True, "Properly rejected non-admin request")
                else:
                    self.log_test("Authorization Check (Non-Admin)", False, 
                                f"Expected 403, got {response.status_code}")
            except Exception as e:
                self.log_test("Authorization Check (Non-Admin)", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for Ciatos ATS User Management")
        print("=" * 60)
        
        # Test sequence
        self.test_generic_signup_disabled()
        self.test_candidate_signup()
        self.test_login_with_requires_password_change()
        self.test_admin_create_user()
        self.test_change_password_flow()
        self.test_user_crud_operations()
        self.test_authorization_checks()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)