import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Search, UserPlus, QrCode, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import QRCodeComponent from './QRCodeComponent';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddFriendModal = ({ isOpen, onClose, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // search, suggestions, qr

  // Load friend suggestions from backend
  useEffect(() => {
    const loadSuggestions = async () => {
      if (isOpen) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API}/friends/suggestions`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSuggestedFriends(response.data);
        } catch (error) {
          console.error('Failed to load friend suggestions:', error);
          // Fallback to mock suggestions
          const mockSuggestions = [
            {
              id: 'user1',
              username: 'sarah_johnson',
              display_name: 'Sarah Johnson',
              mutual_friends: 3,
              status: 'online'
            },
            {
              id: 'user2', 
              username: 'mike_chen',
              display_name: 'Mike Chen',
              mutual_friends: 1,
              status: 'offline'
            },
            {
              id: 'user3',
              username: 'emma_wilson',
              display_name: 'Emma Wilson',
              mutual_friends: 5,
              status: 'online'
            }
          ];
          setSuggestedFriends(mockSuggestions);
        }
      }
    };

    loadSuggestions();
  }, [isOpen]);

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSearchResults(response.data);
        setIsSearching(false);
      } catch (error) {
        console.error('Search failed:', error);
        // Fallback to mock results if API fails
        const mockResults = [
          {
            id: 'search1',
            username: searchQuery.toLowerCase() + '_user',
            display_name: searchQuery + ' User',
            mutual_friends: 0,
            status: 'online'
          },
          {
            id: 'search2',
            username: 'john_' + searchQuery.toLowerCase(),
            display_name: 'John ' + searchQuery,
            mutual_friends: 2,
            status: 'offline'
          }
        ];
        
        setTimeout(() => {
          setSearchResults(mockResults);
          setIsSearching(false);
        }, 500);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const addFriend = async (friendData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/friends/add`, {
        username: friendData.username
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Friend request sent to ${friendData.display_name}!`);
      
      // Remove from suggestions/results
      setSuggestedFriends(prev => prev.filter(f => f.id !== friendData.id));
      setSearchResults(prev => prev.filter(f => f.id !== friendData.id));
      
      return true; // Return success for QR code handling
    } catch (error) {
      console.error('Add friend error:', error);
      toast.error(error.response?.data?.detail || 'Failed to send friend request');
      return false;
    }
  };

  const UserCard = ({ user, showMutualFriends = true }) => (
    <Card className="hover:bg-gray-50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-orange-100 text-orange-700">
              {user.display_name[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="font-medium text-gray-900 truncate">
                {user.display_name}
              </p>
              {user.status === 'online' && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div>
            <p className="text-sm text-gray-500">@{user.username}</p>
            
            {showMutualFriends && user.mutual_friends > 0 && (
              <div className="flex items-center space-x-1 mt-1">
                <Users className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {user.mutual_friends} mutual friends
                </span>
              </div>
            )}
          </div>
          
          <Button
            size="sm"
            onClick={() => addFriend(user)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Add Friends
          </DialogTitle>
        </DialogHeader>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
          <button
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'search' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('search')}
          >
            <Search className="h-4 w-4 mr-1" />
            Search
          </button>
          <button
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'suggestions' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('suggestions')}
          >
            <Zap className="h-4 w-4 mr-1" />
            Suggestions
          </button>
          <button
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'qr' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('qr')}
          >
            <QrCode className="h-4 w-4 mr-1" />
            QR Code
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by username or name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <ScrollArea className="max-h-64">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Searching...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <UserCard key={user.id} user={user} showMutualFriends={false} />
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Start typing to search for friends</p>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">People you may know</span>
            </div>
            
            <ScrollArea className="max-h-64">
              {suggestedFriends.length > 0 ? (
                <div className="space-y-2">
                  {suggestedFriends.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No suggestions available</p>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* QR Code Tab */}
        {activeTab === 'qr' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-2">Your QR Code</p>
              <p className="text-xs text-gray-600 mb-4">
                Let others scan this code to add you as a friend
              </p>
              <Button variant="outline" className="mb-4">
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code
              </Button>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium text-orange-900">Quick Add</span>
              </div>
              <p className="text-xs text-orange-700">
                Share your username: <code className="bg-orange-100 px-1 rounded">@{currentUser?.username || 'username'}</code>
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModal;