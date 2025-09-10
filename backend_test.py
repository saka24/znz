import requests
import sys
import json
import time
from datetime import datetime

class WeChatCloneAPITester:
    def __init__(self, base_url="https://convomate-4.preview.emergentagent.com"):
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

    # News Feed API Tests
    def test_get_news(self):
        """Test getting news posts"""
        success, response = self.run_test("Get News Posts", "GET", "news", 200)
        return success, response

    def test_create_news_post(self, title="Test News Post", content="This is a test news post", category="tech"):
        """Test creating a news post"""
        news_data = {
            "title": title,
            "content": content,
            "category": category,
            "image_url": "https://example.com/test-image.jpg"
        }
        
        success, response = self.run_test("Create News Post", "POST", "news", 200, data=news_data)
        return success, response

    def test_get_comments(self, post_id):
        """Test getting comments for a news post"""
        success, response = self.run_test(
            f"Get Comments (post_id: {post_id})",
            "GET",
            f"news/{post_id}/comments",
            200
        )
        return success, response

    def test_create_comment(self, post_id, content="This is a test comment"):
        """Test creating a comment on a news post"""
        comment_data = {
            "content": content
        }
        
        success, response = self.run_test(
            f"Create Comment (post_id: {post_id})",
            "POST",
            f"news/{post_id}/comments",
            200,
            data=comment_data
        )
        return success, response

    # Marketplace API Tests
    def test_get_products(self, category=None, search=None):
        """Test getting products"""
        endpoint = "products"
        params = []
        if category:
            params.append(f"category={category}")
        if search:
            params.append(f"search={search}")
        if params:
            endpoint += "?" + "&".join(params)
        
        success, response = self.run_test("Get Products", "GET", endpoint, 200)
        return success, response

    def test_create_product(self, name="Test Product", price=99.99, category="electronics"):
        """Test creating a product listing"""
        product_data = {
            "name": name,
            "description": "This is a test product for sale",
            "price": price,
            "category": category,
            "images": ["https://example.com/product1.jpg"],
            "stock_quantity": 5,
            "condition": "new",
            "location": "Dar es Salaam, Tanzania",
            "tags": ["test", "electronics", "gadget"]
        }
        
        success, response = self.run_test("Create Product", "POST", "products", 200, data=product_data)
        return success, response

    def test_like_product(self, product_id):
        """Test liking/unliking a product"""
        success, response = self.run_test(
            f"Like Product (product_id: {product_id})",
            "POST",
            f"products/{product_id}/like",
            200
        )
        return success, response

    def test_add_to_cart(self, product_id, quantity=1):
        """Test adding product to cart"""
        cart_data = {
            "product_id": product_id,
            "quantity": quantity
        }
        
        success, response = self.run_test("Add to Cart", "POST", "cart/add", 200, data=cart_data)
        return success, response

    def test_get_cart(self):
        """Test getting user's cart"""
        success, response = self.run_test("Get Cart", "GET", "cart", 200)
        return success, response

    def test_create_order(self, product_ids, quantities=None):
        """Test creating an order"""
        if quantities is None:
            quantities = [1] * len(product_ids)
        
        order_data = {
            "product_ids": product_ids,
            "quantities": quantities,
            "shipping_address": {
                "street": "123 Test Street",
                "city": "Dar es Salaam",
                "state": "Dar es Salaam",
                "postal_code": "12345",
                "country": "Tanzania"
            },
            "payment_method": "tigo_pesa"
        }
        
        success, response = self.run_test("Create Order", "POST", "orders", 200, data=order_data)
        return success, response

    def test_get_orders(self):
        """Test getting user's orders"""
        success, response = self.run_test("Get Orders", "GET", "orders", 200)
        return success, response

    # Account Settings API Tests
    def test_get_user_profile(self):
        """Test getting user profile"""
        success, response = self.run_test("Get User Profile", "GET", "users/profile", 200)
        return success, response

    def test_update_user_profile(self, display_name="Updated Test User", phone="+255123456789"):
        """Test updating user profile"""
        profile_data = {
            "display_name": display_name,
            "phone": phone,
            "bio": "This is my updated bio",
            "location": "Dar es Salaam, Tanzania",
            "website": "https://example.com"
        }
        
        success, response = self.run_test("Update User Profile", "PUT", "users/profile", 200, data=profile_data)
        return success, response

    def test_change_password(self, current_password, new_password="NewTestPass123!"):
        """Test changing user password"""
        password_data = {
            "current_password": current_password,
            "new_password": new_password
        }
        
        success, response = self.run_test("Change Password", "POST", "users/change-password", 200, data=password_data)
        return success, response

    def test_get_privacy_settings(self):
        """Test getting privacy settings"""
        success, response = self.run_test("Get Privacy Settings", "GET", "users/privacy-settings", 200)
        return success, response

    def test_update_privacy_settings(self):
        """Test updating privacy settings"""
        privacy_data = {
            "last_seen_online": False,
            "profile_photo_visible": True,
            "phone_visible": False,
            "email_visible": False,
            "search_by_phone": True,
            "search_by_email": False,
            "read_receipts": True,
            "typing_indicators": False
        }
        
        success, response = self.run_test("Update Privacy Settings", "PUT", "users/privacy-settings", 200, data=privacy_data)
        return success, response

    def test_upload_profile_picture(self):
        """Test uploading profile picture"""
        success, response = self.run_test("Upload Profile Picture", "POST", "users/profile-picture", 200)
        return success, response

    def test_delete_account(self):
        """Test deleting user account"""
        success, response = self.run_test("Delete Account", "DELETE", "users/account", 200)
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
        
        # Test user search functionality
        print("\n🔍 Testing User Search...")
        search_success, search_response = self.test_user_search("test")
        if search_success:
            print(f"   ✅ Search returned {len(search_response)} results")
        
        # Test friend suggestions
        print("\n💡 Testing Friend Suggestions...")
        suggestions_success, suggestions_response = self.test_friend_suggestions()
        if suggestions_success:
            print(f"   ✅ Friend suggestions returned {len(suggestions_response)} suggestions")
            # Check if suggestions have required fields
            if suggestions_response:
                first_suggestion = suggestions_response[0]
                required_fields = ['id', 'username', 'display_name', 'mutual_friends']
                missing_fields = [field for field in required_fields if field not in first_suggestion]
                if not missing_fields:
                    print("   ✅ Friend suggestions have all required fields")
                else:
                    print(f"   ❌ Friend suggestions missing fields: {missing_fields}")
        
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

        # Test 9: News Feed System
        print("\n📰 Testing News Feed System...")
        
        # Get news posts (should be empty initially)
        news_success, news_response = self.test_get_news()
        if news_success:
            print(f"   ✅ Retrieved {len(news_response)} news posts")
        
        # Create a news post
        create_news_success, create_news_response = self.test_create_news_post(
            f"Breaking News {timestamp}",
            "This is a test news post created during API testing",
            "tech"
        )
        
        news_post_id = None
        if create_news_success and 'post' in create_news_response:
            news_post_id = create_news_response['post']['id']
            print(f"   ✅ Created news post with ID: {news_post_id}")
        
        # Get comments for the news post (should be empty)
        if news_post_id:
            comments_success, comments_response = self.test_get_comments(news_post_id)
            if comments_success:
                print(f"   ✅ Retrieved {len(comments_response)} comments for news post")
            
            # Create a comment on the news post
            comment_success, comment_response = self.test_create_comment(
                news_post_id,
                "This is a test comment on the news post"
            )
            if comment_success:
                print("   ✅ Successfully created comment on news post")

        # Test 10: Marketplace System
        print("\n🛒 Testing Marketplace System...")
        
        # Get products (should be empty initially)
        products_success, products_response = self.test_get_products()
        if products_success:
            print(f"   ✅ Retrieved {len(products_response)} products")
        
        # Create a product listing
        create_product_success, create_product_response = self.test_create_product(
            f"Test Smartphone {timestamp}",
            299.99,
            "electronics"
        )
        
        product_id = None
        if create_product_success and 'product' in create_product_response:
            product_id = create_product_response['product']['id']
            print(f"   ✅ Created product with ID: {product_id}")
        
        # Test product search
        search_products_success, search_products_response = self.test_get_products(search="smartphone")
        if search_products_success:
            print(f"   ✅ Product search returned {len(search_products_response)} results")
        
        # Test category filtering
        category_products_success, category_products_response = self.test_get_products(category="electronics")
        if category_products_success:
            print(f"   ✅ Category filter returned {len(category_products_response)} products")
        
        # Like the product
        if product_id:
            like_success, like_response = self.test_like_product(product_id)
            if like_success:
                print("   ✅ Successfully liked product")
            
            # Add product to cart
            cart_add_success, cart_add_response = self.test_add_to_cart(product_id, 2)
            if cart_add_success:
                print("   ✅ Successfully added product to cart")
        
        # Get cart contents
        cart_success, cart_response = self.test_get_cart()
        if cart_success:
            print(f"   ✅ Retrieved cart with {len(cart_response)} items")
        
        # Create an order
        if product_id:
            order_success, order_response = self.test_create_order([product_id], [1])
            if order_success:
                print("   ✅ Successfully created order")
        
        # Get orders
        orders_success, orders_response = self.test_get_orders()
        if orders_success:
            print(f"   ✅ Retrieved {len(orders_response)} orders")

        # Test 11: Account Settings System
        print("\n⚙️ Testing Account Settings System...")
        
        # Get user profile
        profile_success, profile_response = self.test_get_user_profile()
        if profile_success:
            print("   ✅ Successfully retrieved user profile")
        
        # Update user profile
        update_profile_success, update_profile_response = self.test_update_user_profile(
            f"Updated {user1_info['user_data']['display_name']}",
            "+255987654321"
        )
        if update_profile_success:
            print("   ✅ Successfully updated user profile")
        
        # Get privacy settings
        privacy_get_success, privacy_get_response = self.test_get_privacy_settings()
        if privacy_get_success:
            print("   ✅ Successfully retrieved privacy settings")
        
        # Update privacy settings
        privacy_update_success, privacy_update_response = self.test_update_privacy_settings()
        if privacy_update_success:
            print("   ✅ Successfully updated privacy settings")
        
        # Upload profile picture
        profile_pic_success, profile_pic_response = self.test_upload_profile_picture()
        if profile_pic_success:
            print("   ✅ Successfully uploaded profile picture")
        
        # Test password change
        password_change_success, password_change_response = self.test_change_password(
            user1_info['password'],
            "NewTestPassword123!"
        )
        if password_change_success:
            print("   ✅ Successfully changed password")
            # Update user info with new password for potential future use
            user1_info['password'] = "NewTestPassword123!"

        # Test 12: Payment System
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