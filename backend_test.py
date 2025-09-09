import requests
import sys
import json
import time
from datetime import datetime

class WeChatCloneAPITester:
    def __init__(self, base_url="https://connect-chat-18.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_users = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if self.token:
            default_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            default_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success:
                try:
                    response_data = response.json()
                    details += f", Response: {json.dumps(response_data, indent=2)[:200]}..."
                    return self.log_test(name, True, details), response_data
                except:
                    return self.log_test(name, True, details), {}
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Error: {response.text[:200]}"
                return self.log_test(name, False, details), {}

        except Exception as e:
            return self.log_test(name, False, f"Exception: {str(e)}"), {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test("Health Check", "GET", "health", 200)
        return success

    def test_user_registration(self, username, email, password, display_name, phone=""):
        """Test user registration"""
        user_data = {
            "username": username,
            "email": email,
            "password": password,
            "display_name": display_name,
            "phone": phone
        }
        
        success, response = self.run_test(
            f"User Registration ({username})",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            user_info = {
                'username': username,
                'password': password,
                'token': response['access_token'],
                'user_data': response.get('user', {})
            }
            self.test_users.append(user_info)
            return True, user_info
        return False, {}

    def test_user_login(self, username, password):
        """Test user login"""
        login_data = {
            "username": username,
            "password": password
        }
        
        success, response = self.run_test(
            f"User Login ({username})",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True, response
        return False, {}

    def test_get_chats(self):
        """Test getting user chats"""
        success, response = self.run_test("Get User Chats", "GET", "chats", 200)
        return success, response

    def test_create_chat(self, participants, name="Test Chat"):
        """Test creating a new chat"""
        chat_data = {
            "name": name,
            "chat_type": "private",
            "participants": participants
        }
        
        success, response = self.run_test("Create Chat", "POST", "chats", 200, data=chat_data)
        return success, response

    def test_get_chat_messages(self, chat_id):
        """Test getting messages from a chat"""
        success, response = self.run_test(
            f"Get Chat Messages ({chat_id})",
            "GET",
            f"chats/{chat_id}/messages",
            200
        )
        return success, response

    def test_ai_suggestions(self, message="Hello, how are you?"):
        """Test AI message suggestions"""
        ai_data = {
            "message": message,
            "context": "Friendly conversation"
        }
        
        success, response = self.run_test("AI Message Suggestions", "POST", "ai/suggestions", 200, data=ai_data)
        return success, response

    def test_ai_translation(self, message="Hello, how are you?", target_language="es"):
        """Test AI message translation"""
        translate_data = {
            "message": message,
            "target_language": target_language
        }
        
        success, response = self.run_test("AI Message Translation", "POST", "ai/translate", 200, data=translate_data)
        return success, response

    def test_get_friends(self):
        """Test getting friends list"""
        success, response = self.run_test("Get Friends List", "GET", "friends", 200)
        return success, response

    def test_add_friend(self, friend_username):
        """Test adding a friend"""
        friend_data = {
            "username": friend_username
        }
        
        success, response = self.run_test(f"Add Friend ({friend_username})", "POST", "friends/add", 200, data=friend_data)
        return success, response

    def test_accept_friend_request(self, from_user_id):
        """Test accepting a friend request"""
        accept_data = {
            "userId": from_user_id,
            "from_user_id": from_user_id
        }
        
        success, response = self.run_test(f"Accept Friend Request ({from_user_id})", "POST", "friends/accept", 200, data=accept_data)
        return success, response

    def test_decline_friend_request(self, from_user_id):
        """Test declining a friend request"""
        decline_data = {
            "userId": from_user_id,
            "from_user_id": from_user_id
        }
        
        success, response = self.run_test(f"Decline Friend Request ({from_user_id})", "POST", "friends/decline", 200, data=decline_data)
        return success, response

    def test_get_notifications(self):
        """Test getting user notifications"""
        success, response = self.run_test("Get Notifications", "GET", "notifications", 200)
        return success, response

    def test_friend_request_flow(self, user1_info, user2_info):
        """Test complete friend request flow"""
        print("\n🤝 Testing Complete Friend Request Flow...")
        
        # Step 1: User1 sends friend request to User2
        print(f"   Step 1: {user1_info['username']} sends friend request to {user2_info['username']}")
        
        # Login as user1
        login_success, _ = self.test_user_login(user1_info['username'], user1_info['password'])
        if not login_success:
            return False
        
        # Send friend request
        add_success, _ = self.test_add_friend(user2_info['username'])
        if not add_success:
            return False
        
        # Step 2: Login as User2 and check notifications
        print(f"   Step 2: {user2_info['username']} checks notifications")
        
        login_success, _ = self.test_user_login(user2_info['username'], user2_info['password'])
        if not login_success:
            return False
        
        # Check notifications
        notifications_success, notifications_response = self.test_get_notifications()
        if not notifications_success:
            return False
        
        # Find friend request notification
        friend_request_notification = None
        for notification in notifications_response:
            if (notification.get('type') == 'friend_request' and 
                notification.get('data', {}).get('from_user_id') == user1_info['user_data']['id']):
                friend_request_notification = notification
                break
        
        if not friend_request_notification:
            print("   ❌ Friend request notification not found")
            return False
        
        print(f"   ✅ Friend request notification found: {friend_request_notification.get('message', '')}")
        
        # Step 3: Accept friend request
        print(f"   Step 3: {user2_info['username']} accepts friend request")
        
        accept_success, _ = self.test_accept_friend_request(user1_info['user_data']['id'])
        if not accept_success:
            return False
        
        # Step 4: Verify friends list updated
        print("   Step 4: Verifying friends list updated")
        
        friends_success, friends_response = self.test_get_friends()
        if not friends_success:
            return False
        
        # Check if user1 is now in user2's friends list
        user1_in_friends = any(
            friend.get('id') == user1_info['user_data']['id'] or 
            friend.get('username') == user1_info['username']
            for friend in friends_response
        )
        
        if user1_in_friends:
            print(f"   ✅ {user1_info['username']} successfully added to {user2_info['username']}'s friends list")
            return True
        else:
            print(f"   ❌ {user1_info['username']} not found in {user2_info['username']}'s friends list")
            return False

    def test_friend_request_decline_flow(self, user1_info, user2_info):
        """Test friend request decline flow"""
        print("\n❌ Testing Friend Request Decline Flow...")
        
        # Step 1: User1 sends friend request to User2
        print(f"   Step 1: {user1_info['username']} sends friend request to {user2_info['username']}")
        
        # Login as user1
        login_success, _ = self.test_user_login(user1_info['username'], user1_info['password'])
        if not login_success:
            return False
        
        # Send friend request
        add_success, _ = self.test_add_friend(user2_info['username'])
        if not add_success:
            return False
        
        # Step 2: Login as User2 and decline
        print(f"   Step 2: {user2_info['username']} declines friend request")
        
        login_success, _ = self.test_user_login(user2_info['username'], user2_info['password'])
        if not login_success:
            return False
        
        # Decline friend request
        decline_success, _ = self.test_decline_friend_request(user1_info['user_data']['id'])
        if not decline_success:
            return False
        
        # Step 3: Verify friends list unchanged
        print("   Step 3: Verifying friends list unchanged")
        
        friends_success, friends_response = self.test_get_friends()
        if not friends_success:
            return False
        
        # Check if user1 is NOT in user2's friends list
        user1_in_friends = any(
            friend.get('id') == user1_info['user_data']['id'] or 
            friend.get('username') == user1_info['username']
            for friend in friends_response
        )
        
        if not user1_in_friends:
            print(f"   ✅ {user1_info['username']} correctly not in {user2_info['username']}'s friends list after decline")
            return True
        else:
            print(f"   ❌ {user1_info['username']} incorrectly found in {user2_info['username']}'s friends list after decline")
            return False

    def test_invalid_friend_requests(self):
        """Test invalid friend request scenarios"""
        print("\n⚠️  Testing Invalid Friend Request Scenarios...")
        
        # Test accept with missing userId
        print("   Testing accept with missing userId...")
        success, _ = self.run_test("Accept Friend (Missing userId)", "POST", "friends/accept", 400, data={})
        if success:
            print("   ✅ Correctly rejected accept request with missing userId")
        
        # Test decline with missing userId  
        print("   Testing decline with missing userId...")
        success, _ = self.run_test("Decline Friend (Missing userId)", "POST", "friends/decline", 400, data={})
        if success:
            print("   ✅ Correctly rejected decline request with missing userId")
        
        # Test accept with invalid userId
        print("   Testing accept with invalid userId...")
        success, _ = self.run_test("Accept Friend (Invalid userId)", "POST", "friends/accept", 404, data={"userId": "invalid_user_id"})
        if success:
            print("   ✅ Correctly rejected accept request with invalid userId")
        
        # Test decline with invalid userId
        print("   Testing decline with invalid userId...")
        success, _ = self.run_test("Decline Friend (Invalid userId)", "POST", "friends/decline", 404, data={"userId": "invalid_user_id"})
        if success:
            print("   ✅ Correctly rejected decline request with invalid userId")
        
        return True

    def test_payment_request(self, to_user, amount=100.0, description="Test payment"):
        """Test sending payment request"""
        payment_data = {
            "to_user": to_user,
            "amount": amount,
            "description": description
        }
        
        success, response = self.run_test("Send Payment Request", "POST", "payments/request", 200, data=payment_data)
        return success, response

    def test_get_payments(self):
        """Test getting payments"""
        success, response = self.run_test("Get Payments", "GET", "payments", 200)
        return success, response

    def test_user_search(self, query="test"):
        """Test user search functionality"""
        success, response = self.run_test(
            f"User Search (query: {query})",
            "GET",
            f"users/search?q={query}",
            200
        )
        return success, response

    def test_friend_suggestions(self):
        """Test friend suggestions endpoint"""
        success, response = self.run_test(
            "Friend Suggestions",
            "GET",
            "friends/suggestions",
            200
        )
        return success, response

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("🚀 Starting WeChat Clone API Comprehensive Testing")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)

        # Test 1: Health Check
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False

        # Test 2: User Registration (create 2 test users)
        timestamp = datetime.now().strftime("%H%M%S")
        user1_success, user1_info = self.test_user_registration(
            f"testuser1_{timestamp}",
            f"test1_{timestamp}@example.com",
            "TestPass123!",
            f"Test User 1 {timestamp}",
            "+1234567890"
        )

        user2_success, user2_info = self.test_user_registration(
            f"testuser2_{timestamp}",
            f"test2_{timestamp}@example.com",
            "TestPass123!",
            f"Test User 2 {timestamp}",
            "+1234567891"
        )

        if not (user1_success and user2_success):
            print("❌ User registration failed - stopping tests")
            return False

        # Test 3: User Login (login as user1)
        login_success, login_response = self.test_user_login(
            user1_info['username'],
            user1_info['password']
        )

        if not login_success:
            print("❌ User login failed - stopping tests")
            return False

        # Test 4: Get Chats (should be empty initially)
        self.test_get_chats()

        # Test 5: Create Chat between the two users
        chat_success, chat_response = self.test_create_chat(
            [user1_info['user_data']['id'], user2_info['user_data']['id']],
            f"Test Chat {timestamp}"
        )

        chat_id = None
        if chat_success and 'id' in chat_response:
            chat_id = chat_response['id']

        # Test 6: Get Chat Messages (should be empty)
        if chat_id:
            self.test_get_chat_messages(chat_id)

        # Test 7: AI Features Testing
        print("\n🤖 Testing AI Integration Features...")
        
        # Test AI Suggestions
        ai_suggestions_success, suggestions_response = self.test_ai_suggestions("Hello there!")
        
        # Test AI Translation
        ai_translation_success, translation_response = self.test_ai_translation("Hello, how are you?", "es")

        # Test 8: Friends System
        print("\n👥 Testing Friends System...")
        
        # Get friends list (should be empty)
        self.test_get_friends()
        
        # Test complete friend request flow (accept)
        friend_flow_success = self.test_friend_request_flow(user1_info, user2_info)
        
        # Test friend request decline flow with new users
        user3_success, user3_info = self.test_user_registration(
            f"testuser3_{timestamp}",
            f"test3_{timestamp}@example.com",
            "TestPass123!",
            f"Test User 3 {timestamp}",
            "+1234567892"
        )
        
        if user3_success:
            decline_flow_success = self.test_friend_request_decline_flow(user1_info, user3_info)
        
        # Test invalid friend request scenarios
        self.test_invalid_friend_requests()

        # Test 9: Payment System
        print("\n💳 Testing Payment System...")
        
        # Send payment request from user1 to user2
        self.test_payment_request(user2_info['user_data']['id'], 50.0, "Test payment request")
        
        # Get payments
        self.test_get_payments()

        # Final Results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend API is working correctly.")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed. Check the issues above.")
            return False

def main():
    tester = WeChatCloneAPITester()
    success = tester.run_comprehensive_test()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())