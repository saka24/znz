from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import json
import jwt
import bcrypt
import uuid
import asyncio
import logging
from pathlib import Path
import secrets
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB setup
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# FastAPI app
app = FastAPI(title="WeChat Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key')
ALGORITHM = "HS256"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password_hash: str
    display_name: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    status: str = "offline"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    display_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chat_id: str
    sender_id: str
    sender_name: str
    content: str
    message_type: str = "text"  # text, image, voice, payment, location
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None

class Chat(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    chat_type: str = "private"  # private, group
    participants: List[str]
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_message: Optional[str] = None
    last_activity: datetime = Field(default_factory=datetime.utcnow)

class Friend(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    friend_id: str
    status: str = "pending"  # pending, accepted, blocked
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_user: str
    to_user: str
    amount: float
    description: str
    status: str = "pending"  # pending, completed, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_status: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_status[user_id] = "online"
        await self.update_user_status(user_id, "online")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        self.user_status[user_id] = "offline"
        asyncio.create_task(self.update_user_status(user_id, "offline"))

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

    async def send_to_chat(self, message: dict, chat_id: str):
        # Get chat participants
        chat = await get_chat_by_id(chat_id)
        if chat:
            for participant_id in chat.get('participants', []):
                if participant_id in self.active_connections:
                    await self.active_connections[participant_id].send_text(json.dumps(message))

    async def update_user_status(self, user_id: str, status: str):
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"status": status, "last_seen": datetime.utcnow()}}
        )

manager = ConnectionManager()

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

async def get_chat_by_id(chat_id: str) -> Optional[dict]:
    return await db.chats.find_one({"id": chat_id})

def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)

async def send_reset_email(email: str, token: str, user_name: str):
    """
    Send password reset email - Mock implementation
    In production, integrate with SendGrid, AWS SES, or similar service
    """
    try:
        # Mock email sending - replace with actual email service
        print(f"=== PASSWORD RESET EMAIL ===")
        print(f"To: {email}")
        print(f"Subject: Reset your SISI Chat password")
        print(f"")
        print(f"Hi {user_name},")
        print(f"")
        print(f"You requested to reset your password for SISI Chat.")
        print(f"Your reset token is: {token}")
        print(f"")
        print(f"Copy this token and paste it in the reset password form.")
        print(f"This token will expire in 1 hour.")
        print(f"")
        print(f"If you didn't request this, please ignore this email.")
        print(f"")
        print(f"Best regards,")
        print(f"SISI Chat Team")
        print(f"===========================")
        
        # In production, use this structure with real email service:
        """
        # Example with SendGrid
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        
        message = Mail(
            from_email='noreply@sisichat.com',
            to_emails=email,
            subject='Reset your SISI Chat password',
            html_content=f'''
            <h2>Reset your password</h2>
            <p>Hi {user_name},</p>
            <p>You requested to reset your password for SISI Chat.</p>
            <p><strong>Reset Token: {token}</strong></p>
            <p>Copy this token and paste it in the reset password form.</p>
            <p>This token will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            '''
        )
        
        sg = SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        """
        
        return True
    except Exception as e:
        logging.error(f"Failed to send reset email: {e}")
        return False

# AI Integration for message suggestions and translation
async def get_ai_suggestions(message: str, context: str = "") -> List[str]:
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"suggestions-{uuid.uuid4()}",
            system_message="Generate 3 short, helpful message suggestions based on the context. Return only the suggestions, one per line."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"Context: {context}\nMessage: {message}\nGenerate 3 helpful response suggestions:"
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        suggestions = [s.strip() for s in response.split('\n') if s.strip()][:3]
        return suggestions
    except Exception as e:
        logging.error(f"AI suggestions error: {e}")
        return ["Thanks!", "Got it", "Let me check"]

async def translate_message(message: str, target_language: str = "en") -> str:
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"translate-{uuid.uuid4()}",
            system_message=f"Translate the given text to {target_language}. Return only the translation, no extra text."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=f"Translate: {message}")
        response = await chat.send_message(user_message)
        return response.strip()
    except Exception as e:
        logging.error(f"Translation error: {e}")
        return message

# Authentication endpoints
@app.post("/api/auth/register")
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one(
        {"$or": [{"username": user_data.username}, {"email": user_data.email}]}
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        display_name=user_data.display_name,
        phone=user_data.phone
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "email": user.email
        }
    }

@app.post("/api/auth/login")
async def login_user(user_data: UserLogin):
    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "display_name": user["display_name"],
            "email": user["email"]
        }
    }

@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    # Find user by email
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If your email is registered, you will receive a reset link"}
    
    # Generate reset token
    reset_token = generate_reset_token()
    expires_at = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    
    # Store reset token in database
    await db.password_resets.insert_one({
        "user_id": user["id"],
        "email": user["email"],
        "token": reset_token,
        "expires_at": expires_at,
        "used": False,
        "created_at": datetime.utcnow()
    })
    
    # Send reset email
    email_sent = await send_reset_email(user["email"], reset_token, user["display_name"])
    
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send reset email")
    
    return {"message": "Password reset email sent successfully"}

@app.post("/api/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    # Find valid reset token
    reset_record = await db.password_resets.find_one({
        "token": request.token,
        "used": False,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Hash new password
    new_password_hash = hash_password(request.new_password)
    
    # Update user password
    await db.users.update_one(
        {"id": reset_record["user_id"]},
        {"$set": {"password_hash": new_password_hash, "updated_at": datetime.utcnow()}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"_id": reset_record["_id"]},
        {"$set": {"used": True, "used_at": datetime.utcnow()}}
    )
    
    return {"message": "Password reset successfully"}

# Chat endpoints
@app.get("/api/chats")
async def get_user_chats(current_user: str = Depends(get_current_user)):
    chats = await db.chats.find({"participants": current_user}).to_list(100)
    
    # Convert MongoDB documents to proper format
    return [
        {
            **chat,
            "_id": str(chat["_id"]) if "_id" in chat else None
        } for chat in chats
    ]

@app.post("/api/chats")
async def create_chat(chat_data: dict, current_user: str = Depends(get_current_user)):
    chat = Chat(
        name=chat_data.get("name", "New Chat"),
        chat_type=chat_data.get("chat_type", "private"),
        participants=chat_data.get("participants", [current_user]),
        created_by=current_user
    )
    
    await db.chats.insert_one(chat.dict())
    return chat.dict()

@app.get("/api/chats/{chat_id}/messages")
async def get_chat_messages(chat_id: str, current_user: str = Depends(get_current_user)):
    # Verify user is in chat
    chat = await get_chat_by_id(chat_id)
    if not chat or current_user not in chat.get("participants", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = await db.messages.find({"chat_id": chat_id}).sort("timestamp", 1).to_list(100)
    
    # Convert MongoDB documents to proper format
    return [
        {
            **message,
            "_id": str(message["_id"]) if "_id" in message else None
        } for message in messages
    ]

# AI endpoints
@app.post("/api/ai/suggestions")
async def get_message_suggestions(data: dict, current_user: str = Depends(get_current_user)):
    message = data.get("message", "")
    context = data.get("context", "")
    suggestions = await get_ai_suggestions(message, context)
    return {"suggestions": suggestions}

@app.post("/api/ai/translate")
async def translate_text(data: dict, current_user: str = Depends(get_current_user)):
    message = data.get("message", "")
    target_language = data.get("target_language", "en")
    translation = await translate_message(message, target_language)
    return {"translation": translation}

# Friends endpoints
@app.get("/api/friends")
async def get_friends(current_user: str = Depends(get_current_user)):
    friends = await db.friends.find(
        {"$or": [{"user_id": current_user}, {"friend_id": current_user}], "status": "accepted"}
    ).to_list(100)
    
    friend_ids = []
    for friend in friends:
        if friend["user_id"] == current_user:
            friend_ids.append(friend["friend_id"])
        else:
            friend_ids.append(friend["user_id"])
    
    # Get friend details
    friends_data = await db.users.find(
        {"id": {"$in": friend_ids}},
        {"password_hash": 0}
    ).to_list(100)
    
    # Convert MongoDB documents to proper format
    return [
        {
            **friend,
            "_id": str(friend["_id"]) if "_id" in friend else None
        } for friend in friends_data
    ]

@app.post("/api/friends/add")
async def add_friend(data: dict, current_user: str = Depends(get_current_user)):
    friend_username = data.get("username")
    friend_user = await db.users.find_one({"username": friend_username})
    
    if not friend_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if friend_user["id"] == current_user:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
    # Check if already friends
    existing = await db.friends.find_one({
        "$or": [
            {"user_id": current_user, "friend_id": friend_user["id"]},
            {"user_id": friend_user["id"], "friend_id": current_user}
        ]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Friend request already exists")
    
    friend_request = Friend(
        user_id=current_user,
        friend_id=friend_user["id"],
        status="accepted"  # Auto-accept for now
    )
    
    await db.friends.insert_one(friend_request.dict())
    return {"message": "Friend added successfully"}

# Payment mock endpoints
@app.post("/api/payments/request")
async def request_payment(data: dict, current_user: str = Depends(get_current_user)):
    payment = PaymentRequest(
        from_user=current_user,
        to_user=data.get("to_user"),
        amount=data.get("amount"),
        description=data.get("description", "Payment request")
    )
    
    await db.payments.insert_one(payment.dict())
    
    # Send payment request via WebSocket
    await manager.send_personal_message(
        json.dumps({
            "type": "payment_request",
            "payment": payment.dict()
        }),
        data.get("to_user")
    )
    
    return {"message": "Payment request sent", "payment": payment.dict()}

@app.get("/api/payments")
async def get_payments(current_user: str = Depends(get_current_user)):
    payments = await db.payments.find(
        {"$or": [{"from_user": current_user}, {"to_user": current_user}]}
    ).to_list(100)
    
    # Convert MongoDB documents to proper format
    return [
        {
            **payment,
            "_id": str(payment["_id"]) if "_id" in payment else None
        } for payment in payments
    ]

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "chat_message":
                # Store message
                message = Message(
                    chat_id=message_data.get("chat_id"),
                    sender_id=user_id,
                    sender_name=message_data.get("sender_name", "Unknown"),
                    content=message_data.get("content"),
                    message_type=message_data.get("message_type", "text"),
                    metadata=message_data.get("metadata")
                )
                
                await db.messages.insert_one(message.dict())
                
                # Update chat last activity
                await db.chats.update_one(
                    {"id": message.chat_id},
                    {"$set": {"last_message": message.content, "last_activity": datetime.utcnow()}}
                )
                
                # Send to all chat participants
                await manager.send_to_chat({
                    "type": "new_message",
                    "message": message.dict()
                }, message.chat_id)
                
            elif message_data.get("type") == "typing":
                # Forward typing indicator to chat participants
                await manager.send_to_chat({
                    "type": "typing",
                    "user_id": user_id,
                    "chat_id": message_data.get("chat_id"),
                    "is_typing": message_data.get("is_typing", False)
                }, message_data.get("chat_id"))
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Notification endpoints
@app.post("/api/notifications/subscribe")
async def subscribe_to_notifications(data: dict, current_user: str = Depends(get_current_user)):
    # Store push notification subscription
    subscription_data = {
        "user_id": current_user,
        "subscription": data.get("subscription"),
        "created_at": datetime.utcnow()
    }
    
    await db.push_subscriptions.update_one(
        {"user_id": current_user},
        {"$set": subscription_data},
        upsert=True
    )
    
    return {"message": "Subscription saved successfully"}

@app.get("/api/notifications")
async def get_notifications(current_user: str = Depends(get_current_user)):
    # Get user notifications
    notifications = await db.notifications.find(
        {"user_id": current_user}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return [
        {
            **notification,
            "_id": str(notification["_id"]) if "_id" in notification else None
        } for notification in notifications
    ]

@app.post("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: str = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user},
        {"$set": {"read": True, "read_at": datetime.utcnow()}}
    )
    return {"message": "Notification marked as read"}

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}