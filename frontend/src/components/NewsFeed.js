import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Plus, 
  Clock, 
  User,
  Image,
  Send,
  ThumbsUp
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NewsFeed = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general',
    image_url: ''
  });
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState({});

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'tech', label: 'Technology' },
    { value: 'sports', label: 'Sports' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'business', label: 'Business' },
    { value: 'health', label: 'Health' }
  ];

  // Load news posts
  const loadPosts = async () => {
    try {
      const response = await axios.get(`${API}/news`);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Failed to load news feed');
    }
  };

  // Create new post
  const createPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/news`, newPost, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Post created successfully!');
      setNewPost({ title: '', content: '', category: 'general', image_url: '' });
      setShowCreatePost(false);
      loadPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    }
  };

  // Load comments for a post
  const loadComments = async (postId) => {
    if (comments[postId]) return; // Already loaded
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await axios.get(`${API}/news/${postId}/comments`);
      setComments(prev => ({ ...prev, [postId]: response.data }));
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Create comment
  const createComment = async (postId) => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/news/${postId}/comments`, {
        content: newComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewComment('');
      setComments(prev => ({ ...prev, [postId]: [] })); // Reset to reload
      loadComments(postId);
      toast.success('Comment added!');
    } catch (error) {
      console.error('Failed to create comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Create Post Button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-orange-100 text-orange-700">
                {user?.display_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              className="flex-1 justify-start text-gray-500"
              onClick={() => setShowCreatePost(true)}
            >
              What's happening in your world?
            </Button>
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => setShowCreatePost(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* News Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-orange-100 text-orange-700">
                      {post.author_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{post.author_name}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(post.created_at)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {categories.find(c => c.value === post.category)?.label || post.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {post.image_url && (
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={post.image_url} 
                      alt={post.title}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                      <Heart className="h-4 w-4 mr-1" />
                      {post.likes?.length || 0}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 hover:text-blue-500"
                      onClick={() => loadComments(post.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Comments
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500">
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>

                {/* Comments Section */}
                {comments[post.id] && (
                  <div className="border-t pt-3 space-y-3">
                    <div className="space-y-2">
                      {comments[post.id].map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                              {comment.author_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="font-semibold text-sm text-gray-900">
                                {comment.author_name}
                              </p>
                              <p className="text-sm text-gray-700 mt-1">
                                {comment.content}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatTime(comment.created_at)}
                              </span>
                              <Button variant="ghost" size="sm" className="h-6 text-xs text-gray-500">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Like
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    <div className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                          {user?.display_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex space-x-2">
                        <Input
                          placeholder="Write a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              createComment(post.id);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => createComment(post.id)}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {loadingComments[post.id] && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading comments...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Post Modal */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create News Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <Input
                placeholder="What's the news?"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <Textarea
                placeholder="Share the details..."
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newPost.category}
                onChange={(e) => setNewPost({...newPost, category: e.target.value})}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL (optional)
              </label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={newPost.image_url}
                onChange={(e) => setNewPost({...newPost, image_url: e.target.value})}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreatePost(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={createPost}
              >
                Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsFeed;