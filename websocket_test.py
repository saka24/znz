import asyncio
import websockets
import json
import sys
from datetime import datetime

class WebSocketTester:
    def __init__(self, base_url="https://connect-chat-18.preview.emergentagent.com"):
        self.base_url = base_url
        self.ws_url = base_url.replace('https://', 'wss://').replace('http://', 'ws://')
        
    async def test_websocket_connection(self, user_id="test-user-123"):
        """Test WebSocket connection and messaging"""
        print(f"🔍 Testing WebSocket connection to: {self.ws_url}/ws/{user_id}")
        
        try:
            # Connect to WebSocket
            uri = f"{self.ws_url}/ws/{user_id}"
            async with websockets.connect(uri) as websocket:
                print("✅ WebSocket connection established")
                
                # Test sending a chat message
                test_message = {
                    "type": "chat_message",
                    "chat_id": "test-chat-123",
                    "sender_name": "Test User",
                    "content": "Hello, this is a test message!",
                    "message_type": "text"
                }
                
                await websocket.send(json.dumps(test_message))
                print("✅ Test message sent via WebSocket")
                
                # Test typing indicator
                typing_message = {
                    "type": "typing",
                    "chat_id": "test-chat-123",
                    "is_typing": True
                }
                
                await websocket.send(json.dumps(typing_message))
                print("✅ Typing indicator sent via WebSocket")
                
                # Wait for any responses
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    print(f"✅ Received WebSocket response: {response}")
                except asyncio.TimeoutError:
                    print("ℹ️  No WebSocket response received (timeout)")
                
                return True
                
        except websockets.exceptions.ConnectionClosed as e:
            print(f"❌ WebSocket connection closed: {e}")
            return False
        except websockets.exceptions.InvalidURI as e:
            print(f"❌ Invalid WebSocket URI: {e}")
            return False
        except Exception as e:
            print(f"❌ WebSocket connection failed: {str(e)}")
            return False

async def main():
    print("🚀 Starting WebSocket Testing")
    print("=" * 50)
    
    tester = WebSocketTester()
    success = await tester.test_websocket_connection()
    
    if success:
        print("\n✅ WebSocket testing completed successfully")
        return 0
    else:
        print("\n❌ WebSocket testing failed")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))