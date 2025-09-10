import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Button } from './components/ui/button';
import PWAInstallBanner from './components/PWAInstallBanner';
import NotificationCenter from './components/NotificationCenter';
import AddFriendModal from './components/AddFriendModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import NewsFeed from './components/NewsFeed';
import Marketplace from './components/Marketplace';
import AccountSettings from './components/AccountSettings';
import { Input } from './components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Textarea } from './components/ui/textarea';
import { ScrollArea } from './components/ui/scroll-area';
import { Separator } from './components/ui/separator';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { 
  MessageCircle, 
  Users, 
  Settings, 
  Send, 
  Plus, 
  Search,
  Phone,
  VideoIcon,
  Mic,
  Camera,
  MapPin,
  CreditCard,
  Smile,
  MoreHorizontal,
  UserPlus,
  Zap,
  Globe,
  Star,
  Newspaper,
  ShoppingBag,
  User
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  // State management
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    display_name: '', 
    phone: '' 
  });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [paymentData, setPaymentData] = useState({ amount: '', description: '' });
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Authentication functions
  const login = async (formData) => {
    try {
      console.log('Attempting login with:', { username: formData.username });
      const response = await axios.post(`${API}/auth/login`, formData);
      const { access_token, user: userData } = response.data;
      
      console.log('Login successful:', userData);
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      
      // Initialize WebSocket
      initializeWebSocket(userData.id, access_token);
      
      toast.success(`Welcome back, ${userData.display_name}!`);
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
    }
  };

  const register = async (formData) => {
    try {
      console.log('Attempting registration with:', { username: formData.username, email: formData.email });
      const response = await axios.post(`${API}/auth/register`, formData);
      const { access_token, user: userData } = response.data;
      
      console.log('Registration successful:', userData);
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      
      // Initialize WebSocket
      initializeWebSocket(userData.id, access_token);
      
      toast.success(`Welcome to SISI Chat, ${userData.display_name}!`);
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    if (ws) {
      ws.close();
    }
    toast.info('Logged out successfully');
  };

  // WebSocket functions
  const initializeWebSocket = (userId, token) => {
    const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const websocket = new WebSocket(`${wsUrl}/ws/${userId}`);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error. Please refresh the page.');
    };
    
    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Auto-reconnect after 3 seconds
      setTimeout(() => initializeWebSocket(userId, token), 3000);
    };
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'new_message':
        if (data.message.chat_id === activeChat?.id) {
          setMessages(prev => [...prev, data.message]);
        }
        // Update chat list with new message
        setChats(prev => prev.map(chat => 
          chat.id === data.message.chat_id 
            ? { ...chat, last_message: data.message.content, last_activity: data.message.timestamp }
            : chat
        ));
        break;
      
      case 'typing':
        if (data.chat_id === activeChat?.id && data.user_id !== user.id) {
          setIsTyping(data.is_typing);
        }
        break;
      
      case 'payment_request':
        toast.info(`Payment request: $${data.payment.amount} from ${data.payment.description}`);
        break;
      
      default:
        console.log('Unknown message type:', data);
    }
  };

  // Chat functions
  const loadChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(response.data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !ws || !activeChat) return;
    
    const messageData = {
      type: 'chat_message',
      chat_id: activeChat.id,
      sender_name: user.display_name,
      content: newMessage,
      message_type: 'text'
    };
    
    ws.send(JSON.stringify(messageData));
    setNewMessage('');
    
    // Get AI suggestions for quick replies
    getAISuggestions(newMessage);
  };

  const sendTypingIndicator = (isTyping) => {
    if (ws && activeChat) {
      ws.send(JSON.stringify({
        type: 'typing',
        chat_id: activeChat.id,
        is_typing: isTyping
      }));
    }
  };

  // AI functions
  const getAISuggestions = async (message) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/ai/suggestions`, {
        message,
        context: `Chat with ${activeChat?.name || 'friend'}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    }
  };

  const translateMessage = async (message, targetLang = 'en') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/ai/translate`, {
        message,
        target_language: targetLang
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTranslatedText(response.data.translation);
      setShowTranslation(true);
    } catch (error) {
      toast.error('Translation failed');
    }
  };

  // Payment functions
  const sendPaymentRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/payments/request`, {
        to_user: activeChat.participants.find(p => p !== user.id),
        amount: parseFloat(paymentData.amount),
        description: paymentData.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Payment request sent!');
      setPaymentData({ amount: '', description: '' });
    } catch (error) {
      toast.error('Failed to send payment request');
    }
  };

  // Friend request handlers
  const handleAcceptFriend = async (userId, notificationData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/friends/accept`, { 
        userId: userId,
        from_user_id: userId 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const friendName = notificationData?.from_display_name || 'Friend';
      toast.success(`Friend request from ${friendName} accepted!`);
      loadFriends(); // Refresh friends list
    } catch (error) {
      console.error('Accept friend error:', error);
      toast.error(error.response?.data?.detail || 'Failed to accept friend request');
    }
  };

  const handleDeclineFriend = async (userId, notificationData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/friends/decline`, { 
        userId: userId,
        from_user_id: userId 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const friendName = notificationData?.from_display_name || 'Friend';
      toast.info(`Friend request from ${friendName} declined`);
    } catch (error) {
      console.error('Decline friend error:', error);
      toast.error(error.response?.data?.detail || 'Failed to decline friend request');
    }
  };

  // Load friends
  const loadFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  // Handle deep link for QR code friend adding
  const handleDeepLink = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const friendUsername = urlParams.get('user');
    const friendId = urlParams.get('id');
    const friendName = urlParams.get('name');
    
    if (friendUsername && friendId && friendName && isAuthenticated) {
      // Check if it's not the current user
      if (friendId === user?.id) {
        toast.info("You can't add yourself as a friend!");
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API}/friends/add`, {
          username: friendUsername
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success(`Friend request sent to ${friendName}!`);
        loadFriends(); // Refresh friends list
      } catch (error) {
        console.error('Deep link friend add error:', error);
        const errorMessage = error.response?.data?.detail || 'Failed to send friend request';
        
        if (errorMessage.includes('already exists')) {
          toast.info(`You're already friends with ${friendName}!`);
        } else {
          toast.error(errorMessage);
        }
      }
      
      // Clean URL after processing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Effects
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsAuthenticated(true);
      initializeWebSocket(parsedUser.id, token);
    }

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  // Handle deep link when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      handleDeepLink();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
      loadFriends();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if there's a pending friend request in URL
  const urlParams = new URLSearchParams(window.location.search);
  const pendingFriendName = urlParams.get('name');
  const pendingFriendUsername = urlParams.get('user');

  // Authentication UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        
        {/* QR Code Welcome Banner */}
        {pendingFriendName && (
          <div className="fixed top-4 inset-x-4 z-50">
            <Card className="bg-orange-100 border-orange-300">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-orange-900">
                    🎉 {pendingFriendName} invited you to SISI Chat!
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Sign up or log in to connect with @{pendingFriendUsername}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-orange-700">
              {showLogin ? 'Welcome Back' : 'Join SISI Chat'}
            </CardTitle>
            {pendingFriendName && (
              <p className="text-sm text-orange-600 mt-2">
                Connect with {pendingFriendName} after signing up!
              </p>
            )}
          </CardHeader>
          <CardContent>
            {showLogin ? (
              <div className="space-y-4">
                <Input
                  placeholder="Username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => login(loginForm)}
                >
                  Sign In
                </Button>
                <div className="text-center text-sm text-gray-600 space-y-2">
                  <button 
                    className="text-orange-600 hover:underline block mx-auto"
                    onClick={() => setShowForgotPasswordModal(true)}
                  >
                    Forgot password?
                  </button>
                  <p>
                    Don't have an account?{' '}
                    <button 
                      className="text-orange-600 hover:underline"
                      onClick={() => setShowLogin(false)}
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="Username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                />
                <Input
                  placeholder="Display Name"
                  value={registerForm.display_name}
                  onChange={(e) => setRegisterForm({...registerForm, display_name: e.target.value})}
                />
                <Input
                  placeholder="Phone (optional)"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                />
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => register(registerForm)}
                >
                  Create Account
                </Button>
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button 
                    className="text-orange-600 hover:underline"
                    onClick={() => setShowLogin(true)}
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main App UI
  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" />
      <PWAInstallBanner />
      
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-orange-100 text-orange-700">
                  {user?.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-900">{user?.display_name}</h2>
                <Badge variant="secondary" className="text-xs">
                  Online
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <NotificationCenter 
                user={user}
                websocket={ws}
                onAcceptFriend={handleAcceptFriend}
                onDeclineFriend={handleDeclineFriend}
              />
              <Button variant="ghost" size="sm" onClick={() => setShowAccountSettings(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'chats' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('chats')}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Chats
            </button>
            <button
              className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'friends' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('friends')}
            >
              <Users className="h-4 w-4 mr-1" />
              Friends
            </button>
            <button
              className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'news' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('news')}
            >
              <Newspaper className="h-4 w-4 mr-1" />
              News
            </button>
            <button
              className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'marketplace' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('marketplace')}
            >
              <ShoppingBag className="h-4 w-4 mr-1" />
              Market
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {activeTab === 'chats' && (
            <div className="space-y-1 p-2">
              {chats.map((chat) => (
                <Card 
                  key={chat.id} 
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    activeChat?.id === chat.id ? 'bg-orange-50 border-orange-200' : ''
                  }`}
                  onClick={() => setActiveChat(chat)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {chat.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {chat.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {chat.last_message || 'No messages yet'}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(chat.last_activity).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="p-2">
              <Button 
                className="w-full mb-4 bg-orange-600 hover:bg-orange-700" 
                onClick={() => setShowAddFriendModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friends
              </Button>
              
              <div className="space-y-2">
                {friends.map((friend) => (
                  <Card key={friend.id || friend._id} className="cursor-pointer hover:bg-gray-50">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-orange-100 text-orange-700">
                            {friend.display_name?.[0] || 'F'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {friend.display_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{friend.username}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="h-full">
              <NewsFeed user={user} />
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="h-full">
              <Marketplace user={user} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'news' ? (
          <div className="flex-1 bg-white">
            <NewsFeed user={user} />
          </div>
        ) : activeTab === 'marketplace' ? (
          <div className="flex-1 bg-white">
            <Marketplace user={user} />
          </div>
        ) : activeChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-orange-100 text-orange-700">
                      {activeChat.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{activeChat.name}</h3>
                    <p className="text-sm text-gray-500">
                      {isTyping ? 'Typing...' : 'Online'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <VideoIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.sender_id === user.id
                          ? 'bg-orange-500 text-white ml-auto'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      {message.sender_id !== user.id && (
                        <p className="text-xs text-gray-500 mb-1">{message.sender_name}</p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        {message.sender_id !== user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-2"
                            onClick={() => translateMessage(message.content)}
                          >
                            <Globe className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="p-2 bg-gray-50 border-t">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-gray-600">Quick replies</span>
                </div>
                <div className="flex space-x-2 flex-wrap">
                  {aiSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setNewMessage(suggestion);
                        messageInputRef.current?.focus();
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm">
                  <Smile className="h-5 w-5" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    ref={messageInputRef}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      sendTypingIndicator(e.target.value.length > 0);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        sendMessage();
                        sendTypingIndicator(false);
                      }
                    }}
                    className="pr-32"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Send Payment Request</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Amount (TZS)"
                            type="number"
                            value={paymentData.amount}
                            onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                          />
                          <Input
                            placeholder="Description"
                            value={paymentData.description}
                            onChange={(e) => setPaymentData({...paymentData, description: e.target.value})}
                          />
                          <Button 
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            onClick={sendPaymentRequest}
                          >
                            Send Payment Request
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="ghost" size="sm">
                      <MapPin className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={sendMessage}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Welcome to SISI Chat
              </h3>
              <p className="text-gray-500">
                Select a chat to start messaging or create a new conversation
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Translation Dialog */}
      <Dialog open={showTranslation} onOpenChange={setShowTranslation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Translation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={translatedText}
              readOnly
              className="min-h-[100px]"
            />
            <Button 
              className="w-full"
              onClick={() => setShowTranslation(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Friend Modal */}
      <AddFriendModal 
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        currentUser={user}
        onFriendRequestSent={() => {
          // Trigger notification refresh
          if (ws) {
            ws.send(JSON.stringify({
              type: 'refresh_notifications'
            }));
          }
        }}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />

      {/* Account Settings Modal */}
      <Dialog open={showAccountSettings} onOpenChange={setShowAccountSettings}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Account Settings</DialogTitle>
          </DialogHeader>
          <AccountSettings 
            user={user}
            onUpdateUser={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }}
            onLogout={() => {
              setShowAccountSettings(false);
              logout();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;