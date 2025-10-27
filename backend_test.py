#!/usr/bin/env python3
"""
Backend API Testing for SlotManager - Links (Vínculos) Functionality
Tests the new Links API endpoints that were just implemented.
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BACKEND_URL = "https://casino-dashboard-6.preview.emergentagent.com/api"
TEST_EMAIL = "admin@admin.com"
TEST_PASSWORD = "admin"

# Test Data
TEST_CLIENT_ID = "18ef5fc5-39ef-4cd6-b569-458858ddf534"  # Cliente Teste
TEST_OPERATOR_ID = "6a66e43c-5066-4c41-b546-838385f83e80"  # Operador Teste

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class BackendTester:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        self.test_results = []
        self.created_link_id = None
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = f"{Colors.GREEN}✅ PASS{Colors.ENDC}" if success else f"{Colors.RED}❌ FAIL{Colors.ENDC}"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"    Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })
    
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with proper error handling"""
        url = f"{BACKEND_URL}{endpoint}"
        
        # Add auth header if token exists
        if self.token and headers is None:
            headers = {"Authorization": f"Bearer {self.token}"}
        elif self.token and headers:
            headers["Authorization"] = f"Bearer {self.token}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def test_authentication(self):
        """Test user authentication"""
        print(f"\n{Colors.BLUE}=== Testing Authentication ==={Colors.ENDC}")
        
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = self.make_request('POST', '/auth/login', login_data, headers={})
        
        if response is None:
            self.log_result("Authentication", False, "Failed to connect to backend")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                self.token = data.get('access_token')
                user_info = data.get('user', {})
                
                if self.token:
                    self.log_result("Authentication", True, 
                                  f"Login successful for {user_info.get('email', 'unknown user')}")
                    return True
                else:
                    self.log_result("Authentication", False, "No access token in response")
                    return False
            except json.JSONDecodeError:
                self.log_result("Authentication", False, "Invalid JSON response")
                return False
        else:
            self.log_result("Authentication", False, 
                          f"Login failed with status {response.status_code}: {response.text}")
            return False
    
    def test_create_link(self):
        """Test creating a new link"""
        print(f"\n{Colors.BLUE}=== Testing Create Link ==={Colors.ENDC}")
        
        if not self.token:
            self.log_result("Create Link", False, "No authentication token available")
            return False
        
        # Test creating a valid link
        link_data = {
            "client_id": TEST_CLIENT_ID,
            "operator_id": TEST_OPERATOR_ID
        }
        
        response = self.make_request('POST', '/links', link_data)
        
        if response is None:
            self.log_result("Create Link", False, "Failed to connect to backend")
            return False
        
        if response.status_code in [200, 201]:
            try:
                data = response.json()
                self.created_link_id = data.get('id')
                
                # Validate response structure
                required_fields = ['id', 'client_id', 'operator_id', 'created_at']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_result("Create Link", False, 
                                  f"Missing fields in response: {missing_fields}")
                    return False
                
                # Validate data matches request
                if data['client_id'] != TEST_CLIENT_ID or data['operator_id'] != TEST_OPERATOR_ID:
                    self.log_result("Create Link", False, 
                                  "Response data doesn't match request data")
                    return False
                
                self.log_result("Create Link", True, 
                              f"Link created successfully with ID: {self.created_link_id}")
                return True
                
            except json.JSONDecodeError:
                self.log_result("Create Link", False, "Invalid JSON response")
                return False
        else:
            self.log_result("Create Link", False, 
                          f"Failed with status {response.status_code}: {response.text}")
            return False
    
    def test_duplicate_link_prevention(self):
        """Test that duplicate links are prevented"""
        print(f"\n{Colors.BLUE}=== Testing Duplicate Link Prevention ==={Colors.ENDC}")
        
        if not self.token:
            self.log_result("Duplicate Prevention", False, "No authentication token available")
            return False
        
        # Try to create the same link again
        link_data = {
            "client_id": TEST_CLIENT_ID,
            "operator_id": TEST_OPERATOR_ID
        }
        
        response = self.make_request('POST', '/links', link_data)
        
        if response is None:
            self.log_result("Duplicate Prevention", False, "Failed to connect to backend")
            return False
        
        if response.status_code == 400:
            try:
                data = response.json()
                if "already exists" in data.get('detail', '').lower():
                    self.log_result("Duplicate Prevention", True, 
                                  "Duplicate link correctly prevented")
                    return True
                else:
                    self.log_result("Duplicate Prevention", False, 
                                  f"Wrong error message: {data.get('detail')}")
                    return False
            except json.JSONDecodeError:
                self.log_result("Duplicate Prevention", False, "Invalid JSON response")
                return False
        else:
            self.log_result("Duplicate Prevention", False, 
                          f"Expected 400 status, got {response.status_code}: {response.text}")
            return False
    
    def test_invalid_client_validation(self):
        """Test validation for non-existent client"""
        print(f"\n{Colors.BLUE}=== Testing Invalid Client Validation ==={Colors.ENDC}")
        
        if not self.token:
            self.log_result("Invalid Client Validation", False, "No authentication token available")
            return False
        
        # Try to create link with invalid client ID
        link_data = {
            "client_id": "invalid-client-id-12345",
            "operator_id": TEST_OPERATOR_ID
        }
        
        response = self.make_request('POST', '/links', link_data)
        
        if response is None:
            self.log_result("Invalid Client Validation", False, "Failed to connect to backend")
            return False
        
        if response.status_code == 404:
            try:
                data = response.json()
                if "client not found" in data.get('detail', '').lower():
                    self.log_result("Invalid Client Validation", True, 
                                  "Invalid client correctly rejected")
                    return True
                else:
                    self.log_result("Invalid Client Validation", False, 
                                  f"Wrong error message: {data.get('detail')}")
                    return False
            except json.JSONDecodeError:
                self.log_result("Invalid Client Validation", False, "Invalid JSON response")
                return False
        else:
            self.log_result("Invalid Client Validation", False, 
                          f"Expected 404 status, got {response.status_code}: {response.text}")
            return False
    
    def test_invalid_operator_validation(self):
        """Test validation for non-existent operator"""
        print(f"\n{Colors.BLUE}=== Testing Invalid Operator Validation ==={Colors.ENDC}")
        
        if not self.token:
            self.log_result("Invalid Operator Validation", False, "No authentication token available")
            return False
        
        # Try to create link with invalid operator ID
        link_data = {
            "client_id": TEST_CLIENT_ID,
            "operator_id": "invalid-operator-id-12345"
        }
        
        response = self.make_request('POST', '/links', link_data)
        
        if response is None:
            self.log_result("Invalid Operator Validation", False, "Failed to connect to backend")
            return False
        
        if response.status_code == 404:
            try:
                data = response.json()
                if "operator not found" in data.get('detail', '').lower():
                    self.log_result("Invalid Operator Validation", True, 
                                  "Invalid operator correctly rejected")
                    return True
                else:
                    self.log_result("Invalid Operator Validation", False, 
                                  f"Wrong error message: {data.get('detail')}")
                    return False
            except json.JSONDecodeError:
                self.log_result("Invalid Operator Validation", False, "Invalid JSON response")
                return False
        else:
            self.log_result("Invalid Operator Validation", False, 
                          f"Expected 404 status, got {response.status_code}: {response.text}")
            return False
    
    def test_get_all_links(self):
        """Test getting all links"""
        print(f"\n{Colors.BLUE}=== Testing Get All Links ==={Colors.ENDC}")
        
        if not self.token:
            self.log_result("Get All Links", False, "No authentication token available")
            return False
        
        response = self.make_request('GET', '/links')
        
        if response is None:
            self.log_result("Get All Links", False, "Failed to connect to backend")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_result("Get All Links", False, "Response is not an array")
                    return False
                
                # Check if our created link is in the list
                if self.created_link_id:
                    found_link = None
                    for link in data:
                        if link.get('id') == self.created_link_id:
                            found_link = link
                            break
                    
                    if found_link:
                        # Validate link structure
                        required_fields = ['id', 'client_id', 'operator_id', 'created_at']
                        missing_fields = [field for field in required_fields if field not in found_link]
                        
                        if missing_fields:
                            self.log_result("Get All Links", False, 
                                          f"Link missing fields: {missing_fields}")
                            return False
                        
                        self.log_result("Get All Links", True, 
                                      f"Retrieved {len(data)} links, including our created link")
                        return True
                    else:
                        self.log_result("Get All Links", False, 
                                      "Created link not found in response")
                        return False
                else:
                    self.log_result("Get All Links", True, 
                                  f"Retrieved {len(data)} links successfully")
                    return True
                
            except json.JSONDecodeError:
                self.log_result("Get All Links", False, "Invalid JSON response")
                return False
        else:
            self.log_result("Get All Links", False, 
                          f"Failed with status {response.status_code}: {response.text}")
            return False
    
    def test_delete_link(self):
        """Test deleting a link"""
        print(f"\n{Colors.BLUE}=== Testing Delete Link ==={Colors.ENDC}")
        
        if not self.token:
            self.log_result("Delete Link", False, "No authentication token available")
            return False
        
        if not self.created_link_id:
            self.log_result("Delete Link", False, "No link ID available for deletion")
            return False
        
        response = self.make_request('DELETE', f'/links/{self.created_link_id}')
        
        if response is None:
            self.log_result("Delete Link", False, "Failed to connect to backend")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "deleted" in data.get('message', '').lower():
                    self.log_result("Delete Link", True, 
                                  f"Link {self.created_link_id} deleted successfully")
                    return True
                else:
                    self.log_result("Delete Link", False, 
                                  f"Unexpected response message: {data.get('message')}")
                    return False
            except json.JSONDecodeError:
                self.log_result("Delete Link", False, "Invalid JSON response")
                return False
        else:
            self.log_result("Delete Link", False, 
                          f"Failed with status {response.status_code}: {response.text}")
            return False
    
    def test_delete_nonexistent_link(self):
        """Test deleting a non-existent link"""
        print(f"\n{Colors.BLUE}=== Testing Delete Non-existent Link ==={Colors.ENDC}")
        
        if not self.token:
            self.log_result("Delete Non-existent Link", False, "No authentication token available")
            return False
        
        # Try to delete a non-existent link
        fake_link_id = "non-existent-link-id-12345"
        response = self.make_request('DELETE', f'/links/{fake_link_id}')
        
        if response is None:
            self.log_result("Delete Non-existent Link", False, "Failed to connect to backend")
            return False
        
        if response.status_code == 404:
            try:
                data = response.json()
                if "not found" in data.get('detail', '').lower():
                    self.log_result("Delete Non-existent Link", True, 
                                  "Non-existent link correctly returned 404")
                    return True
                else:
                    self.log_result("Delete Non-existent Link", False, 
                                  f"Wrong error message: {data.get('detail')}")
                    return False
            except json.JSONDecodeError:
                self.log_result("Delete Non-existent Link", False, "Invalid JSON response")
                return False
        else:
            self.log_result("Delete Non-existent Link", False, 
                          f"Expected 404 status, got {response.status_code}: {response.text}")
            return False
    
    def cleanup_existing_links(self):
        """Clean up any existing test links"""
        print(f"\n{Colors.BLUE}=== Cleaning up existing test links ==={Colors.ENDC}")
        
        if not self.token:
            return
        
        # Get all existing links
        response = self.make_request('GET', '/links')
        if response and response.status_code == 200:
            links = response.json()
            
            # Delete any links with our test client/operator combination
            for link in links:
                if (link.get('client_id') == TEST_CLIENT_ID and 
                    link.get('operator_id') == TEST_OPERATOR_ID):
                    delete_response = self.make_request('DELETE', f'/links/{link["id"]}')
                    if delete_response and delete_response.status_code == 200:
                        print(f"    Deleted existing test link: {link['id']}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"{Colors.BOLD}Starting Backend API Tests for Links (Vínculos) Functionality{Colors.ENDC}")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Client ID: {TEST_CLIENT_ID}")
        print(f"Test Operator ID: {TEST_OPERATOR_ID}")
        
        # First authenticate and cleanup
        if not self.test_authentication():
            print(f"{Colors.RED}Authentication failed, cannot continue{Colors.ENDC}")
            return False
        
        self.cleanup_existing_links()
        
        # Run tests in order (skip authentication since we already did it)
        tests = [
            self.test_create_link,
            self.test_duplicate_link_prevention,
            self.test_invalid_client_validation,
            self.test_invalid_operator_validation,
            self.test_get_all_links,
            self.test_delete_link,
            self.test_delete_nonexistent_link
        ]
        
        passed = 1  # Authentication already passed
        total = len(tests) + 1  # +1 for authentication
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                self.log_result(test.__name__, False, f"Test crashed: {str(e)}")
        
        # Print summary
        print(f"\n{Colors.BOLD}=== TEST SUMMARY ==={Colors.ENDC}")
        print(f"Total Tests: {total}")
        print(f"Passed: {Colors.GREEN}{passed}{Colors.ENDC}")
        print(f"Failed: {Colors.RED}{total - passed}{Colors.ENDC}")
        
        if passed == total:
            print(f"{Colors.GREEN}🎉 All tests passed!{Colors.ENDC}")
            return True
        else:
            print(f"{Colors.RED}❌ {total - passed} test(s) failed{Colors.ENDC}")
            return False

def main():
    """Main function"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
    # Save results to file
    with open('/app/test_results_links.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'backend_url': BACKEND_URL,
            'total_tests': len(tester.test_results),
            'passed_tests': sum(1 for r in tester.test_results if r['success']),
            'all_passed': success,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())