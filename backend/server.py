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
# Email imports commented out for now - using mock email functionality
# import smtplib
# from email.mime.text import MimeText
# from email.mime.multipart import MimeMultipart

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

class NewsPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_id: str
    author_name: str
    title: str
    content: str
    image_url: Optional[str] = None
    category: str = "general"  # general, tech, sports, entertainment, etc.
    likes: List[str] = []  # user IDs who liked
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    author_id: str
    author_name: str
    content: str
    likes: List[str] = []  # user IDs who liked
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CreateNewsPost(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    category: str = "general"

class CreateComment(BaseModel):
    content: str

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    seller_name: str
    name: str
    description: str
    price: float
    currency: str = "TZS"  # Tanzanian Shilling
    category: str
    images: List[str] = []  # Image URLs
    stock_quantity: int = 1
    condition: str = "new"  # new, used, refurbished
    location: str
    is_active: bool = True
    tags: List[str] = []
    views: int = 0
    likes: List[str] = []  # user IDs who liked
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CreateProduct(BaseModel):
    name: str
    description: str
    price: float
    category: str
    images: List[str] = []
    stock_quantity: int = 1
    condition: str = "new"
    location: str
    tags: List[str] = []

class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    quantity: int = 1
    added_at: datetime = Field(default_factory=datetime.utcnow)

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    buyer_name: str
    seller_id: str
    seller_name: str
    products: List[dict]  # Product details with quantities
    total_amount: float
    currency: str = "TZS"
    status: str = "pending"  # pending, paid, shipped, delivered, cancelled
    payment_method: str = "tigo_pesa"
    payment_reference: Optional[str] = None
    shipping_address: dict
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CreateOrder(BaseModel):
    product_ids: List[str]
    quantities: List[int]
    shipping_address: dict
    payment_method: str = "tigo_pesa"

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    payer_id: str
    payee_id: str
    amount: float
    currency: str = "TZS"
    payment_method: str
    status: str = "pending"  # pending, completed, failed, refunded
    reference: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

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

# User search endpoint
@app.get("/api/users/search")
async def search_users(q: str, current_user: str = Depends(get_current_user)):
    if len(q) < 2:
        return []
    
    # Search for users by username or display name
    users = await db.users.find({
        "$and": [
            {"id": {"$ne": current_user}},  # Exclude current user
            {
                "$or": [
                    {"username": {"$regex": q, "$options": "i"}},
                    {"display_name": {"$regex": q, "$options": "i"}}
                ]
            }
        ]
    }, {
        "password_hash": 0  # Exclude password hash
    }).limit(10).to_list(10)
    
    # Convert MongoDB documents to proper format
    search_results = []
    for user in users:
        # Check if already friends
        existing_friendship = await db.friends.find_one({
            "$or": [
                {"user_id": current_user, "friend_id": user["id"]},
                {"user_id": user["id"], "friend_id": current_user}
            ]
        })
        
        search_results.append({
            **user,
            "_id": str(user["_id"]) if "_id" in user else None,
            "mutual_friends": 0,  # Could calculate this later
            "is_friend": existing_friendship is not None,
            "friend_status": existing_friendship["status"] if existing_friendship else None
        })
    
    return search_results

# Friend suggestions endpoint
@app.get("/api/friends/suggestions")
async def get_friend_suggestions(current_user: str = Depends(get_current_user)):
    # Get current user's friends
    current_friends = await db.friends.find({
        "$or": [
            {"user_id": current_user, "status": "accepted"},
            {"friend_id": current_user, "status": "accepted"}
        ]
    }).to_list(100)
    
    friend_ids = set()
    for friendship in current_friends:
        if friendship["user_id"] == current_user:
            friend_ids.add(friendship["friend_id"])
        else:
            friend_ids.add(friendship["user_id"])
    
    # Find users who are not already friends
    all_users = await db.users.find({
        "id": {"$ne": current_user}
    }, {
        "password_hash": 0
    }).to_list(100)
    
    suggestions = []
    for user in all_users:
        if user["id"] not in friend_ids:
            # Check if there's a pending friend request
            pending_request = await db.friends.find_one({
                "$or": [
                    {"user_id": current_user, "friend_id": user["id"], "status": "pending"},
                    {"user_id": user["id"], "friend_id": current_user, "status": "pending"}
                ]
            })
            
            if not pending_request:
                # Calculate mutual friends
                user_friends = await db.friends.find({
                    "$or": [
                        {"user_id": user["id"], "status": "accepted"},
                        {"friend_id": user["id"], "status": "accepted"}
                    ]
                }).to_list(100)
                
                user_friend_ids = set()
                for friendship in user_friends:
                    if friendship["user_id"] == user["id"]:
                        user_friend_ids.add(friendship["friend_id"])
                    else:
                        user_friend_ids.add(friendship["user_id"])
                
                mutual_friends = len(friend_ids.intersection(user_friend_ids))
                
                suggestions.append({
                    **user,
                    "_id": str(user["_id"]) if "_id" in user else None,
                    "mutual_friends": mutual_friends,
                    "status": "online" if user.get("status") == "online" else "offline",
                    "suggestion_reason": "mutual_friends" if mutual_friends > 0 else "new_user"
                })
    
    # Sort by mutual friends count (descending) and take top 10
    suggestions.sort(key=lambda x: x["mutual_friends"], reverse=True)
    return suggestions[:10]

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
        status="pending"  # Send as pending request
    )
    
    await db.friends.insert_one(friend_request.dict())
    
    # Get current user details once
    current_user_data = await db.users.find_one({'id': current_user})
    
    # Create notification for the target user
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": friend_user["id"],
        "type": "friend_request",
        "title": "New Friend Request",
        "message": f"{current_user_data['display_name']} wants to be your friend",
        "read": False,
        "created_at": datetime.utcnow(),
        "data": {
            "from_user_id": current_user,
            "from_username": current_user_data['username'],
            "from_display_name": current_user_data['display_name']
        }
    }
    
    await db.notifications.insert_one(notification)
    
    # Send real-time notification via WebSocket
    notification_for_ws = {
        **notification,
        "created_at": notification["created_at"].isoformat(),
        "_id": str(notification.get("_id", ""))
    }
    await manager.send_personal_message(
        json.dumps({
            "type": "notification",
            "notification": notification_for_ws
        }),
        friend_user["id"]
    )
    
    return {"message": "Friend request sent successfully"}

@app.post("/api/friends/accept")
async def accept_friend_request(data: dict, current_user: str = Depends(get_current_user)):
    from_user_id = data.get("userId") or data.get("from_user_id")
    
    if not from_user_id:
        raise HTTPException(status_code=400, detail="Missing user ID")
    
    # Find the pending friend request
    friend_request = await db.friends.find_one({
        "user_id": from_user_id,
        "friend_id": current_user,
        "status": "pending"
    })
    
    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Update friend request status to accepted
    await db.friends.update_one(
        {"_id": friend_request["_id"]},
        {"$set": {"status": "accepted", "accepted_at": datetime.utcnow()}}
    )
    
    # Remove the notification
    await db.notifications.delete_many({
        "user_id": current_user,
        "type": "friend_request",
        "data.from_user_id": from_user_id
    })
    
    return {"message": "Friend request accepted successfully"}

@app.post("/api/friends/decline")
async def decline_friend_request(data: dict, current_user: str = Depends(get_current_user)):
    from_user_id = data.get("userId") or data.get("from_user_id")
    
    if not from_user_id:
        raise HTTPException(status_code=400, detail="Missing user ID")
    
    # Find and delete the pending friend request
    result = await db.friends.delete_one({
        "user_id": from_user_id,
        "friend_id": current_user,
        "status": "pending"
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Remove the notification
    await db.notifications.delete_many({
        "user_id": current_user,
        "type": "friend_request",
        "data.from_user_id": from_user_id
    })
    
    return {"message": "Friend request declined successfully"}

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
    payment_dict = payment.dict()
    payment_dict["created_at"] = payment_dict["created_at"].isoformat()
    await manager.send_personal_message(
        json.dumps({
            "type": "payment_request",
            "payment": payment_dict
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
                message_dict = message.dict()
                message_dict["timestamp"] = message_dict["timestamp"].isoformat()
                await manager.send_to_chat({
                    "type": "new_message",
                    "message": message_dict
                }, message.chat_id)
                
            elif message_data.get("type") == "typing":
                # Forward typing indicator to chat participants
                await manager.send_to_chat({
                    "type": "typing",
                    "user_id": user_id,
                    "chat_id": message_data.get("chat_id"),
                    "is_typing": message_data.get("is_typing", False)
                }, message_data.get("chat_id"))
                
            elif message_data.get("type") == "refresh_notifications":
                # Refresh notifications for the user
                notifications = await db.notifications.find(
                    {"user_id": user_id}
                ).sort("created_at", -1).limit(50).to_list(50)
                
                formatted_notifications = [
                    {
                        **notification,
                        "created_at": notification["created_at"].isoformat() if "created_at" in notification else None,
                        "_id": str(notification["_id"]) if "_id" in notification else None
                    } for notification in notifications
                ]
                
                await manager.send_personal_message(
                    json.dumps({
                        "type": "notifications_update",
                        "notifications": formatted_notifications
                    }),
                    user_id
                )
    
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

@app.post("/api/notifications/refresh")
async def refresh_notifications(current_user: str = Depends(get_current_user)):
    # Trigger notification refresh for the user
    notifications = await db.notifications.find(
        {"user_id": current_user}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    formatted_notifications = [
        {
            **notification,
            "created_at": notification["created_at"].isoformat() if "created_at" in notification else None,
            "_id": str(notification["_id"]) if "_id" in notification else None
        } for notification in notifications
    ]
    
    # Send via WebSocket
    await manager.send_personal_message(
        json.dumps({
            "type": "notifications_update",
            "notifications": formatted_notifications
        }),
        current_user
    )
    
    return {"message": "Notifications refreshed", "count": len(formatted_notifications)}

# News endpoints
@app.get("/api/news")
async def get_news():
    news_posts = await db.news.find({}).sort("created_at", -1).limit(50).to_list(50)
    return [
        {
            **post,
            "_id": str(post["_id"]) if "_id" in post else None,
            "created_at": post["created_at"].isoformat() if "created_at" in post else None
        } for post in news_posts
    ]

@app.post("/api/news")
async def create_news_post(post_data: CreateNewsPost, current_user: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user})
    
    news_post = NewsPost(
        author_id=current_user,
        author_name=user["display_name"],
        title=post_data.title,
        content=post_data.content,
        image_url=post_data.image_url,
        category=post_data.category
    )
    
    await db.news.insert_one(news_post.dict())
    return {"message": "News post created successfully", "post": news_post.dict()}

@app.get("/api/news/{post_id}/comments")
async def get_comments(post_id: str):
    comments = await db.comments.find({"post_id": post_id}).sort("created_at", 1).to_list(100)
    return [
        {
            **comment,
            "_id": str(comment["_id"]) if "_id" in comment else None,
            "created_at": comment["created_at"].isoformat() if "created_at" in comment else None
        } for comment in comments
    ]

@app.post("/api/news/{post_id}/comments")
async def create_comment(post_id: str, comment_data: CreateComment, current_user: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user})
    
    comment = Comment(
        post_id=post_id,
        author_id=current_user,
        author_name=user["display_name"],
        content=comment_data.content
    )
    
    await db.comments.insert_one(comment.dict())
    return {"message": "Comment created successfully", "comment": comment.dict()}

# Marketplace endpoints
@app.get("/api/products")
async def get_products(category: str = None, search: str = None):
    query = {"is_active": True}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search]}}
        ]
    
    products = await db.products.find(query).sort("created_at", -1).limit(50).to_list(50)
    return [
        {
            **product,
            "_id": str(product["_id"]) if "_id" in product else None,
            "created_at": product["created_at"].isoformat() if "created_at" in product else None
        } for product in products
    ]

@app.post("/api/products")
async def create_product(product_data: CreateProduct, current_user: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user})
    
    product = Product(
        seller_id=current_user,
        seller_name=user["display_name"],
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        category=product_data.category,
        images=product_data.images,
        stock_quantity=product_data.stock_quantity,
        condition=product_data.condition,
        location=product_data.location,
        tags=product_data.tags
    )
    
    await db.products.insert_one(product.dict())
    return {"message": "Product created successfully", "product": product.dict()}

@app.post("/api/products/{product_id}/like")
async def like_product(product_id: str, current_user: str = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    likes = product.get("likes", [])
    if current_user in likes:
        likes.remove(current_user)
        action = "unliked"
    else:
        likes.append(current_user)
        action = "liked"
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"likes": likes}}
    )
    
    return {"message": f"Product {action}", "likes_count": len(likes)}

@app.post("/api/cart/add")
async def add_to_cart(data: dict, current_user: str = Depends(get_current_user)):
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)
    
    # Check if product exists
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if already in cart
    existing_item = await db.cart.find_one({"user_id": current_user, "product_id": product_id})
    if existing_item:
        await db.cart.update_one(
            {"user_id": current_user, "product_id": product_id},
            {"$inc": {"quantity": quantity}}
        )
    else:
        cart_item = CartItem(
            user_id=current_user,
            product_id=product_id,
            quantity=quantity
        )
        await db.cart.insert_one(cart_item.dict())
    
    return {"message": "Product added to cart"}

@app.get("/api/cart")
async def get_cart(current_user: str = Depends(get_current_user)):
    cart_items = await db.cart.find({"user_id": current_user}).to_list(100)
    
    # Get product details for each cart item
    enriched_items = []
    for item in cart_items:
        product = await db.products.find_one({"id": item["product_id"]})
        if product:
            enriched_items.append({
                **item,
                "_id": str(item["_id"]) if "_id" in item else None,
                "product": {
                    **product,
                    "_id": str(product["_id"]) if "_id" in product else None
                }
            })
    
    return enriched_items

@app.post("/api/orders")
async def create_order(order_data: CreateOrder, current_user: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user})
    
    # Get products and calculate total
    products = []
    total_amount = 0
    
    for i, product_id in enumerate(order_data.product_ids):
        product = await db.products.find_one({"id": product_id})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
        
        quantity = order_data.quantities[i] if i < len(order_data.quantities) else 1
        products.append({
            "product_id": product_id,
            "name": product["name"],
            "price": product["price"],
            "quantity": quantity,
            "subtotal": product["price"] * quantity
        })
        total_amount += product["price"] * quantity
    
    # Create order
    order = Order(
        buyer_id=current_user,
        buyer_name=user["display_name"],
        seller_id=products[0]["product_id"],  # Simplified - assumes single seller
        seller_name="Seller",  # Would get from product
        products=products,
        total_amount=total_amount,
        payment_method=order_data.payment_method,
        shipping_address=order_data.shipping_address
    )
    
    await db.orders.insert_one(order.dict())
    
    # Create payment transaction
    payment = PaymentTransaction(
        order_id=order.id,
        payer_id=current_user,
        payee_id=products[0]["product_id"],  # Simplified
        amount=total_amount,
        payment_method=order_data.payment_method
    )
    
    await db.payments.insert_one(payment.dict())
    
    return {"message": "Order created successfully", "order": order.dict()}

@app.get("/api/orders")
async def get_orders(current_user: str = Depends(get_current_user)):
    orders = await db.orders.find({
        "$or": [{"buyer_id": current_user}, {"seller_id": current_user}]
    }).sort("created_at", -1).to_list(100)
    
    return [
        {
            **order,
            "_id": str(order["_id"]) if "_id" in order else None,
            "created_at": order["created_at"].isoformat() if "created_at" in order else None
        } for order in orders
    ]

# Account management endpoints
@app.get("/api/users/profile")
async def get_user_profile(current_user: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user}, {"password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        **user,
        "_id": str(user["_id"]) if "_id" in user else None
    }

@app.put("/api/users/profile")
async def update_user_profile(profile_data: dict, current_user: str = Depends(get_current_user)):
    # Update allowed fields
    allowed_fields = ["display_name", "phone", "bio", "location", "website"]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.users.update_one(
        {"id": current_user},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": current_user}, {"password_hash": 0})
    
    return {
        "message": "Profile updated successfully",
        "user": {
            **updated_user,
            "_id": str(updated_user["_id"]) if "_id" in updated_user else None
        }
    }

@app.post("/api/users/change-password")
async def change_password(data: dict, current_user: str = Depends(get_current_user)):
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Current and new passwords are required")
    
    # Verify current password
    user = await db.users.find_one({"id": current_user})
    if not user or not verify_password(current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    new_password_hash = hash_password(new_password)
    await db.users.update_one(
        {"id": current_user},
        {"$set": {"password_hash": new_password_hash, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Password changed successfully"}

@app.get("/api/users/privacy-settings")
async def get_privacy_settings(current_user: str = Depends(get_current_user)):
    settings = await db.privacy_settings.find_one({"user_id": current_user})
    
    if not settings:
        # Return default settings
        default_settings = {
            "user_id": current_user,
            "last_seen_online": True,
            "profile_photo_visible": True,
            "phone_visible": False,
            "email_visible": False,
            "search_by_phone": True,
            "search_by_email": True,
            "read_receipts": True,
            "typing_indicators": True
        }
        await db.privacy_settings.insert_one(default_settings)
        return default_settings
    
    return {
        **settings,
        "_id": str(settings["_id"]) if "_id" in settings else None
    }

@app.put("/api/users/privacy-settings")
async def update_privacy_settings(settings_data: dict, current_user: str = Depends(get_current_user)):
    settings_data["user_id"] = current_user
    settings_data["updated_at"] = datetime.utcnow()
    
    await db.privacy_settings.update_one(
        {"user_id": current_user},
        {"$set": settings_data},
        upsert=True
    )
    
    return {"message": "Privacy settings updated successfully"}

@app.post("/api/users/profile-picture")
async def upload_profile_picture(current_user: str = Depends(get_current_user)):
    # Mock implementation - in production, integrate with cloud storage
    # For now, return a placeholder URL
    avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={current_user}"
    
    await db.users.update_one(
        {"id": current_user},
        {"$set": {"avatar_url": avatar_url, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Profile picture updated", "avatar_url": avatar_url}

@app.delete("/api/users/account")
async def delete_account(current_user: str = Depends(get_current_user)):
    # Delete user data
    await db.users.delete_one({"id": current_user})
    await db.friends.delete_many({"$or": [{"user_id": current_user}, {"friend_id": current_user}]})
    await db.messages.delete_many({"sender_id": current_user})
    await db.notifications.delete_many({"user_id": current_user})
    await db.privacy_settings.delete_one({"user_id": current_user})
    await db.products.delete_many({"seller_id": current_user})
    await db.cart.delete_many({"user_id": current_user})
    await db.orders.delete_many({"$or": [{"buyer_id": current_user}, {"seller_id": current_user}]})
    
    return {"message": "Account deleted successfully"}

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}